# Orchard play review — Pairs and Catch

Pairs and Catch now use a quiet orchard setting with a low recessed seed tray for matching, fixed-proportion fruit and basket art, and a two-layer basket so caught fruit can sit behind its rim. Each completed pair grows a seedling in the tray. The composed review evidence is in `reviews/orchard-play/`.

## Actual play and progress

Pairs was played through its beginner and experienced tiers. A wrong match keeps the reference visible. A correct match enables replay without scoring it again, grows the seedlings, and reveals a child-led Next control. The full two-board round completed. Rapid finishing paid once. In the recorded progression, the wallet moved from 20 to 22 after a wrong round worth two stars, then to 23 after a perfect three-star result; repeating the result did not pay again. Reload restored the three-star best and wallet of 23. The state snapshots are in `pairs-reward-replay.json`.

Catch keeps stationary choices for beginners and gently moving fruit at tier three. A wrong choice clears the option; success clears the hint. Holding a caught fruit and replaying its name did not score again. Next remained child-led. Keyboard Home/End moved the basket, and dragging the basket under a moving target caught it. The existing layout evidence records the 390×844 phone, 320×568 small phone, 568×320 landscape and 1100×800 desktop checks without overflow in `catch-layout-checks.json`. The refreshed desktop result and reduced-motion landscape screenshots now match their checked viewports at 1100×800 and 568×320. Tablet night evidence is 768×961.

Screenshots: `pairs-before-phone.png`, `pairs-result-phone.png`, `pairs-small-phone.png`, `pairs-landscape.png`, `pairs-tablet-night.png`, `catch-before-phone.png`, `catch-three-choice-phone.png`, `catch-result-phone.png`, `catch-small-phone.png`, `catch-landscape-reduced.png`, and `catch-desktop-result.png`. Normal-motion review confirmed fruit selection followed by immediate Next, target change, replay, and return Home. Reduced-motion landscape review confirmed the غُ target, held replay, Enter on Next, focus on the new choice, and Home. The browser console remained empty.

## Composed-frame value measurements

`frame-values.json` was recomputed from every PNG in this directory with Pillow and NumPy. For each whole image, `L=(maxRGB+minRGB)/2`; the recorded bands are light `L>0.8`, mid `0.45≤L≤0.7`, and dark `L<0.3`. ART.md's whole-frame quotas are 8%, 12%, and 5%. These are global measurements and expose remaining palette/value debt; a frame can miss a quota even when the matching values pass. Three saved frames miss the dark quota: `catch-before-phone.png` (1.21%), `catch-desktop-result.png` (4.77%), and `pairs-before-phone.png` (2.30%). Do not treat this evidence as a blanket art-bible pass.

`palette.txt` is the output of `node scripts/check-palette.mjs`: 654 distinct off-palette hexes across 906 uses, and 18 distinct off-scale stroke widths across 206 uses. This reflects accumulated repository-wide debt and is not attributable to this pass alone. The checker reports only; strict mode remains deferred until the documented debt is cleared.

The full 312-test suite passed after the latest SVG-child landing-animation change; its captured output is in `reviews/orchard-play/tests.txt`. The composed visual review was manual; `/art-review` was not callable in this environment, so that review command remains outstanding.

## Release state

The Pairs/Catch pass is a local release candidate, pending final publication. This checkpoint does not complete the broader game/art goal. Physical-device and touch review and broader Catch tier coverage remain outside the evidence captured here.
