// Native paper-diorama props for the self-paced Friend Play puppet show.
// The caller owns the live friend art and all curtain motion.
(function (ns) {
  const INK = "#4a3620";
  const stroke = (width = 4) => `stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

  function booth() {
    return `<svg class="ff-booth" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="190" rx="105" ry="7" fill="#3e5236" opacity=".2"/>
      <!-- Broad, low planked stage base -->
      <path d="M19 157Q19 151 27 151H213Q221 151 221 158V181Q221 188 213 188H27Q19 188 19 181Z" fill="#70501b" ${stroke()}/>
      <path d="M27 156H213Q216 156 216 160V178Q216 182 211 182H29Q24 182 24 178V160Q24 156 27 156Z" fill="#c69434"/>
      <path d="M27 163H213M27 174H213" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M33 158V162M75 158V162M119 158V162M164 158V162M207 158V162M53 170V173M98 170V173M145 170V173M188 170V173" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M31 158H91" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/>
      <!-- Side uprights and their inset timber panels frame the clear stage slot -->
      <path d="M28 43Q28 36 36 36H57Q64 36 64 44V157H28Z" fill="#70501b" ${stroke()}/>
      <path d="M35 45Q35 42 39 42H56V150H35Z" fill="#c69434"/>
      <path d="M176 44Q176 36 184 36H204Q212 36 212 44V157H176Z" fill="#70501b" ${stroke()}/>
      <path d="M184 42H201Q205 42 205 46V150H184Z" fill="#c69434"/>
      <path d="M43 51V141M193 51V141" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M39 53V76M189 53V76" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Overhanging scalloped canopy, with curved valance and a small ridge cap -->
      <path d="M17 43Q20 32 31 28Q34 12 49 12Q60 1 75 9Q89 1 102 9Q119 0 133 9Q149 1 162 10Q179 2 191 12Q207 10 211 28Q221 31 223 43Q224 49 217 50H23Q16 50 17 43Z" fill="#c25a49" ${stroke()}/>
      <path d="M24 38Q32 31 40 38Q48 46 56 38Q64 31 72 38Q80 46 88 38Q96 31 104 38Q112 46 120 38Q128 31 136 38Q144 46 152 38Q160 31 168 38Q176 46 184 38Q192 31 200 38Q208 46 216 38V44Q208 52 200 44Q192 37 184 44Q176 52 168 44Q160 37 152 44Q144 52 136 44Q128 37 120 44Q112 52 104 44Q96 37 88 44Q80 52 72 44Q64 37 56 44Q48 52 40 44Q32 37 24 44Z" fill="#ee806f"/>
      <path d="M38 21Q52 11 66 18M88 15Q100 8 111 15M137 15Q150 9 163 18M177 20Q188 14 198 22" fill="none" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/>
      <path d="M25 47H215" fill="none" stroke="#8a3a2d" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Curtain groups cover only the central opening while closed. CSS opens them outward. -->
      <g class="ff-curtain-left">
        <path d="M64 40Q78 35 92 40Q105 35 120 40V156Q108 151 96 156Q80 151 64 156Z" fill="#8a3a2d" ${stroke(3)}/>
        <path d="M68 43Q80 39 92 44Q104 39 116 44V151Q105 147 95 152Q81 148 68 152Z" fill="#ee806f"/>
        <path d="M74 47Q80 91 74 147M91 45Q96 92 91 149M107 46Q112 92 107 149" fill="none" stroke="#c25a49" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M67 145Q80 142 94 146Q105 142 116 146" fill="none" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/>
        <path d="M62 83Q70 78 76 84L72 94Q66 97 61 92Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="68" cy="87" r="2.4" fill="#fffdf7"/>
      </g>
      <g class="ff-curtain-right">
        <path d="M120 40Q135 35 149 40Q163 35 176 40V156Q160 151 144 156Q132 151 120 156Z" fill="#8a3a2d" ${stroke(3)}/>
        <path d="M124 44Q136 39 148 44Q160 39 172 43V152Q159 148 145 152Q135 147 124 151Z" fill="#ee806f"/>
        <path d="M133 46Q128 92 133 149M149 45Q144 92 149 149M166 47Q160 91 166 147" fill="none" stroke="#c25a49" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M124 146Q135 142 146 146Q160 142 173 145" fill="none" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/>
        <path d="M178 83Q170 78 164 84L168 94Q174 97 179 92Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="172" cy="87" r="2.4" fill="#fffdf7"/>
      </g>
    </svg>`;
  }

  function perch() {
    return `<svg class="ff-perch" viewBox="0 0 180 140" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="132" rx="66" ry="5" fill="#3e5236" opacity=".18"/>
      <path d="M43 88Q90 81 137 88L132 99Q90 104 48 99Z" fill="#70501b" ${stroke(3)}/>
      <path d="M49 89Q90 84 131 89L128 95Q90 99 52 95Z" fill="#c69434"/>
      <path d="M58 97L54 121Q90 128 126 121L122 97" fill="#70501b" ${stroke(3)}/>
      <path d="M63 101L60 117Q90 122 120 117L117 101Q90 105 63 101Z" fill="#c69434"/>
      <path d="M52 119Q90 126 128 119Q132 120 132 125V128Q90 136 48 128V125Q48 120 52 119Z" fill="#70501b" ${stroke(3)}/>
      <path d="M57 122Q90 128 123 122" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M70 91L68 95M90 89V95M110 91L112 95" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M57 105L60 105M120 105L123 105" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function eye() {
    return `<svg class="ff-help-eye" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M7 32Q18 15 32 15Q46 15 57 32Q46 49 32 49Q18 49 7 32Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="33" cy="32" r="11" fill="#7fce54" stroke="#4a3620" stroke-width="3"/>
      <circle cx="34" cy="33" r="5" fill="#2b1e12"/>
      <circle cx="30" cy="28" r="3" fill="#fffdf7"/>
      <path d="M13 31Q21 20 31 20" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  // Original curtain retained for comparison and rollback.
  const classic = char => `<button type="button" class="ff-curtain" aria-label="Hear my friend's name"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M14 18H106V102H14Z" fill="#c25a49" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M60 18V102" stroke="#8a3a2d" stroke-width="3"/><path d="M28 18Q34 60 26 102M46 18Q50 60 44 102M74 18Q70 60 76 102M92 18Q86 60 94 102" fill="none" stroke="#ee806f" stroke-width="3"/><text x="60" y="66" text-anchor="middle" font-size="40" fill="#ffe49a" font-family="ui-rounded, system-ui">?</text></svg><span class="ff-peek" hidden>${ns.LetterFriends.art(char, { size: 90 })}</span></button>`;

  ns.FriendPlayArt = { booth, perch, eye, classic, boothViewBox: "0 0 240 200", perchViewBox: "0 0 180 140", slot: { x: 120, y: 103, width: 108, height: 108 } };
})(window.MiftahGame || (window.MiftahGame = {}));
