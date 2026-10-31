const SOURCES = {
  main: "https://raw.githubusercontent.com/seferhanbaylansefo-ux/FNTDREMATCHEDV5555/refs/heads/main/TowerStats.json",
  custom: "https://raw.githubusercontent.com/seferhanbaylansefo-ux/TowerStatsForFNTDREMATCHEDV5/refs/heads/main/TowerStatsCustom.json"
};

// Add or edit trading values here. Keys must match unit names exactly.
// Example: "Freddy": 100
const VALUES = {
  "Freddy": 100,
  "Foxy": 250,
  "Chica": 150
};

// Demand and stability are optional labels you can maintain manually.
const UNIT_META = {
  "Freddy": { demand: "Medium", stability: "Stable" }
};

let units = [];
let leftOffer = [];
let rightOffer = [];
let selectedTradeUnit = null;

const $ = (id) => document.getElementById(id);
const number = (value) => Number(value || 0).toLocaleString("en-US");
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function assetUrl(image) {
  const match = String(image || "").match(/(\d+)/);
  return match ? `https://www.roblox.com/asset-thumbnail/image?assetId=${match[1]}&width=150&height=150&format=png` : "";
}
function imageMarkup(unit, cls = "unit-image") {
  const url = assetUrl(unit.data.Image);
  return url ? `<img class="${cls}" src="${url}" alt="${safe(unit.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('hidden')"><span class="${cls} unit-placeholder hidden">?</span>` : `<span class="${cls} unit-placeholder">?</span>`;
}
function valueOf(unit) { return Number(VALUES[unit.name] ?? 0); }

async function loadUnits() {
  const status = $("load-status");
  try {
    status.textContent = "Downloading GitHub JSON files…";
    const results = await Promise.all(SOURCES && [SOURCES.main, SOURCES.custom].map(async url => {
      const response = await fetch(url, {cache: "no-store"});
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return response.json();
    }));
    const merged = new Map();
    for (const source of results) {
      if (!source || typeof source !== "object" || Array.isArray(source)) continue;
      Object.entries(source).forEach(([name, data]) => {
        if (data && typeof data === "object") merged.set(name, {name, data});
      });
    }
    units = [...merged.values()].sort((a,b) => a.name.localeCompare(b.name));
    if (!units.length) throw new Error("No units found in JSON files.");
    populateRarities();
    renderUnits();
    $("unit-count").textContent = number(units.length);
    $("rarity-count").textContent = new Set(units.map(u => u.data.Rarity).filter(Boolean)).size;
    $("updated-at").textContent = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    status.textContent = "✓ Both GitHub sources connected";
  } catch (error) {
    console.error(error);
    status.textContent = "Could not load data. Check connection / GitHub JSON.";
    $("unit-grid").innerHTML = `<div class="loading-card">Unable to load the unit database.<br><br>${safe(error.message)}<br><br>Open this website using GitHub Pages or a local server, then refresh.</div>`;
    $("unit-count").textContent = "0";
    $("rarity-count").textContent = "0";
  }
}

