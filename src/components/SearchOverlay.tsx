"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { roundCoordinate } from "@/lib/coordinates";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { placePath } from "@/lib/slug";
import type { Place } from "@/lib/weather/types";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dict: Dictionary;
};

export function SearchOverlay({
  open,
  onClose,
  locale,
  dict,
}: SearchOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={dict.search.open}
          // Dims enough that white text reads on the lightest day sky.
          className="fixed inset-0 z-20 flex flex-col items-center bg-[#050312]/70 px-4 pt-[18vh] text-white backdrop-blur-[16px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onKeyDown={(event) => event.key === "Escape" && onClose()}
          // Only a click on the dimmed sky itself closes, not one inside the search.
          onMouseDown={(event) =>
            event.target === event.currentTarget && onClose()
          }
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.search.close}
            className="absolute top-6 right-6 cursor-pointer p-2 text-2xl leading-none text-white/75 hover:text-white"
          >
            ×
          </button>
          <SearchBox onClose={onClose} locale={locale} dict={dict} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type SearchResult = { query: string; places: Place[]; failed: boolean };

function Spinner() {
  return (
    <span
      aria-hidden
      className="block size-4 animate-spin rounded-full border-[1.5px] border-white/75 border-t-transparent motion-reduce:animate-none"
    />
  );
}

function SearchBox({
  onClose,
  locale,
  dict,
}: Omit<SearchOverlayProps, "open">) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResult | null>(null);
  const [highlight, setHighlight] = useState({ query: "", index: -1 });
  const [locationError, setLocationError] = useState("");
  const debounced = useDebouncedValue(query.trim(), 300);
  const isSearching = debounced.length >= 2;

  useEffect(() => {
    // Focus the input on open and give focus back to the trigger on close.
    const trigger = document.activeElement;
    inputRef.current?.focus();
    return () => {
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  useEffect(() => {
    if (!isSearching) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: debounced, lang: locale });
    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`search failed: ${res.status}`);
        const body = (await res.json()) as { results: Place[] };
        if (!controller.signal.aborted) {
          setResponse({
            query: debounced,
            places: body.results,
            failed: false,
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResponse({ query: debounced, places: [], failed: true });
        }
      });
    // A newer query aborts this one, so a slow answer never replaces newer results.
    return () => controller.abort();
  }, [debounced, isSearching, locale]);

  // Results and highlight only count for the query on screen.
  const current =
    isSearching && response?.query === debounced ? response : null;
  const places = current?.places ?? [];
  // From the keystroke until this exact text has its answer (debounce + request).
  const typed = query.trim();
  const isLoading = typed.length >= 2 && response?.query !== typed;
  const active = highlight.query === debounced ? highlight.index : -1;
  const message = current?.failed
    ? dict.search.unavailable
    : current && places.length === 0
      ? dict.search.noResults
      : "";

  function choose(place: Place | undefined) {
    if (!place || place.id === null) return;
    router.push(`/${locale}/${placePath(place.name, place.id)}`);
    onClose();
  }

  function goToMyLocation() {
    if (!navigator.geolocation) {
      setLocationError(dict.search.locationUnavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = roundCoordinate(coords.latitude);
        const lon = roundCoordinate(coords.longitude);
        router.push(`/${locale}?lat=${lat}&lon=${lon}`);
        onClose();
      },
      // Code 1 is PERMISSION_DENIED; anything else means no position.
      (error) =>
        setLocationError(
          error.code === 1
            ? dict.search.locationDenied
            : dict.search.locationUnavailable,
        ),
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (places.length === 0) return;
      const next = active + (event.key === "ArrowDown" ? 1 : -1);
      const index = next < 0 ? places.length - 1 : next % places.length;
      setHighlight({ query: debounced, index });
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(places[Math.max(active, 0)]);
    }
  }

  return (
    <div className="w-full max-w-[720px]">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={dict.search.open}
          aria-expanded={places.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${listId}-${active}` : undefined
          }
          placeholder={dict.search.placeholder}
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLocationError("");
          }}
          onKeyDown={onKeyDown}
          className="font-display w-full border-b border-white/30 bg-transparent pr-8 pb-3 text-4xl tracking-[-0.7px] outline-none placeholder:text-white/50 focus-visible:border-white md:text-6xl"
        />
        {isLoading && (
          <span className="absolute top-[calc(50%-6px)] right-0 -translate-y-1/2">
            <Spinner />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={goToMyLocation}
        className="mt-4 cursor-pointer text-sm tracking-[0.7px] text-white/75 underline-offset-4 hover:text-white hover:underline"
      >
        {dict.search.useMyLocation}
      </button>
      <ul
        id={listId}
        role="listbox"
        aria-label={dict.search.open}
        className="mt-4"
      >
        {places.map((place, i) => (
          <li
            key={place.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // Keeps focus in the input while clicking an option.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(place)}
            className={`cursor-pointer py-2 text-lg ${i === active ? "text-white" : "text-white/75 hover:text-white"}`}
          >
            {[place.name, place.region, place.country]
              .filter(Boolean)
              .join(", ")}
          </li>
        ))}
      </ul>
      <p role="status" className="mt-4 text-sm text-white/75">
        {locationError ||
          (isLoading ? (
            <span className="sr-only">{dict.search.searching}</span>
          ) : (
            message
          ))}
      </p>
    </div>
  );
}
