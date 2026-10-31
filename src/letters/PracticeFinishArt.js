// A child-led garden keepsake scene: the pet and planter are calm companions.
(function (ns) {
  const INK = "#4a3620";
  const PAPER = "#fffaf0";
  const PAPER_LIGHT = "#fffdf7";
  const WOOD = "#c69434";
  const WOOD_DARK = "#70501b";
  const GREEN = "#7fce54";
  const LEAF = "#b7e779";
  const LEAF_DARK = "#4e9677";
  const GREEN_DARK = "#2f5c46";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const CORAL_DARK = "#c25a49";

  function bloom(x, y, petals, leafColor = LEAF) {
    return `<g aria-hidden="true">
      <path d="M${x} ${y + 9}Q${x - 1} ${y + 28} ${x} 128" fill="none" stroke="${GREEN_DARK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M${x - 1} ${y + 20}Q${x - 14} ${y + 13} ${x - 21} ${y + 18}Q${x - 18} ${y + 30} ${x - 1} ${y + 27}Z" fill="${leafColor}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${x + 1} ${y + 31}Q${x + 15} ${y + 23} ${x + 21} ${y + 28}Q${x + 17} ${y + 40} ${x + 1} ${y + 38}Z" fill="${leafColor}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${x} ${y - 24}C${x + 7} ${y - 24} ${x + 8} ${y - 13} ${x + 12} ${y - 10}C${x + 23} ${y - 15} ${x + 28} ${y - 4} ${x + 22} ${y + 3}C${x + 27} ${y + 11} ${x + 18} ${y + 19} ${x + 9} ${y + 13}C${x + 4} ${y + 24} ${x - 8} ${y + 21} ${x - 10} ${y + 11}C${x - 22} ${y + 16} ${x - 28} ${y + 5} ${x - 20} ${y - 3}C${x - 27} ${y - 13} ${x - 17} ${y - 21} ${x - 8} ${y - 15}C${x - 5} ${y - 22} ${x - 3} ${y - 24} ${x} ${y - 24}Z" fill="${petals}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="${x}" cy="${y}" r="8" fill="${WOOD}" stroke="${INK}" stroke-width="3"/>
      <path d="M${x - 5} ${y - 4}Q${x - 1} ${y - 7} ${x + 3} ${y - 5}" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function planter() {
    return `<g aria-hidden="true">
      <path d="M201 135Q201 127 211 127H337Q347 127 347 137L334 193Q332 204 319 207H230Q217 204 214 193Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="194" y="119" width="160" height="24" rx="12" fill="${CORAL}" stroke="${INK}" stroke-width="4"/>
      <path d="M202 127Q274 121 346 127" fill="none" stroke="${CORAL_LIGHT}" stroke-width="3" stroke-linecap="round"/>
      <path d="M232 207Q274 213 318 207V216Q274 222 232 216Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M220 150Q231 155 241 151M300 151Q313 155 326 149" fill="none" stroke="${CORAL_DARK}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function earnedStar() {
    return `<g aria-hidden="true">
      <path d="M341 121Q349 90 340 57" fill="none" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>
      <rect x="315" y="12" width="42" height="46" rx="15" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <path d="M336 19L341 29L352 31L344 39L346 50L336 45L326 50L328 39L320 31L331 29Z" fill="#f3c955" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M326 18Q336 15 345 18" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  }

  function pictureSign(picture) {
    return `<g aria-hidden="true">
      <path d="M270 222V190" stroke="${WOOD_DARK}" stroke-width="9" stroke-linecap="round"/>
      <rect x="194" y="64" width="154" height="140" rx="14" fill="${PAPER_LIGHT}" stroke="${INK}" stroke-width="4"/>
      <image href="${picture}" x="204" y="70" width="134" height="128" preserveAspectRatio="xMidYMid meet"/>
      <circle cx="335" cy="219" r="18" fill="${LEAF}" stroke="${INK}" stroke-width="3"/>
      <path d="M326 219H344M338 212L345 219 338 226" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }

  function scene({ petArt = "", paid = false, picture = null } = {}) {
    const ownPicture = typeof picture === 'string' && picture.length <= 60000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(picture) ? picture : null;
    let pet = String(petArt || "");
    if (/^\s*<svg\b/i.test(pet)) {
      pet = pet.replace(/^\s*<svg\b([^>]*)>/i, (open, attrs) => {
        const cleaned = attrs.replace(/\s+preserveAspectRatio=("[^"]*"|'[^']*')/i, "");
        return `<svg${cleaned} preserveAspectRatio="xMidYMax meet" style="width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;">`;
      });
    }
    return `<div class="pf-scene" style="position:relative;display:block;width:100%;aspect-ratio:3/2;">
      <svg class="pf-garden" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style="position:absolute;inset:0;width:100%;height:100%;">
        <ellipse cx="181" cy="220" rx="163" ry="14" fill="${GREEN_DARK}" opacity=".14"/>
        <path d="M17 217Q15 209 29 207Q43 200 60 205Q79 197 98 204Q119 198 138 204Q160 197 179 204Q201 198 219 204Q241 197 259 203Q281 198 299 205Q319 199 333 207Q349 207 349 217Q351 226 337 229Q320 235 300 231Q280 237 260 232Q239 237 218 232Q198 238 178 233Q158 238 137 232Q116 237 96 232Q76 237 56 231Q35 236 23 228Q17 224 17 217Z" fill="${LEAF_DARK}"/>
        <path d="M24 216Q22 209 36 208Q50 201 66 206Q84 199 102 205Q122 200 140 206Q161 200 179 206Q201 200 218 206Q240 200 257 205Q279 200 296 207Q316 202 330 209Q343 210 343 218Q345 225 334 227Q317 232 298 228Q278 234 259 229Q239 234 218 229Q198 235 179 230Q158 235 138 229Q117 234 98 229Q78 234 59 228Q39 233 29 226Q24 222 24 216Z" fill="${LEAF}"/>
        <path d="M39 216Q72 209 104 214M160 221Q180 216 196 219" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linecap="round"/>
        <circle class="pf-pet-ground" cx="86" cy="220" r="1" fill="${GREEN}" opacity="0"/>
        ${ownPicture && paid ? earnedStar() : ""}
        ${ownPicture ? pictureSign(ownPicture) : `${bloom(220, 89, CORAL_LIGHT)}${bloom(267, 82, PAPER_LIGHT, LEAF)}${bloom(305, 91, "#f3c955", LEAF)}${planter()}`}
        ${!ownPicture && paid ? earnedStar() : ""}
      </svg>
      <div class="pf-pet" style="position:absolute;left:-4%;bottom:5%;width:56%;height:94%;display:flex;align-items:flex-end;justify-content:center;">
        ${pet}
      </div>
    </div>`;
  }

  ns.PracticeFinishArt = { scene };
})(window.MiftahGame || (window.MiftahGame = {}));
