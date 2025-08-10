
import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_WORDS = [
  "hops","malt","barley","yeast","mash","wort","lager","ale","stout","porter",
  "pilsner","saison","kolsch","amber","bitter","cask","keg","taproom","growler","pint",
  "hoppy","session","barrel","cellar","craft","brew","bristol","stokes","croft","common",
  "mural","banksy","clifton","harbourside","avon","brunel","balloon","gloucester","lakota",
  "turboisland","montpelier","stpauls","hospitality","cheers","notsocommon","blueglass","graff","goodcheer","taplist","northstreet"
];

type SecretWordRow = { word: string };

function getUtcDayKey(d: Date) {
  const startOfYearUtc = Date.UTC(d.getUTCFullYear(), 0, 1);
  const todayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((todayUtc - startOfYearUtc) / 86400000);
}

function msUntilNextUtcMidnight() {
  const now = new Date();
  const nextUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return nextUtcMidnight.getTime() - now.getTime();
}

export function useSecretWordOfTheDay() {
  const { data, error } = useQuery({
    queryKey: ["secret-words"],
    queryFn: async () => {
      console.log("[SecretWords] Fetching from Supabase...");
      const { data, error } = await supabase
        .from("secret_words")
        .select("word")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SecretWordRow[];
    },
    meta: {
      onError: (err: unknown) => {
        console.warn("[SecretWords] Fetch error:", err);
      },
    },
  });
  // Track UTC day changes to roll the word at midnight UTC
  const [utcDayKey, setUtcDayKey] = useState<number>(() => getUtcDayKey(new Date()));

  useEffect(() => {
    let timeoutId: number;
    const schedule = () => {
      const ms = msUntilNextUtcMidnight();
      timeoutId = window.setTimeout(() => {
        setUtcDayKey(getUtcDayKey(new Date()));
        schedule();
      }, ms);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  const word = useMemo(() => {
    const words = (data && data.length > 0 ? data.map(w => w.word) : FALLBACK_WORDS).filter(Boolean);
    const idx = words.length > 0 ? (utcDayKey % words.length) : 0;
    const selected = words[idx] || "cheers";
    console.log("[SecretWords] Using word:", selected);
    return selected;
  }, [data, utcDayKey]);

  return word;
}

export default useSecretWordOfTheDay;
