"use strict";

// Miftah service worker: offline app shell + data.
// - Shell (HTML/CSS/JS/fonts): stale-while-revalidate, ignoring ?v= cache-busters.
// - data/*.json: network-first so rebuilt data lands promptly; cache fallback offline.
// - Remote recitation audio: deliberately NOT intercepted — see AUDIO_HOSTS below.
const VERSION = "miftah-v62-letter-garden-picnic-20260928";
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

const SHELL = [
  "styles/letters-picnic.css",
  // BEGIN MARIN CURRICULUM AUDIO
  "assets/audio/letters/marin-curriculum-v1/lg-0f4c7785aba9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9398dd2463eb.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cf74c943ec31.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-94eee3c61cac.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cb624b7d0ef4.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-60e3b82e5a3e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-4f057689d289.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9e233c3067bd.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6f7ddec18d79.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2701f008f06f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ba861d96a2da.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-79a5e4461bac-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-81a333ca8e19-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cc4c2e4dbfda-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-07b43bc69877.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-780f94e60087.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c781688bdfdc-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-50e6cddd272b.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-147954761063.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f3d5f289598a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e7757adcd376.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-65ebd28d0327-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2b8af86d7225.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3b719e0537b9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-291b92e492fb.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-924bb86de5f8.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-64cbd95c7cd8-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-413cd9ef9615-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-0c204c583369-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-34fa019fc0cf.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f106b520337d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c70774f9ecbf-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b395574965f1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-4866a45a046c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f33099a288ef.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ea38bdb8dbab.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-a8429e61a006.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1ebb7dbf1c58.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3942d76b714f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-040d0fff887a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8845ef789954.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-05d7abc3e058.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e49934a2356f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-84e9e184b660.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f8b192cd3a04.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8f13db9909e5.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-470dbb77d4df.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-36a1e7188648.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-76bad5b506e7.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f6bfae64253c-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3b8732d73847-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-390d2843328d-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ea02a7a1f92e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-d73b8f256e66.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-96d6e5707674.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c73467ff1741.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-31fc2e8f811d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9e1d5e7f2d91.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7e363b4b23fc.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-875ff90371bc.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b49450735a14.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e2fece36d71a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8ce960a3420a-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e7bebb428fb2-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ed132d80ef2e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7c7afb90ab10.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-45d4256ab31e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-5a23f168330e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3bc5f0ae9739.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-00ad57f4c686.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e455bbaee2ef.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-80cdd720e239-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-a1abac806544.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e163d245aa74.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-794864096e4f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-932469a7bdb8.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8a12dca934bb.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-150434feb214.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-02f7085adb89.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cc7d73f1885c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-408f1c4dddea.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-913b0f56f2c5.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-d5fb917d9db6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-57bf496ca1ac.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-55cfa486d155.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-d10d0df617af.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-54d4a8b5461c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b68c9d45eea8.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1cee009449b6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1f16e40d6192.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-899917db1c13.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b7865f1b44f7.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-63a493773b8a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3d827a5a43cd.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-0bc47ef6eebc.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-06df41524ddd.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7dc1cb03c870.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-07848031d3b5.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-563436b5f189.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7e330ac82db4.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-697fef431da6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2401c0433020-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-0fca749ce8c2-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-11ba12301e3f-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c03effb5dffc-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-38534123f710-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3cc6e720f8c3-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8bd19f151c78.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-14a79786ec2d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-56bd2764fabd.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-89c5c6f454a0.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-af930182cb0f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-00fc50872e5a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8cb8de042947.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ce78b75fbf7c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-24dad8c7f05a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6512126eea52.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-db7696accf25.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-4d86b5e40014.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9cd952ad821d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cfabc85d40c4.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-05d82cf0f520.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ec9450ee268e-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b428ea1f6041.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8258de63d74e-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-aa8811b378b0.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3d0a28c28b20.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3bbe8da7a5b1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8679f2dad70d-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9ed6a9c073f8-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3b8e1495833d-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ca3af558ba11-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-340740d00ba1-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-427032b8a68b-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8aa63c060c0b.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7339da8be97f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2700319fe52a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-049b7c17697e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1267bbed040f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7b0b8febe4a8.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-bfcf70752bf3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6552de8f1eb2.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-38f6528617ad.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-91fd914ee86c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c3b5afe7cc08.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-a5756baa80ee.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8bc549d74bec.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-5c54409fd37a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1bbac20141b3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2d7c57749b54.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-43cc227f4e90.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-47f506e11b63.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c4b11b1faa10.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-353bf3f68337.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1ef3ddb0017b.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7d2fe98d3fcf.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f86274109079.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b39cbc7e3269.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e9437b0a3e81.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c445e7a21765.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-4e89a5b4afe4.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e66d423a3dd9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8f627810c512.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-a8549d663ab9-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-82b658e5075c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7af96a47a4b6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-d4ed5209d00e.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-474f763a4173.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-43ac82f76e3c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f01edb5de2d9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c8b4a821d5b9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-642b2eea6723.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-09c6b807ef8d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-73d38b2d5bed.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f9b77a966b34.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6e9485c46650.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f65ba0692d34.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-98c207c85669.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3062586698e2.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-66a8d70cd9ef-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-74d733b4d22c-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c7841a362473.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-5daa6e6fadf0.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-9e3de7854832.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-41a5ef4bf942.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-3468a09a4e0b.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f14ab1770a44.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6a7ad426ba6c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2f846091a5f9.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7242f6a466e3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-a61229b543f7.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-6d8b0837aad0-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-5e79a2002dd0.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-4c9adc018513.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-db9d001d07f5-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c8f6af9ae470-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f26ead2a68a3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-509b1b7cc314.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-f663e61203ed.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-2578ff399d5d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c7d727cb3393.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-5d2d48da3857.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-dda0619e94e4.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-628d855112ee.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-810b404e2d29.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c8846e99d100.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-50fede0b75aa.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-7c3fe273aa51.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-07324b4a3020.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-b1b97c29972a.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-bfcddfe94739.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-c3ebf3ec2afa.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-e732a36fd0d0.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-94d3b4fa6e7f.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-de88736412f6.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-81d4f87ac87d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ae6c4c49d483.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-cfc53afaefe5.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-d8738fe07ca3.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-1b42fe0a2f60.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-4148486ef90f-r1.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-85ea5b820c79.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-ce78ac63493c.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-8a6ad95fff8d.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-47b825034366.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-fa3853f6a7be.wav",
  "assets/audio/letters/marin-curriculum-v1/lg-0e63f0f59473.wav",
  // END MARIN CURRICULUM AUDIO
  "src/letters/LetterVoiceClips.js",
  "src/letters/LettersVoice.js",
  "assets/audio/letters/marin-v1/alif.wav",
  "assets/audio/letters/marin-v1/ba.wav",
  "assets/audio/letters/marin-v1/ta.wav",
  "assets/audio/letters/marin-v1/tha.wav",
  "assets/audio/letters/marin-v1/jeem.wav",
  "assets/audio/letters/marin-v1/haa.wav",
  "assets/audio/letters/marin-v1/khaa.wav",
  "assets/audio/letters/marin-v1/dal.wav",
  "assets/audio/letters/marin-v1/dhal.wav",
  "assets/audio/letters/marin-v1/ra.wav",
  "assets/audio/letters/marin-v1/zay.wav",
  "assets/audio/letters/marin-v1/sheen.wav",
  "assets/audio/letters/marin-v1/saad.wav",
  "assets/audio/letters/marin-v1/daad.wav",
  "assets/audio/letters/marin-v1/taa.wav",
  "assets/audio/letters/marin-v1/zaa.wav",
  "assets/audio/letters/marin-v1/ayn.wav",
  "assets/audio/letters/marin-v1/ghayn.wav",
  "assets/audio/letters/marin-v1/fa.wav",
  "assets/audio/letters/marin-v1/qaf.wav",
  "assets/audio/letters/marin-v1/kaf.wav",
  "assets/audio/letters/marin-v1/lam.wav",
  "assets/audio/letters/marin-v1/meem.wav",
  "assets/audio/letters/marin-v1/noon.wav",
  "assets/audio/letters/marin-v1/ha.wav",

  "letters.html",
  "styles/letters-rooms.css",
  "styles/letters-composition.css",
  "styles/letters-potting.css",
  "styles/letters-craft.css",
  "styles/letters-journey.css",
  "styles/letters-delivery.css",
  "styles/letters-motion.css",
  "styles/letters-learning.css",
  "styles/letters-drawing.css",
  "src/letters/LettersRoomArt.js",
  "src/letters/LettersLearning.js",
  "src/letters/LettersSound.js",
  "src/letters/LetterDelivery.js",
  "styles/letters.css",
  "styles/letters-animals.css",
  "styles/letters-art-pass.css",
  "styles/letters-map-world.css",
  "styles/letters-activities.css",
  "src/data/letters.js",
  "src/data/animals.js",
  "src/core/SoundSystem.js",
  "src/core/Haptics.js",
  "src/systems/ProgressionSystem.js",
  "src/letters/LettersAnimalArt.js",
  "src/letters/LettersArt.js",
  "src/letters/LettersDecorations.js",
  "src/letters/LettersState.js",
  "src/letters/LettersBoot.js",
  "src/letters/LettersStrength.js",
  "src/letters/LettersWorlds.js",
  "src/letters/GardenPractice.js",
  "src/letters/MiniGames.js",
  "src/letters/LettersGardenArt.js",
  "src/letters/LettersJourney.js",
  "src/letters/LettersMapArt.js",
  "src/letters/LettersActivityArt.js",
  "src/letters/DecoratingGarden.js",
  "src/letters/LettersGame.js",
  "today.html",
  "today.js",
  "progress.html",
  "progress.js",
  "lessons.html",
  "lessons.js",
  "surahs.html",
  "trainer.html",
  "memorize.html",
  "memorize.js",
  "memorize.css",
  "memorize-entry.js",
  "memorize-entry.css",
  "glossary.html",
  "review.html",
  "follow.html",
  "follow.js",
  "styles.css",
  "review.css",
  "glossary.css",
  "app.js",
  "picker.js",
  "review.js",
  "glossary.js",
  "fsrs.js",
  "i18n.js",
  "strength.js",
  "tabbar.js",
  "src/core/RecitationAudio.js",
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "manifest.webmanifest",
  "vendor/fonts/fonts.css",
  "vendor/fonts/uthmanic-hafs-v22.ttf",
  "vendor/fonts/amiri-quran-400-arabic.woff2",
  "vendor/fonts/amiri-quran-400-latin.woff2",
  "vendor/fonts/inter-latin.woff2",
  "vendor/fonts/noto-nastaliq-urdu-400.woff2",
  "vendor/fonts/inter-latin-ext.woff2",
];

