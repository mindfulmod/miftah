// Native, child-scale Water Garden scenery. Behaviour and hit areas stay in
// WaterGarden.js; these lane hooks are kept here for its water and flower states.
(function (ns) {
  const LANES = [70, 180, 290];
  const INK = '#4a3620';
  const lane = (x, i) => {
    const petal = ['#ee806f', '#f3c955', '#b49fcf'][i];
    const petalLight = ['#ffa798', '#ffe49a', '#e6d6f0'][i];
    return `
      <g aria-hidden="true">
        <ellipse cx="${x}" cy="309" rx="29" ry="8" fill="#4e9677" opacity=".25"/>
        <path d="M${x - 27} 306Q${x - 22} 294 ${x} 296Q${x + 22} 294 ${x + 28} 306Q${x + 22} 315 ${x} 315Q${x - 22} 315 ${x - 27} 306Z" fill="#70501b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${x - 20} 304Q${x} 298 ${x + 21} 304" fill="none" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M${x - 12} 306Q${x} 303 ${x + 12} 306" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M${x} 301Q${x + 2} 284 ${x} 270" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/>
        <path d="M${x - 1} 291Q${x - 17} 290 ${x - 17} 279Q${x - 6} 278 ${x} 287Q${x + 7} 278 ${x + 17} 281Q${x + 15} 291 ${x - 1} 291Z" fill="#7fce54" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M${x - 12} 282Q${x - 6} 285 ${x - 2} 289M${x + 12} 284Q${x + 5} 286 ${x + 1} 290" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
        <g class="wg-flower" data-lane="${i}" transform="translate(0 12)">
          <g class="wg-bud">
            <path d="M${x} 270Q${x - 11} 265 ${x - 7} 256Q${x - 2} 257 ${x} 262Q${x + 2} 257 ${x + 7} 256Q${x + 11} 265 ${x} 270Z" fill="${petal}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
            <path d="M${x - 3} 265Q${x} 260 ${x + 3} 265" fill="none" stroke="${petalLight}" stroke-width="2.4" stroke-linecap="round"/>
          </g>
          <g class="wg-bloom" opacity="0">
            ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="253" rx="7" ry="11" transform="rotate(${a} ${x} 262)" fill="${petal}" stroke="${INK}" stroke-width="2.4"/>`).join('')}
            <path d="M${x - 3} 255Q${x - 1} 250 ${x + 2} 251" fill="none" stroke="${petalLight}" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="${x}" cy="262" r="7" fill="#ffe49a" stroke="${INK}" stroke-width="2.4"/>
            <circle cx="${x - 2}" cy="260" r="1.6" fill="#c69434"/>
            <circle cx="${x + 2}" cy="264" r="1.6" fill="#c69434"/>
          </g>
        </g>
      </g>
      <g class="wg-elbow" data-lane="${i}">
        <g class="wg-turn-cue" opacity="0"><path d="M${x - 24} 218A26 26 0 0 0 ${x - 18} 249" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M${x - 24} 247L${x - 17} 251L${x - 15} 243" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
        <g class="wg-turn" style="transform-box:view-box;transform-origin:${x}px 230px">
          <rect x="${x - 10}" y="228" width="20" height="34" rx="7" fill="#a89478" stroke="${INK}" stroke-width="3"/>
          <path d="M${x - 5} 235V255M${x + 4} 235V254" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="${x}" cy="230" r="19" fill="#c9bda4" stroke="${INK}" stroke-width="4"/>
          <circle cx="${x}" cy="230" r="11" fill="#a89478" stroke="${INK}" stroke-width="2.4"/>
          <path d="M${x - 5} 224Q${x} 220 ${x + 5} 224" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M${x} 230V253" stroke="#c9bda4" stroke-width="8" stroke-linecap="round"/>
          <path class="wg-elbow-water" d="M${x} 230V253" stroke="#62cdf4" stroke-width="6" stroke-linecap="round" opacity="0"/>
          <circle cx="${x - 18}" cy="230" r="6" fill="#e8743c" stroke="${INK}" stroke-width="2.4"/>
          <path d="M${x - 20} 228Q${x - 18} 226 ${x - 16} 228" fill="none" stroke="#ffa06e" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        <path d="M${x} 212V230" stroke="#c9bda4" stroke-width="8" stroke-linecap="round"/>
        <path class="wg-inlet-water" d="M${x} 212V230" stroke="#62cdf4" stroke-width="6" stroke-linecap="round" opacity="0"/>
        <circle cx="${x}" cy="230" r="6" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/>
        <circle class="wg-basin-water" cx="${x}" cy="230" r="4" fill="#62cdf4" opacity="0"/>
      </g>
      <ellipse class="wg-puddle" data-lane="${i}" cx="${x + 36}" cy="236" rx="3" ry="2" fill="#96ecff" stroke="#3a8fc4" stroke-width="1.6" opacity="0"/>
      <g>
        <rect x="${x - 13}" y="87" width="26" height="131" rx="8" fill="#70501b" stroke="${INK}" stroke-width="3"/>
        <rect x="${x - 8}" y="91" width="16" height="122" rx="6" fill="#c9bda4" stroke="#a89478" stroke-width="2.4"/>
        <path d="M${x - 4} 99V205" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <path d="M${x - 10} 113H${x + 10}M${x - 10} 145H${x + 10}M${x - 10} 177H${x + 10}" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
        <path class="wg-flow" data-lane="${i}" d="M${x} 92V214" stroke="#62cdf4" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
        <path class="wg-flow-light" data-lane="${i}" d="M${x - 2} 96V212" stroke="#96ecff" stroke-width="2.4" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      </g>
      <g class="wg-gate" data-lane="${i}">
        <rect x="${x - 20}" y="57" width="9" height="42" rx="4" fill="#a89478" stroke="${INK}" stroke-width="3"/>
        <rect x="${x + 11}" y="57" width="9" height="42" rx="4" fill="#a89478" stroke="${INK}" stroke-width="3"/>
        <path d="M${x - 16} 63V93M${x + 16} 63V93" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
        <g class="wg-board">
          <rect x="${x - 14}" y="61" width="28" height="31" rx="6" fill="#c9bda4" stroke="${INK}" stroke-width="4"/>
          <path d="M${x - 8} 69H${x + 8}M${x - 8} 77H${x + 8}M${x - 8} 85H${x + 8}" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="${x - 9}" cy="66" r="1.6" fill="#70501b"/><circle cx="${x + 9}" cy="87" r="1.6" fill="#70501b"/>
        </g>
        <rect x="${x - 24}" y="93" width="48" height="7" rx="3.5" fill="#a89478" stroke="${INK}" stroke-width="2.4"/>
      </g>`;
  };

  function scene() {
    return `<svg class="wg-scene" viewBox="0 0 360 320" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 53Q85 39 157 51Q254 32 360 51V320H0Z" fill="#b7e779"/>
      <path d="M0 250Q29 242 61 246Q94 251 126 247Q155 241 180 249Q219 256 249 244Q285 232 318 244Q342 251 360 246V320H0Z" fill="#7fce54"/>
      <path d="M0 274Q35 266 74 272Q111 279 148 271Q184 264 218 273Q253 281 287 269Q325 260 360 274V320H0Z" fill="#4e9677" opacity=".5"/>
      <ellipse cx="180" cy="311" rx="168" ry="8" fill="#2f5c46" opacity=".2"/>

      <g aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 310Q64 300 112 309L113 315Q64 306 13 316Z" fill="#a89478" stroke="#4a3620" stroke-width="3"/>
        <path d="M248 309Q299 299 348 310L347 316Q299 305 249 315Z" fill="#a89478" stroke="#4a3620" stroke-width="3"/>
        <path d="M15 310Q64 302 109 310M251 310Q299 301 345 311" stroke="#c9bda4" stroke-width="2.4"/>
        <path d="M22 308l12-2M48 305l10-2M77 303l11-1M269 305l12-2M304 302l12-1M330 306l9 2" stroke="#a89478" stroke-width="2.4"/>
        <path d="M10 266q5-8 8-14m-8 14q-4-7-5-12m345 12q5-8 9-12m-9 12q-5-7-5-13" stroke="#4e9677" stroke-width="3"/>
        <path d="M23 282q4-7 8-10m-8 10q-4-5-5-9m316 7q5-7 8-10m-8 10q-4-5-5-9" stroke="#7fce54" stroke-width="2.4"/>
      </g>

      <g>
        <path d="M111 37Q111 16 132 12Q149 1 165 14Q180 -1 197 13Q223 11 233 31Q244 51 221 60H136Q111 56 111 37Z" fill="#a89478" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M120 35Q121 19 139 17Q153 8 166 20Q181 7 195 19Q217 17 225 33Q232 48 214 52H140Q121 50 120 35Z" fill="#96ecff"/>
        <path d="M128 34Q146 26 160 33Q176 39 192 31Q207 27 217 34" fill="none" stroke="#62cdf4" stroke-width="3" stroke-linecap="round"/>
        <path d="M138 22Q146 18 154 21" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
        <path d="M126 51Q141 58 160 54M199 54Q214 57 222 49" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="129" cy="45" rx="9" ry="6" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="226" cy="43" rx="10" ry="7" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/>
        <path d="M177 47V64Q177 69 182 69H194" fill="none" stroke="#a89478" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M179 48V63" fill="none" stroke="#62cdf4" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g aria-hidden="true">
        <path d="M163 17Q162 10 169 8Q174 4 180 9Q186 4 192 9Q198 12 196 19Q192 24 180 23Q167 24 163 17Z" fill="#c9bda4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M171 13Q174 10 178 13M184 13Q188 10 191 13" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="180" cy="15" rx="4" ry="3" fill="#70501b"/>
        <path d="M180 17Q180 21 180 25" fill="none" stroke="#62cdf4" stroke-width="4" stroke-linecap="round"/>
        <path d="M180 18Q178 20 179 22" fill="none" stroke="#96ecff" stroke-width="2.4" stroke-linecap="round"/>
      </g>

      <g>
        <rect x="43" y="58" width="274" height="25" rx="12" fill="#a89478" stroke="${INK}" stroke-width="4"/>
        <rect x="49" y="63" width="262" height="14" rx="7" fill="#62cdf4"/>
        <path d="M58 66Q104 62 151 66M217 66Q260 62 301 66" fill="none" stroke="#96ecff" stroke-width="3" stroke-linecap="round"/>
        <path d="M60 81H300" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M48 83V90M312 83V90" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>
      </g>

      ${LANES.map(lane).join('')}

      <g fill="#c9bda4" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round">
        <path d="M31 258Q34 247 45 249Q55 245 61 255Q65 264 55 269H39Q30 266 31 258Z"/>
        <path d="M300 263Q302 251 314 252Q323 247 330 257Q335 267 325 272H309Q300 270 300 263Z"/>
        <path d="M79 284Q81 277 89 278Q97 276 100 283Q101 290 94 292H84Q78 290 79 284Z"/>
      </g>
      <path d="M38 255Q44 252 49 254M307 259Q314 255 320 258" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.WaterPlayArt = { scene };
  })(window.MiftahGame = window.MiftahGame || {});
