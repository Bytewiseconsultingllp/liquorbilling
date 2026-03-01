import mongoose from "mongoose"
import { Expense, ExpenseCategory } from "@/models/Expense"
import { AuditService } from "@/services/auditService"
import { CashbookService } from "@/services/cashbookService"

export class ExpenseService {
  /* ────────── Categories ────────── */

  static async listCategories(organizationId: string) {
    return ExpenseCategory.find({ organizationId }).sort({ name: 1 }).lean()
  }

  static async createCategory(
    data: { name: string; description?: string },
    organizationId: string
  ) {
    return ExpenseCategory.create({ ...data, organizationId })
  }

  static async updateCategory(
    id: string,
    data: { name?: string; description?: string },
    organizationId: string
  ) {
    const cat = await ExpenseCategory.findOneAndUpdate(
      { _id: id, organizationId },
      data,
      { new: true }
    )
    if (!cat) throw new Error("Category not found")
    return cat
  }

  static async deleteCategory(id: string, organizationId: string) {
    // Prevent deletion if expenses reference this category
    const count = await Expense.countDocuments({
      categoryId: id,
      organizationId,
      status: { $ne: "deleted" },
    })
    if (count > 0) throw new Error("Cannot delete category with existing expenses")
    await ExpenseCategory.deleteOne({ _id: id, organizationId })
  }

  /* ────────── Expenses ────────── */

  static async listExpenses(
    organizationId: string,
    opts: {
      page?: number
      limit?: number
      categoryId?: string
      startDate?: string
      endDate?: string
      paymentMode?: string
    } = {}
  ) {
    const { page = 1, limit = 20, categoryId, startDate, endDate, paymentMode } = opts
    const skip = (page - 1) * limit

    const filter: any = { organizationId, status: { $ne: "deleted" } }
    if (categoryId) filter.categoryId = categoryId
    if (paymentMode) filter.paymentMode = paymentMode
    if (startDate || endDate) {
      filter.expenseDate = {}
      if (startDate) filter.expenseDate.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.expenseDate.$lte = end
      }
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(filter),
    ])

    return {
      data: expenses,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  static async createExpense(
    data: any,
    organizationId: string,
    actorId: string
  ) {
    const session = await mongoose.startSession()
    try {
      session.startTransaction()

      // Generate expense number
      const count = await Expense.countDocuments({ organizationId })
      const expenseNumber = `EXP-${String(count + 1).padStart(5, "0")}`

      const expense = await Expense.create(
        [
          {
            ...data,
            expenseNumber,
            organizationId,
            createdBy: actorId,
          },
        ],
        { session }
      )

      // Cashbook entry (cash-out / online-out)
      const isCash = data.paymentMode === "Cash"
      const isOnline = data.paymentMode === "Online"
      if (isCash || isOnline) {
        await CashbookService.createEntry(
          {
            organizationId,
            date: data.expenseDate || new Date(),
            sourceType: "expense",
            referenceId: expense[0]._id,
            cashOut: isCash ? data.amount : 0,
            onlineOut: isOnline ? data.amount : 0,
            description: `Expense: ${data.categoryName} - ${data.description || expenseNumber}`,
          },
          session
        )
      }

      await AuditService.log({
        actorId,
        tenantId: organizationId,
        action: "CREATE_EXPENSE",
        entityType: "Expense",
        entityId: expense[0]._id,
      })

      await session.commitTransaction()
      session.endSession()
      return expense[0]
    } catch (err) {
      await session.abortTransaction()
      session.endSession()
      throw err
    }
  }

  static async deleteExpense(
    id: string,
    organizationId: string,
    actorId: string
  ) {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, organizationId, status: { $ne: "deleted" } },
      { status: "deleted", deletedAt: new Date() },
      { new: true }
    )
    if (!expense) throw new Error("Expense not found")

    await AuditService.log({
      actorId,
      tenantId: organizationId,
      action: "DELETE_EXPENSE",
      entityType: "Expense",
      entityId: id,
    })

    return expense
  }

  /* ────────── Aggregates ────────── */

  static async getSummary(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ) {
    const match: any = { organizationId, status: { $ne: "deleted" } }
    if (startDate || endDate) {
      match.expenseDate = {}
      if (startDate) match.expenseDate.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        match.expenseDate.$lte = end
      }
    }

    const [byCategory, byPaymentMode, totals] = await Promise.all([
      Expense.aggregate([
        { $match: match },
        { $group: { _id: "$categoryName", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: "$paymentMode", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ])

    return {
      byCategory,
      byPaymentMode,
      totalAmount: totals[0]?.total || 0,
      totalCount: totals[0]?.count || 0,
    }
  }
}
