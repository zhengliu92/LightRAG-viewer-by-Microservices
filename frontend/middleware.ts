import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/login";
  const access_token = cookieStore.get("access_token")?.value;

  if (!isPublicPath && !access_token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isPublicPath && access_token) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }
}

export const config = {
  matcher: ["/", "/login"],
};
