// Wordless toy-chest family pictures. Each picture is built from the parts
// that make the object recognisable, using the Letter Garden pet language.
(function (ns) {
  const I = '#4a3620';
  const K = (w = 4) => `stroke="${I}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const D = (c, w = 2.4) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const shine = (x, y, rx, ry, rot = -24) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#fffdf7" opacity=".72"/>`;
  const wrap = (body) => `<svg viewBox="0 0 100 88" aria-hidden="true">${body}</svg>`;

  function play() {
    return wrap(`<ellipse cx="50" cy="75" rx="37" ry="5" fill="#2f5c46" opacity=".16"/>
      <!-- rounded crate body, rim and two broad slats -->
      <path d="M15 37Q15 32 21 32H79Q85 32 85 38L81 71Q80 76 74 76H26Q20 76 19 71Z" fill="#ee806f" ${K()}/>
      <path d="M17 44H83M20 62H80" ${D('#c25a49', 3)}/>
      <path d="M12 35Q12 30 18 30H82Q88 30 88 35V42Q88 46 83 46H17Q12 46 12 42Z" fill="#ffa798" ${K(3)}/>
      <path d="M24 48V59M76 48V59" ${D('#c25a49', 3)}/>
      <path d="M22 34H35" ${D('#fffdf7', 2.4)}/>${shine(28, 38, 8, 2.5)}
      <!-- ball peeking over the rim -->
      <circle cx="61" cy="25" r="13" fill="#f3c955" ${K(3)}/>
      <path d="M54 15Q62 23 58 36M67 14Q62 23 70 34" ${D('#c69434', 2.4)}/>
      <ellipse cx="57" cy="18" rx="4" ry="2" fill="#fffdf7" opacity=".75"/>`);
  }
  function listen() {
    return wrap(`<ellipse cx="50" cy="76" rx="31" ry="5" fill="#2f5c46" opacity=".16"/>
      <!-- drum body with projecting hoops and tension lugs -->
      <path d="M23 31Q50 40 77 31L73 65Q50 76 27 65Z" fill="#ee806f" ${K()}/>
      <ellipse cx="50" cy="31" rx="27" ry="10" fill="#fffaf0" ${K(3)}/>
      <ellipse cx="50" cy="33" rx="20" ry="5.5" fill="#e5dcc8" ${K(2.4)}/>
      <path d="M26 42Q50 51 74 42M27 58Q50 67 73 58" ${D('#c25a49', 3)}/>
      <path d="M29 37L31 61M71 37L69 61M43 40L44 66M57 40L56 66" ${D('#ffa798', 2.4)}/>
      <path d="M18 13L49 28" ${D(I, 4)}/><path d="M18 13L49 28" ${D('#c69434', 3)}/>
      <ellipse cx="17" cy="12" rx="8" ry="5" transform="rotate(25 17 12)" fill="#c69434" ${K(2.4)}/>
      <path d="M33 27Q43 23 52 26" ${D('#fffdf7', 2.4)}/>${shine(37, 31, 7, 2)}`);
  }
  function read() {
    return wrap(`<ellipse cx="50" cy="73" rx="38" ry="5" fill="#2f5c46" opacity=".16"/>
      <!-- open cover, rounded page block and central binding -->
      <path d="M12 29Q31 22 49 34V69Q31 58 13 66Z" fill="#ee806f" ${K()}/>
      <path d="M88 29Q69 22 51 34V69Q69 58 87 66Z" fill="#ee806f" ${K()}/>
      <path d="M17 31Q32 27 47 36V63Q31 55 17 60Z" fill="#fffaf0" ${K(3)}/>
      <path d="M83 31Q68 27 53 36V63Q69 55 83 60Z" fill="#fffaf0" ${K(3)}/>
      <path d="M50 34V68" ${D('#c25a49', 3)}/>
      <path d="M23 38Q33 35 41 40M23 45Q33 42 41 47M59 40Q68 35 77 38M59 47Q68 42 77 45" ${D('#c69434', 2.4)}/>
      <path d="M19 32Q30 29 39 33" ${D('#fffdf7', 2.4)}/>${shine(27, 31, 7, 2)}`);
  }
  function think() {
    return wrap(`<ellipse cx="50" cy="75" rx="37" ry="5" fill="#2f5c46" opacity=".16"/>
      <!-- low play board, with four chunky interlocking pieces -->
      <rect x="13" y="22" width="74" height="51" rx="10" fill="#c69434" ${K()}/>
      <path d="M20 29H80V66H20Z" fill="#ffe49a" ${K(3)}/>
      <path d="M20 47H40Q40 40 47 40Q54 40 54 47H80M50 29V40M50 54V66" ${D('#70501b', 3)}/>
      <path d="M20 29H43Q43 36 50 36V47H40Q40 54 33 54Q26 54 26 47H20Z" fill="#ee806f" ${K(2.4)}/>
      <path d="M57 29H80V44H72Q65 44 65 51Q65 58 72 58H80V66H57V54Q50 54 50 47Q50 40 57 40Z" fill="#96ecff" ${K(2.4)}/>
      <path d="M25 32H35" ${D('#fffdf7', 2.4)}/>${shine(29, 34, 5, 2)}`);
  }
  function write() {
    return wrap(`<ellipse cx="51" cy="76" rx="30" ry="5" fill="#2f5c46" opacity=".16"/>
      <!-- broad rounded pencil pot with rolled lip and two pencils -->
      <path d="M26 43Q50 48 74 43L70 72Q50 78 30 72Z" fill="#96ecff" ${K()}/>
      <ellipse cx="50" cy="44" rx="24" ry="8" fill="#ccfbef" ${K(3)}/>
      <path d="M34 52L36 68M50 54V71M66 52L64 68" ${D('#3a8fc4', 2.4)}/>
      <path d="M35 45L30 16Q29 12 33 11L39 10L47 44Z" fill="#f3c955" ${K(3)}/>
      <path d="M30 16L35 45M36 14L42 42" ${D('#c69434', 2.4)}/>
      <path d="M30 16L32 7Q33 4 36 7L39 10Z" fill="#c69434" ${K(2.4)}/>
      <path d="M58 44L62 14Q63 10 67 11L72 12L69 46Z" fill="#ee806f" ${K(3)}/>
      <path d="M63 15L61 42M69 17L67 43" ${D('#c25a49', 2.4)}/>
      <path d="M62 14L67 6Q69 3 71 7L72 12Z" fill="#c25a49" ${K(2.4)}/>
      <path d="M35 46H47" ${D('#fffdf7', 2.4)}/>${shine(40, 49, 6, 2)}`);
  }
  function explore() {
    return wrap(`<ellipse cx="49" cy="76" rx="34" ry="5" fill="#2f5c46" opacity=".16"/>
      <!-- stout can with high handle, broad spout and watering rose -->
      <path d="M27 38Q27 31 35 31H59Q68 31 69 40L72 67Q72 73 65 74H35Q28 73 28 67Z" fill="#7fce54" ${K()}/>
      <path d="M34 39Q43 35 52 39V57Q43 52 34 57Z" fill="#b7e779" ${K(2.4)}/>
      <path d="M37 42Q43 40 48 42" ${D('#fffdf7', 2.4)}/>${shine(39, 42, 5, 2)}
      <path d="M31 38Q15 29 17 48Q18 57 29 58" fill="none" ${K(4)}/>
      <path d="M62 44L77 32Q81 29 84 33L89 40Q91 44 86 46L70 54" fill="#93ab6c" ${K(3)}/>
      <ellipse cx="86" cy="38" rx="7" ry="5" transform="rotate(25 86 38)" fill="#c4d39b" ${K(2.4)}/>
      <path d="M45 34Q44 25 49 19" ${D('#4e9677', 3)}/>
      <path d="M48 25Q38 25 37 17Q46 15 49 23M48 22Q51 12 60 13Q59 21 49 25" fill="#b7e779" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 23Q43 19 39 18M49 21Q53 16 57 15" ${D('#4e9677', 2.4)}/>
      <path d="M83 49Q90 52 92 57M77 54Q82 59 82 64" ${D('#62cdf4', 2.4)}/>`);
  }

  const families = { play, listen, read, think, write, explore };
  ns.ToyChestArt = {
    family(id) { return (families[id] || play)(); },
  };
})(window.MiftahGame = window.MiftahGame || {});
