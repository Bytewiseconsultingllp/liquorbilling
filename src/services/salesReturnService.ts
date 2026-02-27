import mongoose from "mongoose"
import { Sale } from "@/models/Sale"
import { Product } from "@/models/Product"
import { VendorStock } from "@/models/VendorStock"
import { AuditLog } from "@/models/AuditLog"

export class SalesReturnService {
  static async returnFullSale(
    saleId: string,
    actorId: string
  ) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const originalSale = await Sale.findById(saleId)
        .session(session)

      if (!originalSale)
        throw new Error("Sale not found")

      if (originalSale.type !== "sale")
        throw new Error("Cannot return this transaction")

      if (originalSale.isReturned)
        throw new Error("Sale already returned")

      if (originalSale.status === "voided")
        throw new Error("Cannot return voided sale")

      // Check morningStockLastUpdatedDate restriction
      const saleProducts = await Product.find({
        organizationId: originalSale.organizationId,
        _id: { $in: originalSale.items.map((i: any) => i.productId) },
      }).session(session)

      for (const p of saleProducts) {
        if (p.morningStockLastUpdatedDate) {
          const morningDate = new Date(p.morningStockLastUpdatedDate)
          morningDate.setHours(0, 0, 0, 0)
          const saleDate = new Date(originalSale.saleDate)
          saleDate.setHours(0, 0, 0, 0)
          if (saleDate < morningDate) {
            throw new Error(
              `Cannot return sale: sale date is before morning stock date for ${p.name}`
            )
          }
        }
      }

      // Restore stock
      for (const item of originalSale.items) {

        // Restore vendor stock
        for (const alloc of item.vendorAllocations) {
          const vendorStock = await VendorStock.findOne({
            vendorId: alloc.vendorId,
            productId: item.productId,
          }).session(session)

          if (!vendorStock)
            throw new Error("Vendor stock missing")

          vendorStock.currentStock += alloc.quantity
          await vendorStock.save({ session })
        }

        // Restore product stock
        const product = await Product.findById(
          item.productId
        ).session(session)

        if (!product)
          throw new Error("Product not found")

        product.currentStock += item.quantity
        await product.save({ session })
      }

      // Create return sale
      const returnSale = await Sale.create(
        [
          {
            saleNumber:
              "ret-" + Date.now(),
            organizationId:
              originalSale.organizationId,
            type: "return",
            referenceSaleId:
              originalSale._id,
            customerId:
              originalSale.customerId,
            customerName:
              originalSale.customerName,
            saleDate: new Date(),
            items: originalSale.items,
            subtotal:
              originalSale.subtotal,
            taxAmount:
              originalSale.taxAmount,
            totalAmount:
              originalSale.totalAmount,
            billDiscountAmount:
              originalSale.billDiscountAmount,
            totalDiscount:
              originalSale.totalDiscount,
            paidAmount: 0,
            dueAmount: 0,
            paymentStatus: "paid",
            createdBy: actorId,
          },
        ],
        { session }
      )

      // Mark original sale
      originalSale.isReturned = true
      await originalSale.save({ session })

      // Reverse customer outstanding balance
      if (originalSale.customerId && originalSale.dueAmount > 0) {
        const { Customer } = await import("@/models/Customer")
        await Customer.findByIdAndUpdate(
          originalSale.customerId,
          { $inc: { outstandingBalance: -originalSale.dueAmount } },
          { session }
        )
      }

      // Audit log
      await AuditLog.create(
        [
          {
            organizationId:
              originalSale.organizationId,
            actorId,
            actionType: "SALE_RETURN",
            entityType: "Sale",
            entityId:
              originalSale._id,
            metadata: {
              returnSaleId:
                returnSale[0]._id,
            },
          },
        ],
        { session }
      )

      await session.commitTransaction()
      session.endSession()

      return returnSale[0]

    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }
}