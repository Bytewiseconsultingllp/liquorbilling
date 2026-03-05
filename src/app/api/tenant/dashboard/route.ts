import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
import { Customer } from "@/models/Customer"
import { Sale } from "@/models/Sale"
import { Purchase } from "@/models/Purchase"
import { Vendor } from "@/models/Vendor"
import { Expense } from "@/models/Expense"
import { CreditPayment } from "@/models/CreditPayment"
import { StockClosing } from "@/models/StockClosing"
import { startOfDayIST, endOfDayIST } from "@/lib/timezone"
import mongoose from "mongoose"

// Dynamically load B2BSale model
const B2BSale = mongoose.models.B2BSale || mongoose.model("B2BSale_Dashboard", new mongoose.Schema({}, { strict: false, collection: "b2bsales" }))

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()
  const tenantId = session.user.tenantId
  const tid = new mongoose.Types.ObjectId(tenantId)

  const now = new Date()
  const todayStart = startOfDayIST()
  const todayEnd = endOfDayIST()

  // 7-day range
  const weekStart = startOfDayIST(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000))

  // 30-day range
  const monthStart = startOfDayIST(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000))

  const [
    totalUsers, activeUsers,
    totalProducts, lowStockProducts, outOfStockProducts,
    totalCustomers, customersWithDues, totalVendors,
    todaySalesAgg, todayPurchasesAgg, todayB2BSalesAgg, todayExpensesAgg, todayCreditAgg,
    totalOutstandingAgg,
    weeklySalesAgg, weeklyPurchasesAgg,
    monthlySalesAgg, monthlyPurchasesAgg, monthlyExpensesAgg,
    topProductsAgg, topCustomersAgg, topVendorsAgg,
    lowStockList, stockValueAgg,
    recentSales, recentPurchases,
    vendorDuesAgg, lastClosing,
  ] = await Promise.all([
    User.countDocuments({ tenantId, status: { $ne: "deleted" } }),
    User.countDocuments({ tenantId, status: "active" }),
    Product.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" } }),
    Product.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" }, $expr: { $lte: ["$currentStock", { $ifNull: ["$reorderLevel", 0] }] }, currentStock: { $gt: 0 } }),
    Product.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" }, currentStock: { $lte: 0 } }),
    Customer.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" } }),
    Customer.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" }, outstandingBalance: { $gt: 0 } }),
    Vendor.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" } }),

    Sale.aggregate([
      { $match: { organizationId: tid, saleDate: { $gte: todayStart, $lte: todayEnd }, status: "active", type: "sale" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" }, cash: { $sum: "$cashAmount" }, online: { $sum: "$onlineAmount" }, credit: { $sum: "$creditAmount" }, discount: { $sum: "$totalDiscount" }, count: { $sum: 1 } } },
    ]),
    Purchase.aggregate([
      { $match: { organizationId: tid, purchaseDate: { $gte: todayStart, $lte: todayEnd }, isReturned: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, subtotal: { $sum: "$subtotal" }, tax: { $sum: "$taxAmount" }, paid: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" }, count: { $sum: 1 } } },
    ]),
    B2BSale.aggregate([
      { $match: { organizationId: tid, saleDate: { $gte: todayStart, $lte: todayEnd }, status: "active" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" }, cash: { $sum: "$cashAmount" }, online: { $sum: "$onlineAmount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { organizationId: tid, expenseDate: { $gte: todayStart, $lte: todayEnd }, status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    CreditPayment.aggregate([
      { $match: { organizationId: tid, creditDate: { $gte: todayStart, $lte: todayEnd }, status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" }, cash: { $sum: "$cashAmount" }, online: { $sum: "$onlineAmount" }, count: { $sum: 1 } } },
    ]),

    Customer.aggregate([
      { $match: { organizationId: tid, status: { $ne: "deleted" }, outstandingBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$outstandingBalance" } } },
    ]),

    Sale.aggregate([
      { $match: { organizationId: tid, saleDate: { $gte: weekStart, $lte: todayEnd }, status: "active", type: "sale" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate", timezone: "+05:30" } }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Purchase.aggregate([
      { $match: { organizationId: tid, purchaseDate: { $gte: weekStart, $lte: todayEnd }, isReturned: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate", timezone: "+05:30" } }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    Sale.aggregate([
      { $match: { organizationId: tid, saleDate: { $gte: monthStart, $lte: todayEnd }, status: "active", type: "sale" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, cash: { $sum: "$cashAmount" }, online: { $sum: "$onlineAmount" }, credit: { $sum: "$creditAmount" }, discount: { $sum: "$totalDiscount" }, count: { $sum: 1 } } },
    ]),
    Purchase.aggregate([
      { $match: { organizationId: tid, purchaseDate: { $gte: monthStart, $lte: todayEnd }, isReturned: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { organizationId: tid, expenseDate: { $gte: monthStart, $lte: todayEnd }, status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),

    Sale.aggregate([
      { $match: { organizationId: tid, saleDate: { $gte: monthStart, $lte: todayEnd }, status: "active", type: "sale" } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", name: { $first: "$items.productName" }, totalQty: { $sum: "$items.quantity" }, totalAmount: { $sum: "$items.totalAmount" } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]),
    Sale.aggregate([
      { $match: { organizationId: tid, saleDate: { $gte: monthStart, $lte: todayEnd }, status: "active", type: "sale", customerId: { $ne: null } } },
      { $group: { _id: "$customerId", name: { $first: "$customerName" }, totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
    ]),
    Purchase.aggregate([
      { $match: { organizationId: tid, purchaseDate: { $gte: monthStart, $lte: todayEnd }, isReturned: { $ne: true } } },
      { $group: { _id: "$vendorId", name: { $first: "$vendorName" }, totalAmount: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
    ]),

    Product.find({ organizationId: tenantId, status: { $ne: "deleted" }, $or: [{ currentStock: { $lte: 0 } }, { $expr: { $lte: ["$currentStock", { $ifNull: ["$reorderLevel", 0] }] } }] })
      .select("name brand volumeML currentStock reorderLevel").sort({ currentStock: 1 }).limit(10).lean(),

    Product.aggregate([
      { $match: { organizationId: tid, status: { $ne: "deleted" }, currentStock: { $gt: 0 } } },
      { $group: { _id: null, totalRetailValue: { $sum: { $multiply: ["$currentStock", "$pricePerUnit"] } }, totalItems: { $sum: "$currentStock" }, productCount: { $sum: 1 } } },
    ]),

    Sale.find({ organizationId: tenantId, status: "active", type: "sale" })
      .select("saleNumber customerName totalAmount cashAmount onlineAmount creditAmount saleDate paymentStatus")
      .sort({ saleDate: -1, createdAt: -1 }).limit(5).lean(),

    Purchase.find({ organizationId: tenantId, isReturned: { $ne: true } })
      .select("purchaseNumber vendorName totalAmount paidAmount dueAmount purchaseDate paymentStatus")
      .sort({ purchaseDate: -1, createdAt: -1 }).limit(5).lean(),

    Purchase.aggregate([
      { $match: { organizationId: tid, isReturned: { $ne: true }, dueAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]),

    StockClosing.findOne({ organizationId: tenantId })
      .select("closingDate totalDifferenceValue cashAmount onlineAmount").sort({ closingDate: -1 }).lean(),
  ])

  const ts = todaySalesAgg[0] || { total: 0, paid: 0, due: 0, cash: 0, online: 0, credit: 0, discount: 0, count: 0 }
  const tp = todayPurchasesAgg[0] || { total: 0, subtotal: 0, tax: 0, paid: 0, due: 0, count: 0 }
  const tb = todayB2BSalesAgg[0] || { total: 0, paid: 0, due: 0, cash: 0, online: 0, count: 0 }
  const te = todayExpensesAgg[0] || { total: 0, count: 0 }
  const tc = todayCreditAgg[0] || { total: 0, cash: 0, online: 0, count: 0 }
  const ms = monthlySalesAgg[0] || { total: 0, cash: 0, online: 0, credit: 0, discount: 0, count: 0 }
  const mp = monthlyPurchasesAgg[0] || { total: 0, paid: 0, due: 0, count: 0 }
  const me = monthlyExpensesAgg[0] || { total: 0, count: 0 }
  const sv = stockValueAgg[0] || { totalRetailValue: 0, totalItems: 0, productCount: 0 }

  return NextResponse.json({
    todaySales: { count: ts.count, total: ts.total, paid: ts.paid, due: ts.due, cash: ts.cash, online: ts.online, credit: ts.credit, discount: ts.discount },
    todayPurchases: { count: tp.count, total: tp.total, subtotal: tp.subtotal, tax: tp.tax, paid: tp.paid, due: tp.due },
    todayB2B: { count: tb.count, total: tb.total, paid: tb.paid, due: tb.due, cash: tb.cash, online: tb.online },
    todayExpenses: { count: te.count, total: te.total },
    todayCredit: { count: tc.count, total: tc.total, cash: tc.cash, online: tc.online },
    users: { total: totalUsers, active: activeUsers },
    products: { total: totalProducts, lowStock: lowStockProducts, outOfStock: outOfStockProducts },
    customers: { total: totalCustomers, withDues: customersWithDues, totalOutstanding: totalOutstandingAgg[0]?.total || 0 },
    vendors: { total: totalVendors, totalDues: vendorDuesAgg[0]?.total || 0 },
    monthly: {
      sales: { total: ms.total, cash: ms.cash, online: ms.online, credit: ms.credit, discount: ms.discount, count: ms.count },
      purchases: { total: mp.total, paid: mp.paid, due: mp.due, count: mp.count },
      expenses: { total: me.total, count: me.count },
    },
    weeklyChart: {
      sales: weeklySalesAgg.map((d: any) => ({ date: d._id, total: d.total, count: d.count })),
      purchases: weeklyPurchasesAgg.map((d: any) => ({ date: d._id, total: d.total, count: d.count })),
    },
    topProducts: topProductsAgg.map((p: any) => ({ id: p._id, name: p.name, qty: p.totalQty, amount: p.totalAmount })),
    topCustomers: topCustomersAgg.map((c: any) => ({ id: c._id, name: c.name, amount: c.totalAmount, count: c.count })),
    topVendors: topVendorsAgg.map((v: any) => ({ id: v._id, name: v.name, amount: v.totalAmount, paid: v.paid, due: v.due, count: v.count })),
    lowStockList: lowStockList.map((p: any) => ({ id: p._id, name: p.name, brand: p.brand, volumeML: p.volumeML, currentStock: p.currentStock, reorderLevel: p.reorderLevel || 0 })),
    stockValue: { retailValue: sv.totalRetailValue, totalItems: sv.totalItems, productCount: sv.productCount },
    recentSales: recentSales.map((s: any) => ({ id: s._id, number: s.saleNumber, customer: s.customerName, total: s.totalAmount, cash: s.cashAmount, online: s.onlineAmount, credit: s.creditAmount, date: s.saleDate, status: s.paymentStatus })),
    recentPurchases: recentPurchases.map((p: any) => ({ id: p._id, number: p.purchaseNumber, vendor: p.vendorName, total: p.totalAmount, paid: p.paidAmount, due: p.dueAmount, date: p.purchaseDate, status: p.paymentStatus })),
    lastClosing: lastClosing ? { date: lastClosing.closingDate, diffValue: lastClosing.totalDifferenceValue, cash: lastClosing.cashAmount, online: lastClosing.onlineAmount } : null,
  })
}
