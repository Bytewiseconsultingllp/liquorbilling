import mongoose from "mongoose";
import { Product } from "@/models/Product";
import { VendorStock } from "@/models/VendorStock";
import { Sale } from "@/models/Sale";
import { StockClosing } from "@/models/StockClosing";
import { monitorEventLoopDelay } from "perf_hooks";

export class InventoryService {
  static async reconcileClosingStock(
    organizationId: string,
    closingData: Array<{
      productId: string;
      closingStock: number;
      morningStock: number;
      purchases: number;
      sales: number;
      discrepancy: number;
      discrepancyValue: number;
    }>,
    cashAmount: number,
    onlineAmount: number,
    actorId: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const products = await Product.find({
        organizationId,
      }).session(session);

      let saleItems: any[] = [];
      let totalDifferenceValue = 0;
      let closingItems: any[] = [];

      for (const entry of closingData) {
        const product = products.find(
          (p) => p._id.toString() === entry.productId,
        );
        if (!product) continue;

        const systemStock = product.currentStock;
        const physical = entry.closingStock;
        const difference = systemStock - physical;

        // Update morningStock with the physical count for next day
        product.morningStock = physical;

        if (difference <= 0) {
          await product.save({ session });
          continue;
        }

        // Deduct vendor stock by priority
        let remaining = difference;

        const vendorStocks = await VendorStock.find({
          productId: product._id,
          organizationId,
          currentStock: { $gt: 0 },
        })
          .sort({ priority: 1 })
          .session(session);

        let vendorAllocations: any[] = [];

        for (const vs of vendorStocks) {
          if (remaining <= 0) break;

          const deduct = Math.min(remaining, vs.currentStock);

          vs.currentStock -= deduct;
          await vs.save({ session });

          vendorAllocations.push({
            vendorId: vs.vendorId,
            quantity: deduct,
            vendorName: vs.vendorName,
          });

          remaining -= deduct;
        }

        if (remaining > 0) {
          throw new Error(`Vendor stock insufficient for ${product.name}`);
        }

        // Update product stock
        product.currentStock = physical;
        await product.save({ session });

        const value = difference * product.pricePerUnit;

        totalDifferenceValue += value;

        saleItems.push({
          productId: product._id,
          productName: product.name,
          quantity: difference,
          pricePerUnit: product.pricePerUnit,
          discountAmount: 0,
          totalAmount: value,
          vendorAllocations,
        });

        closingItems.push({
          productId: product._id,
          productName: product.name,
          morningStock: entry.morningStock,
          purchases: entry.purchases,
          sales: entry.sales,
          systemStock,
          closingStock: physical,
          physicalStock: physical,
          difference,
          discrepancy: entry.discrepancy,
          discrepancyValue: entry.discrepancyValue,
        });
      }

      if (saleItems.length === 0) {
        throw new Error("No stock difference found");
      }

      // Generate sub-bills by volume (≤ 2500 ML per sub-bill)
      const VOLUME_LIMIT = 2500;
      type SaleItemWithVolume = (typeof saleItems)[number] & { volumeML: number };
      const itemsWithVol: SaleItemWithVolume[] = saleItems.map((si: any) => {
        const prod = products.find((p) => p._id.toString() === si.productId.toString());
        return { ...si, volumeML: prod?.volumeML ?? 0 };
      });

      const grandVolume = itemsWithVol.reduce((a, b) => a + b.volumeML * b.quantity, 0);
      let subBills: any[] = [];

      if (grandVolume > VOLUME_LIMIT) {
        // First-Fit Decreasing bin-packing by volume
        const sorted = [...itemsWithVol].sort((a, b) => b.volumeML - a.volumeML);
        const bins: { items: any[]; volume: number }[] = [];

        for (const item of sorted) {
          let remaining = item.quantity;
          while (remaining > 0) {
            let placed = false;
            for (const bin of bins) {
              const spaceML = VOLUME_LIMIT - bin.volume;
              if (item.volumeML > 0 && spaceML < item.volumeML) continue;
              const maxQty = item.volumeML > 0 ? Math.floor(spaceML / item.volumeML) : remaining;
              const qty = Math.min(remaining, Math.max(1, maxQty));
              if (qty <= 0) continue;
              const value = qty * item.pricePerUnit;
              bin.items.push({
                productId: item.productId,
                productName: item.productName,
                quantity: qty,
                pricePerUnit: item.pricePerUnit,
                discountAmount: 0,
                totalAmount: value,
              });
              bin.volume += item.volumeML * qty;
              remaining -= qty;
              placed = true;
              break;
            }
            if (!placed) {
              const qty = Math.min(remaining, item.volumeML > 0 ? Math.max(1, Math.floor(VOLUME_LIMIT / item.volumeML)) : remaining);
              const value = qty * item.pricePerUnit;
              bins.push({
                items: [{
                  productId: item.productId,
                  productName: item.productName,
                  quantity: qty,
                  pricePerUnit: item.pricePerUnit,
                  discountAmount: 0,
                  totalAmount: value,
                }],
                volume: item.volumeML * qty,
              });
              remaining -= qty;
            }
          }
        }

        subBills = bins.map((bin) => {
          const biTotal = bin.items.reduce((a: number, b: any) => a + b.totalAmount, 0);
          return {
            items: bin.items,
            subTotalAmount: biTotal,
            totalDiscountAmount: 0,
            totalAmount: biTotal,
            paymentMode: "cash",
            cashPaidAmount: 0,
            onlinePaidAmount: 0,
            creditPaidAmount: 0,
          };
        });

        // Distribute payment across sub-bills proportionally
        const totalSub = subBills.reduce((a: number, b: any) => a + b.totalAmount, 0);
        for (const sb of subBills) {
          const ratio = totalSub > 0 ? sb.totalAmount / totalSub : 1 / subBills.length;
          sb.cashPaidAmount = Math.round(cashAmount * ratio * 100) / 100;
          sb.onlinePaidAmount = Math.round(onlineAmount * ratio * 100) / 100;
        }
      }

      // Generate disc sale number
      const saleNumber = "disc-" + Date.now();

      // Disc bill time = today 23:59:59
      const discBillDate = new Date();
      discBillDate.setHours(23, 59, 59, 0);

      const sale = await Sale.create(
        [
          {
            saleNumber,
            organizationId,
            customerName: "Walk-In",
            saleDate: discBillDate,
            items: saleItems,
            subBills: subBills.length > 0 ? subBills : [],
            subtotal: totalDifferenceValue,
            taxAmount: 0,
            totalAmount: totalDifferenceValue,
            billDiscountAmount: 0,
            totalDiscount: 0,
            paidAmount: cashAmount + onlineAmount,
            dueAmount: 0,
            paymentStatus: "paid",
            createdBy: actorId,
          },
        ],
        { session },
      );

      // Save StockClosing snapshot
      await StockClosing.create(
        [
          {
            organizationId,
            closingDate: new Date(),
            items: closingItems,
            totalDifferenceValue,
            saleId: sale[0]._id,
            cashAmount,
            onlineAmount,
          },
        ],
        { session },
      );

      // Update morningStockLastUpdatedDate for ALL products to next day 00:00:01
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate());
      nextDay.setHours(0, 0, 1, 0);

      await Product.updateMany(
        { organizationId },
        { $set: { morningStockLastUpdatedDate: nextDay } },
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return sale[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
