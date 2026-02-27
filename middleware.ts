import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const url = req.nextUrl.clone()

  // Skip internal Next.js paths
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next()
  }

  // Development: allow path-based tenancy
  if (host.includes("localhost")) {
    return NextResponse.next()
  }

  // Extract subdomain
  const parts = host.split(".")

  // If no subdomain (e.g., yourapp.com)
  if (parts.length < 3) {
    return NextResponse.next()
  }

  const subdomain = parts[0]

  // Skip www
  if (subdomain === "www") {
    return NextResponse.next()
  }

  // Skip admin subdomain if you later use it
  if (subdomain === "admin") {
    return NextResponse.next()
  }

  // Rewrite to internal tenant route
  url.pathname = `/${subdomain}${url.pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
}