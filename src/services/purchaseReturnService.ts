import mongoose from "mongoose"
import { Purchase } from "@/models/Purchase"
import { Product } from "@/models/Product"
import { VendorStock } from "@/models/VendorStock"
import { AuditService } from "@/services/auditService"

export class PurchaseReturnService {
  static async returnPurchase(
    purchaseId: string,
    organizationId: string,
    actorId: string
  ) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const purchase = await Purchase.findOne({
        _id: purchaseId,
        organizationId,
      }).session(session)

      if (!purchase) throw new Error("Purchase not found")
      if (purchase.isReturned) throw new Error("Purchase already returned")

      // Reverse stock for each item
      for (const item of purchase.items) {
        const totalBottles = item.totalBottles || 0

        // Decrement product stock
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { currentStock: -totalBottles } },
          { session }
        )

        // Decrement vendor stock
        await VendorStock.findOneAndUpdate(
          {
            organizationId,
            vendorId: purchase.vendorId,
            productId: item.productId,
          },
          { $inc: { currentStock: -totalBottles } },
          { session }
        )
      }

      // Mark purchase as returned
      purchase.isReturned = true
      purchase.returnedAt = new Date()
      purchase.returnedBy = actorId
      await purchase.save({ session })

      await session.commitTransaction()
      session.endSession()

      // Audit log
      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "PURCHASE_RETURN",
        entityType: "Purchase",
        entityId: purchase._id,
      })

      return purchase
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }
}
