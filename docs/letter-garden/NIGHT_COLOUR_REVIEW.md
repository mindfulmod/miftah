# Overworld colour — 30 September 2026

Owner request: night grass is too dark and colours must stay lively throughout
the day. Local stamp: `20260930-garden-colour1`, service worker v70.

The night map previously used the darkest foliage colour across its large grass
plane, then desaturated the entire landscape to 68% and the landmarks to 80%.
Night now uses the middle foliage ramp for grass; the darkest green is limited
to bank/contact shading. Removed the landscape, landmark and backdrop saturation
filters. Reduced the daytime cream light overlay from .23 to .12 so it does not
bleach the grass. The darker night river remains distinct from the daytime river.

Browser comparisons cover the same map position at night/day on desktop and
night/sunset/morning at 390×844. Current chapter, locks, flowers, reward stars and
navigation are unchanged. A fixed empty grass patch in the desktop captures
increased from HSL lightness 36.1% / saturation 14.1% to 45.7% / 20.2%. This is a
sample measurement, not a claim about every pixel. Computed filters on the
landscape and landmarks are `none`.

Evidence: `reviews/night-colour/`. The test suite passes **352 tests**, recorded
with the concurrent room pass in `reviews/reward-rooms/tests.log`. Syntax checks
and `git diff --check` pass. No new colour literals were needed for this map fix.
Production has not been changed. The user's production browser tab was preserved;
testing used a separate local origin and seeded progress.

Next owner action: compare the saved night screenshot against `before.png`, then
try the local map at your normal screen brightness. The rest of the art objective
is still active; this is a completed colour correction, not a whole-game art sign-off.
