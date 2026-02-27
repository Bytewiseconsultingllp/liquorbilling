import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "@/models/User";
import { createUserSchema, bulkUserSchema, updateUserSchema } from "@/validators/userValidator";
import { AuditService } from "./auditService";
import { Tenant } from "@/models/Tenant";
const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: 999999,
};
export class UserService {
  static async createUser(data: unknown, tenantId: string) {
    const parsed = createUserSchema.parse(data);

    const existing = await User.findOne({ email: parsed.email });
    if (existing) {
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const tenant = await Tenant.findById(tenantId);

    const currentCount = await User.countDocuments({
      tenantId,
      status: { $ne: "deleted" },
    });

    if (currentCount >= PLAN_LIMITS[tenant.plan]) {
      throw new Error("User limit reached for current plan");
    }
    const user = await User.create({
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      tenantId,
      role: parsed.role,
      employmentType: parsed.employmentType,
      salary: parsed.employmentType === "employee" ? parsed.salary : 0,
      isPlatformAdmin: false,
      status: "active",
    });

    return user;
  }

  static async updateUser(userId: string, data: unknown, currentUserId: string) {
    const parsed = updateUserSchema.parse(data);
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (parsed.role && parsed.role !== user.role) {
      if (userId === currentUserId && parsed.role !== "owner") {
        throw new Error("You cannot demote yourself");
      }
      if (user.role === "owner" && parsed.role !== "owner") {
        const ownerCount = await User.countDocuments({ tenantId: user.tenantId, role: "owner" });
        if (ownerCount <= 1) throw new Error("Cannot demote the last owner");
      }
    }

    if (parsed.email && parsed.email !== user.email) {
      const dup = await User.findOne({ email: parsed.email });
      if (dup) throw new Error("Email already exists");
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.email !== undefined) updateData.email = parsed.email;
    if (parsed.role !== undefined) updateData.role = parsed.role;
    if (parsed.employmentType !== undefined) updateData.employmentType = parsed.employmentType;
    if (parsed.employmentType === "non-employee") updateData.salary = 0;
    else if (parsed.salary !== undefined) updateData.salary = parsed.salary;

    const updated = await User.findByIdAndUpdate(userId, updateData, { returnDocument: "after" });

    await AuditService.log({
      actorId: currentUserId,
      tenantId: user.tenantId,
      action: "UPDATE_USER",
      entityType: "User",
      entityId: user._id,
      metadata: updateData,
    });

    return updated;
  }

  static async updateUserRole(
    userId: string,
    newRole: "owner" | "admin" | "member",
    currentUserId: string,
  ) {
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    // Prevent self-demotion
    if (userId === currentUserId && newRole !== "owner") {
      throw new Error("You cannot demote yourself");
    }

    // If demoting an owner
    if (user.role === "owner" && newRole !== "owner") {
      const ownerCount = await User.countDocuments({
        tenantId: user.tenantId,
        role: "owner",
      });

      if (ownerCount <= 1) {
        throw new Error("Cannot demote the last owner");
      }
    }

    user.role = newRole;
    await user.save();
    await AuditService.log({
      actorId: currentUserId,
      tenantId: user.tenantId,
      action: "UPDATE_ROLE",
      entityType: "User",
      entityId: user._id,
      metadata: { newRole },
    });
    return user;
  }
  static async disableUser(userId: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "disabled" },
      { new: true },
    );

    if (!user) throw new Error("User not found");

    return user;
  }

  static async deleteUser(userId: string, currentUserId: string) {
    const user = await User.findByIdAndUpdate(userId, {
      status: "deleted",
      deletedAt: new Date(),
    });

    if (!user) throw new Error("User not found");

    // Prevent self-deletion
    if (userId === currentUserId) {
      throw new Error("You cannot delete yourself");
    }

    // Prevent deleting last owner
    if (user.role === "owner") {
      const ownerCount = await User.countDocuments({
        tenantId: user.tenantId,
        role: "owner",
      });

      if (ownerCount <= 1) {
        throw new Error("Cannot delete the last owner");
      }
    }

    await User.findByIdAndDelete(userId);
    await AuditService.log({
      actorId: currentUserId,
      tenantId: user.tenantId,
      action: "DELETE_USER",
      entityType: "User",
      entityId: user._id,
      metadata: { deletedAt: new Date() },
    });
    return true;
  }

  static async bulkCreateUsers(data: unknown, tenantId: string) {
    const session = await mongoose.startSession();

    try {
      const parsed = bulkUserSchema.parse(data);

      session.startTransaction();

      const usersToInsert = [];

      for (const entry of parsed) {
        const existing = await User.findOne({
          email: entry.email,
        }).session(session);

        if (existing) {
          throw new Error(`Email already exists: ${entry.email}`);
        }

        const passwordHash = await bcrypt.hash(entry.password, 10);

        usersToInsert.push({
          name: entry.name,
          email: entry.email,
          passwordHash,
          tenantId,
          role: entry.role,
          employmentType: entry.employmentType,
          salary: entry.employmentType === "employee" ? (entry.salary || 0) : 0,
          isPlatformAdmin: false,
          status: "active",
        });
      }

      await User.insertMany(usersToInsert, { session });

      await session.commitTransaction();
      session.endSession();

      return { created: usersToInsert.length };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
