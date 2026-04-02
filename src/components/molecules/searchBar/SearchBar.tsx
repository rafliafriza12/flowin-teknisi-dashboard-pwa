"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "../../atoms/icons/SearchIcon";
import CommandF from "../../atoms/icons/CommandF";
import { searchableItems, SearchableItem } from "@/constant/searchableItems";
import { usePermissions } from "@/providers/PermissionProvider";
import ChevronLeftIcon from "../../atoms/icons/ChevronLeftIcon";

// ── helpers ──────────────────────────────────────────────────────────

/** Normalise a string for matching (lowercase, trimmed). */
const norm = (s: string) => s.toLowerCase().trim();

/**
 * Score how well `query` matches `item`.
 * Returns 0 when there is no match at all.
 * Higher → better match.
 */
function scoreItem(item: SearchableItem, query: string): number {
  const q = norm(query);
  if (!q) return 0;

  const label = norm(item.label);
  const category = norm(item.category ?? "");
  const fullLabel = category ? `${category} ${label}` : label;

  // Exact full label match
  if (label === q || fullLabel === q) return 100;

  // Label starts with query
  if (label.startsWith(q)) return 80;

  // Label includes query
  if (label.includes(q)) return 60;

  // Category + label includes query
  if (fullLabel.includes(q)) return 50;

  // Any keyword starts with query
  for (const kw of item.keywords) {
    if (norm(kw).startsWith(q)) return 40;
  }

  // Any keyword includes query
  for (const kw of item.keywords) {
    if (norm(kw).includes(q)) return 30;
  }

  // Split multi-word query: every word must match something
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const haystack = [label, category, ...item.keywords.map(norm)].join(" ");
    const allMatch = words.every((w) => haystack.includes(w));
    if (allMatch) return 20;
  }

  return 0;
}

// ── component ────────────────────────────────────────────────────────

export const SearchBar = () => {
  const router = useRouter();
  const { isTechnician, isLoading: isLoadingPermissions } = usePermissions();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // ── permission-filtered items (computed once when perms load) ──
  const allowedItems = useMemo(() => {
    if (isLoadingPermissions) return [];
    // Semua item ditampilkan untuk Teknisi yang sudah login
    if (isTechnician) return searchableItems;
    return searchableItems.filter((item) => !item.category); // hanya Dashboard & Profile
  }, [isLoadingPermissions, isTechnician]);

  // ── search results ─────────────────────────────────────────────
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const scored = allowedItems
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 8).map((r) => r.item);
  }, [query, allowedItems]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── navigate to item ──────────────────────────────────────────
  const navigate = useCallback(
    (item: SearchableItem) => {
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
      router.push(item.url);
    },
    [router],
  );

  // ── keyboard handler ──────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          navigate(results[activeIndex]);
        } else if (results.length > 0) {
          navigate(results[0]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // ── click outside → close ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── global Ctrl+F / Cmd+F shortcut ────────────────────────────
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, []);

  // ── highlight matched text ────────────────────────────────────
  const highlightMatch = (text: string) => {
    const q = norm(query);
    if (!q) return text;

    const idx = norm(text).indexOf(q);
    if (idx === -1) return text;

    return (
      <>
        {text.slice(0, idx)}
        <span className="text-moss-stone font-semibold">
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-80">
      {/* Input */}
      <div
        className={`h-10 border rounded-lg bg-grey-lightest flex gap-2 items-center p-2 transition-colors ${
          showDropdown
            ? "border-moss-stone ring-2 ring-moss-stone/20"
            : "border-grey-stroke"
        }`}
      >
        <SearchIcon className="w-4 h-4 text-grey" />
        <input
          ref={inputRef}
          type="text"
          className="text-xs outline-none bg-transparent flex-1"
          placeholder="Search anything..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="text-grey hover:text-neutral-03 transition-colors p-0.5"
            aria-label="Clear search"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : (
          <CommandF className="w-7 h-7" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-grey-stroke rounded-lg shadow-lg overflow-hidden z-[60]">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-grey">
                No results found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            <ul
              ref={listRef}
              className="py-1 max-h-80 overflow-y-auto thinnest-scrollbar"
            >
              {results.map((item, idx) => (
                <li key={item.url}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(item);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === activeIndex
                        ? "bg-moss-stone/10"
                        : "hover:bg-grey-lightest"
                    }`}
                  >
                    <SearchIcon className="w-3.5 h-3.5 text-grey shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-neutral-03 block truncate">
                        {highlightMatch(item.label)}
                      </span>
                      {item.category && (
                        <span className="text-[10px] text-grey block truncate">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <ChevronLeftIcon className="w-3 h-3 text-grey rotate-180 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer hint */}
          <div className="border-t border-grey-stroke px-4 py-2 flex items-center gap-3 text-[10px] text-grey">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-grey-lightest border border-grey-stroke text-[9px] font-mono">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-grey-lightest border border-grey-stroke text-[9px] font-mono">
                ↵
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-grey-lightest border border-grey-stroke text-[9px] font-mono">
                esc
              </kbd>
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
