import { AuditLog } from "@/models/AuditLog"

export class AuditService {
  static async log({
    actorId,
    tenantId,
    action,
    entityType,
    entityId,
    metadata,
  }: any) {
    await AuditLog.create({
      actorId,
      tenantId,
      action,
      entityType,
      entityId,
      metadata,
    })
  }
}