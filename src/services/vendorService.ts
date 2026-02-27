import mongoose from "mongoose"
import { Vendor } from "@/models/Vendor"
import { AuditService } from "@/services/auditService"
import { bulkVendorSchema } from "@/validators/vendorValidator"

export class VendorService {
  static async createVendor(
    data: any,
    organizationId: string,
    actorId: string
  ) {
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const { priority } = data

      // Shift existing vendors DOWN
      await Vendor.updateMany(
        {
          organizationId,
          priority: { $gte: priority },
          status: { $ne: "deleted" },
        },
        { $inc: { priority: 1 } },
        { session }
      )

      const vendor = await Vendor.create(
        [
          {
            ...data,
            organizationId,
          },
        ],
        { session }
      )

      await session.commitTransaction()
      session.endSession()

      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "CREATE_VENDOR",
        entityType: "Vendor",
        entityId: vendor[0]._id,
      })

      return vendor[0]
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }

  static async updateVendor(
    id: string,
    data: any,
    actorId: string
  ) {
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const vendor = await Vendor.findById(id)
      if (!vendor) throw new Error("Vendor not found")

      const oldPriority = vendor.priority
      const newPriority = data.priority

      if (newPriority && newPriority !== oldPriority) {
        // Remove gap
        await Vendor.updateMany(
          {
            organizationId: vendor.organizationId,
            priority: { $gt: oldPriority },
          },
          { $inc: { priority: -1 } },
          { session }
        )

        // Shift new range
        await Vendor.updateMany(
          {
            organizationId: vendor.organizationId,
            priority: { $gte: newPriority },
          },
          { $inc: { priority: 1 } },
          { session }
        )
      }

      const updated = await Vendor.findByIdAndUpdate(
        id,
        data,
        { returnDocument: "after", session }
      )

      await session.commitTransaction()
      session.endSession()

      await AuditService.log({
        actorId,
        tenantId: vendor.organizationId,
        action: "UPDATE_VENDOR",
        entityType: "Vendor",
        entityId: id,
      })

      return updated
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }

  static async softDeleteVendor(id: string, actorId: string) {
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const vendor = await Vendor.findById(id)
      if (!vendor) throw new Error("Vendor not found")

      const removedPriority = vendor.priority

      vendor.status = "deleted"
      vendor.deletedAt = new Date()
      await vendor.save({ session })

      // Collapse priority gap
      await Vendor.updateMany(
        {
          organizationId: vendor.organizationId,
          priority: { $gt: removedPriority },
        },
        { $inc: { priority: -1 } },
        { session }
      )

      await session.commitTransaction()
      session.endSession()

      return true
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }

  static async bulkCreateVendors(data: unknown, organizationId: string, actorId: string) {
    const session = await mongoose.startSession()
    try {
      const parsed = bulkVendorSchema.parse(data)
      session.startTransaction()

      const vendors = parsed.map((v) => ({
        name: v.name,
        tin: v.tin,
        cin: v.cin,
        gstin: v.gstin,
        priority: v.priority,
        contactPerson: v.contactPerson,
        email: v.email,
        phone: v.phone,
        address: v.address,
        bankDetails: {
          accountName: v.bankAccountName,
          bankName: v.bankName,
          accountNumber: v.accountNumber,
          ifscCode: v.ifscCode,
        },
        organizationId,
      }))

      const inserted = await Vendor.insertMany(vendors, { session })

      await session.commitTransaction()
      session.endSession()

      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "BULK_CREATE_VENDORS",
        entityType: "Vendor",
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