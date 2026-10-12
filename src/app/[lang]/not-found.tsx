import { lang } from "next/root-params";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const locale = await lang();
  const dict = getDictionary(isLocale(locale) ? locale : defaultLocale);

  return (
    <main>
      <h1>{dict.notFound.title}</h1>
      <p>{dict.notFound.body}</p>
    </main>
  );
}
