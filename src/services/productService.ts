import mongoose from "mongoose"
import { Product } from "@/models/Product"
import { Vendor } from "@/models/Vendor"
import { VendorStock } from "@/models/VendorStock"
import { createProductSchema, bulkProductSchema } from "@/validators/productValidator"
import { AuditService } from "@/services/auditService"

export class ProductService {
  static async createProduct(data: unknown, organizationId: string, actorId: string) {
    const parsed = createProductSchema.parse(data)

    const product = await Product.create({
      ...parsed,
      organizationId,
    })

    await AuditService.log({
      actorId,
      tenantId: organizationId,
      action: "CREATE_PRODUCT",
      entityType: "Product",
      entityId: product._id,
      metadata: { name: product.name },
    })

    return product
  }

  static async updateProduct(productId: string, data: any, actorId: string) {
    // Handle appending a single barcode without replacing existing ones
    if (data.appendBarcode) {
      const code = data.appendBarcode
      const updated = await Product.findByIdAndUpdate(
        productId,
        { $push: { barcodes: { code, createdBy: actorId } } },
        { returnDocument: "after" }
      )
      if (!updated) throw new Error("Product not found")
      await AuditService.log({
        actorId,
        tenantId: updated.organizationId,
        action: "UPDATE_PRODUCT",
        entityType: "Product",
        entityId: updated._id,
        metadata: { appendBarcode: code },
      })
      return updated
    }

    const updated = await Product.findByIdAndUpdate(
      productId,
      data,
      { returnDocument: "after" }
    )

    if (!updated) throw new Error("Product not found")

    await AuditService.log({
      actorId,
      tenantId: updated.organizationId,
      action: "UPDATE_PRODUCT",
      entityType: "Product",
      entityId: updated._id,
      metadata: data,
    })

    return updated
  }

  static async softDeleteProduct(productId: string, actorId: string) {
    const product = await Product.findById(productId)
    if (!product) throw new Error("Product not found")

    product.status = "deleted"
    product.deletedAt = new Date()
    await product.save()

    await AuditService.log({
      actorId,
      tenantId: product.organizationId,
      action: "DELETE_PRODUCT",
      entityType: "Product",
      entityId: product._id,
    })

    return true
  }

  static async bulkCreateProducts(data: unknown, organizationId: string, actorId: string) {
    const parsed = bulkProductSchema.parse(data)
    const session = await mongoose.startSession()
    session.startTransaction()

    try {

      // Transform barcodes string (pipe-separated) into barcode objects, and separate from rest
      const products = parsed.map((p) => {
        const { barcodes, ...rest } = p as any
        const productDoc: any = { ...rest, organizationId }
        if (barcodes && typeof barcodes === "string" && barcodes.trim()) {
          productDoc.barcodes = barcodes.split("|").map((code: string) => ({
            code: code.trim(),
            createdBy: actorId,
          }))
        }
        // Populate purchasePricePerUnit array from purchasePricePerCaret
        if (productDoc.purchasePricePerCaret && productDoc.purchasePricePerCaret > 0) {
          productDoc.purchasePricePerUnit = [{
            purchasePrice: productDoc.purchasePricePerCaret,
            effectiveFrom: new Date(),
          }]
        }
        // Handle morningStock and morningStockLastUpdatedDate
        if (productDoc.morningStock !== undefined && productDoc.morningStock >= 0) {
          productDoc.morningStock = productDoc.morningStock
          // if (productDoc.morningStockLastUpdatedDate) {
          //   // Support both "2026-02-24" and ISO formats; strip time if just a date
          //   const dateStr = String(productDoc.morningStockLastUpdatedDate).trim().split("T")[0]
          //   const parsed = new Date(dateStr + "T00:00:00.000Z")
          //   productDoc.morningStockLastUpdatedDate = isNaN(parsed.getTime()) ? new Date() : parsed
          // } else {
          //   productDoc.morningStockLastUpdatedDate = new Date()
          // }
        }
        return productDoc
      })

      const inserted = await Product.insertMany(products, { session })

      // Find the highest-priority active vendor for this tenant
      const topVendor = await Vendor.findOne(
        { organizationId, status: "active" },
        null,
        { sort: { priority: 1 }, session }
      )

      // Create VendorStock entries if a vendor exists
      if (topVendor) {
        const vendorStockDocs = inserted.map((prod: any) => ({
          organizationId,
          vendorId: topVendor._id,
          productId: prod._id,
          productName: prod.name,
          brand: prod.brand,
          volumeML: prod.volumeML,
          currentStock: prod.currentStock || 0,
          lastPurchasePrice: prod.purchasePricePerCaret || null,
          lastPurchaseDate: prod.purchasePricePerCaret ? new Date() : null,
        }))
        await VendorStock.insertMany(vendorStockDocs, { session })
      }

      
      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "BULK_CREATE_PRODUCTS",
        entityType: "Product",
        metadata: { count: inserted.length },
      })
      
      await session.commitTransaction()
      session.endSession()
      return { created: inserted.length }
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }
}