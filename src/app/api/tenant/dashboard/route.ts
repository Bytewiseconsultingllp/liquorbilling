import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
import { Customer } from "@/models/Customer"
import { Sale } from "@/models/Sale"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()
  const tenantId = session.user.tenantId

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const [
    totalUsers,
    activeUsers,
    totalProducts,
    lowStockProducts,
    totalCustomers,
    customersWithDues,
    todaySalesAgg,
    totalOutstanding,
  ] = await Promise.all([
    User.countDocuments({ tenantId, status: { $ne: "deleted" } }),
    User.countDocuments({ tenantId, status: "active" }),
    Product.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" } }),
    Product.countDocuments({
      organizationId: tenantId,
      status: { $ne: "deleted" },
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
    }),
    Customer.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" } }),
    Customer.countDocuments({ organizationId: tenantId, status: { $ne: "deleted" }, outstandingBalance: { $gt: 0 } }),
    Sale.aggregate([
      {
        $match: {
          organizationId: tenantId,
          saleDate: { $gte: startOfDay, $lte: endOfDay },
          status: "active",
          type: "sale",
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          totalCash: { $sum: "$cashAmount" },
          totalOnline: { $sum: "$onlineAmount" },
          totalCredit: { $sum: "$creditAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Customer.aggregate([
      { $match: { organizationId: tenantId, status: { $ne: "deleted" }, outstandingBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$outstandingBalance" } } },
    ]),
  ])

  const todaySales = todaySalesAgg[0] || {
    totalSales: 0,
    totalPaid: 0,
    totalDue: 0,
    totalCash: 0,
    totalOnline: 0,
    totalCredit: 0,
    count: 0,
  }

  return NextResponse.json({
    users: { total: totalUsers, active: activeUsers },
    products: { total: totalProducts, lowStock: lowStockProducts },
    customers: { total: totalCustomers, withDues: customersWithDues, totalOutstanding: totalOutstanding[0]?.total || 0 },
    todaySales: {
      count: todaySales.count,
      totalAmount: todaySales.totalSales,
      totalPaid: todaySales.totalPaid,
      totalDue: todaySales.totalDue,
      totalCash: todaySales.totalCash,
      totalOnline: todaySales.totalOnline,
      totalCredit: todaySales.totalCredit,
    },
  })
}
