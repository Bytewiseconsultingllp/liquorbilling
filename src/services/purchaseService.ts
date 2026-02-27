import mongoose from "mongoose";
import { Purchase } from "@/models/Purchase";
import { VendorStock } from "@/models/VendorStock";
import { Product } from "@/models/Product";
import { AuditService } from "@/services/auditService";
import { LedgerService } from "./ledgerService";

export class PurchaseService {
  static async createPurchase(
    data: any,
    organizationId: string,
    actorId: string,
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Generate purchase number
      const purchaseNumber = "PUR-" + Date.now();

      const purchase = await Purchase.create(
        [
          {
            ...data,
            purchaseNumber,
            organizationId,
            createdBy: actorId,
          },
        ],
        { session },
      );

      for (const item of data.items) {
        const totalBottles = item.totalBottles || 0;

        // 1️⃣ Update vendor stock (increment by total bottles)
        await VendorStock.findOneAndUpdate(
          {
            organizationId,
            vendorId: data.vendorId,
            productId: item.productId,
          },
          {
            $inc: { currentStock: totalBottles },
            $set: {
              productName: item.productName,
              brand: item.brand,
              volumeML: item.volumeML,
              lastPurchasePrice: item.purchasePricePerCaret,
              lastPurchaseDate: new Date(),
            },
          },
          { upsert: true, session },
        );

        // 2️⃣ Update product stock directly (increment by total bottles)
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { currentStock: totalBottles } },
          { session },
        );
      }

      await session.commitTransaction();
      session.endSession();

      await LedgerService.createEntry({
        organizationId,
        entityType: "vendor",
        entityId: data.vendorId,
        referenceType: "purchase",
        referenceId: purchase[0]._id,
        debit: data.totalAmount,
        credit: data.paidAmount,
        description: `Purchase ${purchaseNumber}`,
      });
      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "CREATE_PURCHASE",
        entityType: "Purchase",
        entityId: purchase[0]._id,
      });

      return purchase[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async listPurchases(organizationId: string) {
    return Purchase.find({ organizationId }).sort({ createdAt: -1 }).lean();
  }

  static async getPurchaseById(id: string, organizationId: string) {
    return Purchase.findOne({ _id: id, organizationId }).lean();
  }

  static async getTodayPurchases(organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return Purchase.find({
      organizationId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 }).lean();
  }
}
