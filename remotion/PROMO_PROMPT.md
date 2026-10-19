Create a new, fast, high-energy promo video for Numa with Remotion, replacing the current `remotion/` composition. It will be used as a paid Instagram / Facebook ad (Reels, Stories, Feed). I will add an Armenian voice-over and music myself afterwards, so the video must be built around the voice-over script below and leave room for it.

## Goal
In 30 seconds, make an Instagram shop owner in Armenia feel: "this is exactly my mess", then "this fixes it", then "I want this now". Show the real product, not abstract shapes.

## Format
- Main composition `Promo`: 1080×1920 (9:16), 30 fps, exactly 30 s (900 frames).
- Also register `PromoFeed` 1080×1350 (4:5) and `PromoSquare` 1080×1080 (1:1) that reuse the same scenes and re-layout (not just crop).
- Keep all important content inside the Reels safe area: nothing important in the top 220 px or the bottom 380 px of the 9:16 frame.
- No audio in the render. Export a `remotion/voiceover-timing.md` that lists each scene with its start/end time in seconds and the exact line of voice-over it belongs to, so I can record to it.

## Style (match the landing page, it is the brand)
- Background paper `#eef0f3` with a faint dot grid; ink `#141416`; brand blue `#185aef`, brand yellow `#fed740`, white; status colours amber (Նոր), blue (Հաստատված), emerald (Առաքված / profit), rose (Չվճարված).
- Fonts: Fedra Sans Arm for text (Armenian and Latin), Montserrat for digits (files in `src/app/fonts`).
- Realistic device mockups: the phone and browser frames from `src/components/landing/devices.tsx` and the screens from `src/components/landing/sale-story.tsx` and `feature-demos.tsx`. Rebuild them for Remotion where needed (no hooks/timers; everything must be driven by `useCurrentFrame()`), but keep them visually identical to the site.
- Motion: snappy springs, fast cuts every 1–2 s, whip/slide transitions, zoom-ins on the exact UI detail being talked about, number counters, kinetic typography for the key words. Energetic but readable: every on-screen word must stay up long enough to read (min ~0.8 s for 3–4 words).
- Big burned-in Armenian captions on every scene (they double as subtitles for people watching without sound), max 2 short lines, high contrast.

## The real example to use everywhere (keep numbers consistent)
Shop "Փափուկ աշխարհ", product "Փափուկ արջուկ, 40 սմ" (use the bear illustration `BearArt`), price 9 900 ֏, sale link −15% → 8 415 ֏, free delivery. Customer "Անի Մ." orders 2 → 16 830 ֏. Stock: bear 24 → 22, bags 40 → 38. Profit from this order +9 630 ֏; month net profit 412 750 → 422 380 ֏. Dashboard month: sales 742 300 ֏, net 422 380 ֏, margin 56,9 %, break-even on the 4th. Sources: Instagram DM 64 %, Meta Ads 27 %, shop 9 %.

## Scenes and voice-over (Armenian), with timing
1. 0–3 s, HOOK. Phone full of chaos: unread DMs counter flying up "37", notebook lines, Excel cell `#REF!`, all shaking. Caption: «Instagram խանութ ունե՞ք»
   VO: «Instagram-ով վաճառո՞ւմ եք։»
2. 3–6 s, PAIN. Quick cuts: "who paid?" crossed-out notebook, "how many bags left?", "real profit = ???". Caption: «Պատվերները՝ DM-ում, հաշիվը՝ տետրում»
   VO: «Պատվերները կորչում են DM-ում, իսկ շահույթը՝ տետրում։»
3. 6–8 s, TURN. Everything gets swept away, logo "Numa" snaps in. Caption: «Ծանոթացեք՝ Numa»
   VO: «Ծանոթացեք՝ Numa։»
4. 8–12 s, SALE LINK. Browser: catalog → "Վճարման հղում" dialog, type 15 % and 0 ֏ delivery, "Պատճենվեց", link lands in a DM bubble. Caption: «Մեկ հղում՝ զեղչով»
   VO: «Ուղարկեք ապրանքի հղումը՝ զեղչով և առաքմամբ։»
5. 12–16 s, CUSTOMER ORDERS. Customer phone: checkout page, qty 2, name/phone/address typing fast, "Պատվիրել" → "Պատվերն ընդունված է". Caption: «Հաճախորդն ինքն է պատվիրում»
   VO: «Հաճախորդն ինքն է պատվիրում՝ առանց հավելվածի։»
6. 16–19 s, YOU SEE IT. Owner phone buzzes: "Նոր պատվեր՝ 16 830 ֏", order card slides in, status Նոր → Առաքված, email flies to the customer. Caption: «Նոր պատվեր՝ ակնթարթորեն»
   VO: «Դուք անմիջապես տեսնում եք պատվերը։»
7. 19–22 s, STOCK. Warehouse bars drop: bear −2, bags −2, labels −2, filling −200 g; filling turns amber "Քիչ է մնացել". Caption: «Պահեստը նվազում է ինքը»
   VO: «Պահեստը, նույնիսկ տոպրակներն ու պիտակները, հաշվվում են ինքնաբերաբար։»
8. 22–26 s, PROFIT. Dashboard: counters 742 300 / 422 380 / 56,9 %, chart draws, "Հասավ 4-ին", +9 630 ֏ flies into the profit tile. Caption: «Իրական մաքուր շահույթ»
   VO: «Եվ տեսնում եք իրական մաքուր շահույթը, ոչ թե պարզապես վաճառքը։»
9. 26–30 s, CTA. Price card "13 000 ֏ / ամիս", rotating "30 օր" guarantee seal, button "Ստեղծել խանութը", URL "numa.am". Caption: «30 օր՝ գումարի վերադարձի երաշխիքով»
   VO: «Numa՝ 13 000 դրամ ամսական։ Չհավանեք՝ 30 օրում կվերադարձնենք գումարը։»

Total VO must fit comfortably inside 30 s at a natural pace; if a line is too long for its scene, shorten the line, don't speed up the scene unreadably. Put the final VO text into `voiceover-timing.md`.

## Rules
- Only real features of the app; no fake logos, reviews, user counts or statistics. All names and numbers are the illustrative example above.
- Everything frame-driven (`useCurrentFrame`, `interpolate`, `spring`), deterministic, no `setInterval`, no random values without a seed.
- Code structure: `remotion/scenes/*.tsx` (one file per scene), shared `remotion/ui/*` (devices, screens, captions), `remotion/timeline.ts` with the scene lengths in frames, `remotion/Promo.tsx` using `<Series>` / `<TransitionSeries>`.
- Keep the npm scripts working: `video:studio`, `video:render` (→ `out/promo-9x16.mp4`), `video:render:feed`, `video:render:square`. Use the Remotion and zod versions already in package.json.

## Before you say it's done
1. Run `npx tsc --noEmit` and `npm run lint`.
2. Render a still of the middle of every scene for 9:16 and look at each one: check that nothing is cut off, text is readable, nothing is in the unsafe zones.
3. Render the full 9:16 video and the 4:5 and 1:1 versions, and tell me their paths and durations.
4. Give me the final Armenian voice-over script with timings.
