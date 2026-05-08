## Country carousel reset

Replace the current `/country` triptych carousel with the 6 newly uploaded country images, curated for visual rhythm (statement room → atmosphere → room → outdoors → food → arrival).

### New assets (to be saved)

Save the 6 uploads into `src/assets/cb-carousel-new/`:

1. `country-01.jpg` — red velvet room with copper bath (Stad_Room1)
2. `country-02.jpg` — barn-beam suite with copper bath, gold buttoned wall (Stad_Room3)
3. `country-03.jpg` — outdoor terrace firepit at night (Stad_Outsdie_Terrace)
4. `country-04.jpg` — copper bath close-up, red velvet ceiling (89-2R2A2806)
5. `country-05.jpg` — Thai food sharing spread, overhead (Crazy_Bear_Autumn_2022-14-2)
6. `country-06.jpg` — red Routemaster bus reception (20240523-CRAZYBEAR627)

(`country-01–03` already saved in earlier batch; only 04–06 are new.)

### Curated order

Lead with the most cinematic, high-impact bedroom (barn-beam suite), then alternate room / atmosphere / outdoors / food / arrival to keep the triptych moving:

```
1. country-02  barn-beam suite (hero)
2. country-04  copper bath close-up (texture / detail)
3. country-01  red velvet room
4. country-03  terrace firepit (outdoors)
5. country-05  Thai food spread
6. country-06  red bus reception (arrival / signature)
```

### File changes

`src/data/heroCarousels.ts`:

- Remove old `countryA–H` imports.
- Add 6 new imports from `cb-carousel-new/country-0*.jpg`.
- Update `heroCarouselMap["/country"]` to the 6-image curated order above.

No other files touched. The old `cb-carousel/country-*` files are left in place (still referenced elsewhere if needed) but unused by the hero.

### Confirm before implementing

Lead slide is the **barn-beam suite (country-02)** — same approach as Town, leading with the most distinctive room. Say if you'd prefer a different opener (e.g. the red velvet room or the firepit) and I'll re-curate.
