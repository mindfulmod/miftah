"use strict";

/*
 * navigator-run.js — the voyage itself.
 * Chart generation, the four encounter formats (meaning volley, audio echo,
 * matching pairs, speed chain), boon drafting, mystery events, the haven,
 * the guardian boss, and the run summary. All recall flows through the core
 * word engine in navigator.js; this file is the "game" wrapped around it.
 *
 * Load order: this file loads before navigator.js, so it only touches SN.*
 * inside functions (at call time), never at parse time.
 */

window.SN = window.SN || {};

(() => {
  const SN = window.SN;
  const C = window.SN_CONTENT;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const crewAssetVersion = "20260710-nav14";
  const crewAvatar = (crewId) => `assets/navigator/crew-${crewId}-avatar.png?v=${crewAssetVersion}`;

  let run = null;
  let enc = null;
  SN.debugRun = () => ({ run, enc });

  function particleFX(method) {
    SN.particlesReady?.then((particles) => particles?.[method]?.());
  }

  // ------------------------------------------------------------------ chart
  // A voyage: harbor → 2 → 3 → 2 → haven → guardian. Every path crosses 3-4
  // encounters, at most one mystery, one haven — and the chart as a whole
  // always contains all four base encounter formats. "verse" is a 5th,
  // opportunistic format: it only appears when a short ayah is already
  // fully unlocked, taking the place of one of row 3's natural repeats.
  const BASE_FORMATS = ["volley", "echo", "pairs", "chain"];
  const VERSE_NODE_MIN = 2, VERSE_NODE_MAX = 10;
  const VERSE_BOSS_MIN = 16;
  function genChart() {
    const fmts = SN.shuffle(BASE_FORMATS); // 4 formats
    const nodes = [];
    let id = 0;
    const add = (row, x, type, extra) => {
      const n = Object.assign({ id: "n" + id++, row, x, type, next: [] }, extra);
      nodes.push(n);
      return n;
    };
    const r1 = [add(1, 0.3, "enc", { format: fmts[0] }), add(1, 0.7, "enc", { format: fmts[1] })];
    const mysteryIx = Math.floor(Math.random() * 3);
    const r2fmts = SN.shuffle([fmts[2], fmts[3]]);
    const r2 = [0, 1, 2].map((i) =>
      i === mysteryIx
        ? add(2, 0.18 + i * 0.32, "mystery", { event: SN.pick(C.events) })
        : add(2, 0.18 + i * 0.32, "enc", { format: r2fmts.pop() || SN.pick(fmts) })
    );
    const r3fmts = SN.shuffle(fmts).slice(0, 2);
    const verseOptions = SN.eligibleVerses ? SN.eligibleVerses({ minWords: VERSE_NODE_MIN, maxWords: VERSE_NODE_MAX }) : [];
    let verseRef = null;
    if (verseOptions.length && Math.random() < 0.6) {
      verseRef = SN.pick(verseOptions);
      r3fmts[Math.floor(Math.random() * 2)] = "verse";
    }
    const r3 = [
      add(3, 0.32, "enc", { format: r3fmts[0], ayahRef: r3fmts[0] === "verse" ? verseRef : undefined }),
      add(3, 0.68, "enc", { format: r3fmts[1], ayahRef: r3fmts[1] === "verse" ? verseRef : undefined }),
    ];
    const haven = add(4, 0.5, "haven");
    const boss = add(5, 0.5, "boss");

    r1[0].next = [r2[0].id, r2[1].id];
    r1[1].next = [r2[1].id, r2[2].id];
    r2[0].next = [r3[0].id];
    r2[1].next = [r3[0].id, r3[1].id];
    r2[2].next = [r3[1].id];
    r3[0].next = [haven.id];
    r3[1].next = [haven.id];
    haven.next = [boss.id];

    // Cursed cargo (Phase 5): opt-in risk, never a global setting. Pick one
    // "enc" node from row 2 or row 3 — never row 1, never the mystery, never
    // a verse node — so an uncursed alternative path always exists.
    if (Math.random() < 0.55) {
      const candidates = [...r2, ...r3].filter((n) => n.type === "enc" && n.format !== "verse");
      if (candidates.length) SN.pick(candidates).type = "cursed";
    }
    return nodes;
  }
  // Very long ayahs (Ayat al-Kursi and the like) are real showpieces — kept
  // out of the boss pool until the profile has enough voyages under its
  // belt, so a brand-new player's first Watcher fight doesn't hinge on a
  // 50-word recitation. Shorter "boss-worthy" ayahs stay available throughout.
  const BOSS_VERSE_LENGTH_GATES = [
    { minRuns: 0, maxWords: 20 },
    { minRuns: 4, maxWords: 35 },
    { minRuns: 10, maxWords: Infinity },
  ];
  function bossVerseMaxWords() {
    const runs = (SN.state.meta && SN.state.meta.runs) || 0;
    let cap = BOSS_VERSE_LENGTH_GATES[0].maxWords;
    for (const gate of BOSS_VERSE_LENGTH_GATES) if (runs >= gate.minRuns) cap = gate.maxWords;
    return cap;
  }

  // Clone the boss's static phases, splitting one long fully-unlocked ayah
  // across all three — a third of the recitation per phase — rather than
  // cramming the whole thing into the last phase alone.
  function computeBossPhases() {
    const phases = C.boss.phases.map((p) => Object.assign({}, p));
    const options = SN.eligibleVerses ? SN.eligibleVerses({ minWords: VERSE_BOSS_MIN, maxWords: bossVerseMaxWords() }) : [];
    if (options.length) {
      const ref = SN.pick(options);
      const words = ref.words;
      const chunkSize = Math.ceil(words.length / 3);
      const chunks = [words.slice(0, chunkSize), words.slice(chunkSize, chunkSize * 2), words.slice(chunkSize * 2)];
      const taunts = [
        `The eye narrows on a memory whole — the first of Surah ${ref.surah}, verse ${ref.ayah}. Hold what you're given.`,
        `The memory deepens. Hold the middle of the verse steady against the dark.`,
        `The eye opens fully. Complete Surah ${ref.surah}, verse ${ref.ayah} — the whole of it now yours to keep.`,
      ];
      for (let i = 0; i < phases.length; i++) {
        phases[i] = {
          format: "verse",
          ayahRef: { surah: ref.surah, ayah: ref.ayah, translation: ref.translation, words: chunks[i] },
          taunt: taunts[i],
        };
      }
    }
    return phases;
  }
  const nodeById = (id) => run.chart.find((n) => n.id === id);
  const reachable = () => (run.at == null ? run.chart.filter((n) => n.row === 1) : nodeById(run.at).next.map(nodeById));

  const GLYPHS = {
    volley: `<path d="M2 -7 L-4 1 L0 1 L-2 8 L5 -1 L1 -1 Z" fill="currentColor"/>`,
    echo: `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M-5 -3 Q-1 0 -5 3"/><path d="M0 -6 Q5 0 0 6"/><path d="M4 -8 Q11 0 4 8" opacity="0.6"/></g>`,
    pairs: `<g fill="currentColor"><circle cx="-5" cy="-4" r="2.6"/><circle cx="5" cy="4" r="2.6"/><path d="M-5 -4 L5 4" stroke="currentColor" stroke-width="1.6"/></g>`,
    chain: `<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M-7 -4 L-2 0 L-7 4"/><path d="M-1 -4 L4 0 L-1 4"/><path d="M5 -4 L10 0 L5 4" opacity="0.6"/></g>`,
    verse: `<g fill="currentColor"><circle cx="-6" cy="2" r="1.8"/><circle cx="0" cy="-4" r="1.8"/><circle cx="6" cy="2" r="1.8"/><path d="M-6 2 L0 -4 L6 2" stroke="currentColor" stroke-width="1.4" fill="none"/></g>`,
    mystery: `<text y="5.5" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor" font-family="Inter,sans-serif">?</text>`,
    haven: `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="0" cy="-5.5" r="2.2"/><path d="M0 -3.3 V7 M0 7 c-3.6 0 -6.4 -2.4 -6.8 -5.4 M0 7 c3.6 0 6.4 -2.4 6.8 -5.4 M-8 3 l1.4 1.8 M8 3 l-1.4 1.8"/></g>`,
    boss: `<g><circle cx="0" cy="0" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="0" cy="0" r="3" fill="currentColor"/></g>`,
    cursed: `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="-7" y="-3" width="14" height="9" rx="1.5"/><path d="M-7 -3 Q0 -8 7 -3"/><path d="M-3 1.5 h6" stroke-width="2.4"/></g>`,
  };

  function nodeLabel(n) {
    if (n.type === "cursed") return "Cursed cargo — the sea asks a price";
    if (n.type === "enc") return C.formats[n.format].name;
    if (n.type === "mystery") return run.mods.foresight ? n.event.title : "Mystery waters";
    if (n.type === "haven") return "A sheltered haven";
    return "The Watcher";
  }

  function renderChart() {
    setSeaMood(null);
    const W = 340, H = 470;
    const rowY = { 0: 442, 1: 360, 2: 280, 3: 200, 4: 128, 5: 54 };
    const px = (n) => 30 + n.x * (W - 60);
    const py = (n) => rowY[n.row];
    const reach = new Set(reachable().map((n) => n.id));

    const edges = run.chart.flatMap((n) =>
      n.next.map((t) => {
        const b = nodeById(t);
        const lit = run.visited.has(n.id) && (run.visited.has(t) || reach.has(t));
        return `<path class="chart-edge${lit ? " lit" : ""}" d="M${px(n)} ${py(n) - 20} Q${(px(n) + px(b)) / 2} ${(py(n) + py(b)) / 2} ${px(b)} ${py(b) + 20}"/>`;
      })
    );
    // harbor → row 1
    run.chart.filter((n) => n.row === 1).forEach((n) => {
      edges.unshift(`<path class="chart-edge${run.at == null || run.visited.has(n.id) ? " lit" : ""}" d="M${W / 2} ${rowY[0] - 16} Q${(W / 2 + px(n)) / 2} ${(rowY[0] + py(n)) / 2} ${px(n)} ${py(n) + 20}"/>`);
    });

    const nodesSvg = run.chart.map((n) => {
      const cls = ["chart-node"];
      if (run.visited.has(n.id)) cls.push("done");
      if (reach.has(n.id)) cls.push("reachable");
      if (run.at === n.id) cls.push("current");
      if (n.type === "cursed") cls.push("cursed");
      const glyph = n.type === "enc" ? GLYPHS[n.format] : GLYPHS[n.type];
      const r = n.type === "boss" ? 26 : 20;
      const interactive = reach.has(n.id)
        ? ` role="button" tabindex="0" aria-label="${SN.esc(nodeLabel(n))}"`
        : "";
      return `<g class="${cls.join(" ")}" data-node="${n.id}" transform="translate(${px(n)} ${py(n)})"${interactive}>
        <circle class="node-ring" r="${r}"/>
        <g class="node-glyph" transform="scale(${n.type === "boss" ? 1.5 : 1})">${glyph}</g>
      </g>`;
    }).join("");

    const shipAt = run.at == null ? { x: W / 2, y: rowY[0] } : { x: px(nodeById(run.at)), y: py(nodeById(run.at)) };
    const nextUp = reachable();
    const caption = nextUp.length === 1 && nextUp[0].type === "boss"
      ? "The Watcher waits at the edge of the reach."
      : nextUp.length ? "Choose your heading — tap a glowing waypoint." : "";
    const miniPennant = run.vessel === "layl" ? "#b48be8" : run.vessel === "rimah" ? "#7fb4d9" : "#5fd6c0";

    SN.render(`
      ${topHUD()}
      <div class="chart-wrap">
        <div class="chart-svg-holder">
          <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
            ${[...Array(26)].map(() => `<circle cx="${(Math.random() * W).toFixed(0)}" cy="${(Math.random() * H).toFixed(0)}" r="0.8" fill="#cfe0ff" opacity="${(0.12 + Math.random() * 0.3).toFixed(2)}"/>`).join("")}
            ${edges.join("")}
            ${nodesSvg}
            <g class="chart-ship" transform="translate(${shipAt.x - 17} ${shipAt.y - 34})">
              <g transform="scale(0.24)"><path d="M20 78 Q80 96 140 74 L128 92 Q80 104 34 90 Z" fill="#3b2f52"/><path d="M76 12 L76 74" stroke="#6a563c" stroke-width="4"/><path d="M78 14 Q124 30 84 72 Z" fill="#e8dcc0"/><path d="M76 12 L96 17 L76 22Z" fill="${miniPennant}"/><circle cx="134" cy="66" r="6" fill="#e3b75f"/></g>
            </g>
          </svg>
        </div>
        <div class="chart-caption">${caption}
          ${nodeLabelLegend()}
          <div style="margin-top:6px"><a href="#" data-retreat style="color:var(--muted)">Strike sails and return to harbor</a></div>
        </div>
      </div>`);

    $$("[data-node]").forEach((g) => {
      const n = nodeById(g.dataset.node);
      if (!reach.has(n.id)) return;
      const chooseNode = () => { SN.audio.click(); enterNode(n.id); };
      g.addEventListener("click", chooseNode);
      g.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        chooseNode();
      });
    });
    $("[data-retreat]").onclick = (e) => {
      e.preventDefault();
      SN.confirm("Strike sails and slip back to harbor? The voyage ends here.", () => finishRun("retreat"));
    };
  }

  function nodeLabelLegend() {
    const upNext = reachable();
    if (!upNext.length) return "";
    return `<div style="margin-top:4px">${upNext.map((n) => `<b style="color:var(--star)">${nodeLabel(n)}</b>`).join(" · ")}</div>`;
  }

  function enterNode(id) {
    run.at = id;
    run.visited.add(id);
    const n = nodeById(id);
    if (n.type === "enc") startEncounter({ format: n.format, ayahRef: n.ayahRef });
    else if (n.type === "cursed") cursedIntro(n);
    else if (n.type === "mystery") renderEvent(n.event);
    else if (n.type === "haven") renderHaven();
    else bossIntro();
  }

  // ------------------------------------------------------------ cursed cargo
  const CURSED_CHEST_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="cc-glow" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#e0635a" stop-opacity="0.3"/><stop offset="1" stop-color="#e0635a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="60" cy="58" r="52" fill="url(#cc-glow)"/>
  <path d="M22 84 Q60 98 98 84 L94 100 Q60 110 26 100 Z" fill="#241d33"/>
  <path d="M22 84 L22 60 Q60 42 98 60 L98 84 Q60 96 22 84Z" fill="#3b2f52"/>
  <path d="M22 60 Q60 42 98 60" fill="none" stroke="#e0635a" stroke-width="1.4" opacity="0.7"/>
  <g stroke="#e0635a" stroke-width="2.4" stroke-linecap="round"><path d="M40 68 h40"/></g>
  <circle cx="60" cy="68" r="3.2" fill="#e0635a">
    <animate attributeName="opacity" values="1;.35;1" dur="2.2s" repeatCount="indefinite"/>
  </circle>
  <path d="M18 100 Q60 94 102 100" stroke="#e0635a" stroke-width="1.4" fill="none" opacity="0.4">
    <animate attributeName="opacity" values=".4;.1;.4" dur="2.8s" repeatCount="indefinite"/>
  </path>
