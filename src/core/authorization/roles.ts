export type TenantRole = "owner" | "admin" | "member"

export function hasMinimumRole(
  userRole: TenantRole,
  requiredRole: TenantRole
) {
  const hierarchy = {
    owner: 3,
    admin: 2,
    member: 1,
  }

  return hierarchy[userRole] >= hierarchy[requiredRole]
}