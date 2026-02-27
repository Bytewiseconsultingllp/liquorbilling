import mongoose from "mongoose"

const auditSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    action: String,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    metadata: Object,
  },
  { timestamps: true }
)

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditSchema)