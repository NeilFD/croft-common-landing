## Goal

Loosen profile picture upload restrictions on two axes:

1. **File size cap** - bump from 5MB to 15MB so high-res phone photos go through without the user having to compress.
2. **AI face verification rules** - keep the check (still useful to block logos, animals, cartoons, screenshots, blank images), but stop rejecting normal member photos for things like side angles, sunglasses, hats, or being a bit further from the camera.

## Changes

### 1. `src/hooks/useAvatarUpload.ts`

- Bump the size guard from `5 * 1024 * 1024` to `15 * 1024 * 1024`.
- Update the toast text from "Image size must be less than 5MB" to "Image size must be less than 15MB".

### 2. `src/components/profile/AvatarUpload.tsx`

- Update the helper line from "Drag and drop an image or click to browse. Max 5MB." to "Drag and drop an image or click to browse. Max 15MB."

### 3. `supabase/functions/verify-avatar-face/index.ts`

Rewrite the prompt to be much looser. New rules:

ACCEPT if the image clearly contains a real human person (any angle, any lighting that's still recognisable). Sunglasses, hats, a bit of distance, side angles, slightly blurry, dim light, group shots where the member is clearly visible - all acceptable.

REJECT only if it's clearly NOT a member photo:

- No person at all (logo, object, blank wall, food, scenery only).
- An animal, cartoon, illustration, meme, emoji, or obvious AI-generated avatar with no real human.
- A screenshot of another app, a document, or a chart.
- Pornographic / explicit content.
- Image is so dark, broken, or corrupted that nothing is visible.

Anything else: ACCEPT.

Update the rejection-reason guidance so the message is gentle ("Looks like that's not a photo of you - try one with you in it") rather than nitpicky.

No changes to the response shape, model, or auth.

## Out of scope

- Storage bucket policies (already permissive).
- The `accept="image/*"` input filter (browser-level, fine as-is).
- Drop AI verification entirely - we're keeping it, just loosening it.