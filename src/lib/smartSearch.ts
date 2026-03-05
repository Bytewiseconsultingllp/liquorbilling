/**
 * Smart token-based search utility.
 *
 * Splits the query into individual tokens and checks that EVERY token matches
 * at least one of the searchable fields of a record. This means:
 *   "MM 90ml"  matches "MM Vodka 90 ml"
 *   "vodka 180" matches "MM Vodka 180 ml"
 *   "bhola cash" matches "Bhola | cashAmount"
 *
 * Tokens are matched case-insensitively and support partial matches.
 *
 * For MongoDB server-side queries, `buildTokenRegex` creates a `$and` array
 * of `$or` conditions that can be spread into a Mongoose filter.
 */

/* ─── Client-side ─── */

/**
 * Returns true if every token in `query` appears in at least one of the
 * provided `fields` strings.
 */
export function smartMatch(query: string, ...fields: (string | number | null | undefined)[]): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  const hay = fields.map(f => String(f ?? "").toLowerCase()).join(" ")
  return tokens.every(token => hay.includes(token))
}

/* ─── Server-side (MongoDB) ─── */

/**
 * Builds a MongoDB `$and` filter where every search token must match at least
 * one of the given field paths via `$regex`.
 *
 * Example:
 *   buildTokenRegex("MM 90ml", ["name", "brand", "category"])
 *   → { $and: [
 *       { $or: [{ name: /MM/i }, { brand: /MM/i }, { category: /MM/i }] },
 *       { $or: [{ name: /90ml/i }, { brand: /90ml/i }, { category: /90ml/i }] },
 *     ] }
 *
 * Returns `null` when the query is empty so callers can skip it.
 */
export function buildTokenRegex(query: string, fieldPaths: string[]): Record<string, unknown> | null {
  const tokens = query.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null

  // Escape special regex characters in each token
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const andConditions = tokens.map(token => ({
    $or: fieldPaths.map(field => ({ [field]: { $regex: escape(token), $options: "i" } })),
  }))

  return andConditions.length === 1 ? andConditions[0] : { $and: andConditions }
}
