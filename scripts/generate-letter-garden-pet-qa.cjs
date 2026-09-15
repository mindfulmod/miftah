// Generate a disposable live-art pet grid for the isolated local QA origin.
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'letters.html'),'utf8');
const qaDir=path.join(root,'.qa');

const hrefs=[...source.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)].map(match=>match[1]);
const scripts=[...source.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(match=>match[1]);
const wantedStyles=['vendor/fonts/fonts.css','styles/letters.css','styles/letters-animals.css'];
const wantedScripts=['src/letters/LettersAnimalArt.js','src/letters/LettersArt.js'];
const liveUrl=(urls,wanted)=>urls.find(url=>url.split('?')[0]===wanted);

const styleUrls=wantedStyles.map(wanted=>liveUrl(hrefs,wanted));
const scriptUrls=wantedScripts.map(wanted=>liveUrl(scripts,wanted));
if(styleUrls.some(url=>!url)||scriptUrls.some(url=>!url)){
  throw new Error('letters.html no longer exposes the expected live pet art dependencies');
}

const html=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <base href="/">
  <title>Letter Garden pet art QA</title>
  ${styleUrls.map(url=>`<link rel="stylesheet" href="${url}">`).join('\n  ')}
  <style>
    :root{color-scheme:light}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;background:#ccfbef;color:#4a3620;font-family:ui-rounded,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .qa-page{width:min(1000px,calc(100vw - 32px));min-height:600px;margin:clamp(16px,5vh,52px) auto;padding:18px 22px 22px;border:3px solid #4a3620;border-radius:30px;background:#fffaf0;box-shadow:0 9px 0 #c9bda4}
    .qa-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px;min-height:38px;margin:0 4px 12px}
    .qa-heading h1{margin:0;font-size:24px;line-height:1.2}.qa-heading p{margin:0;color:#70501b;font-size:14px}
    .qa-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(245px,1fr));gap:14px;min-height:510px}
    .qa-card{display:flex;min-width:0;flex-direction:column;align-items:center;justify-content:flex-end;overflow:hidden;padding:8px 8px 11px;border:2px solid #c9bda4;border-radius:24px;background:#fffdf7}
    .qa-pet{display:grid;min-height:190px;place-items:end center;isolation:isolate}.qa-pet>svg,.qa-pet>.lg-animal{display:block;max-width:100%}
    .qa-label{width:100%;margin-top:4px;padding-top:7px;border-top:2px solid #e5dcc8;text-align:center;font-size:15px;font-weight:750;letter-spacing:.01em}
    @media(max-width:760px){.qa-page{padding:14px}.qa-heading{align-items:flex-start;flex-direction:column;gap:4px}.qa-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none}.qa-card{min-height:245px}}
    @media(max-width:410px){.qa-page{width:calc(100vw - 16px);margin:8px auto}.qa-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="qa-page">
    <header class="qa-heading"><h1>Live pet art QA</h1><p id="qa-settings"></p></header>
    <section class="qa-grid" id="qa-grid" aria-label="Pet body comparison"></section>
  </main>
  ${scriptUrls.map(url=>`<script src="${url}"></script>`).join('\n  ')}
  <script>
    if(location.hostname!=='127.0.0.1')throw new Error('Pet QA requires the isolated 127.0.0.1 origin');
    const ns=window.MiftahGame,query=new URLSearchParams(location.search);
    const mood=query.get('mood')==='proud'?'proud':'neutral';
    const validAccessories=new Set((ns.LETTERS_ACCESSORIES||[]).map(item=>item.id));
    const requested=query.get('worn')||'';
    const combo=['cape','glasses','balloon'].filter(id=>validAccessories.has(id));
    const worn=requested==='combo'?combo:validAccessories.has(requested)?[requested]:[];
    const bodies=(ns.LETTERS_BODIES||[]).slice(0,8);
    if(bodies.length!==8)throw new Error('Expected eight live LETTERS_BODIES for pet QA');
    document.getElementById('qa-settings').textContent='mood: '+mood+' · worn: '+(worn.join(' + ')||'none');
    document.getElementById('qa-grid').innerHTML=bodies.map(body=>
      '<article class="qa-card"><div class="qa-pet">'+ns.LettersArt.pet({species:body.id,stage:2,size:160,mood,worn})+'</div><div class="qa-label">'+(body.name||body.id)+'</div></article>'
    ).join('');
    ns.LettersArt.fitGlyphs?.(document);
  </script>
</body>
</html>`;

fs.mkdirSync(qaDir,{recursive:true});
const output=path.join(qaDir,'pets.html');
fs.writeFileSync(output,html);
console.log(output);
