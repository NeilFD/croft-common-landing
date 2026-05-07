I agree this needs replacing properly rather than another tweak to the current logic.

Plan:

1. Rebuild `src/components/property/HeroCarousel.tsx` as one continuous horizontal track
   - Remove the current three separate panel strips, which is what is causing the flare and reset effect.
   - Use one single sliding row for all images, so the movement is only `translateX` across a stable strip.
   - Keep the carousel inside the existing hero image space only, without changing the rest of the page structure.

2. Make the slide motion simple and smooth
   - No fade, no opacity change, no image swapping during the visible transition.
   - Use a slow glide transition only.
   - Allow chevron clicks to respond immediately and reliably.
   - If a user clicks during movement, queue or ignore safely without causing flashing.

3. Preserve the triptych layout with stronger gaps
   - Keep the wide centre image with partial side images visible on desktop.
   - Increase the visible separations between images so the gaps are clearly defined.
   - On mobile, keep it as a clean single-image slide so it does not squeeze the layout.

4. Ensure `/town` starts on the blue room with copper bath
   - Keep the current `/town` image order where the blue room is first.
   - Make sure the carousel initial position renders that image as the first centre image, not just as a side image.

5. Keep controls clean and non-lucide
   - Use inline SVG chevrons only, not lucide icons.
   - Make the button hit areas larger and more reliable.
   - Keep the controls above the carousel but below the existing hero text overlay.

6. Add image preloading/decoding for the visible and adjacent slides
   - Preload the first few images and neighbouring images so the browser is not loading images mid-glide.
   - This should prevent blank frames and flicker during navigation.

7. Verify behaviour after implementation
   - Check `/town` and `/country` hero carousel rendering.
   - Confirm chevrons respond.
   - Confirm no flashing, fading or opacity transition is used.
   - Confirm the rest of the page structure remains untouched.