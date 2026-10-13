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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-4xl md:text-5xl">{dict.error.title}</h1>
      {/* retry() re-fetches the segment; reset() would only re-render the failed result. */}
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 cursor-pointer border-b border-current pb-1 text-sm tracking-[0.7px]"
      >
        {dict.error.retry}
      </button>
    </main>
  );
}