function populateRarities() {
  const rarities = [...new Set(units.map(u => u.data.Rarity).filter(Boolean))].sort();
  $("rarity-filter").innerHTML = `<option value="">All rarities</option>` + rarities.map(r => `<option value="${safe(r)}">${safe(r)}</option>`).join("");
}
function renderUnits() {
  const query = $("search").value.trim().toLowerCase();
  const rarity = $("rarity-filter").value;
  const sort = $("sort-filter").value;
  let list = units.filter(u => u.name.toLowerCase().includes(query) && (!rarity || u.data.Rarity === rarity));
  if (sort === "value-high") list.sort((a,b) => valueOf(b)-valueOf(a) || a.name.localeCompare(b.name));
  else if (sort === "value-low") list.sort((a,b) => valueOf(a)-valueOf(b) || a.name.localeCompare(b.name));
  else if (sort === "rarity") list.sort((a,b) => (a.data.Rarity||"").localeCompare(b.data.Rarity||"") || a.name.localeCompare(b.name));
  else list.sort((a,b) => a.name.localeCompare(b.name));
  $("unit-grid").innerHTML = list.map(u => `
    <article class="unit-card" data-unit="${encodeURIComponent(u.name)}">
      <div class="unit-card-top">${imageMarkup(u)}<div><div class="unit-name">${safe(u.name)}</div><div class="unit-rarity">${safe(u.data.Rarity || "Unknown")} · ${safe(u.data.Type || "Unknown")}</div></div></div>
      <div class="unit-bottom"><div><div class="value-label">VALUE</div><div class="value-number">${valueOf(u) ? number(valueOf(u)) : "Not set"}</div></div><span class="type-tag">MAX ${safe(u.data.Max ?? "—")}</span></div>
    </article>`).join("");
  $("empty-state").classList.toggle("hidden", list.length !== 0);
  $("unit-grid").classList.toggle("hidden", list.length === 0);
}
function showUnit(name) {
  const unit = units.find(u => u.name === name);
  if (!unit) return;
  const d = unit.data, upgrades = Array.isArray(d.Upgrades) ? d.Upgrades : [];
  const last = upgrades[upgrades.length-1] || {};
  const meta = UNIT_META[name] || {};
  $("modal-content").innerHTML = `
    <div class="modal-hero">${imageMarkup(unit, "modal-image")}<div><h2 id="modal-name">${safe(name)}</h2><div class="modal-meta">${safe(d.Rarity || "Unknown")} · ${safe(d.Type || "Unknown")}</div><div class="modal-value">VALUE: ${valueOf(unit) ? number(valueOf(unit)) : "Not set"}</div></div></div>
    <div class="detail-grid">
      <div class="detail-stat"><span>Placement Cost</span><strong>${number(d.PlacePrice)}</strong></div>
      <div class="detail-stat"><span>Max Placement</span><strong>${safe(d.Max ?? "—")}</strong></div>
      <div class="detail-stat"><span>Upgrade Count</span><strong>${upgrades.length}</strong></div>
      <div class="detail-stat"><span>Max Damage</span><strong>${number(last.Damage)}</strong></div>
      <div class="detail-stat"><span>Max Range</span><strong>${number(last.Range)}</strong></div>
      <div class="detail-stat"><span>Max Cooldown</span><strong>${last.Cooldown ?? "—"}</strong></div>
      <div class="detail-stat"><span>Demand</span><strong>${safe(meta.demand || "Not set")}</strong></div>
      <div class="detail-stat"><span>Stability</span><strong>${safe(meta.stability || "Not set")}</strong></div>
    </div>
    ${d.Passive ? `<div class="passive"><strong>${safe(d.Passive.Name || "Passive")}</strong><br>${safe(d.Passive.Description || "")}</div>` : ""}
    <h3 class="upgrade-title">UPGRADE STATS</h3>
    <div class="upgrade-list">${upgrades.map((up,i) => `<div class="upgrade-card"><strong>UPGRADE ${i+1}</strong><p>Price: ${number(up.Price)}<br>Damage: ${safe(up.Damage ?? "—")}<br>Range: ${safe(up.Range ?? "—")}<br>Cooldown: ${safe(up.Cooldown ?? "—")}${Object.entries(up).filter(([k])=>!["Price","Damage","Range","Cooldown"].includes(k)).map(([k,v])=>`<br>${safe(k)}: ${safe(v)}`).join("")}</p></div>`).join("")}</div>
    <p class="edit-hint">Values are maintained manually in the VALUES object at the top of script.js.</p>`;
  $("unit-modal").classList.remove("hidden");
}
function renderTrade() {
  const total = list => list.reduce((sum,u)=>sum+valueOf(u),0);
  const left = total(leftOffer), right = total(rightOffer);
  $("left-total").textContent = number(left);
  $("right-total").textContent = number(right);
  const renderSide = (list, side) => list.length ? list.map((u,i)=>`<div class="trade-row">${imageMarkup(u)}<div class="trade-row-info"><strong>${safe(u.name)}</strong><small>${safe(u.data.Rarity || "")}</small></div><b>${number(valueOf(u))}</b><button class="remove-unit" data-remove="${side}:${i}" title="Remove">×</button></div>`).join("") : `<p class="muted">Add units to ${side === "left" ? "your" : "their"} offer.</p>`;
  $("left-items").innerHTML = renderSide(leftOffer,"left");
  $("right-items").innerHTML = renderSide(rightOffer,"right");
  const verdict = $("trade-verdict"), diff = $("trade-difference");
  if (!leftOffer.length && !rightOffer.length) { verdict.textContent="Add units to compare"; diff.textContent="The result is based on the values you enter."; }
  else if (!left || !right) { verdict.textContent="Values needed"; diff.textContent="Enter values for the units on both sides to calculate W/F/L."; }
  else {
    const ratio = left / right;
    if (ratio > 1.05) verdict.textContent = "You are OVERpaying";
    else if (ratio < .95) verdict.textContent = "You are UNDERpaying";
    else verdict.textContent = "FAIR TRADE";
    diff.textContent = `Difference: ${number(Math.abs(left-right))} · Your side ${left>right?"has more value":"has less value"} by ${Math.round(Math.abs(ratio-1)*100)}%.`;
  }
}
function renderPicker() {
  const q = $("trade-search").value.toLowerCase();
  const matches = units.filter(u=>u.name.toLowerCase().includes(q)).slice(0,30);
  $("trade-picker").innerHTML = matches.map(u=>`<div class="picker-item" data-pick="${encodeURIComponent(u.name)}"><span>${safe(u.name)} <small class="muted">· ${safe(u.data.Rarity||"")}</small></span><b>${valueOf(u)?number(valueOf(u)):"No value"}</b></div>`).join("") || `<p class="muted">No matching units.</p>`;
  $("trade-picker").classList.remove("hidden");
}

