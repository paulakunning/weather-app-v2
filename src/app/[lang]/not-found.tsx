import { lang } from "next/root-params";
import { SearchTrigger } from "@/components/SearchTrigger";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const param = await lang();
  const locale = isLocale(param) ? param : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-4xl md:text-5xl">
        {dict.notFound.title}
      </h1>
      <p className="text-(--ink-mid-2)">{dict.notFound.body}</p>
      <SearchTrigger locale={locale} dict={dict} />
    </main>
  );
}
