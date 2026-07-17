"use strict";

/*
 * navigator-content.js — everything authored, nothing computed.
 * Crew, dialogue arcs, boons, mystery events, harbor upgrades, the star map's
 * constellations (real Arabic star names — the sky itself speaks the language
 * being learned), the guardian boss, and all procedural SVG art.
 *
 * The engine files read this via window.SN_CONTENT and interpret the small
 * `mod` objects on boons/upgrades; see navigator-run.js for the contract.
 */

window.SN_CONTENT = (() => {
  // ---------------------------------------------------------------- svg bits
  // The ship is build-aware: shipSVG(tiers) renders the same base vessel at
  // every voyage, then layers on crew-colored fittings as that crew's current
  // deepens (tiers 1-3 each) — Resolve reinforces hull & bow, Precision
  // dresses the mast in astrolabe brass, Swiftness arms the bow and brightens
  // the wake. By the boss, two ships rarely look alike.
  // Additive relic markers, one per fit id — same id as the relic itself.
  // Rendered outside the hull's vessel transform so a narrow/squat hull
  // never drags them off their spot.
  const RELIC_FIT_SVG = {
    beads: `<g opacity="0.9"><path d="M22 92 Q28 98 22 104" stroke="#7fb4d9" stroke-width="1.1" fill="none"/><circle cx="23" cy="93" r="1.3" fill="#7fb4d9"/><circle cx="26" cy="97" r="1.3" fill="#7fb4d9"/><circle cx="24" cy="101" r="1.3" fill="#7fb4d9"/><circle cx="20" cy="103" r="1.3" fill="#7fb4d9"/></g>`,
    atlaspage: `<g transform="translate(66 74) rotate(-8)" opacity="0.9"><rect x="0" y="0" width="12" height="9" rx="1" fill="#241d44" stroke="#b48be8" stroke-width="0.6"/><path d="M2 3 L10 3 M2 5.5 L8 5.5" stroke="#d4b8f5" stroke-width="0.6"/></g>`,
    moonpearl: `<circle cx="141" cy="82" r="5.5" fill="#f4ecdf" opacity="0.18"/><circle cx="141" cy="82" r="3.2" fill="#f4ecdf"><animate attributeName="opacity" values="1;.5;1" dur="2.6s" repeatCount="indefinite"/></circle>`,
    navlantern: `<circle cx="42" cy="80" r="10" fill="url(#sn-lantern)" opacity="0.85"/><circle cx="42" cy="80" r="3.6" fill="#e3b75f"><animate attributeName="opacity" values="1;.55;1" dur="2.6s" begin="0.4s" repeatCount="indefinite"/></circle>`,
    deepharpoon: `<g fill="#5fd6c0" opacity="0.95"><path d="M148 74 L160 68 L152 72Z"/><path d="M147 78 L159 76 L150 80Z"/></g>`,
    whaleblessing: `<g stroke="#9fe8ff" stroke-width="0.7" opacity="0.4" fill="none"><path d="M96 44 Q102 50 96 58 M100 46 Q108 52 100 62"/></g>`,
    ibnyunus: `<circle cx="78" cy="18" r="8" fill="none" stroke="#d4b8f5" stroke-width="0.8" opacity="0.6"><animateTransform attributeName="transform" type="rotate" values="360 78 18;0 78 18" dur="6s" repeatCount="indefinite"/></circle>`,
    bottledglow: `<path d="M10 108 Q46 104 80 108 T146 106" stroke="#9ff2e4" stroke-width="1.2" fill="none" opacity="0.4"><animate attributeName="opacity" values=".4;.08;.4" dur="2s" repeatCount="indefinite"/></path>`,
    keeperstin: `<g transform="translate(58 86)" opacity="0.9"><rect x="0" y="0" width="10" height="7" rx="1" fill="#3b2f52" stroke="#e3b75f" stroke-width="0.6"/><path d="M0 3 H10" stroke="#e3b75f" stroke-width="0.6"/></g>`,
    readerslate: `<g transform="translate(44 90) rotate(-4)" opacity="0.9"><rect x="0" y="0" width="9" height="11" rx="1" fill="#191531" stroke="#cfe0ff" stroke-width="0.6"/><path d="M4.5 3 L6 6 L4.5 9 L3 6Z" fill="#cfe0ff"/></g>`,
  };

  // shipSVG(tiers, relicFits, vesselId) — the ship is build- AND vessel-aware.
  // `relicFits` is an array of fit ids (see RELIC_FIT_SVG); `vesselId`
  // (miftah/sabaq/layl/rimah) swaps a handful of shared-geometry params —
  // pennant color, hull squat/narrow, wake, and small additive silhouette
  // touches — without moving the base hull, mast, or sail.
  function shipSVG(tiers, relicFits, vesselId) {
    const t = tiers || {};
    const r = Math.min(3, t.yusuf || 0); // Resolve — Yusuf, blue
    const p = Math.min(3, t.layla || 0); // Precision — Layla, violet
    const s = Math.min(3, t.idris || 0); // Swiftness — Idris, teal
    const fits = relicFits || [];
    const vessel = vesselId || "miftah";

    const hullFit = [
      r >= 1 ? `<path d="M20 90 Q52 102 82 101 Q112 102 138 88" stroke="#7fb4d9" stroke-width="1.4" opacity="0.4" fill="none"/>` : "",
      r >= 2 ? `<g stroke="#7fb4d9" stroke-width="1.3" opacity="0.6"><path d="M40 88v8M70 96v9M100 94v8M128 84v8"/></g>` : "",
      r >= 3 ? `<g><path d="M12 80 Q4 84 3 92 Q10 89 17 85Z" fill="#7fb4d9" opacity="0.9"/><circle cx="8" cy="87" r="3.2" fill="#a8d0ec" opacity="0.65"><animate attributeName="opacity" values=".65;.22;.65" dur="2.3s" repeatCount="indefinite"/></circle></g>` : "",
      s >= 1 ? `<path d="M146 76 L158 71 L145 84Z" fill="#5fd6c0" opacity="0.92"/>` : "",
      s >= 3 ? `<g fill="#9ff2e4"><circle cx="160" cy="70" r="1.6"><animate attributeName="opacity" values="1;.15;1" dur="1s" repeatCount="indefinite"/></circle><circle cx="163" cy="76" r="1.1"><animate attributeName="opacity" values=".2;1;.2" dur="1.25s" repeatCount="indefinite"/></circle></g>` : "",
    ].join("");

    const mastFit = [
      p >= 1 ? `<circle cx="78" cy="18" r="5.2" fill="none" stroke="#b48be8" stroke-width="1.2" opacity="0.85"/><path d="M78 13.3v9.4M73.3 18h9.4" stroke="#b48be8" stroke-width="0.8" opacity="0.7"/>` : "",
      p >= 2 ? `<g fill="#d4b8f5"><circle cx="139" cy="42" r="1.4"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></circle></g>` : "",
      p >= 3 ? `<g stroke="#b48be8" stroke-width="1.1" stroke-linecap="round" opacity="0.8"><path d="M78 18 L86 14"><animateTransform attributeName="transform" type="rotate" values="0 78 18;360 78 18" dur="8s" repeatCount="indefinite"/></path></g><g fill="#e8dcff" opacity="0.8"><circle cx="66" cy="6" r="1"><animate attributeName="opacity" values=".8;.2;.8" dur="2s" repeatCount="indefinite"/></circle><circle cx="88" cy="4" r="0.9"><animate attributeName="opacity" values=".3;.9;.3" dur="2.3s" repeatCount="indefinite"/></circle><circle cx="77" cy="2" r="0.8"><animate attributeName="opacity" values=".6;.15;.6" dur="2.6s" repeatCount="indefinite"/></circle></g>` : "",
    ].join("");

    const wakeFit = (s >= 2 || vessel === "sabaq")
      ? `<path d="M14 104 Q48 100 82 104 T148 103" stroke="#3fd6c0" stroke-width="1.5" fill="none" opacity="0.45"><animate attributeName="opacity" values=".45;.1;.45" dur="2.4s" repeatCount="indefinite"/></path>`
      : "";
    const bottledglowWake = fits.includes("bottledglow") ? RELIC_FIT_SVG.bottledglow : "";

    // Sabaq: hull squats lower/longer. Rimah: narrow hull. Layl: unchanged
    // geometry, taller-reading mast via the pennant/chart-line dressing below.
    const pennantColor = vessel === "layl" ? "#b48be8" : vessel === "rimah" ? "#7fb4d9" : "#5fd6c0";
    const hullXform = vessel === "sabaq" ? "translate(79 90) scale(1.04 0.93) translate(-79 -90)"
      : vessel === "rimah" ? "translate(79 90) scale(0.92 1) translate(-79 -90)"
      : "";
    const rimahLances = vessel === "rimah"
      ? `<g stroke="#7fb4d9" stroke-width="1.3" stroke-linecap="round" opacity="0.9"><path d="M8 76 L-6 70"/><path d="M10 82 L-5 80"/></g>`
      : "";
    const laylAftSail = vessel === "layl"
      ? `<path d="M80 20 Q100 32 90 54 Q83 38 80 20Z" fill="url(#sn-sail2)" opacity="0.85"/>`
      : "";
    const laylChartLines = vessel === "layl"
      ? `<g stroke="#b48be8" stroke-width="0.5" opacity="0.4" fill="none"><path d="M86 30 L100 42 L92 60"/></g><g fill="#e8dcff" opacity="0.6"><circle cx="86" cy="30" r="0.9"/><circle cx="100" cy="42" r="0.9"/><circle cx="92" cy="60" r="0.9"/></g>`
      : "";
    const relicFitSvg = fits.map((f) => RELIC_FIT_SVG[f] || "").join("");

    return `
<svg viewBox="0 0 168 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="sn-sail" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#f8efd9"/><stop offset="0.55" stop-color="#e8d4a4"/><stop offset="1" stop-color="#b89968"/>
    </linearGradient>
    <linearGradient id="sn-sail2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#dcc79a"/><stop offset="1" stop-color="#a88a5c"/>
    </linearGradient>
    <linearGradient id="sn-hull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3163"/><stop offset="1" stop-color="#191531"/>
    </linearGradient>
    <radialGradient id="sn-lantern" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe9b8"/><stop offset="1" stop-color="#e3b75f" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- wake -->
  <path d="M6 94 Q40 89 72 94 T152 92" stroke="#3fd6c0" stroke-width="1.6" fill="none" opacity="0.5">
    <animate attributeName="opacity" values=".5;.15;.5" dur="3.2s" repeatCount="indefinite"/>
  </path>
  <path d="M18 100 Q54 96 90 100 T150 99" stroke="#3fd6c0" stroke-width="1" fill="none" opacity="0.3">
    <animate attributeName="opacity" values=".3;.08;.3" dur="4s" repeatCount="indefinite"/>
  </path>
  ${wakeFit}
  ${bottledglowWake}

  <!-- hull -->
  <g${hullXform ? ` transform="${hullXform}"` : ""}>
    <path d="M12 80 Q46 100 82 98 Q118 99 146 76 L140 90 Q100 108 80 106 Q54 108 20 90 Z" fill="url(#sn-hull)"/>
    <path d="M18 82 Q48 94 82 93 Q114 94 138 78 L134 84 Q100 98 82 98 Q52 99 24 86 Z" fill="#4a4180" opacity="0.55"/>
    <path d="M20 90 Q52 102 82 101 Q112 102 138 88" stroke="#e3b75f" stroke-width="1.1" opacity="0.4" fill="none"/>
    ${hullFit}
  </g>

  <!-- mast + yard -->
  <path d="M78 10 L78 78" stroke="#4a3b28" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M76 12 L142 40" stroke="#5c4a32" stroke-width="2.6" stroke-linecap="round"/>
  ${laylAftSail}

  <!-- lateen sail -->
  <path d="M77 14 L142 41 Q116 78 84 84 Q70 52 77 14 Z" fill="url(#sn-sail)"/>
  <path d="M77 14 Q92 46 84 84" stroke="#8a7248" stroke-width="0.8" opacity="0.5" fill="none"/>
  <path d="M77 14 Q108 34 130 45" stroke="#8a7248" stroke-width="0.7" opacity="0.4" fill="none"/>
  <!-- embroidered star-stitch on the sail -->
  <g stroke="#c69a45" stroke-width="0.7" opacity="0.55" fill="none">
    <path d="M100 40 L112 52 L108 66"/>
  </g>
  <g fill="#fff6df" opacity="0.85">
    <circle cx="100" cy="40" r="1.3"/><circle cx="112" cy="52" r="1.1"/><circle cx="108" cy="66" r="1.1"/>
  </g>
  ${laylChartLines}

  <!-- small counter-sail, furled aft -->
  <path d="M75 20 Q52 38 70 66 Q78 46 75 20 Z" fill="url(#sn-sail2)" opacity="0.9"/>

  <!-- masthead pennant -->
  <path d="M78 10 Q92 12 100 16 Q90 18 78 17 Z" fill="${pennantColor}">
    <animateTransform attributeName="transform" type="rotate" values="0 78 13;6 78 13;0 78 13" dur="2.4s" repeatCount="indefinite"/>
  </path>
  ${mastFit}
  ${rimahLances}
  ${relicFitSvg}

  <!-- stern lantern -->
  <circle cx="30" cy="84" r="12" fill="url(#sn-lantern)"/>
  <circle cx="30" cy="84" r="4.4" fill="#e3b75f">
    <animate attributeName="opacity" values="1;.55;1" dur="2.6s" repeatCount="indefinite"/>
  </circle>
  <path d="M30 76 L30 92 M23 84 L37 84" stroke="#7a6134" stroke-width="1" opacity="0.6"/>
</svg>`;
  }

  const creatures = {
    squall: `
<svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="sq-body" cx="0.4" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#525cae"/><stop offset="0.6" stop-color="#333a70"/><stop offset="1" stop-color="#20244a"/>
    </radialGradient>
  </defs>
  <g stroke="#8f9ce0" stroke-width="1" opacity="0.4" fill="none">
    <path d="M120 24 Q134 30 132 44 Q130 54 118 54">
      <animateTransform attributeName="transform" type="rotate" values="0 122 40;360 122 40" dur="9s" repeatCount="indefinite"/>
    </path>
  </g>
  <g>
    <ellipse cx="86" cy="54" rx="52" ry="27" fill="url(#sq-body)"/>
    <ellipse cx="54" cy="64" rx="32" ry="19" fill="#2a2f5c"/>
    <ellipse cx="116" cy="64" rx="34" ry="18" fill="#272c56"/>
    <ellipse cx="80" cy="36" rx="32" ry="17" fill="#565fac" opacity="0.85"/>
    <path d="M40 60 Q30 52 34 40" stroke="#454d8e" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/>
    <path d="M130 58 Q142 50 138 36" stroke="#20244a" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.6"/>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 4; 0 0" dur="3.4s" repeatCount="indefinite"/>
  </g>
  <circle cx="64" cy="54" r="16" fill="#171a38" opacity="0.55"/>
  <circle cx="104" cy="52" r="16" fill="#171a38" opacity="0.55"/>
  <circle cx="64" cy="53" r="5.4" fill="#ffe9b8">
    <animate attributeName="opacity" values="1;.4;1" dur="2.4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="104" cy="51" r="5.4" fill="#ffe9b8">
    <animate attributeName="opacity" values="1;.4;1" dur="2.4s" begin="0.2s" repeatCount="indefinite"/>
  </circle>
  <path d="M58 72 Q84 82 110 72" stroke="#171a38" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M84 74 L70 96 L80 96 L64 122 L94 90 L82 90 L96 74 Z" fill="#e3b75f">
    <animate attributeName="opacity" values="1;.2;1;1;.5;1" dur="2.2s" repeatCount="indefinite"/>
  </path>
</svg>`,
    fogwyrm: `
<svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="fw-body" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#3a4178" stop-opacity="0.25"/><stop offset="0.55" stop-color="#454e8c" stop-opacity="0.75"/><stop offset="1" stop-color="#5862a8"/>
    </linearGradient>
  </defs>
  <g opacity="0.35" stroke="#9fe8ff" stroke-width="1" fill="none">
    <path d="M16 100 Q24 92 18 82"><animate attributeName="opacity" values=".5;.1;.5" dur="3s" repeatCount="indefinite"/></path>
    <path d="M26 108 Q34 100 28 92"><animate attributeName="opacity" values=".3;.6;.3" dur="2.6s" repeatCount="indefinite"/></path>
  </g>
  <g>
    <path d="M20 96 Q18 80 34 76 Q28 62 48 58 Q46 44 68 44 Q74 30 96 34 Q116 30 130 44 Q142 54 132 64 Q142 72 128 78 Q136 88 116 86 Q118 100 96 96 Q90 108 68 100 Q56 108 44 98 Q28 106 20 96Z" fill="url(#fw-body)"/>
    <path d="M60 46 L66 34 L70 46Z" fill="#454e8c"/>
    <path d="M86 36 L92 22 L98 36Z" fill="#4d5690"/>
    <path d="M112 40 L118 28 L124 42Z" fill="#565fa0"/>
    <animateTransform attributeName="transform" type="translate" values="0 0; 4 2; 0 0" dur="4s" repeatCount="indefinite"/>
  </g>
  <path d="M108 42 Q126 38 136 48 Q140 58 128 62 Q132 50 118 48 Q112 46 108 42Z" fill="#5862a8"/>
  <circle cx="120" cy="50" r="4.6" fill="#9fe8ff">
    <animate attributeName="opacity" values="1;.4;1" dur="1.8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="132" cy="54" r="4" fill="#9fe8ff">
    <animate attributeName="opacity" values="1;.4;1" dur="1.8s" begin="0.3s" repeatCount="indefinite"/>
  </circle>
  <path d="M118 62 Q128 66 136 62" stroke="#232748" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
</svg>`,
    starsnare: `
<svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="ss-bell" cx="0.5" cy="0.15" r="0.9">
      <stop offset="0" stop-color="#544a92"/><stop offset="1" stop-color="#2e2856"/>
    </radialGradient>
    <radialGradient id="ss-glow" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#8f7fe0" stop-opacity="0.35"/><stop offset="1" stop-color="#8f7fe0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="80" cy="52" r="56" fill="url(#ss-glow)"/>
  <g>
    <path d="M38 60 Q40 20 80 8 Q120 20 122 60 Q112 68 102 64 Q92 70 80 66 Q68 70 58 64 Q48 68 38 60Z" fill="url(#ss-bell)"/>
    <path d="M38 60 Q80 74 122 60 Q112 68 102 64 Q92 70 80 66 Q68 70 58 64 Q48 68 38 60Z" fill="#221d44" opacity="0.6"/>
    <g stroke="#b9a5ff" stroke-width="0.9" opacity="0.7" fill="none">
      <path d="M52 52 L80 24 L108 52"/><path d="M62 56 L80 38 L98 56"/><path d="M52 52 L108 52"/>
    </g>
    <g fill="#e8dcff">
      <circle cx="80" cy="24" r="3"/><circle cx="52" cy="52" r="2.6"/><circle cx="108" cy="52" r="2.6"/>
      <circle cx="80" cy="38" r="2.2"/><circle cx="62" cy="56" r="2"/><circle cx="98" cy="56" r="2"/>
    </g>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 5; 0 0" dur="4.4s" repeatCount="indefinite"/>
  </g>
  <g stroke-linecap="round" fill="none" opacity="0.85">
    <path d="M56 66 Q50 92 58 118" stroke="url(#ss-bell)" stroke-width="5"><animate attributeName="d" values="M56 66 Q50 92 58 118;M56 66 Q62 92 52 118;M56 66 Q50 92 58 118" dur="3.6s" repeatCount="indefinite"/></path>
    <path d="M80 68 Q80 98 74 122" stroke="url(#ss-bell)" stroke-width="6"><animate attributeName="d" values="M80 68 Q80 98 74 122;M80 68 Q74 98 86 122;M80 68 Q80 98 74 122" dur="4.1s" repeatCount="indefinite"/></path>
    <path d="M104 66 Q112 92 100 116" stroke="url(#ss-bell)" stroke-width="5"><animate attributeName="d" values="M104 66 Q112 92 100 116;M104 66 Q96 92 108 116;M104 66 Q112 92 100 116" dur="3.3s" repeatCount="indefinite"/></path>
  </g>
  <g fill="#e8dcff">
    <circle cx="58" cy="118" r="1.6"><animate attributeName="opacity" values=".9;.2;.9" dur="2.2s" repeatCount="indefinite"/></circle>
    <circle cx="74" cy="122" r="1.8"><animate attributeName="opacity" values=".3;.9;.3" dur="2.6s" repeatCount="indefinite"/></circle>
    <circle cx="100" cy="116" r="1.5"><animate attributeName="opacity" values=".9;.3;.9" dur="1.9s" repeatCount="indefinite"/></circle>
  </g>
</svg>`,
    leviathan: `
<svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="lv-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c3564"/><stop offset="1" stop-color="#161a38"/>
    </linearGradient>
  </defs>
  <g stroke="#3fd6c0" stroke-width="1.4" opacity="0.4" fill="none">
    <path d="M4 106 Q40 100 74 106"><animate attributeName="opacity" values=".4;.1;.4" dur="2.6s" repeatCount="indefinite"/></path>
    <path d="M2 116 Q36 111 66 116"><animate attributeName="opacity" values=".25;.05;.25" dur="3.2s" repeatCount="indefinite"/></path>
  </g>
  <g>
    <path d="M2 98 Q34 48 90 54 Q128 58 140 90 Q120 100 96 92 Q100 104 78 104 Q60 112 40 100 Q18 108 2 98Z" fill="url(#lv-body)"/>
    <path d="M92 58 Q108 34 132 30 Q126 50 116 62 Q104 56 92 58Z" fill="#161a38"/>
    <path d="M2 98 Q34 60 90 64 Q120 67 136 90" fill="none" stroke="#3a4380" stroke-width="2" opacity="0.6"/>
    <g fill="#20264a" opacity="0.7">
      <circle cx="50" cy="66" r="2"/><circle cx="60" cy="60" r="1.6"/><circle cx="70" cy="58" r="1.8"/>
      <circle cx="42" cy="74" r="1.6"/><circle cx="80" cy="60" r="1.4"/>
    </g>
    <animateTransform attributeName="transform" type="translate" values="0 0; -5 2; 0 0" dur="3.8s" repeatCount="indefinite"/>
  </g>
  <path d="M18 82 Q14 68 24 58 Q34 66 30 80 Q24 86 18 82Z" fill="#2c3564"/>
  <circle cx="24" cy="70" r="4.6" fill="#ffd98a">
    <animate attributeName="opacity" values="1;.35;1" dur="2s" repeatCount="indefinite"/>
  </circle>
  <path d="M16 76 Q22 82 30 78" stroke="#0f1230" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M22 58 Q20 44 26 34 M22 58 Q28 46 32 38" stroke="#cfe0ff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.5">
    <animate attributeName="opacity" values=".5;.1;.5" dur="2.4s" repeatCount="indefinite"/>
  </path>
  <path d="M4 100 Q60 94 130 100" stroke="#3fd6c0" stroke-width="1.6" fill="none" opacity="0.45">
    <animate attributeName="opacity" values=".45;.12;.45" dur="2.8s" repeatCount="indefinite"/>
  </path>
</svg>`,
    algol: `
<svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="al-iris" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#f4a1b0"/><stop offset="0.55" stop-color="#c73f5e"/><stop offset="1" stop-color="#5b1f38"/>
    </radialGradient>
    <linearGradient id="al-sclera" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#241d44"/><stop offset="1" stop-color="#100c26"/>
    </linearGradient>
  </defs>
  <g stroke="#5b4a8f" stroke-width="1.6" fill="#241d44" opacity="0.85">
    <path d="M80 65 L84 30 L88 65Z"/><path d="M80 65 L76 30 L72 65Z"/>
    <path d="M80 65 L112 42 L92 68Z"/><path d="M80 65 L48 42 L68 68Z"/>
    <path d="M80 65 L120 65 L88 70Z"/><path d="M80 65 L40 65 L72 70Z"/>
    <path d="M80 65 L112 88 L92 66Z"/><path d="M80 65 L48 88 L68 66Z"/>
    <path d="M80 65 L84 100 L88 70Z"/><path d="M80 65 L76 100 L72 70Z"/>
    <animateTransform attributeName="transform" type="rotate" values="0 80 65; 8 80 65; 0 80 65" dur="7s" repeatCount="indefinite"/>
  </g>
  <path d="M22 65 Q80 16 138 65 Q80 114 22 65Z" fill="url(#al-sclera)" stroke="#5b4a8f" stroke-width="1.6"/>
  <path d="M18 65 L26 61 L26 69Z" fill="#171233"/>
  <path d="M142 65 L134 61 L134 69Z" fill="#171233"/>
  <g stroke="#7a3450" stroke-width="0.7" opacity="0.45" fill="none">
    <path d="M32 58 Q50 50 60 58"/><path d="M128 58 Q110 50 100 58"/>
  </g>
  <circle cx="80" cy="65" r="32" fill="none" stroke="#5b4a8f" stroke-width="2"/>
  <circle cx="80" cy="65" r="24" fill="url(#al-iris)">
    <animate attributeName="r" values="24;20;24" dur="4.2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="80" cy="65" r="11" fill="#20101c">
    <animate attributeName="r" values="11;15;11" dur="4.2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="75" cy="58" r="4.4" fill="#ffe9b8" opacity="0.9">
    <animate attributeName="opacity" values=".9;.4;.9" dur="4.2s" repeatCount="indefinite"/>
  </circle>
  <path d="M22 65 Q80 30 138 65" stroke="#3a2f5c" stroke-width="1.2" fill="none" opacity="0.6"/>
  <path d="M22 65 Q80 100 138 65" stroke="#3a2f5c" stroke-width="1.2" fill="none" opacity="0.6"/>
</svg>`,
  };

  const portraits = {
    yusuf: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="pt-yface" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#dba576"/><stop offset="1" stop-color="#b47c4d"/>
    </radialGradient>
    <linearGradient id="pt-yturban" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5a86ae"/><stop offset="1" stop-color="#33587e"/>
    </linearGradient>
  </defs>
  <path d="M18 98 Q50 72 82 98 Z" fill="#243456"/>
  <path d="M28 92 Q50 82 72 92 L70 98 Q50 90 30 98Z" fill="#1c2947"/>
  <circle cx="50" cy="48" r="21" fill="url(#pt-yface)"/>
  <path d="M27 45 Q28 20 50 18 Q72 20 73 45 Q73 32 50 29 Q27 32 27 45Z" fill="url(#pt-yturban)"/>
  <path d="M27 43 Q29 24 44 20 L42 28 Q31 32 27 43Z" fill="#79a4c8" opacity="0.8"/>
  <path d="M30 30 Q50 24 70 30" stroke="#274058" stroke-width="1.6" fill="none" opacity="0.6"/>
  <path d="M40 62 Q50 68 60 62 Q62 70 50 72 Q38 70 40 62Z" fill="#eef0ea"/>
  <path d="M39 60 Q50 78 45 82 M61 60 Q50 78 55 82" stroke="#cfd2c6" stroke-width="1.6" fill="none" opacity="0.7"/>
  <circle cx="42" cy="47" r="2.4" fill="#241a06"/>
  <circle cx="58" cy="47" r="2.4" fill="#241a06"/>
  <path d="M38 42 Q42 39 46 42" stroke="#7a6248" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M54 42 Q58 39 62 42" stroke="#7a6248" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M43 57 Q50 61 57 57" stroke="#8a5a34" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="86" r="3.6" fill="none" stroke="#e3b75f" stroke-width="1.4"/>
  <path d="M50 82.5 L50 89.5 M46.5 86 L53.5 86" stroke="#e3b75f" stroke-width="1"/>
</svg>`,
    layla: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="pt-lface" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#e8b483"/><stop offset="1" stop-color="#c98d5c"/>
    </radialGradient>
    <linearGradient id="pt-lhood" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#9370d4"/><stop offset="1" stop-color="#5a3f96"/>
    </linearGradient>
  </defs>
  <path d="M20 98 Q50 74 80 98 Z" fill="#4a3670"/>
  <path d="M26 52 Q21 16 50 14 Q79 16 74 52 Q79 68 70 76 L63 60 Q69 32 50 30 Q31 32 37 60 L30 76 Q21 68 26 52Z" fill="url(#pt-lhood)"/>
  <path d="M28 48 Q25 22 42 18" stroke="#c3aef0" stroke-width="1.3" fill="none" opacity="0.55"/>
  <circle cx="50" cy="47" r="18" fill="url(#pt-lface)"/>
  <circle cx="42" cy="46" r="2.4" fill="#241a06"/>
  <circle cx="58" cy="46" r="2.4" fill="#241a06"/>
  <path d="M37 43 Q42 40 47 43" stroke="#8a6a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M53 43 Q58 40 63 43" stroke="#8a6a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M43 57 Q50 61 57 57" stroke="#8a4b2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <g fill="#ffe9b8">
    <circle cx="30" cy="28" r="1.4"/><circle cx="70" cy="24" r="1.2"/>
    <circle cx="64" cy="18" r="1"/><circle cx="36" cy="20" r="1"/>
  </g>
  <circle cx="66" cy="86" r="6.5" fill="none" stroke="#e3b75f" stroke-width="1.6"/>
  <path d="M66 79.5 L66 92.5 M59.5 86 L72.5 86" stroke="#e3b75f" stroke-width="1.2"/>
</svg>`,
    idris: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="pt-iface" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#d99e6a"/><stop offset="1" stop-color="#b97a4b"/>
    </radialGradient>
  </defs>
  <path d="M22 98 Q50 76 78 98 Z" fill="#164941"/>
  <path d="M30 44 Q27 21 50 19 Q73 21 70 44 Q66 27 50 26 Q34 27 30 44Z" fill="#1c1730"/>
  <path d="M31 30 Q50 22 69 30 Q66 24 50 22 Q34 24 31 30Z" fill="#241d3d"/>
  <circle cx="50" cy="49" r="19" fill="url(#pt-iface)"/>
  <path d="M30 39 L70 39" stroke="#3fd6c0" stroke-width="4.4" stroke-linecap="round"/>
  <circle cx="30" cy="39" r="2.6" fill="#2fa892"/><circle cx="70" cy="39" r="2.6" fill="#2fa892"/>
  <circle cx="42" cy="48" r="2.8" fill="#241a06"/>
  <circle cx="58" cy="48" r="2.8" fill="#241a06"/>
  <circle cx="43" cy="47" r="0.8" fill="#fff" opacity="0.8"/><circle cx="59" cy="47" r="0.8" fill="#fff" opacity="0.8"/>
  <path d="M39 43 Q42 41 45 43" stroke="#7a5a3a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <path d="M55 43 Q58 41 61 43" stroke="#7a5a3a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <path d="M41 58 Q50 65 59 58" stroke="#7a3b1a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M46 59.5 L54 59.5" stroke="#fff" stroke-width="1.4" opacity="0.85"/>
  <g fill="#f4ecdf" stroke="#e3b75f" stroke-width="0.8">
    <circle cx="41" cy="83" r="2.6"/><circle cx="50" cy="86" r="3"/><circle cx="59" cy="83" r="2.6"/>
  </g>
</svg>`,
    you: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="pt-uhood" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#232c56"/><stop offset="1" stop-color="#0a0e26"/>
    </radialGradient>
  </defs>
  <path d="M22 98 Q50 76 78 98 Z" fill="#1f2c4a"/>
  <path d="M27 52 Q23 14 50 12 Q77 14 73 52 Q77 70 66 78 Q70 50 68 38 Q60 20 50 20 Q40 20 32 38 Q30 50 34 78 Q23 70 27 52Z" fill="url(#pt-uhood)"/>
  <path d="M27 52 Q23 14 50 12 Q77 14 73 52" stroke="#3fd6c0" stroke-width="1.2" fill="none" opacity="0.55"/>
  <circle cx="50" cy="46" r="16" fill="#0b1030"/>
  <g fill="#ffe9b8">
    <circle cx="50" cy="39" r="2.2"/><circle cx="41" cy="48" r="1.8"/><circle cx="59" cy="48" r="1.8"/>
    <circle cx="50" cy="55" r="1.5"/>
  </g>
  <g stroke="#e3b75f" stroke-width="0.9" opacity="0.85" fill="none">
    <path d="M50 39 L41 48 L50 55 L59 48 Z"/>
  </g>
  <circle cx="50" cy="46" r="17.5" fill="none" stroke="#e3b75f" stroke-width="0.6" opacity="0.4"/>
</svg>`,
  };

  const harborScene = `
<svg viewBox="0 0 375 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="hb-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0f2e"/><stop offset="0.62" stop-color="#131b42"/><stop offset="0.63" stop-color="#0a1226"/><stop offset="1" stop-color="#070b18"/>
    </linearGradient>
  </defs>
  <rect width="375" height="250" fill="url(#hb-sky)"/>
  <g fill="#cfe0ff">
    <circle cx="36" cy="30" r="1.4"><animate attributeName="opacity" values="1;.3;1" dur="3.1s" repeatCount="indefinite"/></circle>
    <circle cx="88" cy="18" r="1.1"><animate attributeName="opacity" values=".4;1;.4" dur="2.4s" repeatCount="indefinite"/></circle>
    <circle cx="140" cy="40" r="1.3"><animate attributeName="opacity" values="1;.4;1" dur="3.8s" repeatCount="indefinite"/></circle>
    <circle cx="205" cy="22" r="1.5"><animate attributeName="opacity" values=".5;1;.5" dur="2.9s" repeatCount="indefinite"/></circle>
    <circle cx="258" cy="44" r="1.1"><animate attributeName="opacity" values="1;.35;1" dur="3.4s" repeatCount="indefinite"/></circle>
    <circle cx="312" cy="26" r="1.4"><animate attributeName="opacity" values=".45;1;.45" dur="2.6s" repeatCount="indefinite"/></circle>
    <circle cx="345" cy="52" r="1.1"><animate attributeName="opacity" values="1;.4;1" dur="3s" repeatCount="indefinite"/></circle>
    <circle cx="180" cy="55" r="1"><animate attributeName="opacity" values=".5;1;.5" dur="4s" repeatCount="indefinite"/></circle>
  </g>
  <g fill="#ffe9b8" opacity="0.95">
    <circle cx="296" cy="34" r="1.6"/><circle cx="304" cy="28" r="1.3"/><circle cx="310" cy="36" r="1.2"/>
    <circle cx="300" cy="42" r="1.1"/><circle cx="290" cy="41" r="1"/><circle cx="306" cy="45" r="0.9"/><circle cx="298" cy="24" r="1"/>
  </g>
  <path d="M290 41 L296 34 L304 28 M296 34 L300 42 M304 28 L310 36" stroke="#e3b75f" stroke-width="0.6" opacity="0.6" fill="none"/>
  <path d="M0 157 H375" stroke="#2a3a6e" stroke-width="0.8" opacity="0.8"/>
  <g opacity="0.85">
    <path d="M30 196 Q70 206 118 198 L112 214 Q66 220 38 210 Z" fill="#181330"/>
    <path d="M72 132 L72 196" stroke="#3a2d1e" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M74 134 Q108 148 78 192 Z" fill="#d8cba9" opacity="0.9"/>
    <circle cx="110" cy="190" r="3.6" fill="#e3b75f"><animate attributeName="opacity" values="1;.5;1" dur="2.8s" repeatCount="indefinite"/></circle>
  </g>
  <g>
    <rect x="196" y="176" width="179" height="10" rx="2" fill="#241c33"/>
    <rect x="204" y="186" width="7" height="30" fill="#1d1629"/>
    <rect x="252" y="186" width="7" height="34" fill="#1d1629"/>
    <rect x="304" y="186" width="7" height="38" fill="#1d1629"/>
    <rect x="352" y="186" width="7" height="42" fill="#1d1629"/>
    <path d="M228 176 L228 148" stroke="#1d1629" stroke-width="4"/>
    <circle cx="228" cy="144" r="5" fill="#e3b75f"><animate attributeName="opacity" values="1;.55;1" dur="3.1s" repeatCount="indefinite"/></circle>
    <circle cx="228" cy="144" r="9" fill="#e3b75f" opacity="0.2"><animate attributeName="r" values="9;13;9" dur="3.1s" repeatCount="indefinite"/></circle>
    <path d="M340 176 L340 140" stroke="#1d1629" stroke-width="4"/>
    <circle cx="340" cy="136" r="5" fill="#e3b75f"><animate attributeName="opacity" values=".6;1;.6" dur="2.5s" repeatCount="indefinite"/></circle>
  </g>
  <g stroke="#3fd6c0" stroke-width="1.2" fill="none">
    <path d="M8 226 Q60 220 120 226 T260 224"><animate attributeName="opacity" values=".4;.1;.4" dur="3.6s" repeatCount="indefinite"/></path>
    <path d="M40 238 Q110 232 190 238 T352 236"><animate attributeName="opacity" values=".25;.06;.25" dur="4.4s" repeatCount="indefinite"/></path>
  </g>
  <g fill="#e3b75f" opacity="0.5">
    <circle cx="150" cy="222" r="1.2"><animate attributeName="opacity" values=".5;.1;.5" dur="2.2s" repeatCount="indefinite"/></circle>
    <circle cx="168" cy="230" r="1"><animate attributeName="opacity" values=".2;.6;.2" dur="2.8s" repeatCount="indefinite"/></circle>
  </g>
</svg>`;

  const astrolabe = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="50" cy="54" r="38" fill="none" stroke="#e3b75f" stroke-width="2"/>
  <circle cx="50" cy="54" r="30" fill="none" stroke="#e3b75f" stroke-width="1" opacity="0.6"/>
  <circle cx="50" cy="54" r="20" fill="none" stroke="#e3b75f" stroke-width="0.8" opacity="0.4"/>
  <path d="M50 16 L50 92 M12 54 L88 54" stroke="#e3b75f" stroke-width="0.8" opacity="0.5"/>
  <g stroke="#e3b75f" stroke-width="1.6">
    <path d="M50 54 L74 34" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" values="0 50 54; 360 50 54" dur="24s" repeatCount="indefinite"/>
    </path>
  </g>
  <circle cx="50" cy="54" r="3.4" fill="#e3b75f"/>
  <path d="M50 6 A6 6 0 1 0 50.01 6" fill="none" stroke="#e3b75f" stroke-width="2"/>
  <circle cx="74" cy="34" r="1.8" fill="#ffe9b8">
    <animateTransform attributeName="transform" type="rotate" values="0 50 54; 360 50 54" dur="24s" repeatCount="indefinite"/>
  </circle>
</svg>`;

  const icons = {
    heart: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21c-4.8-3.6-9-6.8-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.2-4.2 7.4-9 11z"/></svg>`,
    pearl: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="#f4ecdf"/><circle cx="9.5" cy="9.5" r="2.6" fill="#fff" opacity="0.9"/><circle cx="12" cy="12" r="8" fill="none" stroke="#e3b75f" stroke-width="1.4"/></svg>`,
    anchor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="5" r="2.4"/><path d="M12 7.4V20M12 20c-4 0-7-2.6-7.5-6M12 20c4 0 7-2.6 7.5-6M3 12l1.5 2M21 12l-1.5 2"/></svg>`,
    sound: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>`,
    soundOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16 9l6 6M22 9l-6 6"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.5 6.8L12 16.9 6.5 20.5 8 13.7 3 9.3l6.4-.7z"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>`,
    hammer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M14 5l5 5-2 2-5-5zM12 7 4 15l3 3 8-8"/><path d="M13 4l3-1 4 4-1 3"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`,
    rest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 3c-4 3.5-6 6.6-6 10a6 6 0 0 0 12 0c0-3.4-2-6.5-6-10z"/><path d="M12 21a3.4 3.4 0 0 1-3.4-3.4c0-1.9 1.2-3.7 3.4-5.6 2.2 1.9 3.4 3.7 3.4 5.6A3.4 3.4 0 0 1 12 21z" fill="currentColor" stroke="none" opacity="0.55"/></svg>`,
    chest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="3" y="8" width="18" height="11" rx="2"/><path d="M3 12h18M12 10.5v4"/><path d="M5 8a7 7 0 0 1 14 0"/></svg>`,
    charm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 3l7 4v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V7z"/><circle cx="12" cy="11" r="2.6" fill="currentColor" stroke="none" opacity="0.6"/></svg>`,
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5c2.6-1.6 5.4-1.6 8 0v13c-2.6-1.6-5.4-1.6-8 0v-13z"/><path d="M20 5.5c-2.6-1.6-5.4-1.6-8 0v13c2.6-1.6 5.4-1.6 8 0v-13z"/></svg>`,
    // Current glyphs — the three build axes, one per crew member.
    resolve: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c4.4 5.2 7.4 9.3 7.4 13A7.4 7.4 0 1 1 4.6 15C4.6 11.3 7.6 7.2 12 2z"/></svg>`,
    precision: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>`,
    swiftness: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4.5 14h5.7l-1 8L18 10h-5.7z"/></svg>`,
    hull: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14c4.6 2.8 11.4 2.8 16 0l-2.1 4.2c-3.7 2-8.1 2-11.8 0z" fill="currentColor" opacity=".32"/><path d="M5 13 7 6h10l2 7"/><path d="M8 10h8M12 6v10"/></svg>`,
    sailPatch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 20V4"/><path d="M8 5c5 1.1 8.1 4.9 7.4 11.4C12.6 15 10 14.2 8 15z" fill="currentColor" opacity=".24"/><path d="M10 9h4M9.5 13h5M12 7v8"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 19 6v5.2c0 4.4-2.8 7.6-7 9.8-4.2-2.2-7-5.4-7-9.8V6z" fill="currentColor" opacity=".2"/><path d="M12 7v10M8.5 11.5h7"/></svg>`,
    revive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12a7 7 0 0 1 12.2-4.7L19 9"/><path d="M19 5v4h-4"/><path d="M19 12a7 7 0 0 1-12.2 4.7L5 15"/><path d="M5 19v-4h4"/><path d="M12 8l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4L7 11.7l3.4-.5z" fill="currentColor" opacity=".28" stroke="none"/></svg>`,
    wheel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity=".35"/><path d="M12 3v18M3 12h18M5.7 5.7l12.6 12.6M18.3 5.7 5.7 18.3"/></svg>`,
    net: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5c5 1.5 11 1.5 16 0v10c-3 3.5-13 3.5-16 0z"/><path d="M4 9c5 1.5 11 1.5 16 0M4 13c5 1.5 11 1.5 16 0M8 6v11M12 6.5v12M16 6v11"/></svg>`,
    hourglass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/><path d="M10 8h4M10 17h4" stroke-width="1.2"/></svg>`,
    dimStar: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l1.9 5.1 5.4.3-4.2 3.4 1.4 5.2-4.5-2.9L7.5 17l1.4-5.2-4.2-3.4 5.4-.3z"/><path d="M4 20 20 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    twinStars: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 3l1.1 3 3.2.2-2.5 2 .8 3.1L8 9.6l-2.6 1.7.8-3.1-2.5-2 3.2-.2zM16 10l1.3 3.4 3.7.2-2.9 2.3.9 3.6-3-2-3 2 .9-3.6-2.9-2.3 3.7-.2z"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12s3.3-5.5 9-5.5S21 12 21 12s-3.3 5.5-9 5.5S3 12 3 12z"/><circle cx="12" cy="12" r="2.8" fill="currentColor" opacity=".35"/></svg>`,
    eclipse: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="11" cy="12" r="7" opacity=".35"/><path d="M15.5 5.5a7 7 0 1 0 0 13 7 7 0 0 1 0-13z"/><circle cx="18" cy="6" r="1.2"/></svg>`,
    fire: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2c.4 3.2-2.4 4.3-1.1 7 1.8-1.2 2.9-2.8 3.1-4.7 2.5 2.4 4 5 4 8.2A7 7 0 1 1 5 12.5c0-2.5 1.4-4.8 4.1-6.9-.2 2.1.6 3.6 2.2 4.6C10.8 6.9 12.2 4.6 13 2z"/></svg>`,
    root: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v7"/><path d="M12 11c-4 0-6.5 2.5-7.5 6M12 11c4 0 6.5 2.5 7.5 6"/><path d="M12 11v9M8.5 15l-3 4M15.5 15l3 4"/><circle cx="12" cy="4" r="2" fill="currentColor" opacity=".3"/></svg>`,
    current: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 8c3-3 6-3 9 0s6 3 9 0M3 14c3-3 6-3 9 0s6 3 9 0M5 19c2-1.5 4-1.5 6 0"/></svg>`,
    harpoon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 18 6"/><path d="M14 4h6v6"/><path d="M17 7h4M17 7v-4"/><path d="M7 17l-3-3"/></svg>`,
    breath: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 14c3-2.5 6-2.5 9 0 2.4 2 4.7 2 7 0"/><path d="M5 9c2.4-2 4.8-2 7.2 0 1.8 1.5 3.6 1.5 5.8 0"/><circle cx="7" cy="18" r="1" fill="currentColor"/><circle cx="13" cy="18" r="1" fill="currentColor"/></svg>`,
    lanternFit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5h6M12 2v3M8 5l1 15h6l1-15"/><path d="M8 20h8"/><circle cx="12" cy="12.5" r="3.2" fill="currentColor" opacity=".32"/></svg>`,
    satchel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l1 11H5z" fill="currentColor" opacity=".18"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M8 13h8M12 11v4"/></svg>`,
    hearth: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20h14M6 20V9l6-4 6 4v11"/><path d="M12 18c-2.1-1.1-3-2.5-3-4 0-1.4.8-2.6 2.4-3.8-.1 1.6.7 2.6 1.8 3.2.3-1.4 1-2.6 2-3.4 1 1.4 1.6 2.8 1.6 4.1 0 1.6-1.1 2.9-3 3.9z" fill="currentColor" opacity=".3"/></svg>`,
  };

  const emblems = [
    { id: "astrolabe", name: "Astrolabe", svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="24" cy="26" r="16"/><circle cx="24" cy="26" r="10" opacity="0.6"/><path d="M24 10v32M8 26h32" opacity="0.5"/><path d="M24 26l9-8" stroke-linecap="round"/><circle cx="24" cy="8" r="3"/></svg>` },
    { id: "crescent", name: "Crescent", svg: `<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M30 6a18 18 0 1 0 12 30A20 20 0 0 1 30 6z"/><circle cx="34" cy="14" r="2.4"/></svg>` },
    { id: "pearl", name: "Pearl", svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 30q18-14 36 0-8 12-18 12T6 30z"/><circle cx="24" cy="28" r="7" fill="currentColor" opacity="0.5"/><circle cx="21" cy="25" r="2" fill="currentColor"/></svg>` },
    { id: "lantern", name: "Lantern", svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 12h12M24 4v4M16 12l2 22h12l2-22"/><path d="M18 40h12"/><circle cx="24" cy="24" r="4.5" fill="currentColor" opacity="0.55"/></svg>` },
    { id: "compass", name: "Compass rose", svg: `<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M24 2l4 18-4 18-4-18z"/><path d="M2 24l18 4 18-4-18-4z" opacity="0.55"/><circle cx="24" cy="24" r="3.4"/></svg>` },
    { id: "sail", name: "Sail", svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M22 6v30M22 8q16 6 2 26M8 38q16 6 32 0l-3 5H11z"/><path d="M22 12Q12 22 20 34" opacity="0.6"/></svg>` },
  ];

  // -------------------------------------------------------------------- crew
  // Each crew member is a school of boons and a story. Beats unlock on meta
  // milestones (runs, wins, thurayya stars, words mastered, words rescued) and
  // are read top to bottom, one per harbor visit, Hades-style.
  const crew = [
    {
      id: "yusuf",
      name: "Yusuf",
      title: "the Steady Hand",
      color: "#7fb4d9",
      school: "Sails & Mercy",
      portrait: portraits.yusuf,
      boons: [
        { id: "y1", name: "Patched Sails", icon: icons.sailPatch, desc: "The crew patches the sails — restore 2 health.", mod: { heal: 2 }, repeat: true },
        { id: "y2", name: "Sturdy Ship", icon: icons.hull, desc: "+1 max health, and heal 1.", mod: { hullMax: 1, heal: 1 }, repeat: true },
        { id: "y3", name: "Forgiving Tide", icon: icons.shield, desc: "The first slip in every encounter breaks no timber.", mod: { shieldPerEnc: 1 } },
        { id: "y4", name: "Second Wind", icon: icons.revive, desc: "Once per voyage, a sinking ship gets back up with 1 health.", mod: { revive: 1 } },
        { id: "y5", name: "Steady Hands", icon: icons.wheel, desc: "The wheel holds true — every reading gives 15% more time.", mod: { timeScale: 1.15 }, repeat: true },
        { id: "y6", name: "Harbor's Memory", icon: icons.hearth, desc: "Rests and healing give 2 extra health.", mod: { restBonus: 2 } },
        { id: "y7", name: "Treasure Nets", icon: icons.net, desc: "+3 pearls after every encounter you clear.", mod: { pearlsPerClear: 3 } },
        { id: "y8", name: "Patient Answer", icon: icons.breath, desc: "A slow, sure answer no longer cools your streak.", mod: { slowKeepsStreak: 1 } },
      ],
      arc: [
        { req: {}, lines: [
          { s: "yusuf", t: "So you're the new navigator. Welcome aboard the Miftah. I've held her wheel for forty years — she answers to a steady hand and a stocked memory, nothing else." },
          { s: "yusuf", t: "Out on the night sea, charts blur and lanterns drown. But a word you truly know? That stays lit. That's what we steer by." },
          { s: "yusuf", t: "Rest tonight. Tomorrow we sail the Thurayya Reach — and the reach will test what you remember." },
        ]},
        { req: { runs: 1 }, lines: [
          { s: "yusuf", t: "You came back. Good. The first voyage teaches the same lesson to everyone: the sea is patient, and it asks again." },
          { s: "you", t: "It asked me some words more than once." },
          { s: "yusuf", t: "Ha! It always does. The sea forgets nothing gently, navigator. Neither should you." },
        ]},
        { req: { runs: 2 }, lines: [
          { s: "yusuf", t: "My old teacher, Captain Maryam — Allah have mercy on her — never once looked at a paper chart in a storm." },
          { s: "yusuf", t: "She said paper drinks the rain, but a memorized star drinks nothing. I thought it was poetry. Then our charts washed overboard near the fog banks." },
          { s: "yusuf", t: "We came home by what she carried in her heart. That was the night I began to learn things properly." },
        ]},
        { req: { wins: 1 }, lines: [
          { s: "yusuf", t: "You faced the Watcher and came home with the sky in your satchel. Even Maryam would have nodded at that. Once. Briefly." },
          { s: "you", t: "It blinked at me. I blinked back." },
          { s: "yusuf", t: "That's the whole trick of it, truth be told. Storms and watchers all blink first — if your answer comes steady." },
        ]},
        { req: { runs: 4 }, lines: [
          { s: "yusuf", t: "You handle the wheel less like a passenger now. I've watched you take the hard words head-on instead of tacking around them." },
          { s: "yusuf", t: "There's an old saying on the docks: the wave you dodge tonight waits for you tomorrow, twice as tall. Meet them small, navigator." },
        ]},
        { req: { mastered: 10 }, lines: [
          { s: "yusuf", t: "Ten words ride with you now like old crewmates — you don't even reach for them, they're just there when the water turns." },
          { s: "yusuf", t: "That's the difference between knowing a rope and trusting it. You only learn it by pulling in weather." },
        ]},
        { req: { wins: 2 }, lines: [
          { s: "yusuf", t: "Twice past the Watcher. You know, I feared the reach for years. Maryam knew it, too — she never once shamed me for it." },
          { s: "yusuf", t: "Instead she'd hand me the wheel in calm water, then in chop, then in rain. Courage is mostly practice wearing a brave coat." },
        ]},
        { req: { runs: 6 }, lines: [
          { s: "yusuf", t: "Six voyages. The Miftah likes you — hear how the hull hums? She only does that for navigators who come back after a sinking." },
          { s: "you", t: "How do you know she hums for that?" },
          { s: "yusuf", t: "Because she hummed for me, boy's age ago, the morning after my worst night at sea. Ships respect return more than triumph." },
        ]},
        { req: { stars: 3 }, lines: [
          { s: "yusuf", t: "Three stars of the Thurayya charted. Maryam used to say the Seven Sisters watch over sailors who do their remembering honestly." },
          { s: "yusuf", t: "She'd point up and say: they rise together, always together. Words are the same — learn them in families and they'll never leave you alone in the dark." },
        ]},
        { req: { mastered: 25 }, lines: [
          { s: "yusuf", t: "A quarter-hundred words mastered. Do you feel it yet? How the fog-beasts seem slower, how the storms seem... smaller?" },
          { s: "yusuf", t: "The sea didn't shrink, navigator. You grew. That's the only way the sea ever gets smaller." },
        ]},
        { req: { runs: 8 }, lines: [
          { s: "yusuf", t: "I'll tell you something I've told no one aboard. The night we lost the charts, it was my watch. My knot. My fault." },
          { s: "yusuf", t: "Maryam never said a word of blame. She just taught me the stars, one each night, until the sky was my chart and no knot could undo it." },
          { s: "you", t: "So the wreck made you a helmsman." },
          { s: "yusuf", t: "The wreck made me a student. The years made me a helmsman. Mind the order of that." },
        ]},
        { req: { wins: 4 }, lines: [
          { s: "yusuf", t: "Four times the Watcher has dimmed before you. I've started letting my tea go cold just to watch you work the reach." },
          { s: "yusuf", t: "Maryam had a rank for sailors like you. She called them 'keepers' — the ones the sea trusts to carry its names." },
        ]},
        { req: { mastered: 50 }, lines: [
          { s: "yusuf", t: "Fifty words held fast. You carry more sky than some captains I've sailed under, and I mean captains with grey in their beards." },
          { s: "yusuf", t: "Keep them polished. Even the oldest rope wants tar; even the surest word wants saying again." },
        ]},
        { req: { stars: 7 }, lines: [
          { s: "yusuf", t: "The Thurayya, whole above your masthead. All seven sisters. I have seen three navigators chart it complete in my whole life." },
          { s: "yusuf", t: "One was Maryam. One was a quiet pearl-trader from Suhar. And now — well. Now I've seen three." },
        ]},
        { req: { runs: 12, wins: 5 }, lines: [
          { s: "yusuf", t: "There are reaches past this one, navigator. Darker water, brighter stars, words I never learned to hold." },
          { s: "yusuf", t: "When the day comes that you sail for them, take the Miftah. She was never really mine — a ship belongs to whoever keeps her stars lit." },
          { s: "you", t: "And you?" },
          { s: "yusuf", t: "I'll be on this dock with hot tea and a long list of words to hear about. Go on. The sky is patient, but not that patient." },
        ]},
        { req: { runs: 14, wins: 6 }, lines: [
          { s: "yusuf", t: "Still sailing, still returning. That's the whole religion of the sea, navigator: go out humble, come home grateful, remember everything in between." },
        ]},
      ],
      reactive: {
        victory: [
          "Back with the boss-star dimmed and the hull still breathing. Good sailing.",
          "The reach lost, you won, and the tea's still warm. A fine night's work.",
        ],
        defeat: [
          "So the sea took this round. It takes most rounds — that's how it teaches. The words you missed are already waiting to be won back.",
          "A sinking is just the sea underlining what to study. No shame aboard this dock.",
        ],
        flawless: ["Not one timber scratched? Maryam would have checked the hull twice and then smiled."],
        rescued: ["I saw the words you pulled back from the deep tonight. Salvage like that is worth more than pearls."],
      },
    },
    {
      id: "layla",
      name: "Layla",
      title: "the Star-Reader",
      color: "#b48be8",
      school: "Stars & Time",
      portrait: portraits.layla,
      boons: [
        { id: "l1", name: "Star Chart", icon: icons.dimStar, desc: "One false answer is dimmed on every reading.", mod: { removeDistractor: 1 }, repeat: true },
        { id: "l2", name: "Slow Current", icon: icons.hourglass, desc: "Time leans with you — 25% more time to answer.", mod: { timeScale: 1.25 } },
        { id: "l3", name: "Astrolabe Whisper", icon: astrolabe, desc: "The astrolabe murmurs each word's sound beneath it.", mod: { showTranslit: 1 } },
        { id: "l4", name: "Twin Stars", icon: icons.twinStars, desc: "In star-snare webs, one pair links itself at the start.", mod: { autoPair: 1 } },
        { id: "l5", name: "Polaris Anchor", icon: icons.anchor, desc: "The glass holds still for two breaths before each timer runs.", mod: { graceMs: 1800 } },
        { id: "l6", name: "Moonlit Echo", icon: icons.sound, desc: "Echoes of the deep repeat themselves once, unasked.", mod: { audioReplay: 1 } },
        { id: "l7", name: "Farsight", icon: icons.eye, desc: "Mystery waters reveal their nature on the chart.", mod: { foresight: 1 } },
        { id: "l8", name: "Eclipse Ward", icon: icons.eclipse, desc: "The Watcher's eclipse cannot darken your readings.", mod: { eclipseWard: 1 } },
      ],
      arc: [
        { req: {}, lines: [
          { s: "layla", t: "Oh — the new navigator! Perfect timing. Quick question: when you look up, do you see lights, or do you see names?" },
          { s: "you", t: "...Lights, mostly?" },
          { s: "layla", t: "Lights, mostly! Wonderful. That means I get to watch the moment it changes for you. It's my favorite thing in the world, and it's coming." },
        ]},
        { req: { runs: 1 }, lines: [
          { s: "layla", t: "First voyage done! Now look up — see the brightest one there, in the Eagle? Sailors everywhere call it Altair." },
          { s: "layla", t: "That's النسر الطائر — an-nasr aṭ-ṭā'ir, 'the flying eagle.' The whole world says an Arabic sentence every night and doesn't know it. We know it." },
        ]},
        { req: { runs: 2 }, lines: [
          { s: "layla", t: "I'm building an atlas — every star that still wears its Arabic name. Deneb? ذنب, dhanab: 'tail.' It's the tail of the Hen, الدجاجة." },
          { s: "layla", t: "And Fomalhaut, way down south — فم الحوت, fam al-ḥūt: 'the mouth of the whale.' The sky is a dictionary, navigator. It's just shelved very high up." },
        ]},
        { req: { wins: 1 }, lines: [
          { s: "layla", t: "You beat the Watcher! Do you know what you actually beat? Algol — رأس الغول, ra's al-ghūl, 'the head of the ghoul.' Old astronomers saw it blink and shivered." },
          { s: "layla", t: "It's two stars, really, one passing before the other, over and over. Even the scariest thing in the sky is just... taking turns. I find that very comforting." },
        ]},
        { req: { runs: 4 }, lines: [
          { s: "layla", t: "Here's one for your collection: Aldebaran, the red eye of the Bull. الدبران, ad-dabarān — 'the follower.'" },
          { s: "layla", t: "Follower of what? Of the Thurayya! He's crossed the whole sky behind the Seven Sisters since before anyone wrote anything down. The most patient suitor in creation." },
        ]},
        { req: { mastered: 10 }, lines: [
          { s: "layla", t: "Ten words mastered! Can I tell you a secret about how memory works? It's not a shelf. It's an orbit." },
          { s: "layla", t: "Things you circle back to stay close, like moons. Things you never revisit drift off like comets. Your ten words are moons now. Keep them circling." },
        ]},
        { req: { wins: 2 }, lines: [
          { s: "layla", t: "Vega tonight, straight up — النسر الواقع, an-nasr al-wāqiʿ, 'the swooping eagle.' Altair flies, Vega dives. Two eagles over one sea." },
          { s: "layla", t: "The old star-readers saw the pair of them as a story in motion. Nothing in the sky is alone, navigator. Nothing in a language is, either." },
        ]},
        { req: { stars: 3 }, lines: [
          { s: "layla", t: "Three of the Seven Sisters lit on your map! الثريا, ath-thurayyā — 'the chandelier,' some say. The little rich one, say others." },
          { s: "layla", t: "Sailors used to test their eyesight by counting them. Now you're testing your memory by earning them. I think that's a better use of the Sisters, honestly." },
        ]},
        { req: { runs: 6 }, lines: [
          { s: "layla", t: "You know Rigel, the Foot of the Giant? رِجل الجبّار, rijl al-jabbār. And Betelgeuse — يد الجوزاء, the hand. A whole figure, drawn limb by limb, in Arabic." },
          { s: "layla", t: "That's how my atlas works too. One name a night. One word a wave. Nobody memorizes a giant, navigator — they memorize a hand, then a foot, and one day the giant is theirs." },
        ]},
        { req: { mastered: 25 }, lines: [
          { s: "layla", t: "Twenty-five! Do you notice how the distractors don't fool you anymore? Words that used to look like twins now look like strangers wearing hats." },
          { s: "layla", t: "That's what mastery actually feels like. Not louder knowledge — quieter confusion." },
        ]},
        { req: { runs: 8 }, lines: [
          { s: "layla", t: "Can I confess something? I started the atlas for my grandmother. She knew the stars in Arabic and I... only knew them in books." },
          { s: "layla", t: "She'd point and say the names and I'd nod along, understanding nothing. I swore I'd learn them all properly and read them back to her sky." },
          { s: "you", t: "How far along are you?" },
          { s: "layla", t: "Tonight? One navigator closer. Every word you rescue out there goes in the margins, you know. You're in the atlas already." },
        ]},
        { req: { wins: 4 }, lines: [
          { s: "layla", t: "Fourth victory! I've decided your ship needs a star. Everything that returns deserves one — that's the rule of my atlas." },
          { s: "layla", t: "I'm surveying candidates. It must be steady, a little gold, and visible from the harbor. No, you may not see the shortlist." },
        ]},
        { req: { mastered: 50 }, lines: [
          { s: "layla", t: "Fifty mastered words. Navigator, do you realize you now hold more of the old sea-vocabulary than most of the charts in the harbor archive?" },
          { s: "layla", t: "When you look up now — tell me honestly. Lights, or names?" },
          { s: "you", t: "Names. It's all names now." },
          { s: "layla", t: "There it is. THERE it is! Oh, I never get tired of that moment. Welcome to the readable sky." },
        ]},
        { req: { stars: 7 }, lines: [
          { s: "layla", t: "The whole Thurayya! All seven, charted by memory alone. My grandmother had a saying for nights like this: the sky keeps faith with those who keep its names." },
          { s: "layla", t: "I wrote your constellation into the atlas tonight. Page one. Yes — I moved things. Don't argue with an archivist." },
        ]},
        { req: { runs: 12, wins: 5 }, lines: [
          { s: "layla", t: "It's chosen. Your star. The steady gold one that stands over the harbor mouth at midnight — the one you steer home by, whether you noticed or not." },
          { s: "layla", t: "In the atlas it now reads: 'The Navigator's Lantern. Named for the one who learned the sky word by word, and came home every time.'" },
          { s: "you", t: "Layla... thank you." },
          { s: "layla", t: "Thank the sky. I just take notes." },
        ]},
        { req: { runs: 14, wins: 6 }, lines: [
          { s: "layla", t: "New reaches mean new skies, and new skies mean blank atlas pages. I've sharpened every pencil I own. Whenever you're ready, navigator." },
        ]},
      ],
      reactive: {
        victory: ["The Watcher blinked, you didn't. I'm noting the exact minute in the atlas.", "Another victory for the readable sky! The margins are filling up nicely."],
        defeat: ["The sky's still there, navigator. It'll still be there tomorrow, and so will you — that's the entire arrangement.", "Even eclipses end. Especially eclipses, actually. Come look at the atlas while you catch your breath."],
        flawless: ["A flawless crossing?! Hold still, I'm sketching you for the atlas. Chin up. Perfect."],
        rescued: ["I heard you pulled drowned words back up into the light tonight. That's proper star-reader work, that is."],
      },
    },
    {
      id: "idris",
      name: "Idris",
      title: "the Pearl-Diver",
      color: "#5fd6c0",
      school: "Pearls & Momentum",
      portrait: portraits.idris,
      boons: [
        { id: "i1", name: "Streak of Fire", icon: icons.fire, desc: "Every third answer in a streak strikes half again as hard.", mod: { streakFire: 1 } },
        { id: "i2", name: "Root Resonance", icon: icons.root, desc: "Two kindred-root words in a row spark a burst of bonus damage.", mod: { rootResonance: 1 } },
        { id: "i3", name: "Diver's Greed", icon: icons.pearl, desc: "At streak 5 and beyond, every correct answer shakes loose a pearl.", mod: { pearlAt5: 1 } },
        { id: "i4", name: "Chasing Current", icon: icons.current, desc: "Leviathan chases: the chain fills a quarter faster.", mod: { chainRate: 1.25 } },
        { id: "i5", name: "Perfect Form", icon: icons.star, desc: "Clear an encounter with no mistakes: +5 pearls and heal 1 health.", mod: { flawlessBonus: 1 } },
        { id: "i6", name: "Rising Tide", icon: icons.current, desc: "Each encounter cleared: +4% harpoon damage this voyage.", mod: { dmgPerEnc: 0.04 }, repeat: true },
        { id: "i7", name: "First Pearl", icon: icons.harpoon, desc: "+12% harpoon damage, straight away.", mod: { dmgMult: 1.12 }, repeat: true },
        { id: "i8", name: "Held Breath", icon: icons.breath, desc: "Your streak survives between encounters.", mod: { streakCarry: 1 } },
      ],
      arc: [
        { req: {}, lines: [
          { s: "idris", t: "You're the navigator?! I'm Idris. Pearl-diver. Well — training to be. Well — my mother says I'm training to train. But I found this one myself!" },
          { s: "idris", t: "See how it shines? A pearl starts as one annoying little grain that the oyster goes over again and again and again until it GLOWS." },
          { s: "idris", t: "Yusuf says words work the same. I don't fully believe him yet. Prove it out there, okay?" },
        ]},
        { req: { runs: 2 }, lines: [
          { s: "idris", t: "Two voyages! Okay okay okay — real question. When you're out there and it's ALL dark water under you... aren't you scared?" },
          { s: "you", t: "Sometimes. I go anyway." },
          { s: "idris", t: "Huh. 'Scared anyway.' That's allowed?! Nobody told me that was allowed." },
        ]},
        { req: { runs: 3 }, lines: [
          { s: "idris", t: "I watched your last voyage from the seawall with Yusuf's long-glass. When you get a streak going, the whole ship glows. Like a lantern-chain on Eid!" },
          { s: "idris", t: "That's momentum. Diving's the same — the first pull down is terror, the second is work, and the third one is FLYING." },
        ]},
        { req: { wins: 1 }, lines: [
          { s: "idris", t: "You BEAT the WATCHER. I told everyone on the dock. Twice. Some of them twice each." },
          { s: "idris", t: "My grandfather dove the deep beds his whole life, and he had a rule: the sea gives its best pearls to whoever comes back the most times. Not the strongest. The most-returning-est." },
          { s: "idris", t: "That's a word now. I've decided." },
        ]},
        { req: { runs: 5 }, lines: [
          { s: "idris", t: "Okay, don't laugh. I still can't do the night dive. All the older divers have done it. The water at night is just SO much darker than the daytime water, which — I know. I know how water works." },
          { s: "you", t: "You'll get there. Scared anyway, remember?" },
          { s: "idris", t: "Scared anyway. I'm practicing. In the shallows. At dusk. It counts!" },
        ]},
        { req: { mastered: 10 }, lines: [
          { s: "idris", t: "Ten words you can't forget even if you try?! That's it — that's literally pearls. Grain, coat, coat, coat, GLOW. Yusuf was right." },
          { s: "idris", t: "Don't tell him I said that. He gets a face when he's right. You know the face." },
        ]},
        { req: { runs: 7 }, lines: [
          { s: "idris", t: "I did a sunset dive today. PAST the shallows. There was a moment where I couldn't see the bottom OR the top and my chest went all drum-drum-drum—" },
          { s: "idris", t: "—and then I remembered how you keep answering when the storm's already howling. So I just... kept swimming. Found the bed. Two pearls!" },
          { s: "idris", t: "Here. The small one's for the ship. For luck. The big one's for my mother, obviously." },
        ]},
        { req: { wins: 3 }, lines: [
          { s: "idris", t: "Three Watcher-wins! You know what I like best about how you sail? You don't dodge the words you hate. You hunt them." },
          { s: "idris", t: "Grandfather called that 'diving the wreck first.' Everyone wants the easy beds. The wreck is where the pearls are." },
        ]},
        { req: { mastered: 25 }, lines: [
          { s: "idris", t: "Twenty-five! At this rate your memory's going to need its own harbor. A whole pearl-fleet of words!" },
          { s: "idris", t: "I started my own list, you know. Sea words first: بحر — sea. حوت — whale, like Layla's star! Small list. GROWING list." },
        ]},
        { req: { runs: 9 }, lines: [
          { s: "idris", t: "Tonight's the night. The night dive. For real this time. The moon's good, the water's warm, and I've been scared anyway for WEEKS." },
          { s: "you", t: "Go on then. The dark's just water that hasn't been learned yet." },
          { s: "idris", t: "...I'm stealing that. That's mine now. Watch the seawall for my lantern!" },
        ]},
        { req: { runs: 10 }, lines: [
          { s: "idris", t: "I DID IT. Navigator, I did the night dive! And you won't believe it — down there, in the full dark, the seabed GLOWS. Little blue-green lights everywhere!" },
          { s: "idris", t: "All that time I was afraid of the dark, and the dark was busy being the most beautiful thing I've ever seen." },
          { s: "idris", t: "AND. Look at this one. Have you ever seen a pearl this color? Moon-silver! Grandfather never pulled a moon-pearl in fifty years!" },
        ]},
        { req: { wins: 4 }, lines: [
          { s: "idris", t: "The other divers asked me to teach them the night route. ME. Teaching the big ones! I made them all say 'scared anyway' before we went down. New rule." },
          { s: "idris", t: "You started that, you know. It's spreading through the whole harbor like a good tide." },
        ]},
        { req: { mastered: 50 }, lines: [
          { s: "idris", t: "FIFTY?! Okay that settles the argument I was having with myself. Memory isn't a bag, it's a muscle. Bags fill up. You just keep getting stronger." },
          { s: "idris", t: "My list hit thirty sea-words yesterday. Race you to a hundred, navigator. I'm small but I'm STUBBORN." },
        ]},
        { req: { stars: 7 }, lines: [
          { s: "idris", t: "The whole Thurayya on your map! Layla's been floating around the archive all evening. Even Yusuf whistled — Yusuf! Whistled!" },
          { s: "idris", t: "I took the moon-pearl up the lighthouse and held it against the Sisters. It matches. It really matches. Some things you just have to check personally." },
        ]},
        { req: { runs: 12, wins: 5 }, lines: [
          { s: "idris", t: "So here's my plan. You sail to the far reaches. I finish growing up — nearly done, mostly — and master the deep beds. Then one day you need a diver on the crew and I'm THERE." },
          { s: "you", t: "Deal. First pearl of the new reach is yours to find." },
          { s: "idris", t: "Deal! DEAL. Witnessed by the moon-pearl and everything. You can't take it back now, navigator. This is the realest thing I've ever signed." },
        ]},
        { req: { runs: 14, wins: 6 }, lines: [
          { s: "idris", t: "I checked the lantern on your mast this morning. Cleaned it myself. A deal-crew keeps the deal-ship shining — that's just seamanship." },
        ]},
      ],
      reactive: {
        victory: ["YOU WON AGAIN! I did the dock-dance. There were witnesses. No regrets.", "The Watcher blinked FIRST! Called it. Absolutely called it."],
        defeat: ["Hey — grandfather sank eleven times before his first deep pearl. ELEVEN. You're ahead of schedule.", "The sea's just making you stubborn-er. It did it to me too. Back out there when you're ready!"],
        flawless: ["FLAWLESS?! Not one scratch?! I'm telling the entire harbor. This is not a drill."],
        rescued: ["You brought the lost words back UP! That's diving, that is. That's real diving."],
      },
    },
  ];

  // --------------------------------------------------------- mystery events
  const events = [
    {
      id: "wreck",
      title: "The Drifting Wreck",
      text: "A broken hull drifts across your bow, lanterns long dark, cargo nets still heavy. The water around it is quiet. Perhaps too quiet.",
      glyph: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 74 Q60 90 102 70 L92 88 Q60 98 30 88 Z" fill="#241d33"/><path d="M56 20 L60 72" stroke="#3a2d1e" stroke-width="3" stroke-linecap="round" transform="rotate(-14 58 46)"/><path d="M60 26 Q86 40 64 66 Z" fill="#8d8069" opacity="0.5" transform="rotate(-14 58 46)"/><path d="M10 92 Q60 86 110 92" stroke="#3fd6c0" stroke-width="1.4" fill="none" opacity="0.4"/><circle cx="84" cy="80" r="2.4" fill="#e3b75f" opacity="0.8"><animate attributeName="opacity" values=".8;.2;.8" dur="2.4s" repeatCount="indefinite"/></circle></svg>`,
      choices: [
        { id: "quick", label: "Salvage quickly", sub: "Take what floats free: +8 pearls" },
        { id: "deep", label: "Search the hold", sub: "Answer one reading — right: +16 pearls, wrong: the wreck shifts (−1 hull)" },
      ],
    },
    {
      id: "whale",
      title: "The Great Whale",
      text: "The sea swells, and a vast gentle back breaks the surface beside you, barnacled like a reef. Old sailors say a whale surfaces beside those it means to bless — if they can answer its call.",
      glyph: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8 78 Q40 44 78 56 Q104 64 108 80 Z" fill="#1e2a52"/><path d="M92 58 Q100 36 116 34 Q110 52 104 62 Z" fill="#1e2a52"/><path d="M8 78 Q40 52 78 60 Q100 66 108 80 Z" fill="#2b3a6e" opacity="0.7"/><circle cx="30" cy="66" r="3" fill="#ffd98a"/><g stroke="#9fe8ff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"><path d="M46 44 Q46 34 42 30"/><path d="M50 44 Q52 32 58 28"/></g><path d="M4 86 Q60 80 116 86" stroke="#3fd6c0" stroke-width="1.4" fill="none" opacity="0.45"/></svg>`,
      choices: [
        { id: "listen", label: "Listen to its call", sub: "Name the word it sings — right: it mends your hull (+1) and leaves a pearl" },
        { id: "bow", label: "Bow and sail on", sub: "Some blessings are simply to have seen it" },
      ],
    },
    {
      id: "bottle",
      title: "A Message in a Bottle",
      text: "Green glass glints in your wake. Inside, salt-stained, is a word you once struggled to hold — it has drifted a long way to find you again.",
      glyph: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(24 60 60)"><rect x="50" y="24" width="20" height="14" rx="3" fill="#4a6b52"/><path d="M46 38 Q38 52 40 78 Q41 94 60 94 Q79 94 80 78 Q82 52 74 38 Z" fill="#3d6b58" opacity="0.85"/><rect x="54" y="48" width="12" height="30" rx="2" fill="#e8dcc0" opacity="0.9"/><path d="M56 54 H64 M56 60 H64 M56 66 H62" stroke="#8a7b5a" stroke-width="1.4"/></g><path d="M14 100 Q60 94 106 100" stroke="#3fd6c0" stroke-width="1.4" fill="none" opacity="0.45"/></svg>`,
      choices: [
        { id: "open", label: "Uncork it", sub: "Answer the word — right: it's rescued for good (+6 pearls)" },
        { id: "keep", label: "Stow it for later", sub: "+1 pearl; the word will find you again" },
      ],
    },
    {
      id: "lighthouse",
      title: "The Silent Lighthouse",
      text: "A lighthouse rises from a bare rock, its keeper long gone, its great lamp dark. Yet the door stands open, and inside the hearth is inexplicably warm.",
      glyph: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M48 96 L52 34 H68 L72 96 Z" fill="#2a2440"/><path d="M50 60 H70 M49 76 H71" stroke="#171233" stroke-width="3"/><rect x="50" y="22" width="20" height="14" rx="2" fill="#171233"/><circle cx="60" cy="29" r="4.4" fill="#e3b75f"><animate attributeName="opacity" values=".9;.3;.9" dur="3.2s" repeatCount="indefinite"/></circle><path d="M40 96 H80" stroke="#3a3258" stroke-width="5" stroke-linecap="round"/><path d="M10 104 Q60 98 110 104" stroke="#3fd6c0" stroke-width="1.4" fill="none" opacity="0.4"/></svg>`,
      choices: [
        { id: "rest", label: "Rest by the hearth", sub: "Mend hull to full — but leave 5 pearls for the keeper" },
        { id: "sail", label: "Press on", sub: "The keeper's tin holds 10 pearls, and no one is counting" },
      ],
    },
  ];

  // ------------------------------------------------------------- upgrades
  const upgrades = [
    { id: "hull", name: "Stronger Ship", icon: icons.hull, tiers: [{ cost: 30, desc: "+1 max health on every voyage." }, { cost: 60, desc: "+2 max health on every voyage." }], mod: (t) => ({ hullMax: t }) },
    { id: "lantern", name: "Lantern of Departure", icon: icons.lanternFit, tiers: [{ cost: 50, desc: "Begin every voyage by choosing 1 of 3 boons." }], mod: () => ({ startBoon: 1 }) },
    { id: "keel", name: "Deep Keel", icon: icons.harpoon, tiers: [{ cost: 40, desc: "+10% harpoon damage." }], mod: () => ({ dmgMult: 1.1 }) },
    { id: "satchel", name: "Diver's Satchel", icon: icons.satchel, tiers: [{ cost: 35, desc: "+25% pearls earned from voyages." }], mod: () => ({ pearlMult: 1.25 }) },
    { id: "glass", name: "Star Glass", icon: icons.eye, tiers: [{ cost: 25, desc: "Mystery waters reveal their nature on the chart." }], mod: () => ({ foresight: 1 }) },
    { id: "hearth", name: "Harbor Hearth", icon: icons.hearth, tiers: [{ cost: 45, desc: "Harbor rests heal your ship fully." }], mod: () => ({ restFull: 1 }) },
  ];

  // -------------------------------------------------------- constellations
  // Layout is a 360x430 sky. Every star name here is a real one.
  const constellations = [
    {
      id: "thurayya", name: "Al-Thurayya", arabic: "الثريا", english: "The Pleiades — the Seven Sisters",
      metric: "wins", per: 1, unit: "guardian defeated",
      lore: "<b>الثريا — ath-Thurayyā.</b> The little cluster sailors counted to test their eyes. Every guardian you defeat charts one sister. Aldebaran, 'the follower' (الدبران), has trailed them across the sky since before writing.",
      cx: 96, cy: 96,
      stars: [ { x: 70, y: 78 }, { x: 92, y: 62 }, { x: 114, y: 72 }, { x: 128, y: 94, name: "Thurayya" }, { x: 108, y: 112 }, { x: 84, y: 118 }, { x: 62, y: 104 } ],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]],
    },
    {
      id: "altair", name: "Al-Nasr al-Ta'ir", arabic: "النسر الطائر", english: "The Flying Eagle — Aquila",
      metric: "mastered", per: 8, unit: "words mastered",
      lore: "<b>النسر الطائر — an-nasr aṭ-ṭā'ir,</b> 'the flying eagle.' Its heart is Altair. Every 8 words you master lifts one feather of the eagle into the light.",
      cx: 268, cy: 120,
      stars: [ { x: 268, y: 100, name: "Altair" }, { x: 244, y: 84 }, { x: 292, y: 86 }, { x: 224, y: 116 }, { x: 312, y: 118 }, { x: 268, y: 148 } ],
      lines: [[1,0],[0,2],[3,1],[2,4],[0,5]],
    },
    {
      id: "fomalhaut", name: "Fam al-Hut", arabic: "فم الحوت", english: "The Whale's Mouth — Fomalhaut",
      metric: "rescued", per: 15, unit: "words rescued",
      lore: "<b>فم الحوت — fam al-ḥūt,</b> 'the mouth of the whale,' the lonely southern beacon. Every 15 words you rescue from the deep feeds another star to the whale.",
      cx: 100, cy: 320,
      stars: [ { x: 58, y: 348 }, { x: 84, y: 332 }, { x: 112, y: 326 }, { x: 140, y: 330, name: "Fomalhaut" }, { x: 122, y: 352 }, { x: 92, y: 358 } ],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]],
    },
    {
      id: "dajaja", name: "Al-Dajaja", arabic: "الدجاجة", english: "The Hen — Cygnus, with Deneb its tail",
      metric: "runs", per: 2, unit: "voyages sailed",
      lore: "<b>الدجاجة — ad-dajāja,</b> 'the hen,' gliding down the river of the Milky Way. Deneb (ذنب) is simply 'tail.' Every 2 voyages you sail — won or lost — lights a feather. Returning is what counts.",
      cx: 262, cy: 300,
      stars: [ { x: 262, y: 252, name: "Deneb" }, { x: 262, y: 286 }, { x: 232, y: 296 }, { x: 292, y: 296 }, { x: 262, y: 320 }, { x: 204, y: 310 }, { x: 320, y: 310 } ],
      lines: [[0,1],[1,2],[1,3],[1,4],[2,5],[3,6]],
    },
  ];

  // ------------------------------------------------------------------ boss
  const boss = {
    id: "algol",
    name: "Algol, the Watcher",
    arabic: "رأس الغول",
    translit: "ra's al-ghūl — the head of the ghoul",
    intro: "At the edge of the reach, the sky itself opens one slow red eye. The old star-readers watched it blink for three thousand years and named their unease. Tonight it watches you.",
    svg: creatures.algol,
    phases: [
      { format: "volley", taunt: "The eye narrows. The sea around you steepens into black glass." },
      { format: "echo", taunt: "The Watcher dims — and in the darkness, it begins to sing your words back at you, wrongly." },
      { format: "chain", taunt: "A final eclipse. The Watcher pours the whole night down upon your sails. Answer, and keep answering." },
    ],
    defeat: "The eye gutters, pales... and softens into an ordinary, patient star. The reach falls quiet. Above your mast, the Seven Sisters step out of hiding.",
    victory: "The night closes over the reach. The Watcher's gaze follows you home — patient, unhurried. It knows you will come again.",
  };

  // ------------------------------------------------------------- encounters
  const formats = {
    volley: { name: "Squall of the Reach", kicker: "What does it mean?", verb: "The squall recoils from your light!", svg: creatures.squall, hp: 90 },
    echo: { name: "Fog-Wyrm", kicker: "Listen — which word calls?", verb: "The fog tears open!", svg: creatures.fogwyrm, hp: 80 },
    pairs: { name: "Star-Snare", kicker: "Bind each word to its meaning", verb: "A thread of the snare burns away!", svg: creatures.starsnare, hp: 96 },
    chain: { name: "Leviathan Chase", kicker: "Answer swiftly — outrun it!", verb: "The ship surges ahead!", svg: creatures.leviathan, hp: 100 },
    verse: {
      name: "Star-Verse",
      kicker: "Rebuild the verse, star by star",
      kickerMeaning: "What does it mean?",
      kickerArabic: "Which word carries this meaning?",
      verb: "The verse locks into the sky, whole!",
      svg: creatures.starsnare,
      hp: 96,
    },
  };

  // --------------------------------------------------------------- currents
  // The three build axes — one per crew member, same color as their portrait
  // border. Every boon already belongs to a crew, so drafting one boon always
  // ticks its current up a pip; every 3 pips is a tier, which (a) scales that
  // crew's own boon effects a little stronger and (b) hands a small named
  // perk the first three times. No separate "stat" system to learn — the
  // currents ARE the crew, just read as three bars instead of three faces.
  const currents = {
    yusuf: {
      name: "Resolve", glyph: icons.resolve,
      tiers: [
        { name: "The Tide Turns", desc: "Heal 1 health right away.", mod: { heal: 1 } },
        { name: "Steady Ship", desc: "+1 max health, forever.", mod: { hullMax: 1 } },
        { name: "Unshaken", desc: "A sinking ship rights itself once more.", mod: { revive: 1 } },
      ],
    },
    layla: {
      name: "Precision", glyph: icons.precision,
      tiers: [
        { name: "Clear Sight", desc: "Every reading shows its sound.", mod: { showTranslit: 1 } },
        { name: "Farsight", desc: "Mystery waters reveal their nature.", mod: { foresight: 1 } },
        { name: "Eclipse Ward", desc: "The Watcher's eclipse cannot darken you.", mod: { eclipseWard: 1 } },
      ],
    },
    idris: {
      name: "Swiftness", glyph: icons.swiftness,
      tiers: [
        { name: "Quickening", desc: "+8% harpoon damage.", mod: { dmgMult: 1.08 } },
        { name: "Streak Kindled", desc: "Every third streak strikes harder.", mod: { streakFire: 1 } },
        { name: "Diver's Fortune", desc: "Streak 5+ shakes loose a pearl each hit.", mod: { pearlAt5: 1 } },
      ],
    },
  };

  // ---------------------------------------------------------------- relics
  // A second, rarer item class beside boons: chunky, singular, run-defining,
  // and visible on the ship (see shipSVG's RELIC_FIT_SVG). Keepsakes are
  // picked once at the departure sheet before a voyage; found relics turn up
  // mid-run (the haven's crate, or a cleared cursed-cargo node). Never a
  // sacred object — worldly salvage only, per the game's tone invariant.
  const relics = [
    // -- keepsakes: exactly one equipped, unlock via lifetime metrics --
    {
      id: "beads", name: "Yusuf's Prayer-Worn Beads", crew: "yusuf", keepsake: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 3v3"/><circle cx="12" cy="8.5" r="1.6"/><circle cx="8" cy="11" r="1.6"/><circle cx="16" cy="11" r="1.6"/><circle cx="7" cy="15.5" r="1.6"/><circle cx="17" cy="15.5" r="1.6"/><circle cx="12" cy="18" r="1.8"/></svg>`,
      desc: "Start with Resolve already flowing. Rests and healing give 1 extra.",
      lore: "Forty years between Yusuf's fingers, counting the nights that came home safe.",
      unlock: { runs: 2 },
      mod: { startPips: { yusuf: 1 }, restBonus: 1 },
      fit: "beads",
    },
    {
      id: "atlaspage", name: "Layla's Atlas Page", crew: "layla", keepsake: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5l6-2 6 2 4-1v15l-4 1-6-2-6 2V5z"/><path d="M10 3v15M16 6v15"/></svg>`,
      desc: "Depart with Precision already stirring. Mystery waters reveal their nature.",
      lore: "Torn from Layla's own atlas — the page where she first wrote a star's true name.",
      unlock: { wins: 1 },
      mod: { startPips: { layla: 1 }, foresight: 1 },
      fit: "atlaspage",
    },
    {
      id: "moonpearl", name: "Idris's Moon-Pearl", crew: "idris", keepsake: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M14 4a8 8 0 1 0 6 13 7 7 0 0 1-6-13z" fill="currentColor" opacity="0.5" stroke="none"/><circle cx="9" cy="16" r="3"/></svg>`,
      desc: "Depart with Swiftness already stirring. +1 pearl per encounter cleared.",
      lore: "Pulled from the night-dive he swore he'd never make.",
      unlock: { rescued: 10 },
      mod: { startPips: { idris: 1 }, pearlsPerClear: 1 },
      fit: "moonpearl",
    },
    {
      id: "navlantern", name: "The Navigator's Lantern", crew: null, keepsake: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 2v3M4 12H2M22 12h-2M5.6 5.6l1.4 1.4M18.4 5.6l-1.4 1.4"/><circle cx="12" cy="14" r="6"/><circle cx="12" cy="14" r="2" fill="currentColor" stroke="none"/></svg>`,
      desc: "Depart with all three currents already stirring.",
      lore: "The star Layla named for the one who learned the sky word by word, and came home every time.",
      unlock: { stars: 7 },
      mod: { startPips: { yusuf: 1, layla: 1, idris: 1 } },
      fit: "navlantern",
    },
    // -- found relics: discovered mid-run, one honest tradeoff each --
    {
      id: "deepharpoon", name: "Harpoon of the Deep-Court", crew: null, keepsake: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 20 18 6"/><path d="M18 6l-3 1M18 6l-1 3M14 4l4 4"/></svg>`,
      desc: "+25% harpoon damage — but the extra iron costs 1 max health.",
      lore: "Forged in the deep-court's own yards, too heavy for a light ship to carry for free.",
      mod: { dmgMult: 1.25, hullMax: -1 },
      fit: "deepharpoon",
    },
    {
      id: "whaleblessing", name: "The Whale's Blessing", crew: null, keepsake: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18c4-1 6-5 6-9M21 18c-4-1-6-5-6-9M9 9c1 3 1 6 3 9M15 9c-1 3-1 6-3 9"/></svg>`,
      desc: "Heal 1 health on every encounter you clear with no mistakes.",
      lore: "A barnacle-crusted token, warm to the touch, tumbled loose in a whale's wake.",
      mod: { flawlessHeal: 1 },
      fit: "whaleblessing",
    },
    {
      id: "ibnyunus", name: "Astrolabe of Ibn Yunus", crew: null, keepsake: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5" opacity="0.6"/><path d="M12 4v16M4 12h16" opacity="0.5"/></svg>`,
      desc: "One false answer dims on every reading — but the glass runs 10% faster.",
      lore: "Ibn Yunus charted the stars from Cairo a thousand years ago; his brass still keeps sharper time than most.",
      mod: { removeDistractor: 1, timeScale: 0.9 },
      fit: "ibnyunus",
    },
    {
      id: "bottledglow", name: "Bottled Bioluminescence", crew: null, keepsake: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M10 3h4M11 3v4l-3 4v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8l-3-4V3"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/></svg>`,
      desc: "Leviathan chases fill 20% faster.",
      lore: "A jar of the sea's own light, decanted from a night-dive and never quite gone dark.",
      mod: { chainRate: 1.2 },
      fit: "bottledglow",
    },
    {
      id: "keeperstin", name: "The Keeper's Tin", crew: null, keepsake: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="5" y="9" width="14" height="10" rx="1.5"/><path d="M5 13h14"/><rect x="9" y="5" width="6" height="4" rx="1"/></svg>`,
      desc: "Run pearls are worth 50% more at the bank.",
      lore: "A dented tin some careful merchant buried and never came back for.",
      mod: { pearlMult: 1.5 },
      fit: "keeperstin",
    },
    {
      id: "readerslate", name: "Star-Reader's Slate", crew: null, keepsake: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8l1.2 2.4 2.6.4-1.9 1.8.45 2.6L12 14l-2.35 1.2.45-2.6-1.9-1.8 2.6-.4z" fill="currentColor" stroke="none"/></svg>`,
      desc: "A second wind, once per voyage — no-op if you already carry one.",
      lore: "Star-etched slate, its surface worn soft by a hundred re-readings.",
      mod: { revive: 1 },
      fit: "readerslate",
    },
  ];

  // --------------------------------------------------------------- vessels
  // Three unlockable vessels plus the default. The pre-run "weapon choice":
  // each sets a base playstyle the currents then amplify. Beat 7 lands
  // mid-arc for every crew, so all three unlock around the same voyage.
  const vessels = [
    {
      id: "miftah", name: "The Miftah", meaning: "\"the key\" — مِفْتَاح",
      crew: null, unlockBeat: 0,
      role: "Steady course",
      desc: "Forgiving and balanced. A shield soaks up the first mistake in every encounter.",
      stats: ["4 health", "1 shield / encounter", "standard damage"],
      hull: 4, mod: { shieldPerEnc: 1 }, trait: "steady",
    },
    {
      id: "sabaq", name: "The Sabaq", meaning: "\"the race\" — سَبْق",
      crew: "idris", unlockBeat: 7,
      role: "Momentum",
      desc: "Carries streaks between encounters and grows deadlier as the run accelerates.",
      stats: ["3 health", "streaks carry", "+4% damage / streak"],
      hull: 3, mod: { streakCarry: 1, chainRate: 1.15 }, trait: "streakDamage",
    },
    {
      id: "layl", name: "The Layl", meaning: "الليل — \"the night\"",
      crew: "layla", unlockBeat: 7,
      role: "Control",
      desc: "Reads the route and removes uncertainty, trading speed of attack for precision.",
      stats: ["4 health", "+25% answer time", "1 false answer dimmed"],
      hull: 4, mod: { timeScale: 1.25, dmgMult: 0.9, foresight: 1, removeDistractor: 1 }, trait: "control",
    },
    {
      id: "rimah", name: "The Rimah", meaning: "الرماح — \"the lances\"",
      crew: "yusuf", unlockBeat: 7,
      role: "High risk",
      desc: "A fragile lance-ship that ends fights quickly and rewards flawless clears.",
      stats: ["2 health", "+35% damage", "perfect clears heal you"],
      hull: 2, mod: { dmgMult: 1.35, flawlessHeal: 1, flawlessBonus: 1 }, trait: "flawless",
    },
  ];

  return {
    shipSVG, creatures, portraits, harborScene, astrolabe, icons, emblems,
    crew, events, upgrades, constellations, boss, formats, currents,
    relics, vessels,
    // Kid-profile curriculum: Al-Fatihah first, then up from the short surahs.
    curriculum: [1, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93],
  };
})();
