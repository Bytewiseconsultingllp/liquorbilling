import mongoose from "mongoose";
import { Sale } from "@/models/Sale";
import { VendorStock } from "@/models/VendorStock";
import { Product } from "@/models/Product";
import { Vendor } from "@/models/Vendor";
import { Customer } from "@/models/Customer";
import { AuditService } from "@/services/auditService";
import { LedgerService } from "./ledgerService";

export class SaleService {
  static async createSale(data: any, organizationId: string, actorId: string) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const saleNumber = "SAL-" + Date.now();

      // Server-side discount cap validation
      if (data.customerId) {
        const customer = await Customer.findById(data.customerId).session(session);
        if (customer && customer.maxDiscountPercentage != null) {
          const subtotalBeforeDiscount = data.items.reduce((a: number, i: any) => a + i.quantity * i.pricePerUnit, 0);
          const maxAllowedDiscount = (subtotalBeforeDiscount * customer.maxDiscountPercentage) / 100;
          const totalItemDiscount = data.items.reduce((a: number, i: any) => a + (i.discountAmount || 0), 0);
          const totalDiscount = totalItemDiscount + (data.billDiscountAmount || 0);
          if (totalDiscount > maxAllowedDiscount + 0.01) {
            throw new Error(`Total discount ₹${totalDiscount.toFixed(2)} exceeds maximum allowed ₹${maxAllowedDiscount.toFixed(2)} (${customer.maxDiscountPercentage}%)`);
          }
        }
      }

      for (const item of data.items) {
        let remainingQty = item.quantity;

        // Get vendors ordered by priority
        const vendors = await Vendor.find({
          organizationId,
          status: "active",
        })
          .sort({ priority: 1 })
          .session(session);

        for (const vendor of vendors) {
          if (remainingQty <= 0) break;

          const vendorStock = await VendorStock.findOne({
            organizationId,
            vendorId: vendor._id,
            productId: item.productId,
          }).session(session);

          if (!vendorStock || vendorStock.currentStock <= 0) continue;

          const deductQty = Math.min(remainingQty, vendorStock.currentStock);

          vendorStock.currentStock -= deductQty;
          await vendorStock.save({ session });

          // Track allocation
          item.vendorAllocations = item.vendorAllocations || [];
          item.vendorAllocations.push({
            vendorId: vendor._id,
            vendorName: vendor.name,
            quantity: deductQty,
          });

          remainingQty -= deductQty;
        }

        if (remainingQty > 0) {
          throw new Error(`Insufficient stock for ${item.productName}`);
        }

        // Decrease product aggregated stock
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { currentStock: -item.quantity } },
          { session },
        );
      }

      // Handle customer credit
      if (data.customerId && data.dueAmount > 0) {
        await Customer.findByIdAndUpdate(
          data.customerId,
          {
            $inc: {
              outstandingBalance: data.dueAmount,
            },
            lastTransactionDate: new Date(),
          },
          { session },
        );
      }

      const sale = await Sale.create(
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
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              discountType: item.discountType || "percentage",
              discountValue: item.discountValue || 0,
              discountAmount: item.discountAmount || 0,
              totalAmount: item.totalAmount,
              vendorAllocations: item.vendorAllocations || [],
            })),

            subBills: (data.subBills || []).map((sb: any) => ({
              items: (sb.items || []).map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                discountType: item.discountType || "percentage",
                discountValue: item.discountValue || 0,
                discountAmount: item.discountAmount || 0,
                totalAmount: item.totalAmount,
              })),
              subTotalAmount: sb.subTotalAmount,
              totalDiscountAmount: sb.totalDiscountAmount,
              totalAmount: sb.totalAmount,
              paymentMode: sb.paymentMode || data.paymentMode || "cash",
              cashPaidAmount: sb.cashPaidAmount || 0,
              onlinePaidAmount: sb.onlinePaidAmount || 0,
              creditPaidAmount: sb.creditPaidAmount || 0,
            })),

            subtotal: data.subtotal,
            taxAmount: data.taxAmount,
            totalAmount: data.totalAmount,

            // 🔥 Persist discounts
            billDiscountAmount: data.billDiscountAmount || 0,
            totalDiscount: data.totalDiscount || 0,

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
        { session },
      );

      

      // Only create ledger entry for named customers (skip walk-in)
      if (data.customerId) {
        await LedgerService.createEntry({
          organizationId,
          entityType: "customer",
          entityId: data.customerId,
          referenceType: "sale",
          referenceId: sale[0]._id,
          debit: data.totalAmount,
          credit: data.paidAmount,
          description: `Sale ${sale[0].saleNumber}`,
          session,
        });
      }

      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "CREATE_SALE",
        entityType: "Sale",
        entityId: sale[0]._id,
      });

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
