"use strict";

// Offline support: the service worker caches the app shell, surah data, and
// recitation audio. Registered here because this script loads on every page.
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// Bottom tab bar (mobile). Marks the current tab, points Continue at the
// last-opened surah, and runs the Games sheet toggle.
(() => {
  const page = location.pathname.split("/").pop() || "surahs.html";
  const currentTab = {
    "surahs.html": "surahs",
    "": "surahs",
    "trainer.html": "trainer",
    "glossary.html": "glossary",
  }[page];
  document.querySelectorAll(".tabbar .tab[data-tab]").forEach((tab) => {
    tab.classList.toggle("is-current", tab.dataset.tab === currentTab);
  });

  const cont = document.getElementById("tab-continue");
  if (cont) {
    let last = new URLSearchParams(location.search).get("surah");
    if (!last) {
      try {
        last = localStorage.getItem("quran-trainer:last-surah");
      } catch {}
    }
    cont.href = "trainer.html" + (last ? `?surah=${last}` : "");
    if (currentTab === "trainer") {
      const label = cont.querySelector("span");
      if (label) label.textContent = "Trainer";
    }
  }

  const btn = document.getElementById("tab-games");
  const sheet = document.getElementById("games-sheet");
  if (!btn || !sheet) return;
  const setOpen = (open) => {
    sheet.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", () => setOpen(sheet.hidden));
  document.addEventListener("click", (e) => {
    if (!sheet.hidden && !sheet.contains(e.target) && !btn.contains(e.target)) {
      setOpen(false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !sheet.hidden) setOpen(false);
  });
})();
