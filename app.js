const state = { games: [], q: "", era: "全部", onlyLoop: false };

const eraOrder = ["远古与桌游", "街机黄金期", "8–16位主机", "九十年代奠基", "现代经典"];

async function gunzipB64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(buf));
}

async function boot() {
  const [p1, p2, p3, p4, meta] = await Promise.all([
    fetch("data/games-1.b64").then((r) => r.text()),
    fetch("data/games-2.b64").then((r) => r.text()),
    fetch("data/games-3.b64").then((r) => r.text()),
    fetch("data/games-4.b64").then((r) => r.text()),
    fetch("data/meta.json").then((r) => r.json()),
  ]);
  state.games = await gunzipB64((p1 + p2 + p3 + p4).replace(/\s+/g, ""));
  document.getElementById("stats").innerHTML = [
    `共 <b>${meta.count}</b> 部经典`,
    `已拆循环 <b>${meta.withLoop}</b>`,
    `跨度 <b>远古 → 现代</b>`,
  ]
    .map((t) => `<span class="stat">${t}</span>`)
    .join("");

  const filters = document.getElementById("eraFilters");
  ["全部", ...eraOrder].forEach((era) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = era;
    b.setAttribute("aria-pressed", era === "全部" ? "true" : "false");
    b.addEventListener("click", () => {
      state.era = era;
      [...filters.children].forEach((c) => c.setAttribute("aria-pressed", c.textContent === era ? "true" : "false"));
      render();
    });
    filters.appendChild(b);
  });

  document.getElementById("q").addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  document.getElementById("onlyLoop").addEventListener("change", (e) => {
    state.onlyLoop = e.target.checked;
    render();
  });

  document.getElementById("drawer").addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  const repo = document.getElementById("repoLink");
  if (location.hostname.endsWith("github.io")) {
    const user = location.hostname.split(".")[0];
    const path = location.pathname.split("/").filter(Boolean)[0];
    repo.href = path ? `https://github.com/${user}/${path}` : `https://github.com/${user}`;
    repo.textContent = "GitHub 仓库";
  }

  render();
}

function filtered() {
  return state.games.filter((g) => {
    if (state.era !== "全部" && g.era !== state.era) return false;
    if (state.onlyLoop && !g.hasLoop) return false;
    if (!state.q) return true;
    const blob = [g.name, g.type, g.verb, g.lesson, g.problem, g.why, g.era].join(" ").toLowerCase();
    return blob.includes(state.q);
  });
}

function render() {
  const games = filtered();
  const list = document.getElementById("list");
  const timeline = document.getElementById("timeline");

  const byEra = new Map();
  eraOrder.forEach((e) => byEra.set(e, []));
  games.forEach((g) => {
    if (!byEra.has(g.era)) byEra.set(g.era, []);
    byEra.get(g.era).push(g);
  });

  timeline.innerHTML = "";
  list.innerHTML = "";

  for (const [era, items] of byEra) {
    if (!items.length) continue;
    const id = `era-${era}`;
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = `${era} (${items.length})`;
    timeline.appendChild(a);

    const section = document.createElement("section");
    section.className = "decade";
    section.id = id;
    section.innerHTML = `<h2>${era}</h2>`;
    const cards = document.createElement("div");
    cards.className = "cards";
    items.forEach((g) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.innerHTML = `
        <div class="year">${g.yearLabel || g.year}</div>
        <h3>${escapeHtml(g.name)}</h3>
        <p class="lesson">${escapeHtml(g.lesson || g.why || "")}</p>
        <span class="badge ${g.hasLoop ? "" : "dim"}">${g.hasLoop ? "已拆循环" : "待补拆"}</span>
      `;
      btn.addEventListener("click", () => openDrawer(g));
      cards.appendChild(btn);
    });
    section.appendChild(cards);
    list.appendChild(section);
  }

  if (!games.length) {
    list.innerHTML = `<p class="empty-loop">没有匹配的条目，换个关键词试试。</p>`;
  }
}

function openDrawer(g) {
  const drawer = document.getElementById("drawer");
  document.getElementById("d-era").textContent = g.era;
  document.getElementById("d-title").textContent = g.name;
  document.getElementById("d-meta").textContent = `${g.yearLabel || g.year}${g.type ? " · " + g.type : ""}${g.kbId ? " · 库 #" + g.kbId : ""}`;
  document.getElementById("d-lesson").textContent = g.lesson || g.why || "";

  const box = document.getElementById("d-loop");
  if (!g.hasLoop) {
    box.innerHTML = `<p class="empty-loop">此作尚未写入完整循环字段，欢迎在仓库提交修补。</p>`;
  } else {
    const fields = [
      ["核心动词", g.verb],
      ["问题", g.problem],
      ["对手", g.opponent],
      ["怎么输", g.fail],
      ["取舍", g.tradeoff],
      ["短循环", g.short],
      ["中循环", g.mid],
      ["长循环", g.long],
      ["为何是游戏不是玩具", g.why],
      ["来源核对", g.source],
    ];
    box.innerHTML = `<dl class="fields">${fields
      .filter(([, v]) => v)
      .map(([k, v]) => `<div class="field"><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`)
      .join("")}</dl>`;
  }
  drawer.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  document.getElementById("drawer").hidden = true;
  document.body.style.overflow = "";
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

boot();
