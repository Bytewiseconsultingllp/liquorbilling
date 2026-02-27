/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { Sale } from "@/models/Sale";
import { Purchase } from "@/models/Purchase";
import { CreditPayment } from "@/models/CreditPayment";
import { CashbookEntry } from "@/models/CashbookEntry";
import { Product } from "@/models/Product";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

function buildDateFilter(startDate: string, endDate: string) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

export class ReportService {
  // ─── Daily Report ───────────────────────────────────────────────
  static async getDailyReport(organizationId: string, startDate: string, endDate: string) {
    const orgId = toObjectId(organizationId);
    const dateRange = buildDateFilter(startDate, endDate);

    const [
      salesSummary,
      purchaseSummary,
      creditGiven,
      creditCollected,
      cashbookSummary,
      categoryWiseSale,
      productWiseSale,
      creditGivenByCustomer,
      creditReceivedByCustomer,
      saleCashOnline,
    ] = await Promise.all([
      // Total sales
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            totalDiscount: { $sum: "$totalDiscount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total purchases
      Purchase.aggregate([
        { $match: { organizationId: orgId, purchaseDate: dateRange } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Credit given (due amount from sales)
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale", dueAmount: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalCreditGiven: { $sum: "$dueAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Credit collected
      CreditPayment.aggregate([
        { $match: { organizationId: orgId, creditDate: dateRange, status: "active" } },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: "$amount" },
            cashCollected: { $sum: "$cashAmount" },
            onlineCollected: { $sum: "$onlineAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Cashbook summary
      CashbookEntry.aggregate([
        { $match: { organizationId: orgId, date: dateRange } },
        {
          $group: {
            _id: "$sourceType",
            cashIn: { $sum: "$cashIn" },
            cashOut: { $sum: "$cashOut" },
            onlineIn: { $sum: "$onlineIn" },
            onlineOut: { $sum: "$onlineOut" },
          },
        },
      ]),

      // Category-wise sale
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$productInfo.category", "Uncategorized"] },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Product-wise sale
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Credit given by customer (due from sales)
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale", dueAmount: { $gt: 0 } } },
        {
          $group: {
            _id: "$customerId",
            customerName: { $first: "$customerName" },
            totalCredit: { $sum: "$dueAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalCredit: -1 } },
      ]),

      // Credit received by customer (credit payments)
      CreditPayment.aggregate([
        { $match: { organizationId: orgId, creditDate: dateRange, status: "active" } },
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$customerId",
            customerName: { $first: { $ifNull: ["$customerInfo.name", "Unknown"] } },
            totalReceived: { $sum: "$amount" },
            cashReceived: { $sum: "$cashAmount" },
            onlineReceived: { $sum: "$onlineAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalReceived: -1 } },
      ]),

      // Sale cash/online breakdown
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        {
          $group: {
            _id: null,
            saleCash: { $sum: "$cashAmount" },
            saleOnline: { $sum: "$onlineAmount" },
          },
        },
      ]),
    ]);

    const sco = saleCashOnline[0] || { saleCash: 0, saleOnline: 0 };
    const cc0 = creditCollected[0] || { totalCollected: 0, cashCollected: 0, onlineCollected: 0, count: 0 };

    return {
      period: { startDate, endDate },
      sales: salesSummary[0] || { totalSales: 0, totalPaid: 0, totalDue: 0, totalDiscount: 0, count: 0 },
      purchases: purchaseSummary[0] || { totalPurchases: 0, totalPaid: 0, totalDue: 0, count: 0 },
      creditGiven: creditGiven[0] || { totalCreditGiven: 0, count: 0 },
      creditCollected: cc0,
      totalCashCollection: sco.saleCash + cc0.cashCollected,
      totalOnlineCollection: sco.saleOnline + cc0.onlineCollected,
      cashbook: cashbookSummary,
      categoryWiseSale,
      productWiseSale,
      creditGivenByCustomer,
      creditReceivedByCustomer,
    };
  }

  // ─── Sales Report ──────────────────────────────────────────────
  static async getSalesReport(organizationId: string, startDate: string, endDate: string) {
    const orgId = toObjectId(organizationId);
    const dateRange = buildDateFilter(startDate, endDate);

    const [
      salesSummary,
      paymentModeSummary,
      productWiseSale,
      categoryWiseSale,
      dailyBreakdown,
    ] = await Promise.all([
      // Sales overview
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            totalDiscount: { $sum: "$totalDiscount" },
            totalTax: { $sum: "$taxAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Payment mode breakdown from cashbook
      CashbookEntry.aggregate([
        { $match: { organizationId: orgId, date: dateRange, sourceType: "sale" } },
        {
          $group: {
            _id: null,
            totalCash: { $sum: "$cashIn" },
            totalOnline: { $sum: "$onlineIn" },
          },
        },
      ]),

      // Product-wise
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
            totalDiscount: { $sum: "$items.discountAmount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Category-wise
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$productInfo.category", "Uncategorized"] },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Daily breakdown
      Sale.aggregate([
        { $match: { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            totalAmount: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const salesData = salesSummary[0] || { totalSales: 0, totalPaid: 0, totalDue: 0, totalDiscount: 0, totalTax: 0, count: 0 };
    const paymentData = paymentModeSummary[0] || { totalCash: 0, totalOnline: 0 };

    return {
      period: { startDate, endDate },
      summary: salesData,
      paymentMode: {
        cash: paymentData.totalCash,
        online: paymentData.totalOnline,
        credit: salesData.totalDue,
      },
      productWiseSale,
      categoryWiseSale,
      dailyBreakdown,
    };
  }

  // ─── Purchase Report ───────────────────────────────────────────
  static async getPurchaseReport(organizationId: string, startDate: string, endDate: string) {
    const orgId = toObjectId(organizationId);
    const dateRange = buildDateFilter(startDate, endDate);

    const [
      purchaseSummary,
      productWisePurchase,
      categoryWisePurchase,
      vendorWisePurchase,
      dailyBreakdown,
    ] = await Promise.all([
      // Overview
      Purchase.aggregate([
        { $match: { organizationId: orgId, purchaseDate: dateRange } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            totalTax: { $sum: "$taxAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Product-wise
      Purchase.aggregate([
        { $match: { organizationId: orgId, purchaseDate: dateRange } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Category-wise
      Purchase.aggregate([
        { $match: { organizationId: orgId, purchaseDate: dateRange } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$productInfo.category", "Uncategorized"] },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Vendor-wise
      Purchase.aggregate([
        { $match: { organizationId: orgId, purchaseDate: dateRange } },
        {
          $group: {
            _id: "$vendorId",
            vendorName: { $first: "$vendorName" },
            totalAmount: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Daily
      Purchase.aggregate([
        { $match: { organizationId: orgId, purchaseDate: dateRange } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
            totalAmount: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      period: { startDate, endDate },
      summary: purchaseSummary[0] || { totalPurchases: 0, totalPaid: 0, totalDue: 0, totalTax: 0, count: 0 },
      productWisePurchase,
      categoryWisePurchase,
      vendorWisePurchase,
      dailyBreakdown,
    };
  }

  // ─── Vendor Report ─────────────────────────────────────────────
  static async getVendorReport(organizationId: string, startDate: string, endDate: string, vendorId?: string) {
    const orgId = toObjectId(organizationId);
    const dateRange = buildDateFilter(startDate, endDate);

    // Purchases by/from vendor
    const purchaseMatch: any = { organizationId: orgId, purchaseDate: dateRange };
    if (vendorId) purchaseMatch.vendorId = toObjectId(vendorId);

    // Sales allocated to vendor (via vendorAllocations in sale items)
    const saleMatch: any = { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" };

    const [
      vendorPurchaseSummary,
      vendorProductWisePurchase,
      vendorCategoryWisePurchase,
      vendorSalesSummary,
      vendorProductWiseSale,
      vendorCategoryWiseSale,
    ] = await Promise.all([
      // Purchase summary per vendor
      Purchase.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: "$vendorId",
            vendorName: { $first: "$vendorName" },
            totalPurchases: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalPurchases: -1 } },
      ]),

      // Product-wise purchase per vendor
      Purchase.aggregate([
        { $match: purchaseMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: { vendorId: "$vendorId", productId: "$items.productId" },
            vendorName: { $first: "$vendorName" },
            productName: { $first: "$items.productName" },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Category-wise purchase per vendor
      Purchase.aggregate([
        { $match: purchaseMatch },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { vendorId: "$vendorId", category: { $ifNull: ["$productInfo.category", "Uncategorized"] } },
            vendorName: { $first: "$vendorName" },
            totalQuantity: { $sum: "$items.quantity" },
            totalAmount: { $sum: "$items.totalAmount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Sales involving vendor (via vendor allocations)
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: "$items" },
        { $unwind: "$items.vendorAllocations" },
        ...(vendorId
          ? [{ $match: { "items.vendorAllocations.vendorId": toObjectId(vendorId) } }]
          : []),
        {
          $group: {
            _id: "$items.vendorAllocations.vendorId",
            vendorName: { $first: "$items.vendorAllocations.vendorName" },
            totalQuantitySold: { $sum: "$items.vendorAllocations.quantity" },
            totalSaleAmount: {
              $sum: {
                $multiply: [
                  "$items.pricePerUnit",
                  "$items.vendorAllocations.quantity",
                ],
              },
            },
          },
        },
        { $sort: { totalSaleAmount: -1 } },
      ]),

      // Product-wise sale per vendor
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: "$items" },
        { $unwind: "$items.vendorAllocations" },
        ...(vendorId
          ? [{ $match: { "items.vendorAllocations.vendorId": toObjectId(vendorId) } }]
          : []),
        {
          $group: {
            _id: {
              vendorId: "$items.vendorAllocations.vendorId",
              productId: "$items.productId",
            },
            vendorName: { $first: "$items.vendorAllocations.vendorName" },
            productName: { $first: "$items.productName" },
            totalQuantity: { $sum: "$items.vendorAllocations.quantity" },
            totalAmount: {
              $sum: {
                $multiply: ["$items.pricePerUnit", "$items.vendorAllocations.quantity"],
              },
            },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Category-wise sale per vendor
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: "$items" },
        { $unwind: "$items.vendorAllocations" },
        ...(vendorId
          ? [{ $match: { "items.vendorAllocations.vendorId": toObjectId(vendorId) } }]
          : []),
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              vendorId: "$items.vendorAllocations.vendorId",
              category: { $ifNull: ["$productInfo.category", "Uncategorized"] },
            },
            vendorName: { $first: "$items.vendorAllocations.vendorName" },
            totalQuantity: { $sum: "$items.vendorAllocations.quantity" },
            totalAmount: {
              $sum: {
                $multiply: ["$items.pricePerUnit", "$items.vendorAllocations.quantity"],
              },
            },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    return {
      period: { startDate, endDate },
      purchases: {
        summary: vendorPurchaseSummary,
        productWise: vendorProductWisePurchase,
        categoryWise: vendorCategoryWisePurchase,
      },
      sales: {
        summary: vendorSalesSummary,
        productWise: vendorProductWiseSale,
        categoryWise: vendorCategoryWiseSale,
      },
    };
  }

  // ─── Product Report ────────────────────────────────────────────
  static async getProductReport(organizationId: string, startDate: string, endDate: string, productId?: string) {
    const orgId = toObjectId(organizationId);
    const dateRange = buildDateFilter(startDate, endDate);

    const saleMatch: any = { organizationId: orgId, saleDate: dateRange, status: "active", type: "sale" };
    const purchaseMatch: any = { organizationId: orgId, purchaseDate: dateRange };

    const [
      productSalesSummary,
      productPurchasesSummary,
      productList,
    ] = await Promise.all([
      // Product-wise sales
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: "$items" },
        ...(productId ? [{ $match: { "items.productId": toObjectId(productId) } }] : []),
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            category: { $first: { $ifNull: ["$productInfo.category", "Uncategorized"] } },
            brand: { $first: "$productInfo.brand" },
            totalQuantitySold: { $sum: "$items.quantity" },
            totalSaleAmount: { $sum: "$items.totalAmount" },
            totalDiscount: { $sum: "$items.discountAmount" },
          },
        },
        { $sort: { totalSaleAmount: -1 } },
      ]),

      // Product-wise purchases
      Purchase.aggregate([
        { $match: purchaseMatch },
        { $unwind: "$items" },
        ...(productId ? [{ $match: { "items.productId": toObjectId(productId) } }] : []),
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            category: { $first: { $ifNull: ["$productInfo.category", "Uncategorized"] } },
            brand: { $first: "$productInfo.brand" },
            totalQuantityPurchased: { $sum: "$items.quantity" },
            totalPurchaseAmount: { $sum: "$items.totalAmount" },
          },
        },
        { $sort: { totalPurchaseAmount: -1 } },
      ]),

      // Current product details
      Product.find(
        {
          organizationId: orgId,
          status: "active",
          ...(productId ? { _id: toObjectId(productId) } : {}),
        },
        { name: 1, category: 1, brand: 1, currentStock: 1, pricePerUnit: 1 }
      ).lean(),
    ]);

    // Merge sales and purchase data per product
    const productMap = new Map<string, any>();

    for (const p of productList) {
      const id = p._id.toString();
      productMap.set(id, {
        productId: id,
        productName: p.name,
        category: p.category || "Uncategorized",
        brand: p.brand || "-",
        currentStock: p.currentStock,
        pricePerUnit: p.pricePerUnit,
        totalQuantitySold: 0,
        totalSaleAmount: 0,
        totalQuantityPurchased: 0,
        totalPurchaseAmount: 0,
      });
    }

    for (const s of productSalesSummary) {
      const id = s._id.toString();
      if (productMap.has(id)) {
        productMap.get(id).totalQuantitySold = s.totalQuantitySold;
        productMap.get(id).totalSaleAmount = s.totalSaleAmount;
      } else {
        productMap.set(id, {
          productId: id,
          productName: s.productName,
          category: s.category,
          brand: s.brand || "-",
          currentStock: 0,
          pricePerUnit: 0,
          totalQuantitySold: s.totalQuantitySold,
          totalSaleAmount: s.totalSaleAmount,
          totalQuantityPurchased: 0,
          totalPurchaseAmount: 0,
        });
      }
    }

    for (const p of productPurchasesSummary) {
      const id = p._id.toString();
      if (productMap.has(id)) {
        productMap.get(id).totalQuantityPurchased = p.totalQuantityPurchased;
        productMap.get(id).totalPurchaseAmount = p.totalPurchaseAmount;
      } else {
        productMap.set(id, {
          productId: id,
          productName: p.productName,
          category: p.category,
          brand: p.brand || "-",
          currentStock: 0,
          pricePerUnit: 0,
          totalQuantitySold: 0,
          totalSaleAmount: 0,
          totalQuantityPurchased: p.totalQuantityPurchased,
          totalPurchaseAmount: p.totalPurchaseAmount,
        });
      }
    }

    const products = Array.from(productMap.values());
    const totalSaleAmount = products.reduce((s, p) => s + p.totalSaleAmount, 0);
    const totalPurchaseAmount = products.reduce((s, p) => s + p.totalPurchaseAmount, 0);
    const totalQuantitySold = products.reduce((s, p) => s + p.totalQuantitySold, 0);
    const totalQuantityPurchased = products.reduce((s, p) => s + p.totalQuantityPurchased, 0);

    return {
      period: { startDate, endDate },
      summary: {
        totalProducts: products.length,
        totalSaleAmount,
        totalPurchaseAmount,
        totalQuantitySold,
        totalQuantityPurchased,
      },
      products,
    };
  }
}
