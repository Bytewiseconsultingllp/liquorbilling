import mongoose from "mongoose"
import { CreditPayment } from "@/models/CreditPayment"
import { Customer } from "@/models/Customer"
import { LedgerService } from "./ledgerService"
import { CashbookService } from "./cashbookService"
import { AuditLog } from "@/models/AuditLog"

export class CreditService {

  static async collectCredit(data: any, actorId: string) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const { organizationId, customerId, cashAmount, onlineAmount, note, creditDate } = data

      const amount = cashAmount + onlineAmount

      if (amount <= 0)
        throw new Error("Invalid payment amount")

      const customer = await Customer.findById(customerId).session(session)

      if (!customer)
        throw new Error("Customer not found")

      if (customer.outstandingBalance < amount)
        throw new Error("Payment exceeds outstanding")

      // Resolve creditDate
      const resolvedDate = creditDate ? new Date(creditDate) : new Date()

      // Create payment record
      const payment = await CreditPayment.create([{
        organizationId,
        customerId,
        amount,
        cashAmount,
        onlineAmount,
        note,
        creditDate: resolvedDate,
        createdBy: actorId,
      }], { session })

      // Update customer outstanding
      customer.outstandingBalance -= amount
      await customer.save({ session })

      // Ledger entry (credit)
      await LedgerService.createEntry({
        organizationId,
        entityType: "customer",
        entityId: customerId,
        referenceType: "payment",
        referenceId: payment[0]._id,
        debit: 0,
        credit: amount,
        description: "Credit Payment",
        session,
      })

      // Cashbook entry
      await CashbookService.createEntry({
        organizationId,
        date: resolvedDate,
        sourceType: "sale",
        referenceId: payment[0]._id,
        cashIn: cashAmount,
        onlineIn: onlineAmount,
        description: "Credit Collection",
      }, session)

      // Audit
      await AuditLog.create([{
        organizationId,
        actorId,
        actionType: "CREDIT_COLLECTED",
        entityType: "CreditPayment",
        entityId: payment[0]._id,
      }], { session })

      await session.commitTransaction()
      session.endSession()

      return payment[0]

    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }
  static async cancelPayment(
    paymentId: string,
    actorId: string
  ) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const payment = await CreditPayment.findById(paymentId).session(session)

      if (!payment)
        throw new Error("Payment not found")

      if (payment.status === "cancelled")
        throw new Error("Already cancelled")

      const customer = await Customer.findById(payment.customerId).session(session)

      if (!customer)
        throw new Error("Customer not found")

      // Restore outstanding
      customer.outstandingBalance += payment.amount
      await customer.save({ session })

      payment.status = "cancelled"
      await payment.save({ session })

      // Reverse ledger
      await LedgerService.createEntry({
        organizationId: payment.organizationId,
        entityType: "customer",
        entityId: payment.customerId,
        referenceType: "payment",
        referenceId: payment._id,
        debit: payment.amount,
        credit: 0,
        description: "Payment Reversal",
        session,
      })

      // Reverse cashbook
      await CashbookService.createEntry({
        organizationId: payment.organizationId,
        date: new Date(),
        sourceType: "sale",
        referenceId: payment._id,
        cashOut: payment.cashAmount,
        onlineOut: payment.onlineAmount,
        description: "Credit Reversal",
      }, session)

      await session.commitTransaction()
      session.endSession()

      return true

    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }
}