"use client";

import { useParams } from "next/navigation";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { lang } = useParams<{ lang: string }>();
  const dict = getDictionary(isLocale(lang) ? lang : defaultLocale);

  return (
    <main>
      <h1>{dict.error.title}</h1>
      {/* retry() re-fetches the segment; reset() would only re-render the failed result. */}
      <button type="button" onClick={() => retry()}>
        {dict.error.retry}
      </button>
    </main>
  );
}
