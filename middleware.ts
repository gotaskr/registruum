import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = new Set([
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/auth/callback",
]);

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname) || pathname.startsWith("/invite/");
}

function isAuthRoute(pathname: string) {
  return publicRoutes.has(pathname);
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicRoute(pathname)) {
    const signInUrl = new URL("/sign-in", request.url);

    if (pathname !== "/") {
      signInUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return NextResponse.redirect(signInUrl);
  }

  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