$("search").addEventListener("input", renderUnits);
$("rarity-filter").addEventListener("change", renderUnits);
$("sort-filter").addEventListener("change", renderUnits);
$("unit-grid").addEventListener("click", e => { const card=e.target.closest("[data-unit]"); if(card) showUnit(decodeURIComponent(card.dataset.unit)); });
document.querySelectorAll("[data-close-modal]").forEach(el=>el.addEventListener("click",()=>$("unit-modal").classList.add("hidden")));
document.addEventListener("keydown",e=>{if(e.key==="Escape") $("unit-modal").classList.add("hidden");});
document.querySelectorAll(".nav-link").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b===btn));
  $("units-page").classList.toggle("hidden",btn.dataset.page!=="units");
  $("calculator-page").classList.toggle("hidden",btn.dataset.page!=="calculator");
}));
$("trade-search").addEventListener("input",renderPicker);
$("add-trade-unit").addEventListener("click",renderPicker);
$("trade-picker").addEventListener("click",e=>{
  const item=e.target.closest("[data-pick]"); if(!item)return;
  const u=units.find(x=>x.name===decodeURIComponent(item.dataset.pick)); if(!u)return;
  ( $("trade-side").value==="left" ? leftOffer : rightOffer ).push(u);
  $("trade-picker").classList.add("hidden"); $("trade-search").value=""; renderTrade();
});
document.querySelector(".trade-columns").addEventListener("click",e=>{
  const btn=e.target.closest("[data-remove]"); if(!btn)return;
  const [side,index]=btn.dataset.remove.split(":"); (side==="left"?leftOffer:rightOffer).splice(Number(index),1); renderTrade();
});
$("clear-trade").addEventListener("click",()=>{leftOffer=[];rightOffer=[];renderTrade();});
loadUnits();
