"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { SearchOverlay } from "./SearchOverlay";

// A standalone "Search city" button for pages without the main screen.
export function SearchTrigger({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 cursor-pointer border-b border-current pb-1 text-sm tracking-[0.7px]"
      >
        {dict.search.open}
      </button>
      <SearchOverlay
        open={open}
        onClose={() => setOpen(false)}
        locale={locale}
        dict={dict}
      />
    </>
  );
}
