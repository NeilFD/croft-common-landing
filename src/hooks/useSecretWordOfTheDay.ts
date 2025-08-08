
import { useMemo } from "react";
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

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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

  const word = useMemo(() => {
    const words = (data && data.length > 0 ? data.map(w => w.word) : FALLBACK_WORDS).filter(Boolean);
    const idx = words.length > 0 ? dayOfYear(new Date()) % words.length : 0;
    const selected = words[idx] || "cheers";
    console.log("[SecretWords] Using word:", selected);
    return selected;
  }, [data]);

  return word;
}

export default useSecretWordOfTheDay;
