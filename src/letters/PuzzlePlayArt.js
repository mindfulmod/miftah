// Native paper-world props for the four Letter Garden puzzle games.
// The open paper fields are intentional: live letter SVGs sit above these props.
(function (ns) {
  const INK = "#4a3620";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#f3c955";
  const WOOD_DARK = "#70501b";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const PAPER_SHADE = "#e5dcc8";
  const PAPER_EDGE = "#c9bda4";
  const GREEN = "#7fce54";
  const LEAF = "#b7e779";
  const LEAF_DARK = "#4e9677";
  const GREEN_DARK = "#2f5c46";

  function echoStage() {
    return `<svg viewBox="0 0 320 150" aria-hidden="true">
      <ellipse cx="160" cy="143" rx="142" ry="5" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M12 38V128Q12 134 18 134H26V38ZM294 38V134H302Q308 134 308 128V38Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M17 48V126M303 48V126" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M16 129Q160 121 304 129V140Q160 132 16 140Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M18 126Q160 118 302 126V134Q160 129 18 134Z" fill="${WOOD_LIGHT}"/>
      <path d="M10 36Q12 22 27 21Q36 8 51 18Q62 4 78 16Q94 5 108 16Q124 4 140 16Q160 3 178 16Q194 4 210 16Q228 5 242 17Q260 4 273 19Q292 16 300 34L300 36Q283 39 268 36Q250 40 235 36Q218 39 203 36Q184 40 169 36Q151 40 135 36Q117 39 102 36Q84 40 67 36Q50 40 35 36Q21 39 10 36Z" fill="${LEAF_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M10 31Q12 17 28 16Q37 4 52 13Q64 1 79 12Q95 2 109 12Q125 1 141 12Q160 0 178 12Q194 1 210 12Q228 2 242 13Q260 1 274 15Q292 12 300 29L300 31Q284 34 269 31Q251 35 235 31Q218 34 203 31Q184 35 169 31Q151 35 135 31Q117 34 102 31Q84 35 67 31Q50 35 35 31Q21 34 10 31Z" fill="${LEAF}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M29 25Q43 9 58 20M101 19Q115 7 129 20M183 19Q198 6 214 20M253 22Q266 8 281 23" fill="none" stroke="${PAPER_LIGHT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M45 133V139M275 133V139" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function dotBench() {
    return `<svg viewBox="0 0 260 220" aria-hidden="true">
      <ellipse cx="130" cy="211" rx="105" ry="5" fill="${GREEN_DARK}" opacity=".14"/>
      <path d="M18 29Q18 16 31 16H229Q242 16 242 29V191Q242 204 229 204H31Q18 204 18 191Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 27Q20 18 31 18H229Q240 18 240 29V187Q240 198 229 198H31Q20 198 20 187Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M27 27Q130 18 233 27V39Q130 31 27 39Z" fill="${WOOD_LIGHT}"/>
      <path d="M45 24V191M215 24V191" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
      <rect x="46" y="22" width="168" height="168" rx="12" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="3"/>
      <rect x="50" y="26" width="160" height="160" rx="9" fill="${PAPER}"/>
      <path d="M30 56Q30 48 38 48H44V91H38Q30 91 30 83Z" fill="${LEAF_DARK}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M32 55H42M32 63H42M32 71H42M32 79H42" stroke="${GREEN_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M218 55Q218 48 225 48H231Q238 48 238 55V82Q238 89 231 89H225Q218 89 218 82Z" fill="${PAPER_SHADE}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M221 56Q228 52 235 56V76Q228 80 221 76Z" fill="${WOOD_LIGHT}"/>
      <path d="M75 194H185" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function dotStamp() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="91" rx="37" ry="5" fill="${PAPER_EDGE}"/>
      <path d="M38 29H62L66 67H34Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M43 35H49V63H40Z" fill="${WOOD_LIGHT}"/>
      <path d="M22 24Q22 8 50 8Q78 8 78 24Q78 37 50 37Q22 37 22 24Z" fill="${LEAF_DARK}" stroke="${INK}" stroke-width="4"/>
      <path d="M31 20Q45 11 65 19" fill="none" stroke="${LEAF}" stroke-width="5" stroke-linecap="round"/>
      <path d="M20 62Q50 54 80 62L86 76Q86 84 78 84H22Q14 84 14 76Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M19 79H81V86H19Z" fill="${INK}"/>
      <circle cx="50" cy="70" r="5" fill="${INK}"/>
    </svg>`;
  }

  function turntable() {
    return `<svg viewBox="0 0 140 158" aria-hidden="true">
      <ellipse cx="70" cy="150" rx="60" ry="6" fill="${GREEN_DARK}" opacity=".18"/>
      <path d="M13 70V127Q13 142 29 142H111Q127 142 127 127V70Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4"/>
      <rect x="13" y="66" width="114" height="70" rx="16" fill="${WOOD}" stroke="${INK}" stroke-width="4"/>
      <path d="M23 117H117M30 127H110" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="70" cy="68" r="59" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="4"/>
      <circle cx="70" cy="63" r="58" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="4"/>
      <path d="M23 44Q44 8 85 17" fill="none" stroke="${PAPER_LIGHT}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="70" cy="63" r="46" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
      <path d="M66 10H74M66 116H74M17 59V67M123 59V67" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  function turnHandle() {
    return `<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M14 37A17 17 0 1 1 39 34" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M32 28L38 39L46 29" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="24" r="5" fill="${WOOD}" stroke="${INK}" stroke-width="2.4"/></svg>`;
  }

  function matchFrame() {
    return `<svg viewBox="0 0 230 220" aria-hidden="true">
      <ellipse cx="115" cy="210" rx="87" ry="5" fill="${GREEN_DARK}" opacity=".14"/>
      <path d="M20 22Q20 12 31 12H199Q210 12 210 22V190Q210 201 199 201H31Q20 201 20 190Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M23 22Q23 16 31 16H199Q207 16 207 24V186Q207 194 199 194H31Q23 194 23 186Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M29 24Q115 17 201 24V34Q115 28 29 34Z" fill="${WOOD_LIGHT}"/>
      <rect x="40" y="31" width="150" height="148" rx="12" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="3"/>
      <rect x="44" y="35" width="142" height="140" rx="9" fill="${PAPER}"/>
      <path d="M28 55V169M202 55V169" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="31" cy="28" r="2.4" fill="${WOOD_LIGHT}"/><circle cx="199" cy="28" r="2.4" fill="${WOOD_LIGHT}"/>
      <path d="M94 194Q115 190 136 194" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function station() {
    return `<svg viewBox="0 0 680 240" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 174Q88 166 175 175T348 171T522 174T680 168V240H0Z" fill="${LEAF}"/>
      <path d="M0 195Q87 186 172 196T345 191T518 195T680 188V240H0Z" fill="${GREEN}"/>
      <path d="M0 221Q121 209 243 220T475 218T680 210V240H0Z" fill="${LEAF_DARK}" opacity=".68"/>
      <path d="M8 207Q180 202 340 207T672 202" fill="none" stroke="${WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M8 213Q180 208 340 213T672 208" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <svg x="0" y="184" width="680" height="48" viewBox="0 0 680 48" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <g fill="${PAPER_SHADE}" stroke="${PAPER_EDGE}" stroke-width="2.4">
          <rect x="14" y="17" width="42" height="12" rx="6"/><rect x="81" y="16" width="42" height="12" rx="6"/><rect x="148" y="16" width="42" height="12" rx="6"/><rect x="215" y="15" width="42" height="12" rx="6"/><rect x="282" y="14" width="42" height="12" rx="6"/><rect x="349" y="14" width="42" height="12" rx="6"/><rect x="416" y="13" width="42" height="12" rx="6"/><rect x="483" y="12" width="42" height="12" rx="6"/><rect x="550" y="11" width="42" height="12" rx="6"/><rect x="617" y="10" width="42" height="12" rx="6"/>
        </g>
      </svg>

    </svg>`;
  }

  function stationShelter() {
    return `<svg viewBox="0 0 190 96" aria-hidden="true">
        <ellipse cx="96" cy="91" rx="80" ry="4" fill="${GREEN_DARK}" opacity=".17"/>
        <path d="M8 32Q95 -3 182 32L175 42Q95 12 15 42Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M15 30Q95 2 175 30L170 37Q95 13 20 37Z" fill="${WOOD_LIGHT}"/>
        <path d="M24 39V86Q24 91 30 91H39V37ZM151 37V91H160Q166 91 166 86V39Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M30 44V86M160 44V86" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M27 48Q95 43 163 48" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M70 67Q70 62 76 62H119Q125 62 125 67V72H70Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M75 73L72 84M120 73L123 84" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>
        <path d="M68 84Q97 81 127 84" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`;
  }

  function engine() {
    return `<svg viewBox="0 0 120 80" aria-hidden="true">
      <path d="M8 62H111" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M15 46Q15 40 22 40H90Q98 40 101 47L107 60H17Z" fill="#e8743c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 44H91L97 55H20Z" fill="#ffa06e"/>
      <path d="M14 24Q14 18 20 18H48Q54 18 54 25V46H14Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M10 20Q10 14 17 14H51Q57 14 58 20L55 25H12Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M22 26Q22 23 26 23H43Q47 23 47 27V38H22Z" fill="#ccfbef" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M35 24V37" stroke="#62cdf4" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M51 39Q51 27 65 25H87Q101 26 103 39V49Q101 55 94 55H54Q49 51 51 39Z" fill="#96ecff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M58 30Q72 26 87 30" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M79 27V15Q79 11 84 11H91Q96 11 96 16V28Z" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M76 16Q87 11 99 16V21Q87 18 76 21Z" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M97 49Q104 48 111 54L116 62L94 62Z" fill="${WOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="31" cy="63" r="10" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/><circle cx="31" cy="63" r="3.5" fill="${PAPER_SHADE}"/>
      <circle cx="78" cy="63" r="10" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/><circle cx="78" cy="63" r="3.5" fill="${PAPER_SHADE}"/>
      <path d="M31 63L55 58L78 63" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M27 16Q33 12 39 16" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function carriage() {
    return `<svg viewBox="0 0 100 80" aria-hidden="true">
      <path d="M8 60H95" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M5 58H14M88 58H97" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 11Q12 7 17 7H83Q88 7 88 12V57H12Z" fill="#ee806f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 14Q16 11 20 11H80Q84 11 84 15V54H16Z" fill="#ffa798"/>
      <path d="M18 12H82V18H18Z" fill="#c25a49"/>
      <rect x="24" y="12" width="52" height="49" rx="7" fill="${PAPER_EDGE}" stroke="${INK}" stroke-width="2.4"/>
      <rect x="27" y="14" width="46" height="45" rx="5" fill="${PAPER}"/>
      <circle cx="28" cy="63" r="9" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/><circle cx="28" cy="63" r="3" fill="${PAPER_SHADE}"/>
      <circle cx="72" cy="63" r="9" fill="${WOOD_DARK}" stroke="${INK}" stroke-width="3"/><circle cx="72" cy="63" r="3" fill="${PAPER_SHADE}"/>
      <path d="M13 56Q7 57 6 62Q7 67 15 66M87 56Q93 57 94 62Q93 67 85 66" fill="none" stroke="${WOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  const BALLOON_COLORS = new Set(["#ffa798", "#96ecff", "#b7e779", "#ffe49a", "#b49fcf"]);
  function balloon(color) {
    const fill = BALLOON_COLORS.has(String(color).toLowerCase()) ? String(color).toLowerCase() : "#ffa798";
    const ramps = {
      "#ffa798": "#c25a49", "#96ecff": "#62cdf4", "#b7e779": "#4e9677",
      "#ffe49a": "#c69434", "#b49fcf": "#8c74b0",
    };
    return `<svg viewBox="0 0 100 130" aria-hidden="true">
      <path d="M50 96Q43 107 53 117Q61 123 52 129" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M50 6Q28 6 15 24Q5 40 12 61Q20 84 44 96L50 100L56 96Q80 84 88 61Q95 40 85 24Q72 6 50 6Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="50" cy="52" r="27" fill="${PAPER}" opacity=".95"/>
      <path d="M25 28Q31 16 43 15" fill="none" stroke="${PAPER_LIGHT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M42 97L50 105L58 97Z" fill="${ramps[fill]}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    </svg>`;
  }

  ns.PuzzlePlayArt = { echoStage, dotBench, dotStamp, turntable, turnHandle, matchFrame, station, stationShelter, engine, carriage, balloon };
})(window.MiftahGame || (window.MiftahGame = {}));
