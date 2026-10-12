import { defaultLocale, isLocale } from "@/i18n/config";
import { UpstreamError } from "@/lib/errors";
import { searchPlaces } from "@/lib/geocoding/geocoding";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  if (query.length > 100) {
    return Response.json({ error: "query_too_long" }, { status: 400 });
  }
  const lang = searchParams.get("lang") ?? undefined;
  const locale = isLocale(lang) ? lang : defaultLocale;

  try {
    const results = await searchPlaces(query, locale);
    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  } catch (error) {
    if (error instanceof UpstreamError) {
      return Response.json({ error: "upstream" }, { status: 502 });
    }
    throw error;
  }
}
