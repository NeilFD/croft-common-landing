// Editorial scroll-pinned hero beats per property page.
// Each beat is one short word (1-3 words max) shown over a frame as the
// user scrolls. First and last frame fall back to the page title.
// All entries fully overridable via CMS in a follow-up pass.
// 'Bears Den' tone: staccato, confident. No banned words.

export const heroBeats: Record<string, string[]> = {
  // ---- Town
  "/town": ["Velvet.", "Mirror.", "Marble.", "After hours."],
  "/town/rooms": ["Velvet.", "Mirror.", "Sleep loudly."],
  "/town/rooms/types": ["Pick.", "Your.", "Character."],
  "/town/rooms/gallery": ["Behind.", "The.", "Doors."],
  "/town/restaurants": ["Spice.", "Smoke.", "Sit longer."],
  "/town/bar": ["Pour.", "Linger.", "Repeat."],
  "/town/spa": ["Steam.", "Soak.", "Slow."],
  "/town/pool": ["Dive.", "Drift.", "Dry off later."],
  "/town/whats-on": ["Tonight.", "Late.", "Loud."],

  // ---- Country
  "/country": ["Fire.", "Long table.", "One more."],
  "/country/rooms": ["Beams.", "Copper.", "Linen."],
  "/country/rooms/types": ["Pick.", "Your.", "Character."],
  "/country/rooms/gallery": ["Behind.", "The.", "Doors."],
  "/country/restaurants": ["Spice.", "Smoke.", "Stay."],
  "/country/bar": ["Pour.", "Linger.", "Repeat."],
  "/country/whats-on": ["Tonight.", "Late.", "Loud."],
};

export const getHeroBeatsFor = (path: string): string[] | undefined =>
  heroBeats[path.toLowerCase()];
