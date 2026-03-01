import mongoose from "mongoose"
import { Customer } from "@/models/Customer"
import { createCustomerSchema, bulkCustomerSchema } from "@/validators/customerValidator"
import { AuditService } from "@/services/auditService"

export class CustomerService {
  static async createCustomer(data: unknown, organizationId: string, actorId: string) {
    const parsed = createCustomerSchema.parse(data)

    const customer = await Customer.create({
      ...parsed,
      outstandingBalance: parsed.openingBalance || 0,
      organizationId,
    })

    await AuditService.log({
      actorId,
      tenantId: organizationId,
      action: "CREATE_CUSTOMER",
      entityType: "Customer",
      entityId: customer._id,
      metadata: { name: customer.name },
    })

    return customer
  }

  static async updateCustomer(id: string, data: any, actorId: string) {
    const updated = await Customer.findByIdAndUpdate(
      id,
      data,
      { returnDocument: "after" }
    )

    if (!updated) throw new Error("Customer not found")

    await AuditService.log({
      actorId,
      tenantId: updated.organizationId,
      action: "UPDATE_CUSTOMER",
      entityType: "Customer",
      entityId: updated._id,
      metadata: data,
    })

    return updated
  }

  static async softDeleteCustomer(id: string, actorId: string) {
    const customer = await Customer.findById(id)
    if (!customer) throw new Error("Customer not found")

    customer.status = "deleted"
    customer.deletedAt = new Date()
    await customer.save()

    await AuditService.log({
      actorId,
      tenantId: customer.organizationId,
      action: "DELETE_CUSTOMER",
      entityType: "Customer",
      entityId: customer._id,
    })

    return true
  }

  static async bulkCreateCustomers(data: unknown, organizationId: string, actorId: string) {
    const session = await mongoose.startSession()

    try {
      const parsed = bulkCustomerSchema.parse(data)
      session.startTransaction()

      const customers = parsed.map((c) => ({
        name: c.name,
        type: c.type,
        contactInfo: { phone: c.phone, email: c.email, address: c.address, gstin: c.gstin },
        creditLimit: c.creditLimit || 0,
        maxDiscountPercentage: c.maxDiscountPercentage || 0,
        openingBalance: c.openingBalance || 0,
        outstandingBalance: c.openingBalance || 0,
        notes: c.notes,
        organizationId,
      }))

      const inserted = await Customer.insertMany(customers, { session })

      await session.commitTransaction()
      session.endSession()

      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "BULK_CREATE_CUSTOMERS",
        entityType: "Customer",
        metadata: { count: inserted.length },
      })

      return { created: inserted.length }
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }
}