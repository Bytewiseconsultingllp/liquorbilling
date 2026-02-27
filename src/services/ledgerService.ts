import { LedgerEntry } from "@/models/LedgerEntry"

export class LedgerService {

  static async createEntry({
    organizationId,
    entityType,
    entityId,
    referenceType,
    referenceId,
    debit = 0,
    credit = 0,
    description,
    session,
  }: any) {

    // Get last balance
    const lastEntry = await LedgerEntry.findOne({
      organizationId,
      entityId,
      entityType,
    })
      .sort({ createdAt: -1 })
      .session(session)

    const previousBalance =
      lastEntry?.balanceAfter || 0

    const newBalance =
      previousBalance + debit - credit

    return LedgerEntry.create(
      [{
        organizationId,
        entityType,
        entityId,
        referenceType,
        referenceId,
        debit,
        credit,
        balanceAfter: newBalance,
        description,
      }],
      { session }
    )
  }
}