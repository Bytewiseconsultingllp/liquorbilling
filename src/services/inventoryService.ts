import mongoose from "mongoose";
import { Product } from "@/models/Product";
import { VendorStock } from "@/models/VendorStock";
import { Sale } from "@/models/Sale";
import { StockClosing } from "@/models/StockClosing";
import { endOfDayIST, startOfDayIST } from "@/lib/timezone";

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
    // ── Phase 1: Read all data OUTSIDE the transaction ──────────────
    const productIds = closingData.map((e) => new mongoose.Types.ObjectId(e.productId));

    const [products, allVendorStocks] = await Promise.all([
      Product.find({ organizationId }),
      VendorStock.find({
        productId: { $in: productIds },
        organizationId,
        currentStock: { $gt: 0 },
      }).sort({ productId: 1, priority: 1 }),
    ]);

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Group vendor stocks by productId
    const vendorStockMap = new Map<string, typeof allVendorStocks>();
    for (const vs of allVendorStocks) {
      const pid = vs.productId.toString();
      if (!vendorStockMap.has(pid)) vendorStockMap.set(pid, []);
      vendorStockMap.get(pid)!.push(vs);
    }

    // ── Phase 2: Compute all changes in memory ─────────────────────
    const saleItems: any[] = [];
    let totalDifferenceValue = 0;
    const closingItems: any[] = [];
    const productBulkOps: any[] = [];
    const vendorStockBulkOps: any[] = [];

    for (const entry of closingData) {
      const product = productMap.get(entry.productId);
      if (!product) continue;

      const systemStock = product.currentStock;
      const physical = entry.closingStock;
      const difference = systemStock - physical;

      if (difference <= 0) {
        // Only update morningStock
        productBulkOps.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { morningStock: physical } },
          },
        });
        continue;
      }

      // Deduct vendor stock by priority (in memory)
      let remaining = difference;
      const vendorStocks = vendorStockMap.get(entry.productId) || [];
      const vendorAllocations: any[] = [];

      for (const vs of vendorStocks) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, vs.currentStock);
        vs.currentStock -= deduct; // update in-memory for correct subsequent deductions

        vendorStockBulkOps.push({
          updateOne: {
            filter: { _id: vs._id },
            update: { $inc: { currentStock: -deduct } },
          },
        });

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

      // Update product stock + morningStock
      productBulkOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { currentStock: physical, morningStock: physical } },
        },
      });

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

    // Sub-bill computation (pure CPU, no DB) ────────────────────────
    const VOLUME_LIMIT = 2500;
    type SaleItemWithVolume = (typeof saleItems)[number] & { volumeML: number };
    const itemsWithVol: SaleItemWithVolume[] = saleItems.map((si: any) => {
      const prod = productMap.get(si.productId.toString());
      return { ...si, volumeML: prod?.volumeML ?? 0 };
    });

    const grandVolume = itemsWithVol.reduce((a, b) => a + b.volumeML * b.quantity, 0);
    let subBills: any[] = [];

    if (grandVolume > VOLUME_LIMIT) {
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

      const totalSub = subBills.reduce((a: number, b: any) => a + b.totalAmount, 0);
      for (const sb of subBills) {
        const ratio = totalSub > 0 ? sb.totalAmount / totalSub : 1 / subBills.length;
        sb.cashPaidAmount = Math.round(cashAmount * ratio * 100) / 100;
        sb.onlinePaidAmount = Math.round(onlineAmount * ratio * 100) / 100;
      }
    }

    const saleNumber = "disc-" + Date.now();
    const discBillDate = endOfDayIST();
    const nextDayStart = startOfDayIST();
    const nextDay = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000 + 1000);

    // ── Phase 3: Write inside a SHORT transaction (5 ops max) ──────
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        // 1. Bulk-write product updates (1 round-trip)
        if (productBulkOps.length > 0) {
          await Product.bulkWrite(productBulkOps, { session });
        }

        // 2. Bulk-write vendor stock updates (1 round-trip)
        if (vendorStockBulkOps.length > 0) {
          await VendorStock.bulkWrite(vendorStockBulkOps, { session });
        }

        // 3. Create sale (1 round-trip)
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

        // 4. Create StockClosing snapshot (1 round-trip)
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

        // 5. Update morningStockLastUpdatedDate (1 round-trip)
        await Product.updateMany(
          { organizationId },
          { $set: { morningStockLastUpdatedDate: nextDay } },
          { session },
        );

        return sale[0];
      });

      return result;
    } finally {
      session.endSession();
    }
  }
}
