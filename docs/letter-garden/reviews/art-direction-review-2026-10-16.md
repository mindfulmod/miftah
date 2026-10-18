# Art direction review: is the polish consistent? (2026-10-16)

Owner's question: the characters look polished, but that polish doesn't
carry over to everything else. Is the home page the best it can be for a
young child? This review approaches it the way a senior art director would:
judge the product as one picture, find the system that's broken, show a
style frame before building, then roll out screen by screen.

## Verdict: the game looks like three studios made it
| Tier | What | Quality |
|---|---|---|
| Illustration | Pet, letter friends, stickers, treasures, scene cast | **The bar.** Chunky warm ink, shaded fills, expressive faces, secondary motion. |
| Clip-art | Map props: reeds, beehive, basket, bridge, water wheel, seed mounds | Mixed stroke weights and detail; arbitrary scale (the reeds are taller than the pet); identical copies (two beehive and flower groups); no light source, so nothing sits in a place. |
| App-toolbar | Header buttons, panels, tabs | Eight cream rounded rectangles take a third of a phone screen. Arrow glyphs mean nothing to a pre-reader. Cream panels are the loudest shapes on most screens, which inverts the bible's "the cast carries the colour". |

**The home page's real problem is its structure, not its paint.** It's a
scrolling path across a pastel field plus a toolbar. The best apps for this
age (Toca Life World, Sago Mini, Animal Crossing) make the home screen a
**place**: every destination is an object in it. A child navigates by
touching a house, a stall or a gate, not by decoding a row of icons.

Specific home-page notes:
- **Hierarchy:** the current stop, the pet, the reeds, the rainbow, eight
  buttons, the find and the visitor all shout at the same volume.
- **Ground:** one gradient with soft vertical stripes. There's no horizon or
  depth, so it reads as wallpaper.
- **Composition per device:** cramped on phones (the header eats the top
  third), empty on tablets.
- **The path:** a thin dotted line reads as interface, not as a trail.

## How a senior art director tackles it
1. **Lock the bar.** The characters set the tier, and everything else must
   reach it.
2. **Fix the system, not single assets:**
   - **Light:** one light direction (sun top-left), with lit edges and
     contact shadows to the lower right.
   - **Prop kit:** one ink-weight scale by role, shading ramps on everything
     wider than 24px, three sizes plus colour jitter, and no copy-paste.
   - **UI material:** made of the world (painted wood, stones, leaves,
     paper), never app cards. Chrome shrinks to sound plus the grown-up dot.
3. **Restructure, then polish.** A style frame comes before any build.
4. **Roll out screen by screen:** home → album → games' boards → hubs.

## Style frame: "Garden Village"
`.qa/home-concept.html` is a static comp, not wired in. The home becomes a
small village on a hill. The journey gate at the top holds the next letter
in its medallion, with the one warm light pool, and a sand trail runs down
through the village. Every destination is a landmark:

| Today (header button) | Village landmark |
|---|---|
| Journey stops (scrolling map) | **The gate** at the top: tap it to walk the trail to the journey map (the map stays, one level in) |
| Pet & wardrobe | **The pet's cottage** (leaf roof, round door) |
| Rewards & stickers (album) | **The sticker stall**, with the star count on its awning |
| The friends' garden | **The fenced bed**, with friends standing in it |
| Practice garden (toys) | **The toy chest**, spilling a ball and a balloon |
| Decorate your garden | **The cottage's front yard** (the plot beside the house) |
| Today's walk | **Stepping stones** off the trail |
| Daily practice / check-up | **A sun sundial and a flower bed** by the trail (small) |
| Treasure, visitor, balloon, bud | **Stay in the grass**, exactly as now |

## The alternative: "Polished Path"
Keep the scrolling journey as the home, but rebuild its art:
- painted layered land with a horizon and light, and a textured
  stepping-stone trail;
- props from one kit;
- the eight header buttons replaced by a wooden signpost cluster in the
  world.

It's less disruptive, but the toolbar problem only changes clothes.

## Recommendation
Garden Village. It fixes the structure (navigation by place), gives the cast
a home worthy of its polish, and makes room for the systems added this week
(treasures, visitor, balloon, growing garden) without crowding. Build order:
1. **Prop kit and light** (shared module).
2. **Village home** (phone, sideways phone and tablet compositions).
3. **Journey map** restyled as the land beyond the gate.
4. **UI material pass:** tabs, panels and buttons in wood and paper.
5. **Hub and board pass.**
