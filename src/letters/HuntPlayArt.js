// Native paper-diorama art for Letter Hunt. Letter placement and interaction
// stay with LetterHunt.js; these pictures provide the props and quiet world.
(function (ns) {
  const INK = "#4a3620";
  const stroke = (width = 4) => `stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

  // Each picture is centered at (0,0). The paper medallions leave a calm,
  // high-contrast surface for the caller's live Arabic glyph.
  const THINGS = {
    cloud: {
      label: [0, 7], size: 40, box: [44, 44],
      art: `<ellipse cx="0" cy="43" rx="48" ry="8" fill="#3a8fc4" opacity=".16"/><path d="M-60 25Q-69 8-54-5Q-45-13-31-11Q-24-36-2-36Q15-48 31-30Q55-35 63-15Q76 8 54 25Q47 32 34 32H-43Q-57 32-60 25Z" fill="#c9bda4" ${stroke()}/><path d="M-51 18Q-57 7-46-2Q-37-9-26-4Q-22-29-1-29Q13-40 27-23Q49-28 55-11Q67 6 50 19Q43 25 31 25H-40Q-50 25-51 18Z" fill="#fffdf7"/><g class="hunt-face"><rect x="-27" y="-20" width="54" height="54" rx="13" fill="#fffaf0"/></g>`
    },
    kite: {
      label: [0, -1], size: 34, box: [44, 44],
      art: `<ellipse cx="0" cy="66" rx="27" ry="6" fill="#3a8fc4" opacity=".14"/><path d="M0-58L39-2L0 54L-39-2Z" fill="#c25a49" ${stroke()}/><path d="M0-48L31-2L0 43L-31-2Z" fill="#ffa798"/><path d="M0-48V43M-31-2H31" fill="none" stroke="#ee806f" stroke-width="3" stroke-linecap="round"/><path d="M-23-13L0-48L0-2Z" fill="#fffaf0" opacity=".86"/><path d="M0-2L31-2L0 43Z" fill="#ee806f"/><path d="M0 54Q-18 69-4 82Q12 94-3 108Q-14 119-3 130" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/><path d="M-13 73L-3 81L6 73M-9 101L-2 108L6 101" fill="none" stroke="#c69434" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><g class="hunt-face"><rect x="-27" y="-29" width="54" height="54" rx="13" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g>`
    },
    trunk: {
      label: [0, 17], size: 30, box: [44, 44],
      art: `<ellipse cx="0" cy="69" rx="44" ry="8" fill="#2f5c46" opacity=".22"/><path d="M-25 68Q-18 53-19 35L-18-22Q-19-43-7-47H7Q19-43 18-22L19 35Q18 54 27 68Q3 77-25 68Z" fill="#70501b" ${stroke()}/><path d="M-17 59Q-11 44-12 29L-11-22Q-13-36-5-39H5Q13-36 11-22L12 29Q11 44 18 59Q1 65-17 59Z" fill="#c69434"/><path d="M-6 39V53M6 20V43M-5-17V-3" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="17" rx="13" ry="17" fill="#70501b"/><ellipse cx="0" cy="17" rx="8" ry="12" fill="#3e5236"/><path d="M-8-35L-31-58M7-34L29-61" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M-8-35L-31-58M7-34L29-61" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><circle cx="-40" cy="-68" r="25" fill="#4e9677" ${stroke()}/><circle cx="-17" cy="-93" r="31" fill="#2f5c46" ${stroke()}/><circle cx="16" cy="-96" r="33" fill="#4e9677" ${stroke()}/><circle cx="42" cy="-68" r="26" fill="#2f5c46" ${stroke()}/><circle cx="-5" cy="-56" r="29" fill="#4e9677" ${stroke()}/><path d="M-61-70Q-62-91-43-91Q-32-112-13-99Q-1-117 17-101Q40-111 51-92Q68-87 64-68Q58-48 39-47H-41Q-59-50-61-70Z" fill="#7fce54" ${stroke()}/><path d="M-45-83Q-35-99-20-87M-4-99Q7-108 19-96M30-86Q39-95 48-86" fill="none" stroke="#b7e779" stroke-width="4" stroke-linecap="round"/><g class="hunt-face"><rect x="-27" y="-10" width="54" height="54" rx="13" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g>`
    },
    rock: {
      label: [0, 1], size: 36, box: [44, 44],
      art: `<ellipse cx="0" cy="39" rx="52" ry="8" fill="#2f5c46" opacity=".18"/><path d="M-59 24Q-68 1-47-13L-26-31Q-13-41 2-31Q23-39 37-20Q63-9 61 17Q61 34 42 38H-42Q-57 36-59 24Z" fill="#a89478" ${stroke()}/><path d="M-51 18Q-57 0-39-11L-23-25Q-12-33 1-24Q19-32 31-17Q52-8 52 15Q51 28 37 30H-40Q-51 29-51 18Z" fill="#c9bda4"/><path d="M-35-10Q-17-26 1-20M15-20Q30-22 39-10" fill="none" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/><path d="M-39 13Q-21 8-8 13M18 19Q29 15 39 19" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round"/><g class="hunt-face"><rect x="-29" y="-27" width="58" height="56" rx="16" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g>`
    },
    crate: {
      label: [0, 4], size: 32, box: [48, 48],
      art: `<ellipse cx="0" cy="48" rx="46" ry="7" fill="#2f5c46" opacity=".22"/><path d="M-45-31L-34-41H34L45-31V39L35 47H-35L-45 39Z" fill="#70501b" ${stroke()}/><path d="M-37-28L-29-35H29L37-28V34L30 40H-30L-37 34Z" fill="#c69434"/><path d="M-37-27H37V-12H-37Z" fill="#ffe49a"/><path d="M-37 25H37V34L30 40H-30L-37 34Z" fill="#a89478"/><path d="M-26-11V24M26-11V24M-37 8H37" fill="none" stroke="#70501b" stroke-width="3" stroke-linecap="round"/><path d="M-25-27V-15M25-27V-15" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round"/><g class="hunt-face"><rect x="-29" y="-24" width="58" height="56" rx="10" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g>`
    },
    lily: {
      label: [-2, 1], size: 32, box: [44, 44],
      art: `<ellipse cx="0" cy="28" rx="57" ry="8" fill="#2f5c46" opacity=".2"/><path d="M-62 9Q-57-14-33-18Q-6-25 23-17Q50-15 62 4Q56 22 30 25H-35Q-57 22-62 9Z" fill="#2f5c46" ${stroke()}/><path d="M-52 5Q-47-10-29-13Q-5-19 20-13Q43-12 53 2Q47 16 27 18H-31Q-49 16-52 5Z" fill="#7fce54"/><path d="M-6 4Q-1 7 5 4" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><circle cx="43" cy="-7" r="9" fill="#ee806f" stroke="#4a3620" stroke-width="2.4"/><circle cx="43" cy="-7" r="3" fill="#f3c955"/><g class="hunt-face"><rect x="-29" y="-26" width="54" height="54" rx="13" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g>`
    },
    sail: {
      label: [28, -7], size: 30, box: [44, 44],
      art: `<ellipse cx="0" cy="56" rx="49" ry="7" fill="#2f5c46" opacity=".2"/><path d="M-50 24Q-39 40-24 43H25Q42 40 50 24L40 43H-39Z" fill="#70501b" ${stroke()}/><path d="M-44 23Q-35 36-22 38H24Q37 36 44 23Z" fill="#c69434"/><path d="M-32 25L-22 37M-15 27L-10 38M8 27L5 38M26 26L20 37" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/><path d="M-2 26V-77" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M2-71Q25-59 52-27L56 15H2Z" fill="#c25a49" ${stroke(3)}/><path d="M7-62Q27-51 47-26L50 8H7Z" fill="#fffaf0"/><g class="hunt-face"><rect x="1" y="-34" width="54" height="54" rx="13" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g><path d="M-2-75Q-21-53-37-25V17H-3Z" fill="#ffe49a" stroke="#4a3620" stroke-width="3" stroke-linejoin="round" opacity=".96"/>`
    },
    lantern: {
      label: [0, -4], size: 34, box: [44, 44],
      art: `<ellipse cx="0" cy="56" rx="35" ry="7" fill="#2f5c46" opacity=".2"/><path d="M-18 32L-21 52M18 32L21 52" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M0-73Q-21-73-22-55Q-21-43-8-39V-34" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M-9-57Q-8-69 0-68Q8-69 9-57" fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round"/><path d="M-32-39Q-32-48-22-48H22Q32-48 32-39V26Q32 35 22 35H-22Q-32 35-32 26Z" fill="#70501b" ${stroke()}/><path d="M-25-37Q-25-42-19-42H19Q25-42 25-37V23Q25 29 19 29H-19Q-25 29-25 23Z" fill="#c69434"/><path d="M0 18Q-8 11 0 0Q8 11 0 18Z" fill="#ffa06e" stroke="#e8743c" stroke-width="2.4" stroke-linejoin="round"/><g class="hunt-face"><rect x="-27" y="-31" width="54" height="54" rx="13" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g><path d="M-32-45H32M-32 32H32" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M-27-45H27M-27 32H27" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>`
    },
    flag: {
      label: [21, -40], size: 34, box: [44, 44],
      art: `<ellipse cx="-2" cy="68" rx="20" ry="6" fill="#2f5c46" opacity=".2"/><path d="M-4 66V-70" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M-4 65V-65" stroke="#c69434" stroke-width="3" stroke-linecap="round"/><path d="M-4-65H47L37-40L47-15H-4Z" fill="#3a8fc4" ${stroke()}/><g class="hunt-face"><rect x="-6" y="-67" width="54" height="54" rx="13" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g>`
    },
    shell: {
      label: [0, 3], size: 28, box: [44, 44],
      art: `<ellipse cx="0" cy="38" rx="38" ry="7" fill="#2f5c46" opacity=".2"/><path d="M-47 26Q-55-17-22-32Q0-46 22-32Q55-17 47 26Q44 37 0 38Q-44 37-47 26Z" fill="#c25a49" ${stroke()}/><path d="M-40 23Q-46-13-19-26Q0-38 19-26Q46-13 40 23Q37 31 0 32Q-37 31-40 23Z" fill="#ffa798"/><path d="M0-34V27M-25-24L-14 29M25-24L14 29M-39-8L-27 26M39-8L27 26" fill="none" stroke="#ee806f" stroke-width="3" stroke-linecap="round"/><path d="M-31-16Q-21-28-11-30M11-30Q22-27 31-16" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/><g class="hunt-face"><path d="M-28-25Q0-34 28-25V31Q0 40-28 31Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/></g>`
    },
    pot: {
      label: [0, 17], size: 30, box: [44, 44],
      art: `<ellipse cx="0" cy="70" rx="31" ry="7" fill="#2f5c46" opacity=".22"/><path d="M-30-13H30L23 57Q0 66-23 57Z" fill="#8a3a2d" ${stroke()}/><path d="M-24-9H24L18 52Q0 59-18 52Z" fill="#c25a49"/><path d="M-31 48Q0 55 29 48L28 54Q0 65-28 54Z" fill="#8a3a2d"/><g class="hunt-face"><rect x="-27" y="-10" width="54" height="54" rx="9" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/></g><path d="M-35-20Q-35-25-29-25H29Q35-25 35-20V-10Q35-5 29-5H-29Q-35-5-35-10Z" fill="#c25a49" ${stroke(3)}/><path d="M-28-19H28V-12H-28Z" fill="#ffa798"/><path d="M0-22Q-2-47-18-58M1-22Q10-48 27-54M0-26Q0-52 1-69" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M-18-58Q-36-60-34-75Q-18-79-14-61M27-54Q42-65 36-77Q19-75 21-57M1-69Q-12-83 0-94Q13-86 6-68" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M-29-58Q-26-71-15-70M25-59Q32-70 36-69M-3-83Q0-88 4-84" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/><circle cx="0" cy="-50" r="7" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/>`
    }
  };

  function background(land = "meadow", portrait = false) {
    const night = land === "night";
    const lagoon = land === "lagoon" || land === "river";
    const peaks = land === "peaks";
    const width = portrait ? 600 : 800;
    const height = portrait ? 860 : 600;
    const sky = night ? "#4a4d84" : (land === "orchard" || peaks ? "#ccfbef" : "#96ecff");
    const far = night ? "#4e9677" : peaks ? "#e5dcc8" : "#b7e779";
    const ground = night ? "#2f5c46" : (peaks ? "#b7e779" : "#7fce54");
    const low = night ? "#3e5236" : "#4e9677";
    const cloud = `<path d="M34 176Q24 162 38 152Q47 146 59 151Q64 132 81 133Q95 127 106 142Q125 136 132 151Q144 168 126 178H47Q37 178 34 176Z" fill="#fffdf7" opacity=".74"/><path d="M${width - 142} 208Q${width - 151} 194 ${width - 138} 184Q${width - 129} 178 ${width - 117} 183Q${width - 111} 165 ${width - 94} 166Q${width - 80} 160 ${width - 69} 175Q${width - 51} 169 ${width - 43} 184Q${width - 34} 201 ${width - 50} 210H${width - 128}Q${width - 138} 210 ${width - 142} 208Z" fill="#fffaf0" opacity=".54"/>`;
    const moon = night ? `<circle cx="${width - 82}" cy="80" r="27" fill="#c69434"/><circle cx="${width - 91}" cy="72" r="26" fill="#4a4d84"/><circle cx="70" cy="66" r="3" fill="#ffe49a"/><circle cx="220" cy="105" r="2.4" fill="#ffe49a"/><circle cx="${width - 185}" cy="82" r="2.4" fill="#ffe49a"/>` : `<circle cx="${width - 74}" cy="72" r="29" fill="#ffe49a"/><circle cx="${width - 82}" cy="66" r="21" fill="#fffaf0" opacity=".7"/>`;
    const mountain = peaks ? (portrait ? `<path d="M-20 475L61 315L137 414L222 278L313 424L407 300L493 425L581 323L630 476Z" fill="#c9bda4"/><path d="M-20 493L61 350L135 435L222 316L309 445L407 337L490 445L581 357L630 493Z" fill="#e5dcc8"/><path d="M61 350L75 373L61 367L48 384ZM222 316L239 341L223 334L207 349ZM407 337L423 359L407 353L392 368ZM581 357L595 379L581 373L567 389Z" fill="#fffdf7"/>` : `<path d="M-20 454L108 246L199 366L302 214L424 379L530 250L636 382L730 234L830 411V560H-20Z" fill="#c9bda4"/><path d="M-20 478L108 285L195 394L302 255L416 405L530 285L632 405L730 270L830 438V570H-20Z" fill="#e5dcc8"/><path d="M108 285L126 314L108 307L91 326ZM302 255L325 286L304 278L284 294ZM530 285L550 311L532 305L514 321ZM730 270L749 300L731 292L715 309Z" fill="#fffdf7"/>`) : `<path d="M-20 454Q88 352 180 403Q271 306 366 398Q459 333 551 400Q667 326 820 402V580H-20Z" fill="${far}"/>`;
    const water = lagoon
      ? portrait
        ? `<path d="M300 365Q443 331 620 367V880H320Q297 840 307 817Q353 779 324 739Q283 695 310 650Q354 605 322 565Q283 521 311 476Q352 431 319 391Z" fill="#62cdf4"/><path d="M300 365Q443 331 620 367M300 365L319 391Q352 431 311 476Q283 521 322 565Q354 605 310 650Q283 695 324 739Q353 779 307 817Q297 840 320 880" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/><path d="M380 482q29-8 56 0m57 99q28-8 55 0m-144 142q30-8 57 0" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>`
        : `<path d="M350 365Q390 354 428 365Q472 376 505 345Q551 310 600 310Q642 312 682 321Q745 335 820 285V620H350Q382 575 350 535Q332 500 370 462Q400 424 356 390Z" fill="#62cdf4"/><path d="M350 365Q390 354 428 365Q472 376 505 345Q551 310 600 310Q642 312 682 321" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/><path d="M470 430q30-8 58 0m109 76q30-8 58 0m-180 79q30-8 57 0" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>`
      : "";
    const terrain = portrait
      ? `${lagoon ? `<path d="M-20 350Q150 312 300 350Q465 380 620 330V880H-20Z" fill="${far}"/>` : `<path d="M-20 405Q130 354 300 388Q465 425 620 366V880H-20Z" fill="${far}"/>`}<path d="M-20 530Q155 475 321 516Q473 551 620 505V880H-20Z" fill="${ground}"/><path d="M-20 716Q142 679 298 708Q459 744 620 697V880H-20Z" fill="${low}" opacity=".46"/>${water}`
      : `<path d="M-20 352Q148 304 302 340Q485 382 658 329Q747 306 820 332V620H-20Z" fill="${far}"/><path d="M-20 418Q180 370 363 408Q601 458 820 387V620H-20Z" fill="${ground}"/><path d="M-20 503Q175 462 362 493Q573 528 820 463V620H-20Z" fill="${low}" opacity=".46"/>${water}`;
    const grasses = lagoon
      ? portrait
        ? `<g fill="none" stroke-linecap="round"><path d="M48 742q8-22 14-28m-14 28q-7-18-15-21M90 800q7-17 12-21m-12 21q-6-14-12-18M222 680q7-17 12-21m-12 21q-6-14-12-18" stroke="#2f5c46" stroke-width="3"/><path d="M83 532q7-17 12-21m-12 21q-6-14-12-18m160 18q7-17 12-21m-12 21q-6-14-12-18" stroke="#b7e779" stroke-width="2.4"/></g>`
        : `<g fill="none" stroke-linecap="round"><path d="M32 504q8-22 14-28m-14 28q-7-18-15-21M90 547q7-17 12-21m-12 21q-6-14-12-18m210-1q7-18 13-23m-13 23q-7-14-14-17" stroke="#2f5c46" stroke-width="3"/><path d="M84 467q7-17 12-21m-12 21q-6-14-12-18m214-2q7-17 12-21m-12 21q-6-14-12-18" stroke="#b7e779" stroke-width="2.4"/></g>`
      : portrait
        ? `<g fill="none" stroke-linecap="round"><path d="M48 742q8-22 14-28m-14 28q-7-18-15-21m521 17q-8-22-14-28m14 28q7-18 15-21" stroke="#2f5c46" stroke-width="3"/><path d="M83 800q7-17 12-21m-12 21q-6-14-12-18m447 12q7-17 12-21m-12 21q-6-14-12-18" stroke="#b7e779" stroke-width="2.4"/></g>`
        : `<g fill="none" stroke-linecap="round"><path d="M32 504q8-22 14-28m-14 28q-7-18-15-21m753 18q-8-22-14-28m14 28q7-18 15-21" stroke="#2f5c46" stroke-width="3"/><path d="M90 547q7-17 12-21m-12 21q-6-14-12-18m657 16q7-17 12-21m-12 21q-6-14-12-18" stroke="#b7e779" stroke-width="2.4"/></g>`;
    const peaksOnTop = mountain;
    return `<rect width="${width}" height="${height}" fill="${sky}"/>${moon}${night ? "" : cloud}${peaksOnTop}${terrain}<ellipse cx="${width / 2}" cy="${height - 9}" rx="${portrait ? 250 : 355}" ry="10" fill="#2f5c46" opacity=".15"/>${grasses}`;
  }

  function basket() {
    return `<g aria-hidden="true"><ellipse cx="0" cy="31" rx="49" ry="8" fill="#2f5c46" opacity=".2"/><path d="M-37 0Q-35-31 0-31Q35-31 37 0" fill="none" stroke="#70501b" stroke-width="4" stroke-linecap="round"/><path d="M-36-2L-29 27Q0 39 29 27L36-2Z" fill="#c69434" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M-31 5H31M-28 15H28M-24 25H24" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/><path d="M-18 0L-14 29M0 0V32M18 0L14 29" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/><path d="M-35-3Q0 4 35-3" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/></g>`;
  }

  // Small responses live beside the prop, outside the letter medallion.
  // They are revealed only by a child's touch or a successful find.
  function reaction(kind) {
    const flower = (x, y, colour) => `<g transform="translate(${x} ${y})"><path d="M0 11V24" fill="none" stroke="#2f5c46" stroke-width="3"/><path d="M0 1C-17-16-22 7-9 10C-17 24 5 29 8 14C25 17 25-5 10-4C9-20-10-18 0 1Z" fill="${colour}" ${stroke(2.4)}/><circle cx="2" cy="7" r="5" fill="#f3c955" ${stroke(1.6)}/></g>`;
    const bug = `<g transform="translate(29 -38)"><path d="M-6-8L-10-14M6-8L10-14" fill="none" ${stroke(2.4)}/><ellipse cy="5" rx="15" ry="18" fill="#ee806f" ${stroke(3)}/><path d="M0-8V23" ${stroke(2.4)}/><circle cy="-9" r="7" fill="#4a3620"/><circle cx="-7" cy="3" r="3" fill="#4a3620"/><circle cx="7" cy="12" r="3" fill="#4a3620"/><circle cx="-2" cy="-11" r="1.6" fill="#fffaf0"/></g>`;
    const ripples = y => `<g transform="translate(0 ${y})" fill="none" stroke="#3a8fc4" stroke-width="3" stroke-linecap="round"><path d="M-66-3Q-77 4-65 10M66-3Q77 4 65 10"/><path d="M-78-9Q-94 4-78 17M78-9Q94 4 78 17"/></g>`;
    switch (kind) {
      case 'cloud': return `<g fill="#62cdf4" ${stroke(2.4)}>${[-32,0,32].map((x,i)=>`<path class="hunt-raindrop" style="--drop-delay:${i*90}ms" d="M${x} 40q-14 19 0 21q14-2 0-21Z"/>`).join('')}</g>`;
      case 'kite': return `<path d="M-51-28Q-74-14-60 4M45 19Q68 2 58-17" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/>`;
      case 'flag': return `<path d="M57-62q17 5 23-1M60-40q17 5 23-1M54-18q17 5 23-1" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/>`;
      case 'trunk': return flower(-36,-36,'#ffa798')+flower(38,-44,'#ffe49a');
      case 'pot': return flower(-16,-51,'#ffa798')+flower(16,-61,'#ffe49a');
      case 'rock': case 'crate': return bug;
      case 'lily': return ripples(16);
      case 'sail': return ripples(43);
      case 'shell': return `<circle cy="-27" r="13" fill="#fffdf7" ${stroke(3)}/><circle cx="-4" cy="-31" r="4" fill="#ffe49a"/><path d="M-25-34l-6-6M25-34l6-6M0-48v-8" fill="none" stroke="#f3c955" stroke-width="3" stroke-linecap="round"/>`;
      case 'lantern': return `<ellipse cy="-5" rx="52" ry="59" fill="#f3c955" opacity=".2"/><path d="M-47-42l-9-8M47-42l9-8M-53-5h-12M53-5h12M-47 30l-9 8M47 30l9 8" fill="none" stroke="#f3c955" stroke-width="4" stroke-linecap="round"/>`;
      default: return '';
    }
  }
  ns.HuntPlayArt = { things: THINGS, THINGS, background, basket, reaction };
})(window.MiftahGame || (window.MiftahGame = {}));
