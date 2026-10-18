# Feeling a touch without haptics (research, 2026-10-08)

iPads have no haptic hardware at all (only the Apple Pencil Pro and the
Magic Keyboard trackpad buzz), so on the device most children use, touch has
to be felt through the eyes and ears. How games, animation and film do it,
and what Letter Garden took from each.

| Source | Technique | Why it works | In Letter Garden |
|---|---|---|---|
| Fighting games (Sakurai, Smash Bros.) | **Hit-stop**: both sides freeze for a few frames at contact | Gives the eye time to register the contact; stronger hits stop longer; used selectively so the game stays fast | Right answer holds its squash ~70ms before popping (v56) |
| Game feel ("Juice it or lose it", Vlambeer "Art of screenshake") | Squash & stretch, easing, particles, small screen shake, recoil | Layered, slightly exaggerated response; shake must stay small | Press sink + spring (v55); pop past full size; 3px stage jolt; neighbours nudged (v56) |
| Anime / cartoons | **Impact frames** (1–2 frame flash or inversion), impact lines, vibration, dust | A frame that breaks the style reads as a jolt; the world reacting sells force | One small white flash on the right tile; impact lines from the fingertip (v56) |
| Film sound (Chion, *Audio-Vision*) | **Synchresis**: a sound and image that coincide fuse into one event; sound lends the image weight, texture, resistance | The viewer credits the picture with what the sound supplies | Thock-down / pop-up press sounds on the same frame as the visual; bigger = deeper (v55) |
| HCI research (Lécuyer) | **Pseudo-haptics**: altering how a visual follows the hand makes people perceive stiffness, friction and mass | Vision overrides touch when they disagree | Bath Time's sponge trails the finger and tilts (friction); soft friends squash wide vs firm buttons (material) (v56) |
| Apple fluid interfaces (WWDC 2018) | Instant response, springs, momentum, resistance at boundaries, interruptible motion | Continuous, physical motion feels like an object | Pressed state is instant on pointerdown; springs on release; slide-off cancels (v55) |
| Toca Boca / Sago Mini | Every touch answered; quick, responsive; children's own logic | Wordless apps rely on feedback to guide | Taps on empty ground answered with a faint ripple (v55) |

## Safety limits we hold to (children)
- WCAG 2.3.1: never more than 3 flashes a second; keep flashes small. We use
  one flash, only on the tile (under ~360×360px), never full-screen.
- WCAG 2.3.3 / vestibular: no big screen shakes, no parallax. The stage jolt
  is 3px for 220ms. Everything above is off under reduced motion (system
  setting or the in-app toggle); sound and real ticks remain.
- Contrast between outcomes carries meaning without words: right answers are
  springy and bright, misses are dull and grey — information, never scolding.
