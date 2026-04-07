import { NextResponse, userAgent, type NextRequest } from "next/server";
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

function isMobileDevice(request: NextRequest) {
  const deviceType = userAgent(request).device.type;
  return deviceType === "mobile" || deviceType === "tablet";
}

function getMobilePathname(pathname: string) {
  if (pathname === "/") {
    return "/m";
  }

  if (pathname === "/archive") {
    return "/m/archive";
  }

  if (pathname === "/settings") {
    return "/m/account";
  }

  const spacePageMatch = pathname.match(/^\/space\/([^/]+)$/);
  if (spacePageMatch) {
    return `/m/space/${spacePageMatch[1]}`;
  }

  const workOrderModuleMatch = pathname.match(
    /^\/space\/([^/]+)\/work-order\/([^/]+)\/([^/]+)$/,
  );

  if (workOrderModuleMatch) {
    const [, spaceId, workOrderId, moduleName] = workOrderModuleMatch;
    const mobileTab =
      moduleName === "overview" ||
      moduleName === "chat" ||
      moduleName === "documents" ||
      moduleName === "logs"
        ? moduleName
        : "overview";

    return `/m/space/${spaceId}/work-order/${workOrderId}/${mobileTab}`;
  }

  const workOrderPageMatch = pathname.match(/^\/space\/([^/]+)\/work-order\/([^/]+)$/);
  if (workOrderPageMatch) {
    return `/m/space/${workOrderPageMatch[1]}/work-order/${workOrderPageMatch[2]}/overview`;
  }

  const archiveRecordMatch = pathname.match(/^\/archive\/([^/]+)$/);
  if (archiveRecordMatch) {
    return `/m/archive/${archiveRecordMatch[1]}/overview`;
  }

  return "/m";
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

  if (user && isMobileDevice(request) && !pathname.startsWith("/m")) {
    const mobileUrl = request.nextUrl.clone();
    mobileUrl.pathname = getMobilePathname(pathname);
    mobileUrl.search = search;
    return NextResponse.redirect(mobileUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
