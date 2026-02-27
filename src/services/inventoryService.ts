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
