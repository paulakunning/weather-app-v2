import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, locales, matchLocale } from "@/i18n/config";

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = matchLocale(
    request.headers.get("accept-language"),
    request.cookies.get(LOCALE_COOKIE)?.value,
  );
  const path = pathname === "/" ? "" : pathname;
  return NextResponse.redirect(
    new URL(`/${locale}${path}${search}`, request.url),
  );
}

export const config = {
  // Skips the API, Next internals and any file with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
