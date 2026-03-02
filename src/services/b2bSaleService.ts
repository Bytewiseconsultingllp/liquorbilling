import mongoose from "mongoose"
import { B2BSale } from "@/models/B2BSale"
import { VendorStock } from "@/models/VendorStock"
import { Product } from "@/models/Product"
import { Vendor } from "@/models/Vendor"
import { Customer } from "@/models/Customer"
import { AuditService } from "@/services/auditService"
import { LedgerService } from "./ledgerService"
import { startOfDayIST, endOfDayIST } from "@/lib/timezone"

export class B2BSaleService {
  static async createB2BSale(
    data: any,
    organizationId: string,
    actorId: string
  ) {
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const saleNumber = "B2B-" + Date.now()

      // Deduct stock per item
      for (const item of data.items) {
        const totalBottles = item.totalBottles || 0
        let remainingQty = totalBottles

        // Get vendors ordered by priority
        const vendors = await Vendor.find({
          organizationId,
          status: "active",
        })
          .sort({ priority: 1 })
          .session(session)

        for (const vendor of vendors) {
          if (remainingQty <= 0) break

          const vendorStock = await VendorStock.findOne({
            organizationId,
            vendorId: vendor._id,
            productId: item.productId,
          }).session(session)

          if (!vendorStock || vendorStock.currentStock <= 0) continue

          const deductQty = Math.min(remainingQty, vendorStock.currentStock)
          vendorStock.currentStock -= deductQty
          await vendorStock.save({ session })

          remainingQty -= deductQty
        }

        if (remainingQty > 0) {
          throw new Error(`Insufficient stock for ${item.productName}`)
        }

        // Decrease product aggregated stock
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { currentStock: -totalBottles } },
          { session }
        )
      }

      // Handle customer credit
      if (data.customerId && data.dueAmount > 0) {
        await Customer.findByIdAndUpdate(
          data.customerId,
          {
            $inc: { outstandingBalance: data.dueAmount },
            lastTransactionDate: new Date(),
          },
          { session }
        )
      }

      const sale = await B2BSale.create(
        [
          {
            saleNumber,
            organizationId,
            customerId: data.customerId,
            customerName: data.customerName,
            saleDate: data.saleDate,
            items: data.items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              brand: item.brand,
              volumeML: item.volumeML,
              bottlesPerCaret: item.bottlesPerCaret,
              carets: item.carets,
              bottles: item.bottles,
              totalBottles: item.totalBottles,
              purchasePricePerCaret: item.purchasePricePerCaret,
              amount: item.amount,
            })),
            subtotal: data.subtotal,
            vatRate: data.vatRate,
            vatAmount: data.vatAmount,
            tcsRate: data.tcsRate,
            tcsAmount: data.tcsAmount,
            taxAmount: data.taxAmount,
            totalAmount: data.totalAmount,
            paymentStatus: data.paymentStatus,
            paidAmount: data.paidAmount,
            dueAmount: data.dueAmount,
            paymentMode: data.paymentMode || "cash",
            cashAmount: data.cashAmount || 0,
            onlineAmount: data.onlineAmount || 0,
            creditAmount: data.creditAmount || 0,
            createdBy: actorId,
          },
        ],
        { session }
      )

      await session.commitTransaction()
      session.endSession()

      // Ledger + Audit (outside transaction)
      if (data.customerId) {
        await LedgerService.createEntry({
          organizationId,
          entityType: "customer",
          entityId: data.customerId,
          referenceType: "b2b-sale",
          referenceId: sale[0]._id,
          debit: data.totalAmount,
          credit: data.paidAmount,
          description: `B2B Sale ${saleNumber}`,
        })
      }

      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "CREATE_B2B_SALE",
        entityType: "B2BSale",
        entityId: sale[0]._id,
      })

      return sale[0]
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }

  static async listB2BSales(organizationId: string) {
    return B2BSale.find({ organizationId }).sort({ createdAt: -1 }).lean()
  }

  static async getB2BSaleById(id: string, organizationId: string) {
    return B2BSale.findOne({ _id: id, organizationId }).lean()
  }

  static async getTodayB2BSales(organizationId: string) {
    const startOfDay = startOfDayIST()
    const endOfDay = endOfDayIST()
    return B2BSale.find({
      organizationId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ createdAt: -1 })
      .lean()
  }
}
