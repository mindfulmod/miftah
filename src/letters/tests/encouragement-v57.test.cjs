const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const palette = (() => {
  const art = read("ART.md");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
const game = read("src/letters/LettersGame.js");
const css = read("styles/letters-friends.css");

test("v57 Encouragement: a miss sounds curious, looks like a shrug, never grey", () => {
  const sound = read("src/letters/LettersSound.js");
  assert.match(sound, /softwrong: \[T\(0, 440, \{dur: 0\.08, gain: 0\.042\}\), T\(0\.1, 370, \{dur: 0\.14, gain: 0\.038, glideTo: 415\}\)\],/, "a questioning hm?, lifting at its end");
  assert.match(sound, /if \(name === "wrong"\) \{ this\._steps\(CUES\.softwrong\); return; \}/);
  const miss = css.slice(css.indexOf("@keyframes lg-miss"), css.indexOf("@keyframes lg-miss") + 260);
  assert.doesNotMatch(miss, /saturate|grayscale|brightness/);
});

test("v57 Encouragement: stuck never lasts — a helping hand after two misses, hints everywhere", () => {
  assert.match(game, /this\._missStreak = \(this\._missStreak \|\| 0\) \+ 1;/);
  assert.match(game, /if \(this\._missStreak >= \(this\.sprout \|\| this\.easeUp \? 1 : 2\)\) setTimeout\(\(\) => this\.feel\.guide\(\), 30\);/, "sooner for a little sprout");
  assert.match(game, /const target = stage && \(\[\.\.\.stage\.querySelectorAll\("\.is-hint"\)\]\.find\(visible\)/, "the hand points at what the game is hinting");
  assert.match(game, /\|\| \(idle \? \[\.\.\.stage\.querySelectorAll\("\.tb-sponge, button:not\(\.practice-replay\)/, "a still child is shown where to touch (never the answer)");
  assert.match(game, /this\.feel\?\.guide\?\.\(true\);/);
  assert.match(game, /this\._missStreak = 0;/, "a right answer clears it");
  assert.match(css, /\.lg-guide-hand \{ position: absolute;/);
  assert.match(read("src/letters/ShadowGames.js"), /if \(this\.misses >= 2\) \{/, "Lantern Hunt lights a letter after two misses");
  const toy = read("src/letters/ToyBoxGames.js");
  assert.match(toy, /\.tb-guess-letter"\)\.forEach\(\(b, k\) => b\.classList\.toggle\("is-hint", this\.offered\[k\] === this\.c\)\)/, "Bath Time");
  assert.match(toy, /\.tb-piece"\)\.forEach\(\(b, k\) => b\.classList\.toggle\("is-hint", this\.pieces\[k\]\.c === this\.c && this\.pieces\[k\]\.r === slot\)\)/, "Jigsaw");
  assert.match(toy, /const peek = this\.mismatches >= 3;/, "Friend Pairs peeks again after three mismatches");
  assert.match(game, /this\.watchIdlePrompt\(screenEl, this\.gentle \|\| this\.sprout \? 8000 : 14000, this\.gentle \|\| this\.sprout \? 2 : 1\);/, "every child gets idle help");
});

test("v57 Encouragement: no empty stars, ever — only what was earned, and one star is a proud star", () => {
  assert.doesNotMatch(game, /\[0, 1, 2\]\.map\(\(i\) => `<span class="stars-star \$\{i < stars/, "no grey empty star slots");
  assert.match(game, /earnedStars\(stars, size, gap\) \{/);
  assert.match(css, /\.stars-star\.is-solo svg \{ scale: 1\.4; \}/);
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, document: undefined, console, Math, JSON });
  const art = read("src/letters/LettersArt.js");
  assert.match(art, /const shown = stars > 0 \? Math\.min\(3, stars\) : 3;/, "a played chapter shows only its stars; outlines only invite");
  void ctx;
});

test("v57 Encouragement: 'not enough stars yet' is soon, never wrong; finishing plants a flower", () => {
  assert.doesNotMatch(game, /this\.sound\.play\("wrong"\)/, "no wrong sound for anything that isn't an answer");
  assert.match(game, /class="stand-pips"/, "the stand fills up toward a visit");
  assert.doesNotMatch(game, /this\.starBalance\(\) >= 5 \? "" : "disabled"/, "the stand is never a dead button");
  assert.match(game, /if\(onDone&&this\.session\?\.chapterBonus\)return go\(\);this\.finishBloom\(el,go,friend,this\.payPractice\(kind\)\);/);
  assert.match(css, /@keyframes pg-bloom-grow/);
  assert.deepEqual(off(css), []);
});

test("v57 Encouragement: persistence is the proudest moment; friends greet on replays; the map header is tidy", () => {
  assert.match(game, /const comeback = \(this\._missStreak \|\| 0\) > 0;/);
  assert.match(game, /burst\.className = comeback \? "lg-burst is-big" : bloom \? "lg-burst is-bloom" : "lg-burst";/);
  assert.match(css, /\.lg-burst\.is-big \{ width: 170px;/);
  assert.match(game, /if \(isReplay\) friendArrives\(1200\);/, "a replayed chapter's friend still comes to say hello");
  assert.match(css, /\.lg-app \.lg-screen\.lg-home \.map-play-places \{ margin-top: 22px; \}/, "the play buttons clear the 56px daily strip");
});

test("v57 Encouragement: after a right answer the other choices rest, so waiting never feels broken", () => {
  assert.match(game, /if \(box && el\.closest\("\.tb, \.pz, \.bk, \.vh, \.ws, \.wd, \.ff, \.sh, \.lk"\) && !el\.closest\("\.tb-pairs, \.bk-market, \.sh-lantern"\)\)/, "one-answer games only");
  assert.match(game, /el\.classList\.add\("is-won"\);/);
  assert.match(css, /\.lg-solved > :is\(button, \[role="button"\]\):not\(\.is-won\)/);
  assert.match(game, /if \(this\._missStreak >= \(this\.sprout \|\| this\.easeUp \? 1 : 2\)\)/, "the youngest get the hand after one miss");
  assert.match(game, /A moving answer \(a swimming fish\) is followed/);
});

test("v57 Encouragement: a little sprout's garden offers a handful of simple toys, not two dozen", () => {
  assert.match(game, /const SPROUT_TOYS=\['LetterBalloons','Feed','BathTime','LetterFishing','FriendPairs','ColourFriend','SandTable','BookCorner','BeatDrum'\];/);
  assert.match(game, /if\(this\.sprout\)for\(let i=choices\.length-1;i>=0;i--\)if\(!SPROUT_TOYS\.includes\(choices\[i\]\)\)choices\.splice\(i,1\);/);
});

test("v57 Encouragement: reduced motion still gets its moment — a still golden ring", () => {
  assert.match(game, /if \(this\.prefersReducedMotion\(\)\) \{\n\s+if \(!isSvgPart\(t\.el\)\) \{ t\.el\.classList\.add\("is-won-still"\);/);
  assert.match(css, /\.lg-app \.is-won-still \{ box-shadow: 0 0 0 5px #f3c955/);
});

test("v57 Encouragement: a chapter left half-way picks up where the child got to", () => {
  assert.match(game, /const RESUME_KEY = "quran-trainer:letters:resume";/);
  assert.match(game, /Date\.now\(\) - place\.at < 6 \* 3600000 && place\.gameIndex > 0 && place\.gameIndex < world\.games\.length/, "for a few hours, never past the end");
  assert.match(game, /if \(!s\?\.world \|\| s\.checkup \|\| s\.daily \|\| s\.plan \|\| s\.chapterBonus\) return;/, "only real chapters");
  assert.match(game, /s\.lastStars = stars;\n\s+this\.rememberPlace\?\.\(s, 1\);/, "saved after the stars are counted");
  assert.match(game, /if \(s\?\.world && this\.loadJSON\(RESUME_KEY, null\)\?\.world === s\.world\.id\) this\.saveJSON\(RESUME_KEY, null\);/, "cleared when the chapter is finished");
  assert.match(fs.readFileSync(path.join(root, "src/letters/LettersState.js"), "utf8"), /if \(name === "resume"\) \{/, "the saved place is normalised");
});

test("v57 Encouragement: the first visit of the day is greeted by the pet", () => {
  assert.match(game, /const GREET_KEY = "quran-trainer:letters:greeted";/);
  assert.match(game, /if \(!welcome && this\._greetedDay !== today && this\.loadJSON\(GREET_KEY, ""\) !== today\) \{/, "once a day, and not over a chapter's own welcome");
  assert.match(game, /mapRig\?\.wave\?\.\(\); try \{ this\.sound\.voice\?\.\(this\.pet\?\.species\); \} catch \{\}/);
});

test("v57 Encouragement: in the older chapter games the hand points at the question — hear it again", () => {
  assert.match(game, /\|\| \[\.\.\.this\.root\.querySelectorAll\("\.play-bubble"\)\]\.find\(visible\)\);/);
});

test("v57 Encouragement: a memory mismatch is play, not a mistake", () => {
  const toy = fs.readFileSync(path.join(root, "src/letters/ToyBoxGames.js"), "utf8");
  const pairs = toy.slice(toy.indexOf("class FriendPairs"), toy.indexOf("// ---------- v43 Dot Nests"));
  assert.doesNotMatch(pairs, /softwrong/, "no miss sound when two cards don't match");
  assert.match(pairs, /this\.ctx\.sfx\?\.\("turn"\);/);
});

test("v57 Encouragement: a hard patch quietly eases the next games until the wins come back", () => {
  assert.match(game, /if \(this\._missTimes\.length >= 6 && !this\.easeUp\) \{ this\.easeUp = true;/, "six misses in three minutes");
  assert.match(game, /if \(this\.easeUp && \(this\._easeWins = \(this\._easeWins \|\| 0\) \+ 1\) >= 5\) \{ this\.easeUp = false;/, "five right in a row lifts it");
  assert.match(game, /\?!!\(this\.sprout\|\|this\.easeUp\):undefined,/, "games get Little Sprout settings meanwhile");
});

test("v57 Encouragement: eager taps are answered — Dots Last shows the next dot, Spot the Change's eye bounces", () => {
  const puzzle = fs.readFileSync(path.join(root, "src/letters/PuzzleGames.js"), "utf8");
  assert.match(puzzle, /if \(this\.revealed < this\.dotList\.length\) this\.showDot\(this\.revealed\);/);
  const look = fs.readFileSync(path.join(root, "src/letters/LookGames.js"), "utf8");
  assert.match(look, /if \(this\.phase !== "look"\) return;\n\s+const eye = this\.root\.querySelector\("\.lk-eye"\);/);
});

test("v57 Playtest mode: opt-in, on-device frustration log and report for a grown-up watching", () => {
  assert.match(game, /try \{ mode = new URLSearchParams\(location\.search\)\.get\("playtest"\); \} catch \{\}\n\s+if \(mode === null\) return;/, "off unless the address asks");
  assert.match(game, /const KEY = "quran-trainer:letters:playtest";/);
  assert.match(game, /if \(Date\.now\(\) - \(this\._ptFinishedAt \|\| 0\) > 4000\) log\("left-early", \{ kind \}\);/, "a finished game is not counted as left early");
  assert.match(game, /showPlaytestReport\(list\) \{/);
  assert.ok(fs.existsSync(path.join(root, "docs/letter-garden/reviews/playtest-guide.md")));
});

test("v57 Encouragement: reduced motion still sees the finishing flowers, standing still", () => {
  assert.match(game, /bloom\.className=still\?'pg-bloom is-still':'pg-bloom';/);
  assert.match(css, /\.pg-bloom\.is-still, \.pg-bloom\.is-still \.pg-bloom-bed \{ animation: none; \}/);
});

test("v57 Encouragement: an empty album greets a newcomer with one free sticker visit", () => {
  assert.match(game, /if \(this\.stickers && !this\.stickers\.welcomed && !\(this\.stickers\.owned \|\| \[\]\)\.length\) \{/);
  assert.match(game, /this\.stickers\.welcomed = true;\n\s+this\.stickers\.freeVisits = Math\.min\(9, \(this\.stickers\.freeVisits \|\| 0\) \+ 1\);/);
});

test("v57 Encouragement: the pet's thinking pose is curious — ears perk, never droop", () => {
  const rig = fs.readFileSync(path.join(root, "src/letters/LettersPetRig.js"), "utf8");
  assert.match(rig, /g\.head = -cfg\.tilt; g\.browTilt = 1; g\.ear = 6;/);
  assert.doesNotMatch(rig, /g\.ear = -10/);
});

test("v57 Encouragement: a refused pop bubble fades in its own colours, never grey", () => {
  assert.doesNotMatch(fs.readFileSync(path.join(root, "styles/letters.css"), "utf8"), /\.pop-bubble\.is-no svg \.tile-face \{ fill: #e5dcc8; \}/);
});

test("v57 Encouragement: the chapter's friends come to the party and dance", () => {
  assert.match(game, /partyFriends\(\) \{/);
  assert.match(game, /\$\{this\.partyFriends\(\)\}/);
  assert.match(game, /this\.cheerFriends\(el\);/);
  assert.match(css, /@keyframes party-friend-in/);
});

test("v57 Encouragement: the map always shows where to go — a breathing invite and an idle pointing hand", () => {
  assert.match(css, /\.lg-app \.lg-home \.map-stop\.is-current::before \{ animation: map-invite 2\.4s ease-in-out infinite; \}/);
  assert.match(game, /if \(!touched && el\.isConnected && r && r\.bottom > 60 && r\.top < window\.innerHeight - 60\) \{ this\.feel\.point\(stop\); if \(again\) arm\(15000, false\); \}/, "only at a stop that is on screen");
  assert.match(game, /this\.feel\.point = \(target\) => \{/);
});

test("v57 Encouragement: up to three never-tried toys twinkle in the practice garden", () => {
  assert.match(game, /const TRIED_KEY = "quran-trainer:letters:tried";/);
  assert.match(game, /if\(twinkles>=3\|\|/);
  assert.match(css, /\.pg-new \{ position: absolute;/);
});

test("v57 Encouragement: the speaker pulses while the game is talking", () => {
  assert.match(game, /this\.root\?\.classList\?\.toggle\?\.\("lg-speaking", !!on\)/);
  assert.match(css, /\.lg-app\.lg-speaking :is\(\.practice-replay, \.play-bubble\):not\(\[hidden\]\) \{ animation: lg-speak/);
});

test("v57 Encouragement: a brand-new child is shown to tap the egg", () => {
  assert.match(game, /if \(!tapped && el\.isConnected\) this\.feel\?\.point\?\.\(eggBtn\);/);
});

test("v57 Encouragement: after hatching, the hand shows the way into the garden", () => {
  assert.match(game, /if \(!touched && el\.isConnected\) this\.feel\?\.point\?\.\(go\);/);
});

test("v57 Encouragement: between games the hand points at the way forward when a child is unsure", () => {
  assert.match(game, /if \(\/\\blg-\(stars\|party\|meet\)\\b\/\.test\(className\)/);
  assert.match(game, /idlePoint\(screenEl, ms = 10000, pick = "\.meet-bud, \.meet-piece:not\(\.is-set\), \.stars-next, \.meet-next, \.party-next"\) \{/);
  assert.match(game, /this\.idlePoint\(screenEl, 12000, "\[data-kind\]:has\(\.pg-new\), \[data-kind\]"\);/, "toy menus point at an untried toy first");
});