const DATA = [
  "data/surah-1.json",
  "data/surah-105.json",
  "data/surah-106.json",
  "data/surah-107.json",
  "data/surah-108.json",
  "data/surah-109.json",
  "data/surah-110.json",
  "data/surah-111.json",
  "data/surah-112.json",
  "data/surah-113.json",
  "data/surah-114.json",
];

const AUDIO_HOSTS = new Set(["audio.qurancdn.com", "verses.quran.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)),
      caches.open(DATA_CACHE).then((cache) => cache.addAll(DATA)),
    ])
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Recitation audio: hands-off. Caching it here previously broke playback —
  // <audio> loads these cross-origin with no `crossOrigin` attribute, so the
  // request is no-cors/opaque, and the element issues byte-Range requests
  // (WebKit/Safari far more aggressively than Chromium). The Cache Storage
  // API throws on any attempt to store a 206 Partial Content response — even
  // an opaque one wrapping a 206 underneath — and that unawaited throw broke
  // recitation in production. Recitation is "a gift, never a blocker"
  // (see RecitationAudio.js) — it isn't worth re-fighting this for offline
  // replay of a few clips. Let the browser fetch it exactly as it always did.
  if (AUDIO_HOSTS.has(url.hostname)) return;

  if (url.origin !== location.origin) return;

  // Surah/manifest data: network-first so fresh builds win, cache offline.
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res.ok) await cache.put(url.origin + url.pathname, res.clone());
          return res;
        } catch {
          const hit = await cache.match(req, { ignoreSearch: true });
          if (hit) return hit;
          throw new Error("offline and uncached: " + url.pathname);
        }
      })
    );
    return;
  }

  // App shell: stale-while-revalidate. Cache under the bare pathname so
  // ?v= busters and ?surah= navigations read AND write the same entry —
  // otherwise the revalidated copy lands under a new key and the stale
  // install-time entry keeps winning.
  const key = url.origin + url.pathname;
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const hit = await cache.match(key);
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
