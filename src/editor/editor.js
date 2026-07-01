(async function () {
  const ns = window.MiftahGame;

  const canvas = document.getElementById("editor-canvas");
  const ctx = canvas.getContext("2d");
  const paletteEl = document.getElementById("palette");
  const placedListEl = document.getElementById("placed-list");
  const saveBtn = document.getElementById("save-btn");
  const saveStatusEl = document.getElementById("save-status");
  const modeStatusEl = document.getElementById("mode-status");

  const assets = new ns.AssetLoader();
  await assets.load(ns.ASSETS);

  const mapData = ns.createMapData();

  // Load any existing overrides so the editor picks up where the last
  // session left off (same file the game reads on refresh).
  let overrides = null;
  try {
    const res = await fetch("/api/save-map", { cache: "no-store" });
    overrides = res.ok ? await res.json() : null;
  } catch {
    overrides = null;
  }
  const placed = Array.isArray(overrides?.props) ? overrides.props.slice() : [];
  ns.applyMapOverrides(mapData, { props: placed });

  const world = new ns.WorldMap(mapData);
  const camera = new ns.Camera(world.pixelWidth, world.pixelHeight);

  function resizeCanvas() {
    const wrap = document.getElementById("canvas-wrap");
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = w;
    canvas.height = h;
    camera.resize(w, h);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  camera.x = world.spawn.x - camera.width / 2;
  camera.y = world.spawn.y - camera.height / 2;
  camera.clamp();

  // Minimal renderer shim so TileMap.render() (built for the real game) can
  // be reused as-is here, without pulling in HUD/dialogue/player rendering.
  const rendererShim = {
    drawImage(key, x, y, w, h) {
      const image = assets.get(key);
      const dw = w || image.width;
      const dh = h || image.height;
      ctx.drawImage(image, Math.round(x - camera.x), Math.round(y - camera.y), Math.round(dw), Math.round(dh));
    },
  };

  // ---- Palette -------------------------------------------------------
  let selected = null;
  const categories = [...new Set(ns.EDITOR_CATALOG.map((item) => item.category))];
  for (const category of categories) {
    const heading = document.createElement("h2");
    heading.textContent = category;
    paletteEl.appendChild(heading);
    for (const item of ns.EDITOR_CATALOG.filter((i) => i.category === category)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-item";
      button.dataset.key = item.key;
      const img = document.createElement("img");
      img.src = ns.ASSETS[item.key.split(".")[0]][item.key.split(".")[1]];
      const label = document.createElement("span");
      label.textContent = item.label;
      const dims = document.createElement("span");
      dims.className = "dims";
      dims.textContent = `${item.width}×${item.height}`;
      button.append(img, label, dims);
      button.addEventListener("click", () => selectItem(item, button));
      paletteEl.appendChild(button);
    }
  }

  function selectItem(item, button) {
    selected = item;
    for (const el of paletteEl.querySelectorAll(".palette-item")) el.classList.remove("is-selected");
    button.classList.add("is-selected");
    modeStatusEl.textContent = `— placing: ${item.label}`;
  }

  function deselect() {
    selected = null;
    for (const el of paletteEl.querySelectorAll(".palette-item")) el.classList.remove("is-selected");
    modeStatusEl.textContent = "";
  }

  // ---- Placed list sidebar -------------------------------------------
  function renderPlacedList() {
    placedListEl.innerHTML = "";
    if (!placed.length) {
      const note = document.createElement("p");
      note.id = "empty-note";
      note.textContent = "Nothing placed yet.";
      placedListEl.appendChild(note);
      return;
    }
    for (const prop of placed) {
      const row = document.createElement("div");
      row.className = "placed-row";
      const label = document.createElement("span");
      label.textContent = `${prop.assetKey} @ (${Math.round(prop.x / world.tileSize)},${Math.round(prop.y / world.tileSize)})`;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => removePlaced(prop));
      row.append(label, removeBtn);
      placedListEl.appendChild(row);
    }
  }

  function removePlaced(prop) {
    const i = placed.indexOf(prop);
    if (i >= 0) placed.splice(i, 1);
    const j = world.props.indexOf(prop);
    if (j >= 0) world.props.splice(j, 1);
    renderPlacedList();
  }

  renderPlacedList();

  // ---- Placement validity ---------------------------------------------
  function colliderFor(item, x, y) {
    if (item.collider === false) return null;
    const c = ns.editorDefaultCollider(item.width, item.height);
    return { x: x + c[0], y: y + c[1], w: c[2], h: c[3] };
  }

  function isValidPlacement(item, x, y) {
    if (x < 0 || y < 0 || x + item.width > world.pixelWidth || y + item.height > world.pixelHeight) return false;
    const collider = colliderFor(item, x, y);
    if (!collider) return true;
    const existing = world.props.map((p) => p.collider).filter(Boolean);
    return !existing.some((other) => ns.rectsIntersect(collider, other));
  }

  // ---- Mouse / keyboard interaction -----------------------------------
  let mouseWorld = null;

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left + camera.x, y: clientY - rect.top + camera.y };
  }

  function snap(value) {
    return Math.floor(value / world.tileSize) * world.tileSize;
  }

  canvas.addEventListener("mousemove", (event) => {
    mouseWorld = screenToWorld(event.clientX, event.clientY);
  });

  canvas.addEventListener("mouseleave", () => {
    mouseWorld = null;
  });

  canvas.addEventListener("click", (event) => {
    if (!selected || !mouseWorld) return;
    const x = snap(mouseWorld.x);
    const y = snap(mouseWorld.y);
    if (!isValidPlacement(selected, x, y)) {
      saveStatusEl.textContent = "Can't place there — overlaps or out of bounds.";
      return;
    }
    const prop = {
      id: `editor-${selected.key.replace(/\./g, "-")}-${Date.now()}`,
      assetKey: selected.key,
      x,
      y,
      width: selected.width,
      height: selected.height,
      layer: "object",
      hint: selected.label,
      dialogue: "",
      sortY: y + selected.height,
      collider: colliderFor(selected, x, y),
    };
    placed.push(prop);
    world.props.push(prop);
    renderPlacedList();
    saveStatusEl.textContent = "";
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape") deselect();
  });

  const panKeys = new Set();
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) panKeys.add(event.code);
  });
  window.addEventListener("keyup", (event) => panKeys.delete(event.code));

  let dragging = false;
  let dragStart = null;
  canvas.addEventListener("mousedown", (event) => {
    if (event.button !== 1) return;
    event.preventDefault();
    dragging = true;
    dragStart = { x: event.clientX, y: event.clientY, camX: camera.x, camY: camera.y };
  });
  window.addEventListener("mouseup", () => { dragging = false; });
  window.addEventListener("mousemove", (event) => {
    if (!dragging || !dragStart) return;
    camera.x = dragStart.camX - (event.clientX - dragStart.x);
    camera.y = dragStart.camY - (event.clientY - dragStart.y);
    camera.clamp();
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  // ---- Save -------------------------------------------------------------
  saveBtn.addEventListener("click", async () => {
    saveStatusEl.textContent = "Saving…";
    try {
      const res = await fetch("/api/save-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ props: placed }),
      });
      const data = await res.json();
      saveStatusEl.textContent = data.ok ? `Saved ${placed.length} placement(s).` : `Save failed: ${data.error}`;
    } catch (err) {
      saveStatusEl.textContent = `Save failed: ${err}`;
    }
  });

  // ---- Render loop --------------------------------------------------------
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    const ts = world.tileSize;
    const startX = Math.floor(camera.x / ts) * ts;
    const startY = Math.floor(camera.y / ts) * ts;
    for (let x = startX; x < camera.x + camera.width + ts; x += ts) {
      ctx.beginPath();
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, camera.height);
      ctx.stroke();
    }
    for (let y = startY; y < camera.y + camera.height + ts; y += ts) {
      ctx.beginPath();
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(camera.width, y - camera.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhost() {
    if (!selected || !mouseWorld) return;
    const x = snap(mouseWorld.x);
    const y = snap(mouseWorld.y);
    const valid = isValidPlacement(selected, x, y);
    ctx.save();
    ctx.globalAlpha = 0.55;
    const image = assets.get(selected.key);
    ctx.drawImage(image, Math.round(x - camera.x), Math.round(y - camera.y), selected.width, selected.height);
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = valid ? "#4fd67a" : "#e0503f";
    ctx.fillRect(Math.round(x - camera.x), Math.round(y - camera.y), selected.width, selected.height);
    ctx.strokeStyle = valid ? "#8fffb0" : "#ffb3a0";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(x - camera.x) + 1, Math.round(y - camera.y) + 1, selected.width - 2, selected.height - 2);
    ctx.restore();
  }

  function frame() {
    const panSpeed = 480 / 60;
    if (panKeys.has("ArrowUp")) camera.y -= panSpeed;
    if (panKeys.has("ArrowDown")) camera.y += panSpeed;
    if (panKeys.has("ArrowLeft")) camera.x -= panSpeed;
    if (panKeys.has("ArrowRight")) camera.x += panSpeed;
    camera.clamp();

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    world.tileMap.render(rendererShim, camera);

    const sorted = world.props.slice().sort((a, b) => (a.sortY || a.y + a.height) - (b.sortY || b.y + b.height));
    for (const prop of sorted) rendererShim.drawImage(prop.assetKey, prop.x, prop.y, prop.width, prop.height);

    drawGrid();
    drawGhost();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