</svg>`;
  function cursedIntro(n) {
    enc = null;
    SN.render(`
      <div class="boss-splash cursed-splash">
        <span class="boss-eye">${CURSED_CHEST_SVG}</span>
        <h2>Cursed Cargo</h2>
        <p>A cargo net of some drowned merchant fleet, still full. The knots hum. Answer without a single slip — the glass runs cruel — or the sea keeps it.</p>
        <div class="sum-actions">
          <button class="btn btn-gold btn-big" data-seal>Break the seal</button>
          <button class="btn btn-ghost" data-leave>Leave it be</button>
        </div>
      </div>`);
    $("[data-seal]").onclick = () => {
      SN.audio.cursed();
      startEncounter({ format: n.format, ayahRef: n.ayahRef, cursed: true });
    };
    $("[data-leave]").onclick = () => { SN.audio.click(); renderChart(); };
  }

  // -------------------------------------------------------------- run setup
  SN.startRun = async function startRun() {
    SN.render(`
      <div class="profiles-hero" style="margin:auto">
        <span class="astrolabe">${C.astrolabe}</span>
        <p>Reading the stars…</p>
      </div>`);
    try { await SN.prepareWords(); } catch {}
    if (!Object.keys(SN.state.deck).length && !SN.state.fresh.length) {
      SN.toast("The night is too dark to sail — no words could be loaded.");
      SN.goHarbor();
      return;
    }
    const mods = SN.baseMods();
    run = {
      mods, boons: [],
      hullMax: mods.hullMax, hull: mods.hullMax,
      pearls: 0, streak: 0, bestStreak: 0,
      flawless: true, usedRevive: false, cleared: 0,
      results: {}, recent: [], lastRoot: null,
      chart: null, at: null, visited: new Set(),
      bossCharm: 0, restUsed: false,
      // Build currents — one pip per boon drafted from that crew, one tier
      // per 3 pips. Purely a per-voyage read of "what build is this run."
      currents: { yusuf: 0, layla: 0, idris: 0 },
      currentTier: { yusuf: 0, layla: 0, idris: 0 },
      vessel: SN.state.meta.vessel || "miftah",
      relics: [], relicBought: false, cursedCleared: 0,
      attunedRoot: null, rootTier: 0, crewAligned: false,
    };
    const vessel = currentVessel();
    const rootFamily = SN.rootFamilies().find((family) => family.root === SN.state.meta.attunedRoot && family.tier > 0);
    if (rootFamily) { run.attunedRoot = rootFamily.root; run.rootTier = rootFamily.tier; }
    applyMods(vessel.mod, 1);
    const keepsake = C.relics.find((r) => r.keepsake && r.id === SN.state.meta.equippedKeepsake);
    if (keepsake) { applyMods(keepsake.mod, 1); run.relics.push(keepsake.id); }
    if (vessel.crew && keepsake?.crew === vessel.crew) {
      addPip(vessel.crew);
      run.crewAligned = true;
    }
    run.chart = genChart();
    run.bossPhases = computeBossPhases();
    if (mods.startBoon) offerBoons(() => renderChart(), "The Lantern of Departure is lit — the crew sends you off with a blessing.");
    else renderChart();
  };

  const resultFor = (card) => {
    if (!run.results[card.k]) {
      run.results[card.k] = {
        card, right: 0, wrong: 0,
        wasNew: (card.reps || 0) === 0,
        wasWeak: (card.missPrior || 0) > 0 || (card.lapses || 0) > 0 || ((card.reps || 0) > 0 && (card.stability || 0) < 3),
      };
    }
    return run.results[card.k];
  };

  // ------------------------------------------------------------ shared HUD
  function heartsHTML() {
    let s = "";
    for (let i = 0; i < run.hullMax; i++) s += C.icons.heart.replace("<svg", `<svg class="${i < run.hull ? "" : "lost"}"`);
    if (enc && enc.shield > 0) for (let i = 0; i < enc.shield; i++) s += C.icons.heart.replace("<svg", '<svg class="shield"');
    return s;
  }
  function streakHTML() {
    const hot = run.streak >= 3;
    return `<span class="streak-pill${hot ? " hot" : ""}" id="streak-pill"><span class="streak-star">✦</span> ${run.streak}</span>`;
  }

  // ---- build currents (Resolve/Precision/Swiftness = Yusuf/Layla/Idris) ----
  const CREW_ORDER = ["yusuf", "layla", "idris"];
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const toRoman = (n) => ROMAN[n] || String(n);
  const tierForPips = (pips) => Math.floor(pips / 3);
  const currentScale = (crewId) => 1 + 0.12 * (run.currentTier[crewId] || 0);

  // ---- vessel (Phase 4) ----
  const currentVessel = () => C.vessels.find((v) => v.id === run.vessel) || C.vessels[0];
  const vesselTrait = () => currentVessel().trait;

  // Renders the three crew-colored gauges. `full` adds text labels for the
  // boon-draft "Your build" panel; the bare version is the compact HUD strip.
  function relicChipsHTML() {
    if (!run.relics || !run.relics.length) return "";
    return run.relics.map((id) => {
      const r = C.relics.find((x) => x.id === id);
      if (!r) return "";
      return `<button type="button" class="relic-chip" data-relic="${id}" aria-label="${r.name}">${r.icon}</button>`;
    }).join("");
  }

  function currentsHTML(full) {
    // Currents ARE the crew: a gauge only exists once its friend is aboard.
    // A solo navigator sees a clean HUD — no locked meters teasing systems
    // the story hasn't introduced yet.
    const aboard = CREW_ORDER.filter((id) => SN.recruited(id));
    if (!aboard.length && !run.attunedRoot && !(run.relics && run.relics.length)) return "";
    return `<div class="cur-row${full ? " full" : ""}">${aboard.map((id) => {
      const cr = C.crew.find((c) => c.id === id);
      const cur = C.currents[id];
      const pips = run.currents[id] || 0;
      const tier = run.currentTier[id] || 0;
      const into = pips - tier * 3;
      const pct = (into / 3) * 100;
      return `<div class="cur-chip cur-${id}" data-cur="${id}" title="${cur.name} — ${cr.name}">
        <span class="cur-glyph" style="color:${cr.color}">${cur.glyph}</span>
        <span class="cur-track"><i class="cur-fill" style="width:${pct}%;background:${cr.color}"></i></span>
        <span class="cur-tier"${tier === 0 ? " hidden" : ""}>${toRoman(tier)}</span>
        ${full ? `<span class="cur-name">${cur.name}</span>` : ""}
      </div>`;
    }).join("")}${run.attunedRoot ? `<span class="root-bearing-chip" title="Root bearing — ${SN.esc(run.attunedRoot)}">
      <span class="ar" lang="ar">${SN.esc([...run.attunedRoot].join(" · "))}</span><b>${toRoman(run.rootTier)}</b>
    </span>` : ""}${relicChipsHTML()}</div>`;
  }

  function updateCurrents() {
    $$(".cur-chip").forEach((el) => {
      const id = el.dataset.cur;
      const pips = run.currents[id] || 0;
      const tier = run.currentTier[id] || 0;
      const into = pips - tier * 3;
      const fill = el.querySelector(".cur-fill");
      if (fill) fill.style.width = `${(into / 3) * 100}%`;
      const badge = el.querySelector(".cur-tier");
      if (badge) { badge.textContent = toRoman(tier); badge.hidden = tier === 0; }
    });
  }

  // The top status block every run screen shares: hull, pearls, streak, and
  // the three build gauges beneath.
  function topHUD() {
    return `
      <div class="enc-top">
        <div class="hull-hearts">${heartsHTML()}</div>
        <span class="hud-chip" style="cursor:default">${C.icons.pearl}<span class="pearl-n">${run.pearls}</span></span>
        ${streakHTML()}
      </div>
      ${currentsHTML(false)}`;
  }

  function updateTop() {
    const hearts = $(".hull-hearts"); if (hearts) hearts.innerHTML = heartsHTML();
    const pill = $("#streak-pill"); if (pill) pill.outerHTML = streakHTML();
    const pearls = $(".enc-top .pearl-n"); if (pearls) pearls.textContent = run.pearls;
    updateCurrents();
  }

  function addPearls(n, quiet) {
    run.pearls += n;
    if (!quiet) { SN.audio.pearl(); SN.toast(`+${n} pearl${n === 1 ? "" : "s"}`); }
    updateTop();
  }

  function heal(n) {
    const before = run.hull;
    run.hull = Math.min(run.hullMax, run.hull + n);
    if (run.hull > before) { SN.audio.heal(); SN.toast(`Hull mended +${run.hull - before}`); }
    updateTop();
  }

  // Returns true if the run just ended (defeat).
  function mistake() {
    if (enc) enc.flawless = false;
    run.flawless = false;
    run.streak = 0;
    if (enc && enc.shield > 0 && !enc.cursed) {
      enc.shield--;
      SN.toast("The ward absorbs the blow");
      updateTop();
      return false;
    }
    run.hull--;
    SN.audio.hit();
    SN.fx.shake();
    SN.fx.vignette();
    updateTop();
    if (run.hull <= 0) {
      if (run.mods.revive && !run.usedRevive) {
        run.usedRevive = true;
        run.hull = 1;
        SN.audio.heal();
        SN.toast("Second Wind — the ship rights itself!");
        updateTop();
      } else {
        finishRun("defeat");
        return true;
      }
    }
    // Cursed cargo: the sea keeps its price on the first slip — the node
    // completes with no reward (lost treasure, not death), unless that hit
    // above was already fatal (handled by the defeat branch returning true).
    if (enc && enc.cursed) { cursedFail(); return false; }
    return false;
  }

  function cursedFail() {
    if (!enc || enc.over) return;
    enc.over = true;
    cancelAnimationFrame(enc.timer);
    const es = $(".enemy-svg");
    if (es) es.classList.add("dying");
    SN.toast("The cargo slips back into the dark");
    setTimeout(() => { if (run) renderChart(); }, 950);
  }

  // ------------------------------------------------------------- encounters
  // Sea mood: a slow background tint that makes the voyage FEEL like travel
  // (specs/03). Early rows glow like bio-lit shallows, late rows darken to
  // deep water, and the boss pulls an eclipse vignette over everything.
  function setSeaMood(mood) {
    document.body.classList.remove("mood-shallows", "mood-deep", "mood-eclipse");
    if (mood) document.body.classList.add("mood-" + mood);
  }

  function startEncounter({ format, boss = false, phase = 0, ayahRef = null, cursed = false }) {
    const node = run.at != null ? nodeById(run.at) : null;
    const lastRow = Math.max(...run.chart.map((n) => n.row));
    if (boss) setSeaMood("eclipse");
    else if (node && node.row >= lastRow - 1) setSeaMood("deep");
    else setSeaMood("shallows");
    const f = C.formats[format];
    const hpBase = boss ? 70 : f.hp;
    enc = {
      format, boss, phase, ayahRef, cursed,
      hp: cursed ? Math.round(hpBase * 0.8) : hpBase, maxHp: cursed ? Math.round(hpBase * 0.8) : hpBase,
      shield: cursed ? 0 : (run.mods.shieldPerEnc || 0) + (boss && phase === 0 ? run.bossCharm : 0),
      flawless: true, qIndex: 0, chain: 0, over: false, timer: null,
      rootBearingTriggered: false,
    };
    if (boss && phase > 0 && run.bossShield != null) enc.shield = run.bossShield; // carry charm across phases
    if (!run.mods.streakCarry && !boss) run.streak = 0;

    // Every word in a verse encounter's ayah is by definition already
    // seen — nothing new to introduce, unlike the vocab formats.
    const intros = [];
    if (!boss && format !== "verse") {
      let quota = SN.introQuota();
      while (quota-- > 0 && SN.state.fresh.length) intros.push(SN.introduce(SN.state.fresh[0]));
    }
    renderEncounterShell();
    if (intros.length) showIntros(intros, 0, () => beginCombat());
    else beginCombat();
  }

  function renderEncounterShell() {
    const f = C.formats[enc.format];
    const title = enc.boss ? `${C.boss.name} — ${["I", "II", "III"][enc.phase]}` : f.name;
    const art = enc.boss ? C.boss.svg : f.svg;
    SN.render(`
      ${topHUD()}
      <div class="enemy-stage">
        <span class="enc-name">${title}</span>
        <div class="enc-hp${enc.boss ? " boss" : ""}" ${enc.format === "chain" && !enc.boss ? "hidden" : ""}><i style="width:100%"></i></div>
        ${enc.boss ? `<div class="phase-dots">${[0, 1, 2].map((i) => `<i class="${i <= enc.phase ? "on" : ""}"></i>`).join("")}</div>` : ""}
        <div class="enemy-svg">${art}</div>
        <div class="ship-svg">${C.shipSVG(run.currentTier, run.relics, run.vessel)}</div>
        <div class="ship-particle-host" aria-hidden="true"></div>
      </div>
      <div id="enc-body"></div>`);
    const particleHost = $(".ship-particle-host");
    SN.particlesReady?.then((particles) => {
      if (particleHost?.isConnected) particles?.mountShip?.(particleHost, { vessel: run.vessel });
    });
  }

  function showIntros(cards, ix, done) {
    if (ix >= cards.length) { done(); return; }
    const card = cards[ix];
    $("#enc-body").innerHTML = `
      <div class="intro-card intro-brief panel" style="margin-top:12px">
        <div class="intro-kicker">✦ New word ahead</div>
        <div class="intro-brief-row">
          <div class="prompt-ar ar" lang="ar">${SN.esc(card.arabic)}</div>
          <div class="intro-brief-copy">
            <div class="intro-en">${SN.esc(card.display || card.english)}</div>
            <div class="intro-translit">${SN.esc(card.translit)}</div>
          </div>
        </div>
        <button class="btn btn-gold" data-next>Hear it, then continue →</button>
      </div>`;
    SN.audio.boon();
    SN.recite(card);
    $("[data-next]").onclick = () => { SN.audio.click(); showIntros(cards, ix + 1, done); };
  }

  function showWordDiscovery(card, onDone) {
    const info = SN.lexicalInfo(card);
    const root = info.root || card.root || "";
    const lemma = info.lemma || "";
    const formatCount = (n) => new Intl.NumberFormat("en").format(n || 0);
    const rootHTML = root
      ? `<div class="discovery-root">
          <span class="discovery-label">Root letters</span>
          <div class="discovery-root-letters" dir="rtl" aria-label="Root ${SN.esc([...root].join(" "))}">
            ${[...root].map((letter) => `<span>${SN.esc(letter)}</span>`).join("")}
          </div>
          <p>Words in this family grow from the same core meaning.</p>
        </div>`
      : `<div class="discovery-root is-rootless">
          <span class="discovery-label">Word family</span>
          <strong>Grammar word</strong>
          <p>This particle has no triliteral root assigned.</p>
        </div>`;

    const sheet = SN.overlay(`
      <div class="discovery-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <h2 class="discovery-kicker">✦ New word charted</h2>
      <p class="discovery-lead">You recalled it correctly for the first time.</p>
      <div class="discovery-word-row">
        <div class="discovery-word ar" lang="ar">${SN.esc(card.arabic)}</div>
        <button type="button" class="prompt-word-audio discovery-audio" data-discovery-audio aria-label="Hear this word">${C.icons.sound}</button>
      </div>
      <div class="discovery-translation">${SN.esc(card.display || card.english)}</div>
      <div class="discovery-translit">${SN.esc(card.translit)}</div>
      ${lemma ? `<div class="discovery-lemma"><span>Dictionary form</span><b class="ar" lang="ar">${SN.esc(lemma)}</b></div>` : ""}
      ${rootHTML}
      <div class="discovery-frequency">
        <div>
          <b>${info.lemmaCount ? formatCount(info.lemmaCount) : "—"}<small>×</small></b>
          <span>this lemma<br />in the Quran</span>
        </div>
        <div class="${root ? "" : "is-unavailable"}">
          <b>${root && info.rootCount ? formatCount(info.rootCount) : "—"}<small>${root ? "×" : ""}</small></b>
          <span>${root ? "root-family words" : "no root family"}<br />in the Quran</span>
        </div>
      </div>
      <p class="discovery-source">Counts follow Quranic Arabic Corpus lemmas and roots.</p>
      <button class="btn btn-gold btn-big discovery-continue" data-chart-word>Add to chart ✦</button>`, {
        className: "discovery-sheet",
        dismissible: false,
      });

    enc.discoveryOpen = true;
    SN.audio.boon();
    $("[data-discovery-audio]", sheet).onclick = () => SN.recite(card);
    $("[data-chart-word]", sheet).onclick = () => {
      card.discoveryPending = false;
      card.chartedAt = Date.now();
      SN.saveDeck();
      enc.discoveryOpen = false;
      SN.audio.click();
      SN.closeOverlay();
      onDone();
    };
  }

  function beginCombat() {
    if (enc.format === "pairs") pairsWave();
    else if (enc.format === "verse") verseWave();
    else askQuestion();
  }

  // Question audio belongs to the prompt, not the answer. Every tested word
  // sounds as it appears and exposes the same explicit replay affordance.
  function wirePromptAudio(card, root = document) {
    const replay = $("[data-replay]", root);
    const play = () => {
      SN.recite(card);
      if (!replay) return;
      replay.classList.remove("playing");
      void replay.offsetWidth;
      replay.classList.add("playing");
      setTimeout(() => replay.classList.remove("playing"), 900);
    };
    if (replay) replay.onclick = play;
    play();
    return play;
  }

  // ---- damage & progress ----
  function baseDamage() {
    let dmg = (enc.format === "pairs" ? 14 : 20) * run.mods.dmgMult * (1 + (run.mods.dmgPerEnc || 0) * run.cleared);
    return dmg;
  }
  function applyHit(dmg, opts = {}) {
    SN.audio.harpoon();
    particleFX("strike");
    SN.fx.beam($(".ship-svg"), $(".enemy-svg"));
    const es = $(".enemy-svg");
    if (es) {
      es.classList.remove("hurt"); void es.offsetWidth; es.classList.add("hurt");
      const r = es.getBoundingClientRect();
      SN.fx.float(`−${Math.round(dmg)}`, r.left + r.width / 2, r.top + r.height / 2);
    }
    enc.hp -= dmg;
    const bar = $(".enc-hp i");
    if (bar) bar.style.width = `${clamp01(enc.hp / enc.maxHp) * 100}%`;
    if (enc.hp <= 0) { encounterWon(); return true; }
    return false;
  }

  function onCorrect(card, elapsed, allowed) {
    const res = resultFor(card);
    const discovery = !!card.discoveryPending && !card.chartedAt;
    const slow = elapsed > allowed * 0.85;
    SN.noteAnswer(true, elapsed, allowed);
    SN.grade(card, slow ? 2 : 3);
    res.right++;
    if (slow && !run.mods.slowKeepsStreak) run.streak = 1;
    else run.streak++;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    SN.audio.correct(run.streak);
    if (run.mods.pearlAt5 && run.streak >= 5) addPearls(1, true);

    let dmg = baseDamage();
    if (run.mods.streakFire && run.streak > 0 && run.streak % 3 === 0) { dmg *= 1.5; SN.toast("Streak of fire! ✦"); }
    if (vesselTrait() === "streakDamage") dmg *= 1 + Math.min(0.4, 0.04 * run.streak);
    const cardRoot = SN.lexicalInfo(card).root || card.root || "";
    if (run.attunedRoot && cardRoot === run.attunedRoot) {
      dmg *= 1.25;
      if (!enc.rootBearingTriggered) {
        const rewards = ["+25% strike"];
        if (run.rootTier >= 2) { addPearls(1, true); rewards.push("+1 pearl"); }
        if (run.rootTier >= 3) { enc.shield += 1; rewards.push("+1 ward"); }
        enc.rootBearingTriggered = true;
        SN.toast(`<span class="ar">${SN.esc([...run.attunedRoot].join(" · "))}</span> bearing — ${rewards.join(" · ")}`);
      }
    }
    if (run.mods.rootResonance && run.lastRoot && card.root && card.root === run.lastRoot) {
      dmg += 18;
      SN.toast(`Root resonance — <span class="ar">${SN.esc(card.root)}</span> echoes!`);
      const es = $(".enemy-svg");
      if (es) { const r = es.getBoundingClientRect(); SN.fx.burst(r.left + r.width / 2, r.top + r.height / 2); }
    }
    run.lastRoot = card.root || null;
    updateTop();
    return { damage: dmg, discovery };
  }

  function onWrong(card, elapsed, allowed) {
    const res = resultFor(card);
    SN.noteAnswer(false, elapsed, allowed);
    SN.grade(card, 1);
    res.wrong++;
    run.lastRoot = null;
    SN.audio.wrong();
    particleFX("damage");
    return mistake();
  }

  // ---- question formats (volley / echo / chain) ----
  function askQuestion() {
    if (enc.over) return;
    const avoid = new Set(run.recent.slice(-3));
    const card = SN.drawWord(avoid);
    if (!card) { encounterWon(); return; }
    resultFor(card);
    run.recent.push(card.k);
    enc.qIndex++;

    const mode = enc.format === "echo" ? "arabic" : "meaning";
    const opts = SN.buildOptions(card, mode);
    const knobs = SN.knobs();
    let allowed = knobs.timeMs * (run.mods.timeScale || 1);
    if (enc.format === "chain") allowed *= Math.max(0.55, 1 - (enc.qIndex - 1) * 0.05);
    if (enc.cursed) allowed *= 0.7;

    const f = C.formats[enc.format];
    const showTranslit = run.mods.showTranslit;
    // A marked word wears its wanted poster into battle.
    const bountyHTML = SN.isBounty(card.k)
      ? `<div class="bounty-chip">⚑ Marked — this one got away last voyage</div>`
      : "";
    let promptHTML;
    if (mode === "arabic") {
      promptHTML = `
        <div class="prompt-kicker">${f.kicker}</div>
        <button class="prompt-audio-btn" data-replay aria-label="Play the word">${C.icons.play}</button>
        <div class="prompt-translit">${run.mods.audioReplay ? "the echo repeats itself…" : "tap to hear it again"}</div>`;
    } else {
      promptHTML = `
        <div class="prompt-kicker">${f.kicker}</div>
        <div class="prompt-word-row">
          <div class="prompt-ar ar" lang="ar">${SN.esc(card.arabic)}</div>
          <button class="prompt-word-audio" data-replay aria-label="Replay this word">${C.icons.sound}</button>
        </div>
        ${showTranslit ? `<div class="prompt-translit">${SN.esc(card.translit)}</div>` : ""}`;
    }

    $("#enc-body").innerHTML = `
      <div class="prompt-card panel${SN.isBounty(card.k) ? " is-bounty" : ""}">
        ${bountyHTML}
        ${promptHTML}
        <div class="timer-track"><i id="timer-bar"></i></div>
      </div>
      ${enc.format === "chain" ? `<div class="chain-meter"><i id="chain-bar" style="width:${enc.chain}%"></i></div><div class="chain-label">Fill the chain — outrun the leviathan!</div>` : ""}
      <div class="opts${mode === "arabic" ? "" : ""}">
        ${opts.map((o, i) => `<button class="opt${mode === "arabic" ? " ar-opt" : ""}" ${mode === "arabic" ? 'lang="ar"' : ""} data-opt="${i}">${SN.esc(o.label)}</button>`).join("")}
      </div>`;

    const replayPrompt = wirePromptAudio(card);
    if (mode === "arabic" && run.mods.audioReplay) {
      setTimeout(() => { if (!enc.over && !answered) replayPrompt(); }, 1600);
    }

    // Layla's Star Chart: dim a wrong option (keep at least 2 live).
    if (run.mods.removeDistractor) {
      const wrongEls = $$("[data-opt]").filter((el) => !opts[el.dataset.opt].ok);
      let dims = Math.min(run.mods.removeDistractor, wrongEls.length - 1);
      SN.shuffle(wrongEls).slice(0, Math.max(0, dims)).forEach((el) => el.classList.add("dim"));
    }

    // The Watcher's eclipse: options rise darkened for a moment.
    if (enc.boss && enc.phase >= 1 && enc.qIndex % 3 === 0 && !run.mods.eclipseWard) {
      $$("[data-opt]").forEach((el) => el.classList.add("eclipsed"));
      setTimeout(() => $$("[data-opt]").forEach((el) => el.classList.remove("eclipsed")), 1500);
    }
    // Heat veil: on hot seas the options rise hidden for a short beat — read
    // fast before the dark lifts. Shorter than the boss eclipse, every turn.
    if (run.mods.heatHide && !run.mods.eclipseWard) {
      $$("[data-opt]").forEach((el) => el.classList.add("eclipsed"));
      setTimeout(() => $$("[data-opt]").forEach((el) => el.classList.remove("eclipsed")), 800);
    }

    let answered = false;
    const qStart = performance.now();
    const grace = run.mods.graceMs || 0;

    const bar = $("#timer-bar");
    const track = bar.parentElement;
    function tick() {
      if (answered || enc.over) return;
      const gone = performance.now() - qStart - grace;
      const left = 1 - Math.max(0, gone) / allowed;
      bar.style.transform = `scaleX(${clamp01(left)})`;
      track.classList.toggle("low", left < 0.3);
      if (left <= 0) { onTimeout(); return; }
      enc.timer = requestAnimationFrame(tick);
    }
    enc.timer = requestAnimationFrame(tick);

    function finishQ(delay) {
      setTimeout(() => { if (!enc.over) askQuestion(); }, delay);
    }

    function onTimeout() {
      answered = true;
      $$("[data-opt]").forEach((el) => { el.disabled = true; if (opts[el.dataset.opt].ok) el.classList.add("good"); else el.classList.add("dim"); });
      SN.toast("Too slow — the storm strikes!");
      if (enc.format === "chain") { enc.chain = Math.max(0, enc.chain - 10); const cb = $("#chain-bar"); if (cb) cb.style.width = enc.chain + "%"; }
      const dead = onWrong(card, allowed, allowed);
      if (!dead) finishQ(900);
    }

    $$("[data-opt]").forEach((el) => {
      el.onclick = () => {
        if (answered || enc.over) return;
        answered = true;
        cancelAnimationFrame(enc.timer);
        const opt = opts[el.dataset.opt];
        const elapsed = performance.now() - qStart - grace;
        if (opt.ok) {
          el.classList.add("good");
          const prize = SN.settleBounty(card.k);
          if (prize) {
            addPearls(prize, true);
            SN.toast(`⚑ Bounty settled — <b>+${prize}</b> pearls`);
          }
          const result = onCorrect(card, Math.max(200, elapsed), allowed);
          const finishCorrect = () => {
            if (enc.format === "chain") {
              enc.chain = Math.min(100, enc.chain + 16 * (run.mods.chainRate || 1));
              const cb = $("#chain-bar"); if (cb) cb.style.width = enc.chain + "%";
              SN.audio.harpoon();
              const es = $(".enemy-svg");
              if (es) { es.classList.remove("hurt"); void es.offsetWidth; es.classList.add("hurt"); }
              if (enc.chain >= 100) { encounterWon(); return; }
              finishQ(520);
            } else {
              const won = applyHit(result.damage);
              if (!won) finishQ(520);
            }
          };
          if (result.discovery) showWordDiscovery(card, finishCorrect);
          else finishCorrect();
        } else {
          el.classList.add("bad");
          $$("[data-opt]").forEach((x) => { x.disabled = true; if (opts[x.dataset.opt].ok) x.classList.add("good"); });
          if (enc.format === "chain") { enc.chain = Math.max(0, enc.chain - 10); const cb = $("#chain-bar"); if (cb) cb.style.width = enc.chain + "%"; }
          const dead = onWrong(card, elapsed, allowed);
          if (!dead) finishQ(1000);
        }
      };
    });
  }

  // ---- pairs format ----
  function pairsWave() {
    if (enc.over) return;
    // Draw 4 words unique by BOTH script and gloss — the same Arabic word can
    // occur under two near-identical glosses, which would make twin tiles.
    const avoid = new Set(run.recent.slice(-2));
    const words = [];
    const usedAr = new Set(), usedEn = new Set();
    for (let tries = 0; tries < 40 && words.length < 4; tries++) {
      const c = SN.drawWord(avoid);
      if (!c) break;
      avoid.add(c.k);
      const en = (c.display || c.english).trim().toLowerCase();
      if (usedAr.has(c.arabic) || usedEn.has(en)) continue;
      usedAr.add(c.arabic); usedEn.add(en);
      words.push(c);
    }
    if (words.length < 2) { encounterWon(); return; }
    words.forEach((w) => { resultFor(w); run.recent.push(w.k); });

    const left = SN.shuffle(words.map((w) => ({ k: w.k, label: w.arabic, card: w })));
    const right = SN.shuffle(words.map((w) => ({ k: w.k, label: w.display || w.english, card: w })));

    $("#enc-body").innerHTML = `
      <div class="prompt-card panel" style="padding:10px 14px">
        <div class="prompt-kicker">${C.formats.pairs.kicker}</div>
      </div>
      <div class="pairs-grid">
        <div class="pairs-col">${left.map((t, i) => `<button class="opt ar-opt pair-tile" lang="ar" data-l="${i}">${SN.esc(t.label)}</button>`).join("")}</div>
        <div class="pairs-col">${right.map((t, i) => `<button class="opt pair-tile" data-r="${i}">${SN.esc(t.label)}</button>`).join("")}</div>
      </div>`;

    let selL = null, selR = null, matched = 0, waveStart = performance.now();

    function tryMatch() {
      if (selL == null || selR == null) return;
      const lEl = $(`[data-l="${selL}"]`), rEl = $(`[data-r="${selR}"]`);
      const l = left[selL], r = right[selR];
      const elapsed = performance.now() - waveStart;
      selL = selR = null;
      if (l.k === r.k) {
        lEl.classList.remove("sel"); rEl.classList.remove("sel");
        lEl.classList.add("matched"); rEl.classList.add("matched");
        matched++;
        const result = onCorrect(l.card, Math.min(elapsed, 6000), 9000);
        const finishMatch = () => {
          const won = applyHit(result.damage);
          if (won) return;
          if (matched >= words.length) setTimeout(() => { if (!enc.over) pairsWave(); }, 650);
        };
        if (result.discovery) showWordDiscovery(l.card, finishMatch);
        else finishMatch();
      } else {
        lEl.classList.add("bad"); rEl.classList.add("bad");
        lEl.classList.remove("sel"); rEl.classList.remove("sel");
        setTimeout(() => { lEl.classList.remove("bad"); rEl.classList.remove("bad"); }, 420);
        onWrong(l.card, 6000, 9000);
      }
    }

    $$("[data-l]").forEach((el) => el.onclick = () => {
      if (el.classList.contains("matched")) return;
      $$("[data-l]").forEach((x) => x.classList.remove("sel"));
      el.classList.add("sel"); selL = Number(el.dataset.l);
      SN.audio.click();
      SN.recite(left[selL].card);
      tryMatch();
    });
    $$("[data-r]").forEach((el) => el.onclick = () => {
      if (el.classList.contains("matched")) return;
      $$("[data-r]").forEach((x) => x.classList.remove("sel"));
      el.classList.add("sel"); selR = Number(el.dataset.r);
      SN.audio.click();
      tryMatch();
    });

    // Layla's Twin Stars: one pair binds itself.
    if (run.mods.autoPair && words.length >= 3) {
      const bindAutomaticPair = () => {
        if (enc.over) return;
        if (enc.discoveryOpen) { setTimeout(bindAutomaticPair, 300); return; }
        const li = left.findIndex((t) => !$(`[data-l="${left.indexOf(t)}"]`)?.classList.contains("matched"));
        if (li < 0) return;
        const ri = right.findIndex((t) => t.k === left[li].k);
        const lEl = $(`[data-l="${li}"]`), rEl = $(`[data-r="${ri}"]`);
        if (!lEl || !rEl || lEl.classList.contains("matched")) return;
        lEl.classList.add("matched"); rEl.classList.add("matched");
        matched++;
        SN.audio.boon();
        SN.toast("Twin stars bind themselves ✦");
        applyHit(baseDamage() * 0.6);
      };
      setTimeout(bindAutomaticPair, 700);
    }
  }

  // ---- verse format: answer through a fully-unlocked ayah, word by word ----
  // Each word swaps between "meaning" mode (Arabic prompt, English options —
  // same shape as Squall) and "arabic" mode (the full ayah's English
  // translation shown as context plus a one-word clue, Arabic options — same
  // idea as the Fog-Wyrm but text-first, so it never depends on audio alone
  // to be answerable). Right or wrong, the word locks into the assembly line
  // and the ayah keeps building — the health bar tracks progress through the
  // ayah, not correctness, so it always finishes exactly on the last word.
  function verseWave() {
    if (enc.over) return;
    const a = SN.ayahData(enc.ayahRef.surah, enc.ayahRef.ayah);
    const order = enc.ayahRef.words && enc.ayahRef.words.length ? enc.ayahRef.words : a ? a.words : [];
    if (!order.length) { encounterWon(); return; }
    const translation = enc.ayahRef.translation || (a ? a.translation : "");
    let wordIx = 0;

    $("#enc-body").innerHTML = `
      <div class="verse-line" id="verse-line">${order.map((w, i) => `<span class="verse-slot" data-slot="${i}"></span>`).join("")}</div>
      <div id="verse-question"></div>
      <div class="verse-translation" id="verse-translation" hidden></div>`;

    askVerseWord();

    function askVerseWord() {
      if (enc.over) return;
      const word = order[wordIx];
      const card = SN.state.deck[word.k] || word;
      const mode = Math.random() < 0.6 ? "meaning" : "arabic";
      const opts = SN.buildOptions(card, mode);
      const f = C.formats.verse;

      const promptHTML = mode === "arabic"
        ? `
          <div class="prompt-kicker">${f.kickerArabic}</div>
          <button class="prompt-audio-btn" data-replay aria-label="Replay this word">${C.icons.play}</button>
          <div class="verse-context">${SN.esc(translation)}</div>
          <div class="verse-clue">→ <b>${SN.esc(word.display || word.english)}</b></div>`
        : `
          <div class="prompt-kicker">${f.kickerMeaning}</div>
          <div class="prompt-word-row">
            <div class="prompt-ar ar" lang="ar">${SN.esc(word.arabic)}</div>
            <button class="prompt-word-audio" data-replay aria-label="Replay this word">${C.icons.sound}</button>
          </div>`;

      const body = $("#verse-question");
      body.innerHTML = `
        <div class="prompt-card panel">${promptHTML}</div>
        <div class="opts">${opts.map((o, i) => `<button class="opt${mode === "arabic" ? " ar-opt" : ""}" ${mode === "arabic" ? 'lang="ar"' : ""} data-opt="${i}">${SN.esc(o.label)}</button>`).join("")}</div>`;

      wirePromptAudio(card, body);

      let answered = false;
      $$("[data-opt]", body).forEach((el) => {
        el.onclick = () => {
          if (answered || enc.over) return;
          answered = true;
          const opt = opts[Number(el.dataset.opt)];
          const isLast = wordIx >= order.length - 1;
          const slot = $(`[data-slot="${wordIx}"]`);
          if (slot) { slot.textContent = word.arabic; slot.classList.add("filled"); slot.setAttribute("lang", "ar"); }

          let dead = false;
          if (opt.ok) {
            el.classList.add("good");
            if (SN.state.deck[word.k]) { resultFor(card); SN.grade(card, 3); run.recent.push(word.k); }
            run.streak++;
            run.bestStreak = Math.max(run.bestStreak, run.streak);
            SN.audio.correct(run.streak);
          } else {
            el.classList.add("bad");
            $$("[data-opt]", body).forEach((x) => { x.disabled = true; if (opts[Number(x.dataset.opt)].ok) x.classList.add("good"); });
            run.lastRoot = null;
            SN.audio.wrong();
            dead = mistake();
          }
          updateTop();
          if (dead) return;

          if (isLast && translation) {
            const tr = $("#verse-translation");
            if (tr) { tr.hidden = false; tr.textContent = translation; tr.classList.add("show"); }
          }
          // Deal the exact remaining HP on the final word — dividing maxHp
          // by word count can leave a floating-point dust of HP behind
          // otherwise, which would silently never trip the hp<=0 win check.
          const dmg = isLast ? enc.hp : enc.maxHp / order.length;
          setTimeout(() => {
            if (enc.over) return;
            const won = applyHit(dmg);
            if (won) return;
            wordIx++;
            if (wordIx < order.length) askVerseWord();
          }, opt.ok ? 500 : 900);
        };
      });
    }
  }

  // --------------------------------------------------------- encounter end
  function encounterWon() {
    if (enc.over) return;
    enc.over = true;
    particleFX("victory");
    cancelAnimationFrame(enc.timer);
    const es = $(".enemy-svg");
    if (es) es.classList.add("dying");
    SN.audio.boon();
    run.cleared++;

    // Non-boss verse nodes are the "collect the Qur'an" track — boss verse
    // phases are one-off set-pieces and don't need the same bookkeeping.
    if (enc.format === "verse" && enc.ayahRef && !enc.boss) SN.completeVerse(enc.ayahRef.surah, enc.ayahRef.ayah);

    // Cursed cargo only ever "wins" flawless (any slip ends it early via
    // cursedFail) — the reward replaces the boon draft entirely: a relic
    // choice plus a flat pearl haul, worldly salvage rather than a blessing.
    if (enc.cursed) {
      run.cursedCleared = (run.cursedCleared || 0) + 1;
      addPearls(8, true);
      SN.toast("The cargo cracks open — plunder is yours!");
      SN.saveAll();
      setTimeout(() => grantRelic(null, () => renderChart()), 950);
      return;
    }

    let bonus = 3 + (run.mods.pearlsPerClear || 0) + (enc.flawless ? 2 : 0);
    if (enc.flawless && run.mods.flawlessBonus) { bonus += 5; heal(1); }
    if (enc.flawless && run.mods.flawlessHeal) heal(run.mods.flawlessHeal);
    addPearls(bonus, true);
    SN.toast(`${C.formats[enc.format].verb} +${bonus} pearls`);
    SN.saveAll();

    if (enc.boss) {
      run.bossShield = enc.shield;
      if (enc.phase < 2) {
        const next = enc.phase + 1;
        setTimeout(() => bossSplash(next), 950);
      } else {
        setTimeout(() => finishRun("victory"), 1100);
      }
      return;
    }
    setTimeout(() => offerBoons(() => renderChart()), 950);
  }

  // ------------------------------------------------------------------ boons
  function statChip(icon, label, tone) {
    return `<span class="effect-chip ${tone || ""}">${icon}<span>${SN.esc(label)}</span></span>`;
  }

  function boonEffectChips(b) {
    const m = b.mod || {};
    const chips = [];
    if (m.heal) chips.push(statChip(C.icons.heart, `+${m.heal} health`, "heal"));
    if (m.hullMax) chips.push(statChip(C.icons.hull, `+${m.hullMax} max health`, "heal"));
    if (m.shieldPerEnc) chips.push(statChip(C.icons.shield, "first miss safe", "ward"));
    if (m.revive) chips.push(statChip(C.icons.revive, "revive once", "ward"));
    if (m.timeScale) chips.push(statChip(C.icons.hourglass, `+${Math.round((m.timeScale - 1) * 100)}% time`, "time"));
    if (m.restBonus) chips.push(statChip(C.icons.hearth, `+${m.restBonus} rest heal`, "heal"));
    if (m.pearlsPerClear) chips.push(statChip(C.icons.pearl, `+${m.pearlsPerClear} clear`, "pearl"));
    if (m.slowKeepsStreak) chips.push(statChip(C.icons.breath, "streak holds", "swift"));
    if (m.removeDistractor) chips.push(statChip(C.icons.dimStar, "dim false answer", "time"));
    if (m.showTranslit) chips.push(statChip(C.icons.astrolabe || C.icons.precision, "sound hint", "time"));
    if (m.autoPair) chips.push(statChip(C.icons.twinStars, "free pair", "time"));
    if (m.graceMs) chips.push(statChip(C.icons.anchor, `${Math.round(m.graceMs / 1000)}s grace`, "time"));
    if (m.audioReplay) chips.push(statChip(C.icons.sound, "echo repeats", "time"));
    if (m.foresight) chips.push(statChip(C.icons.eye, "reveal mystery", "time"));
    if (m.eclipseWard) chips.push(statChip(C.icons.eclipse, "block eclipse", "ward"));
    if (m.streakFire) chips.push(statChip(C.icons.fire, "3rd hit burns", "swift"));
    if (m.rootResonance) chips.push(statChip(C.icons.root, "root burst", "swift"));
    if (m.pearlAt5) chips.push(statChip(C.icons.pearl, "streak 5+ pearls", "pearl"));
    if (m.chainRate) chips.push(statChip(C.icons.current, `+${Math.round((m.chainRate - 1) * 100)}% chain`, "swift"));
    if (m.flawlessBonus) {
      chips.push(statChip(C.icons.pearl, "+5 flawless", "pearl"));
      chips.push(statChip(C.icons.heart, "+1 health", "heal"));
    }
    if (m.dmgPerEnc) chips.push(statChip(C.icons.harpoon, `+${Math.round(m.dmgPerEnc * 100)}%/clear`, "swift"));
    if (m.dmgMult) chips.push(statChip(C.icons.harpoon, `+${Math.round((m.dmgMult - 1) * 100)}% damage`, "swift"));
    if (m.streakCarry) chips.push(statChip(C.icons.breath, "carry streak", "swift"));
    return chips.length ? `<div class="boon-effects">${chips.join("")}</div>` : "";
  }

  function offerBoons(done, subtitle) {
    const ownedNoRepeat = new Set(run.boons.filter((id) => {
      const b = allBoons().find((x) => x.id === id);
      return b && !b.repeat;
    }));
    const pool = allBoons().filter((b) => !ownedNoRepeat.has(b.id));
    const offer = SN.shuffle(pool).slice(0, 3);
    if (!offer.length) { done(); return; }

    SN.render(`
      <div style="padding-top:16px">
        <div class="panel build-panel">
          <div class="build-panel-label">Your build</div>
          ${currentsHTML(true)}
        </div>
        <h2 class="screen-title">The crew sends a blessing</h2>
        <p class="screen-sub">${subtitle || "Word travels fast on the night sea. Choose one."}</p>
        <div class="boon-list">
          ${offer.map((b, i) => `
            <button class="boon-card panel boon-${b.crew.id}" data-boon="${i}" style="--crew-color:${b.crew.color}">
              <span class="boon-portrait boon-portrait-art">
                <img src="${crewAvatar(b.crew.id)}" alt="" />
                ${b.crew.portrait}
              </span>
              <span class="boon-item-icon" aria-hidden="true">${b.icon || C.currents[b.crew.id].glyph}</span>
              <span style="min-width:0">
                <div class="boon-crew" style="color:${b.crew.color}">
                  <span class="boon-cur-glyph">${C.currents[b.crew.id].glyph}</span>${b.crew.name} · ${b.crew.school}
                </div>
                <div class="boon-name">${b.name}</div>
                <div class="boon-desc">${b.desc}</div>
                ${boonEffectChips(b)}
              </span>
            </button>`).join("")}
        </div>
        ${run.boons.length ? `<div class="owned-boons">${run.boons.map((id) => { const b = allBoons().find((x) => x.id === id); return `<span class="owned-pill">${b ? b.name : id}</span>`; }).join("")}</div>` : ""}
      </div>`);

    $$("[data-boon]").forEach((el) => {
      el.onclick = () => {
        const b = offer[el.dataset.boon];
        el.classList.add("picked");
        applyBoon(b);
        SN.audio.boon();
        SN.toast(`${b.crew.name}'s blessing: ${b.name}`);
        setTimeout(done, 480);
      };
    });
  }

  let _allBoons = null;
  function allBoons() {
    if (!_allBoons) _allBoons = C.crew.flatMap((cr) => cr.boons.map((b) => Object.assign({ crew: cr }, b)));
    // Boons are the crew's blessings — only friends actually aboard can send
    // one. With zero crew this returns empty and offerBoons() skips itself:
    // the solo first voyage is pure recall, which IS the tutorial.
    return _allBoons.filter((b) => SN.recruited(b.crew.id));
  }

  // A 1-of-2 found-relic choice (haven crate, cursed-cargo clear). If
  // `favor` names a relic still in the pool it's guaranteed as one of the
  // two options; the pool never repeats a relic already carried this run.
  // An empty pool (everything already owned) falls back to a flat +20 pearls.
  function grantRelic(favor, done) {
    const pool = C.relics.filter((r) => !r.keepsake && !run.relics.includes(r.id));
    if (!pool.length) { addPearls(20); done(); return; }
    const forced = favor && pool.find((r) => r.id === (favor.id || favor));
    const rest = SN.shuffle(pool.filter((r) => r !== forced));
    const offer = (forced ? [forced, ...rest] : rest).slice(0, Math.min(2, pool.length));

    SN.audio.relic();
    SN.render(`
      <div style="padding-top:16px">
        <h2 class="screen-title">Treasure from the deep</h2>
        <p class="screen-sub">Worldly treasure, not to be sung of — but worth keeping. Choose one.</p>
        <div class="boon-list">
          ${offer.map((r, i) => `
            <button class="boon-card relic-card panel" data-relic-pick="${i}" style="--crew-color:#e3b75f">
              <span class="boon-portrait relic-portrait">${r.icon}</span>
              <span style="min-width:0">
                <div class="boon-crew" style="color:#e3b75f">Found relic</div>
                <div class="boon-name">${r.name}</div>
                <div class="boon-desc">${r.desc}</div>
              </span>
            </button>`).join("")}
        </div>
      </div>`);

    $$("[data-relic-pick]").forEach((el) => {
      el.onclick = () => {
        const r = offer[el.dataset.relicPick];
        el.classList.add("picked");
        run.relics.push(r.id);
        applyMods(r.mod, 1);
        SN.audio.relic();
        SN.toast(`Relic claimed: ${r.name}`);
        setTimeout(done, 480);
      };
    });
  }

  // Applies a mod object to the run. `scale` amplifies only the numeric
  // knobs that make sense to grow (damage/time bonuses, heals, per-clear
  // pearls) — flags and one-shot unlocks are applied as authored regardless
  // of scale, since "50% of a boolean" isn't meaningful.
  function applyMods(m, scale = 1) {
    if (m.heal) heal(Math.round(m.heal * scale));
    if (m.hullMax) {
      run.hullMax += m.hullMax;
      // Floor stays at 2 even when a relic (deepharpoon) trims hull — a
      // fragile ship is still a ship.
      run.hullMax = Math.max(2, run.hullMax);
      run.hull = Math.min(run.hull, run.hullMax);
      updateTop();
    }
    if (m.timeScale) run.mods.timeScale = (run.mods.timeScale || 1) * (1 + (m.timeScale - 1) * scale);
    if (m.dmgMult) run.mods.dmgMult = (run.mods.dmgMult || 1) * (1 + (m.dmgMult - 1) * scale);
    if (m.graceMs) run.mods.graceMs = (run.mods.graceMs || 0) + m.graceMs * scale;
    if (m.shieldPerEnc) run.mods.shieldPerEnc = (run.mods.shieldPerEnc || 0) + m.shieldPerEnc;
    if (m.revive) run.mods.revive = 1;
    if (m.removeDistractor) run.mods.removeDistractor = (run.mods.removeDistractor || 0) + m.removeDistractor;
    if (m.showTranslit) run.mods.showTranslit = 1;
    if (m.autoPair) run.mods.autoPair = 1;
    if (m.eclipseWard) run.mods.eclipseWard = 1;
    if (m.audioReplay) run.mods.audioReplay = 1;
    if (m.foresight) run.mods.foresight = 1;
    if (m.pearlAt5) run.mods.pearlAt5 = 1;
    if (m.dmgPerEnc) run.mods.dmgPerEnc = (run.mods.dmgPerEnc || 0) + m.dmgPerEnc * scale;
    if (m.streakFire) run.mods.streakFire = 1;
    if (m.rootResonance) run.mods.rootResonance = 1;
    if (m.chainRate) run.mods.chainRate = (run.mods.chainRate || 1) * (1 + (m.chainRate - 1) * scale);
    if (m.flawlessBonus) run.mods.flawlessBonus = 1;
    if (m.streakCarry) run.mods.streakCarry = 1;
    if (m.slowKeepsStreak) run.mods.slowKeepsStreak = 1;
    if (m.restBonus) run.mods.restBonus = (run.mods.restBonus || 0) + m.restBonus * scale;
    if (m.pearlsPerClear) run.mods.pearlsPerClear = (run.mods.pearlsPerClear || 0) + m.pearlsPerClear * scale;
    // -- relics --
    if (m.startPips) for (const [crewId, n] of Object.entries(m.startPips)) for (let i = 0; i < n; i++) addPip(crewId);
    if (m.flawlessHeal) run.mods.flawlessHeal = (run.mods.flawlessHeal || 0) + m.flawlessHeal;
    if (m.pearlMult) run.mods.pearlMult = (run.mods.pearlMult || 1) * m.pearlMult;
  }

  // Flashes the crew-colored gauge when its current crosses a tier.
  function tierUpFX(crewId) {
    $$(`.cur-chip.cur-${crewId}`).forEach((el) => {
      el.classList.remove("tier-flash"); void el.offsetWidth; el.classList.add("tier-flash");
    });
  }

  // A current crossing tier `tier` (1, 2, 3, ...) scales that crew's boons
  // a little stronger from here on, and — for tiers 1-3 — hands a small
  // named perk on top, so going deep in one crew feels like it every time.
  function tierUp(crewId, tier) {
    const cur = C.currents[crewId];
    const cr = C.crew.find((c) => c.id === crewId);
    const perk = cur.tiers[tier - 1];
    if (perk) applyMods(perk.mod, 1);
    SN.audio.tierUp();
    tierUpFX(crewId);
    SN.toast(`<b style="color:${cr.color}">${cur.name} ${toRoman(tier)}</b> — ${perk ? perk.name : "the current runs deeper"}`);
  }

  // One current pip for `crewId` — shared by boon-drafting and relics with
  // startPips (a keepsake is a head start down its crew's current).
  function addPip(crewId) {
    run.currents[crewId] = (run.currents[crewId] || 0) + 1;
    const oldTier = run.currentTier[crewId] || 0;
    const newTier = tierForPips(run.currents[crewId]);
    if (newTier > oldTier) {
      for (let t = oldTier + 1; t <= newTier; t++) tierUp(crewId, t);
      run.currentTier[crewId] = newTier;
    }
  }

  function applyBoon(b) {
    run.boons.push(b.id);
    const crewId = b.crew.id;
    addPip(crewId);
    // The boon benefits from its own tier-up if it just crossed one — a
    // small snowball that rewards committing to a crew.
    applyMods(b.mod, currentScale(crewId));
    updateTop();
  }

  // ----------------------------------------------------------------- events
  function renderEvent(ev) {
    enc = null;
    SN.render(`
      ${topHUD()}
      <div class="event-body">
        <span class="event-glyph">${ev.glyph}</span>
        <h2 class="screen-title">${ev.title}</h2>
        <p>${ev.text}</p>
        <div class="event-choices" id="ev-choices">
          ${ev.choices.map((c) => `
            <button class="btn" data-ev="${c.id}" style="text-align:left">
              <div style="font-weight:800">${c.label}</div>
              <div style="color:var(--muted);font-size:12.5px;font-weight:500;margin-top:2px">${c.sub}</div>
            </button>`).join("")}
        </div>
      </div>`);
    $$("[data-ev]").forEach((b) => b.onclick = () => { SN.audio.click(); resolveEvent(ev, b.dataset.ev); });
  }

  function eventDone(text) {
    $("#ev-choices").innerHTML = `
      <p style="color:var(--star);font-size:14px;line-height:1.6">${text}</p>
      <button class="btn btn-gold" data-on>Sail on</button>`;
    $("[data-on]").onclick = () => { SN.audio.click(); renderChart(); };
  }

  // A single untimed reading inside an event.
  function askOne(mode, card, cb) {
    card = card || SN.drawWord(new Set(run.recent.slice(-3)));
    if (!card) { cb(false, null); return; }
    resultFor(card);
    run.recent.push(card.k);
    const opts = SN.buildOptions(card, mode, 4);
    $("#ev-choices").innerHTML = `
      <div class="prompt-card panel">
        ${mode === "arabic"
          ? `<button class="prompt-audio-btn" data-replay>${C.icons.play}</button><div class="prompt-translit">tap to hear it again</div>`
          : `<div class="prompt-word-row"><div class="prompt-ar ar" lang="ar">${SN.esc(card.arabic)}</div><button class="prompt-word-audio" data-replay aria-label="Replay this word">${C.icons.sound}</button></div>`}
      </div>
      <div class="opts">
        ${opts.map((o, i) => `<button class="opt${mode === "arabic" ? " ar-opt" : ""}" ${mode === "arabic" ? 'lang="ar"' : ""} data-opt="${i}">${SN.esc(o.label)}</button>`).join("")}
      </div>`;
    wirePromptAudio(card, $("#ev-choices"));
    $$("[data-opt]").forEach((el) => {
      el.onclick = () => {
        const opt = opts[el.dataset.opt];
        $$("[data-opt]").forEach((x) => { x.disabled = true; if (opts[x.dataset.opt].ok) x.classList.add("good"); });
        if (opt.ok) {
          const res = resultFor(card); res.right++;
          SN.noteAnswer(true, 4000, 9000); SN.grade(card, 3); SN.audio.correct(run.streak + 1);
        } else {
          el.classList.add("bad");
          const res = resultFor(card); res.wrong++;
          SN.noteAnswer(false, 6000, 9000); SN.grade(card, 1); SN.audio.wrong();
        }
        setTimeout(() => cb(opt.ok, card), 800);
      };
    });
  }

  function resolveEvent(ev, choice) {
    if (ev.id === "wreck") {
      if (choice === "quick") { addPearls(8); eventDone("You haul in what floats free and leave the wreck to its sleep."); }
      else askOne("meaning", null, (ok) => {
        if (ok) { addPearls(16); eventDone("Deep in the hold, a sealed coffer — and the word that opens it comes to you easily."); }
        else {
          const dead = mistake();
          if (!dead) eventDone("The wreck groans and shifts — you pull away with a scratched-up ship and empty hands.");
        }
      });
    } else if (ev.id === "whale") {
      if (choice === "listen") askOne("arabic", null, (ok) => {
        if (ok) { heal(1); addPearls(1, true); eventDone("The whale sounds, and the wave of its leaving lifts the ship like a blessing. Something round and pale gleams on the deck."); }
        else eventDone("The great shape slides under. No harm done — some songs take more than one listening.");
      });
      else eventDone("You dip the lantern twice in respect. The whale's eye, old as the reach, holds you a moment — then it is gone.");
    } else if (ev.id === "bottle") {
      if (choice === "open") {
        const weak = Object.values(SN.state.deck)
          .filter((c) => (c.missPrior || 0) > 0 || (c.lapses || 0) > 0)
          .sort((a, b) => (b.missPrior || 0) + (b.lapses || 0) - (a.missPrior || 0) - (a.lapses || 0))[0];
        askOne("meaning", weak || null, (ok, card) => {
          if (ok) { addPearls(6); eventDone(`The word <span class="ar">${SN.esc(card.arabic)}</span> is yours again — rescued from the drift and stowed where the sea can't take it.`); }
          else eventDone("The ink swims before your eyes. You stow the bottle gently — it will find you again when you're ready.");
        });
      } else { addPearls(1, true); eventDone("You wedge the bottle among the charts. A word that waited this long can wait for harbor."); }
    } else if (ev.id === "lighthouse") {
      if (choice === "rest") {
        run.pearls = Math.max(0, run.pearls - 5);
        run.hull = run.hullMax;
        SN.audio.heal(); updateTop();
        eventDone("You bank the hearth, mend every plank by its light, and leave five pearls in the keeper's tin. Fair is fair.");
      } else { addPearls(10); eventDone("You pocket the tin's pearls and push off quickly, before the lighthouse can change its mind about the dark."); }
    }
  }

  // ------------------------------------------------------------------ haven
  function renderHaven() {
    enc = null;
    const restHeal = run.mods.restFull ? run.hullMax : 2 + (run.mods.restBonus || 0);
    SN.render(`
      ${topHUD()}
      <div style="padding-top:10px">
        <h2 class="screen-title">A Sheltered Haven</h2>
        <p class="screen-sub">A hidden cove before the Watcher's water. Lanterns from another age still burn here.</p>
        <div class="haven-cards">
          <button class="haven-card panel${run.restUsed ? " spent" : ""}" data-h="rest">
            <span class="h-icon">${C.icons.rest}</span>
            <span><div class="h-name">Rest under the cliffs</div><div class="h-desc">Repair ${run.mods.restFull ? "your ship fully" : restHeal + " health"}.</div></span>
            <span class="h-cost">free</span>
          </button>
          <button class="haven-card panel" data-h="boon" ${run.pearls < 12 ? "disabled" : ""}>
            <span class="h-icon">${C.icons.chest}</span>
            <span><div class="h-name">Trade with the cove-keeper</div><div class="h-desc">A blessing of your choosing.</div></span>
            <span class="h-cost">12 ◉</span>
          </button>
          <button class="haven-card panel${run.bossCharm ? " spent" : ""}" data-h="charm" ${run.pearls < 8 ? "disabled" : ""}>
            <span class="h-icon">${C.icons.charm}</span>
            <span><div class="h-name">Warding charm</div><div class="h-desc">Two mistakes against the Watcher break no timber.</div></span>
            <span class="h-cost">8 ◉</span>
          </button>
          <button class="haven-card panel${run.relicBought ? " spent" : ""}" data-h="crate" ${run.pearls < 15 ? "disabled" : ""}>
            <span class="h-icon">${C.icons.chest}</span>
            <span><div class="h-name">A salt-crusted crate</div><div class="h-desc">A found relic, pulled from the sea and worth keeping.</div></span>
            <span class="h-cost">15 ◉</span>
          </button>
        </div>
        <div class="sum-actions"><button class="btn btn-gold btn-big" data-h="sail">Sail for the Watcher</button></div>
      </div>`);

    $$("[data-h]").forEach((b) => {
      b.onclick = () => {
        const a = b.dataset.h;
        SN.audio.click();
        if (a === "rest" && !run.restUsed) { run.restUsed = true; heal(restHeal); renderHaven(); }
        else if (a === "boon" && run.pearls >= 12) { run.pearls -= 12; updateTop(); offerBoons(() => renderHaven(), "The cove-keeper unwraps three oilcloth bundles."); }
        else if (a === "charm" && run.pearls >= 8 && !run.bossCharm) { run.pearls -= 8; run.bossCharm = 2; SN.audio.boon(); SN.toast("The charm hums softly"); renderHaven(); }
        else if (a === "crate" && run.pearls >= 15 && !run.relicBought) { run.pearls -= 15; run.relicBought = true; updateTop(); grantRelic(null, () => renderHaven()); }
        else if (a === "sail") renderChart();
      };
    });
  }

  // ------------------------------------------------------------------- boss
  // Boss phases are cloned from C.boss.phases at run start (see startRun) —
  // when a long ayah is already fully unlocked, the final phase is swapped
  // for a verse phase, auto-named from that ayah's surah/ayah number.
  function bossIntro() {
    SN.audio.rumble();
    SN.render(`
      <div class="boss-splash">
        <span class="boss-eye">${C.boss.svg}</span>
        <span class="boss-ar ar" lang="ar">${C.boss.arabic}</span>
        <h2>${C.boss.name}</h2>
        <div class="prompt-translit">${C.boss.translit}</div>
        <p>${C.boss.intro}</p>
        <p style="color:var(--star)">${run.bossPhases[0].taunt}</p>
        <button class="btn btn-gold btn-big" data-face>Face the Watcher</button>
      </div>`);
    $("[data-face]").onclick = () => { SN.audio.click(); startEncounter({ format: run.bossPhases[0].format, ayahRef: run.bossPhases[0].ayahRef, boss: true, phase: 0 }); };
  }

  function bossSplash(phase) {
    SN.audio.rumble();
    SN.render(`
      <div class="boss-splash">
        <span class="boss-eye">${C.boss.svg}</span>
        <h2>${C.boss.name} — ${["I", "II", "III"][phase]}</h2>
        <p>${run.bossPhases[phase].taunt}</p>
        <button class="btn btn-gold btn-big" data-face>Hold the wheel</button>
      </div>`);
    $("[data-face]").onclick = () => { SN.audio.click(); startEncounter({ format: run.bossPhases[phase].format, ayahRef: run.bossPhases[phase].ayahRef, boss: true, phase }); };
  }

  // -------------------------------------------------------------- run end
  function finishRun(outcome) {
    if (enc) { enc.over = true; cancelAnimationFrame(enc.timer); }
    const m = SN.state.meta;
    const results = Object.values(run.results);
    const rescued = results.filter((r) => r.wasWeak && r.right > 0 && r.wrong === 0);
    const struggled = results.filter((r) => r.wrong > 0);
    const banked = Math.round(run.pearls * (run.mods.pearlMult || 1));

    m.pearls += banked;
    m.runs++;
    if (outcome === "victory") m.wins++;
    m.rescuedTotal += rescued.length;
    m.bestStreak = Math.max(m.bestStreak, run.bestStreak);
    m.lastRun = {
      id: Date.now(), outcome,
      rescued: rescued.length, struggled: struggled.length,
      banked, flawless: run.flawless && outcome === "victory", bestStreak: run.bestStreak,
    };
    // Words that fought back go up on the wanted board for next voyage.
    if (struggled.length) SN.postBounties(struggled.map((r) => r.card.k));

    // The logbook page: the two-way learning contract made visible. Counts
    // only words the trainer knows (the ones syncBack actually credited).
    const WS = window.WordStrength;
    const linked = !!(SN.profile() && SN.profile().linked);
    let logbook = null;
    if (WS && linked) {
      const known = results.filter((r) => WS.get(r.card.k));
      const credited = known.reduce((n, r) => n + r.right + r.wrong, 0);
      const sent = known.filter((r) => r.wrong > 0).length;
      logbook = { credited, sent, share: WS.reviewShare("game", 7) };
    }

    SN.saveAll();
    // Recruitment beats land between the voyage's end and its ledger — the
    // set-piece is the climax, the summary is the epilogue.
    const joining = SN.pendingRecruit();
    if (joining) {
      renderRecruitScene(joining, () =>
        renderSummary(outcome, { banked, rescued, struggled, results, logbook }));
    } else {
      renderSummary(outcome, { banked, rescued, struggled, results, logbook });
    }
  }

  // ------------------------------------------------- recruitment set-pieces
  // One Piece pacing (spec: specs/03-star-navigator-v2.md): each friend is
  // MET, not menu-unlocked — a short scene, then their current begins to
  // flow. Draft copy (Fable, 2026-07-17) pending owner approval; the beats
  // and gating are final.
  const RECRUIT_SCENES = {
    yusuf: {
      title: "A light in the storm",
      lines: [
        "The storm is almost over when you spot him — a big man holding onto a broken mast, keeping his lantern up out of the water like a promise.",
        "“You're sailing out here ALONE?” he says as you pull him onto the ship. “No way. That won't do.”",
        "“I'm Yusuf. I steer ships. I've been shipwrecked twice and never gave up either time — the sea knows me by now.”",
        "He ties down a rope that's been loose since you left home, and the whole ship feels steadier.",
      ],
      unlock: "Yusuf joins your crew — the RESOLVE current is now yours. His blessings protect your ship and forgive your mistakes.",
    },
    layla: {
      title: "The little boat full of stars",
      lines: [
        "She's floating out in the open sea on purpose — a tiny boat covered in star maps, held down by an old brass star-finder.",
        "“Don't touch the maps. Your hands are wet.” Then she looks up: “So YOU'RE the one calming the sea, word by word. I've been tracking you.”",
        "“I'm Layla. I make maps of the stars. I know where every one of them belongs — and lately they've started listening to you. I want to see that up close.”",
        "She steps onto your ship like it was always hers, and pins her first map above the wheel.",
      ],
      unlock: "Layla joins your crew — the PRECISION current is now yours. Her blessings help you see clearly and slow the danger down.",
    },
    idris: {
      title: "The night diver",
      lines: [
        "Something pops out of the dark water next to the ship — a grinning kid holding the anchor rope you lost two seas ago.",
        "“Yours! Found it right next to a sleeping sea monster. I didn't wake it up.” He floats there like the sea is his sofa.",
        "“I'm Idris. I dive for pearls. I go where the light can't reach, and I come back laughing. Usually.”",
        "He climbs aboard before you even ask, already fixing your ropes so the ship sails faster.",
      ],
      unlock: "Idris joins your crew — the SWIFTNESS current is now yours. His blessings reward fast answers and set your streaks on fire.",
    },
  };

  function renderRecruitScene(crewId, done) {
    const cr = C.crew.find((c) => c.id === crewId);
    const scene = RECRUIT_SCENES[crewId];
    SN.recruitCrew(crewId);
    SN.audio.boon();
    SN.render(`
      <div style="padding-top:22px;max-width:560px;margin:0 auto">
        <div class="sum-banner victory" style="--crew-color:${cr.color}">
          <span class="boon-portrait boon-portrait-art" style="width:96px;height:96px;margin:0 auto 10px">${cr.portrait}</span>
          <h2 style="color:${cr.color}">${scene.title}</h2>
          ${scene.lines.map((l) => `<p style="text-align:left;margin:10px 0">${l}</p>`).join("")}
          <p style="color:var(--gold);font-weight:700;margin-top:16px">✦ ${scene.unlock}</p>
        </div>
        <div class="sum-actions">
          <button class="btn btn-gold btn-big" data-welcome>⚓ Welcome aboard, ${cr.name}</button>
        </div>
      </div>`);
    $("[data-welcome]").onclick = () => { SN.audio.click(); done(); };
  }

  const FLARE = `
<svg class="flare" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
  <g fill="#ffe9b8">
    <circle cx="45" cy="42" r="3.4"/><circle cx="66" cy="30" r="4.2"/><circle cx="88" cy="40" r="3.4"/>
    <circle cx="98" cy="62" r="4"/><circle cx="80" cy="80" r="3.2"/><circle cx="56" cy="84" r="3.6"/><circle cx="38" cy="66" r="3.2"/>
  </g>
  <path d="M45 42 L66 30 L88 40 L98 62 L80 80 L56 84 L38 66 Z" fill="none" stroke="#e3b75f" stroke-width="1.1" opacity="0.85"/>
  <g stroke="#e3b75f" stroke-width="1" opacity="0.5">
    <path d="M66 8 L66 18"/><path d="M66 104 L66 116"/><path d="M14 62 L26 62"/><path d="M108 62 L120 62"/>
  </g>
  <animateTransform attributeName="transform" type="rotate" values="0 65 62; 3 65 62; 0 65 62" dur="6s" repeatCount="indefinite"/>
</svg>`;

  function renderSummary(outcome, { banked, rescued, struggled, results, logbook }) {
    setSeaMood(null);
    const win = outcome === "victory";
    const m = SN.metrics();

    // The warm logbook page — peak-end design for the retention engine:
    // tonight's sailing, written into the learning ledger where you can see it.
    const bountyCount = (SN.state.meta.bounties || []).length;
    const logbookHTML = logbook && (logbook.credited > 0 || logbook.share.total > 0)
      ? `
      <div class="panel logbook-panel">
        <div class="logbook-title">⚓ The night's logbook</div>
        <ul class="logbook-lines">
          <li><b>${logbook.credited}</b> recall${logbook.credited === 1 ? "" : "s"} counted toward your real learning record</li>
          ${logbook.sent ? `<li><b>${logbook.sent}</b> word${logbook.sent === 1 ? "" : "s"} sent to tomorrow's warm-up</li>` : `<li>Nothing owed to tomorrow — clean sailing</li>`}
          ${logbook.share.total >= 5 ? `<li>This week, <b>${Math.round(logbook.share.share * 100)}%</b> of your reviews happened at sea</li>` : ""}
          ${bountyCount ? `<li><b>${bountyCount}</b> marked word${bountyCount === 1 ? "" : "s"} wait on the wanted board</li>` : ""}
        </ul>
      </div>`
      : "";

    const chip = (r, cls) => `
      <a class="word-chip ${cls}" href="trainer.html?surah=${r.card.surah || 1}">
        <span class="wc-ar ar" lang="ar">${SN.esc(r.card.arabic)}</span>
        <span class="wc-en">${SN.esc(r.card.display || r.card.english)}</span>
      </a>`;

    let banner;
    if (win) {
      banner = `
        <div class="sum-banner victory">
          ${FLARE}
          <span class="sum-ar ar" lang="ar">الثريا</span>
          <h2>Constellation Charted!</h2>
          <p>${C.boss.defeat}</p>
          <p style="color:var(--gold)">A new sister of the Thurayya burns on your star map — ${Math.min(m.stars, 7)} of 7.</p>
        </div>`;
    } else if (outcome === "retreat") {
      banner = `
        <div class="sum-banner">
          <h2>Sails Struck</h2>
          <p>You slip home under borrowed starlight. The reach keeps its secrets — but you keep every word you met tonight.</p>
        </div>`;
    } else {
      const atBoss = run.at && nodeById(run.at)?.type === "boss";
      banner = `
        <div class="sum-banner">
          <h2>The Sea Prevails</h2>
          <p>${atBoss ? C.boss.victory : "The storm has your name now — but so do the stars. The ship limps home under borrowed starlight, hold full of everything you met out there."}</p>
          <p>Every word that sank you tonight is already easier than it was. That is how navigators are made.</p>
        </div>`;
    }

    const reviewSurah = struggled.length
      ? mode(struggled.map((r) => r.card.surah || 1))
      : null;

    const buildLine = [
      `<span style="color:var(--gold);font-weight:800">${currentVessel().name}</span>`,
      ...CREW_ORDER
        .map((id) => {
          const tier = run.currentTier[id] || 0;
          if (!tier) return null;
          const cr = C.crew.find((c) => c.id === id);
          return `<span style="color:${cr.color};font-weight:800">${C.currents[id].name} ${toRoman(tier)}</span>`;
        })
        .filter(Boolean),
    ];
    if (run.relics.length) {
      const relicNames = run.relics.map((id) => C.relics.find((x) => x.id === id)?.name || id);
      buildLine.push(`<span style="color:#e3b75f">${relicNames.join(", ")}</span>`);
    }

    SN.render(`
      ${banner}
      <div class="sum-stats">
        <div class="sum-stat panel"><b>${banked}</b><span>pearls</span></div>
        <div class="sum-stat panel"><b>${rescued.length}</b><span>rescued</span></div>
        <div class="sum-stat panel"><b>${results.filter((r) => r.wasNew && r.right > 0).length}</b><span>new stars</span></div>
        <div class="sum-stat panel"><b>${SN.state.meta.lastRun.bestStreak}</b><span>best streak</span></div>
      </div>
      ${logbookHTML}
      ${buildLine.length ? `<p style="text-align:center;color:var(--muted);font-size:13px;margin:-6px 0 4px">Your build: ${buildLine.join(" · ")}</p>` : ""}
      ${run.cursedCleared ? `<p style="text-align:center;color:var(--wrong);font-size:12.5px;margin:0 0 4px">⚑ Plundered the deep — cursed cargo cracked open</p>` : ""}
      ${rescued.length ? `
        <div class="word-section">
          <h3>✦ Words rescued from the deep</h3>
          <div class="word-chips">${rescued.slice(0, 12).map((r) => chip(r, "rescued")).join("")}</div>
        </div>` : ""}
      ${struggled.length ? `
        <div class="word-section">
          <h3>Words that fought back</h3>
          <div class="word-chips">${struggled.slice(0, 12).map((r) => chip(r, "struggled")).join("")}</div>
        </div>` : ""}
      <div class="sum-actions">
        <button class="btn btn-gold btn-big" data-again>⛵ Sail again</button>
        ${reviewSurah ? `<a class="btn" style="text-align:center;text-decoration:none" href="review.html?surah=${reviewSurah}">Practice tonight's hard words →</a>` : ""}
        <button class="btn btn-ghost" data-harbor>Return to harbor</button>
      </div>`);

    if (win) SN.audio.victory(); else SN.audio.defeat();
    $("[data-again]").onclick = () => { SN.audio.click(); SN.startRun(); };
    $("[data-harbor]").onclick = () => { SN.audio.click(); SN.goHarbor(); };
    enc = null;
  }

  function mode(arr) {
    const counts = {};
    let best = arr[0], bestN = 0;
    for (const x of arr) { counts[x] = (counts[x] || 0) + 1; if (counts[x] > bestN) { bestN = counts[x]; best = x; } }
    return best;
  }
})();
