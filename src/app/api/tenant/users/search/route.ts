import { NextResponse } from "next/server"
import { elasticClient } from "@/lib/elastic"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""
  const page = Number(searchParams.get("page") || 1)
  const size = 10

  const result = await elasticClient.search({
    index: "users",
    from: (page - 1) * size,
    size,
    query: {
      bool: {
        must: [
          { match: { email: query } },
          { term: { tenantId: session.user.tenantId } },
        ],
      },
    },
  })

  return NextResponse.json(result.hits.hits)
}