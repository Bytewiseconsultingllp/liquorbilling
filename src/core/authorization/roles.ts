export type TenantRole = "owner" | "admin" | "manager" | "sales" | "accountant" | "tax_officer"

export function hasMinimumRole(
  userRole: TenantRole,
  requiredRole: TenantRole
) {
  const hierarchy: Record<string, number> = {
    owner: 6,
    admin: 5,
    manager: 4,
    accountant: 3,
    tax_officer: 2,
    sales: 1,
  }

  return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 0)
}