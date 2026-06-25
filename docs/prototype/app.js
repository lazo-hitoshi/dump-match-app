const STORAGE_KEY = "dumplink.prototype.v1";

const sampleData = {
  sites: [
    {
      id: "S-101",
      name: "有明物流センター造成",
      address: "東京都江東区有明3丁目",
      start: "2026-06-24",
      end: "2026-06-26",
      needed: 6,
      amount: 52000,
      skills: ["大型", "深ダンプ"],
      x: 67,
      y: 44,
    },
    {
      id: "S-102",
      name: "川崎臨海部 解体搬出",
      address: "神奈川県川崎市川崎区浮島町",
      start: "2026-06-24",
      end: "2026-06-25",
      needed: 4,
      amount: 47000,
      skills: ["大型"],
      x: 38,
      y: 68,
    },
    {
      id: "S-103",
      name: "八潮雨水管工事",
      address: "埼玉県八潮市大瀬",
      start: "2026-06-25",
      end: "2026-06-28",
      needed: 3,
      amount: 43000,
      skills: ["小型", "夜間"],
      x: 52,
      y: 24,
    },
  ],
  trucks: [
    {
      id: "D-201",
      company: "東湾ダンプ",
      driver: "田中 誠",
      address: "東京都大田区平和島",
      start: "2026-06-24",
      end: "2026-06-27",
      desiredAmount: 47000,
      skills: ["大型", "深ダンプ"],
      status: "available",
      linkedSiteId: null,
      x: 54,
      y: 62,
    },
    {
      id: "D-202",
      company: "佐藤運送",
      driver: "佐藤 健",
      address: "東京都江戸川区臨海町",
      start: "2026-06-24",
      end: "2026-06-24",
      desiredAmount: 45000,
      skills: ["大型"],
      status: "booked",
      linkedSiteId: "S-101",
      x: 76,
      y: 50,
    },
    {
      id: "D-203",
      company: "北斗土木",
      driver: "井上 美咲",
      address: "埼玉県三郷市中央",
      start: "2026-06-25",
      end: "2026-06-28",
      desiredAmount: 41000,
      skills: ["小型", "夜間"],
      status: "available",
      linkedSiteId: null,
      x: 48,
      y: 20,
    },
    {
      id: "D-204",
      company: "湾岸建材",
      driver: "高橋 優",
      address: "神奈川県横浜市鶴見区大黒町",
      start: "2026-06-24",
      end: "2026-06-26",
      desiredAmount: 49000,
      skills: ["大型", "深ダンプ"],
      status: "available",
      linkedSiteId: null,
      x: 28,
      y: 72,
    },
    {
      id: "D-205",
      company: "城東運輸",
      driver: "山本 大地",
      address: "東京都足立区千住",
      start: "2026-06-24",
      end: "2026-06-25",
      desiredAmount: 39000,
      skills: ["小型"],
      status: "available",
      linkedSiteId: null,
      x: 59,
      y: 31,
    },
  ],
};

const state = {
  role: "admin",
  siteStatus: "all",
  truckView: "cards",
  selectedId: null,
};

let data = loadData();

const els = {
  roleTabs: document.querySelectorAll(".role-tab"),
  navLinks: document.querySelectorAll(".nav-link"),
  pageTitle: document.querySelector("#pageTitle"),
  roleCaption: document.querySelector("#roleCaption"),
  todayLabel: document.querySelector("#todayLabel"),
  todayDispatch: document.querySelector("#todayDispatch"),
  statOpenSites: document.querySelector("#statOpenSites"),
  statOpenTrucks: document.querySelector("#statOpenTrucks"),
  statBooked: document.querySelector("#statBooked"),
  statShortage: document.querySelector("#statShortage"),
  searchInput: document.querySelector("#searchInput"),
  skillFilter: document.querySelector("#skillFilter"),
  dateFilter: document.querySelector("#dateFilter"),
  onlyAvailable: document.querySelector("#onlyAvailable"),
  mapCanvas: document.querySelector("#mapCanvas"),
  matchCount: document.querySelector("#matchCount"),
  matchList: document.querySelector("#matchList"),
  siteCards: document.querySelector("#siteCards"),
  truckCards: document.querySelector("#truckCards"),
  truckBoard: document.querySelector("#truckBoard"),
  adminRows: document.querySelector("#adminRows"),
  toast: document.querySelector("#toast"),
  drawer: document.querySelector("#entryDrawer"),
  backdrop: document.querySelector("#drawerBackdrop"),
  closeDrawer: document.querySelector("#closeDrawer"),
  entryForm: document.querySelector("#entryForm"),
  entryType: document.querySelector("#entryType"),
  drawerCaption: document.querySelector("#drawerCaption"),
  drawerTitle: document.querySelector("#drawerTitle"),
  drawerSubmit: document.querySelector("#drawerSubmit"),
  siteFields: document.querySelector("#siteFields"),
  truckFields: document.querySelector("#truckFields"),
};

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(sampleData);
  } catch {
    return structuredClone(sampleData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateLabel(value) {
  return value.replaceAll("-", "/");
}

function selectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value || option.textContent);
}

function includesDate(item, date) {
  return item.start <= date && item.end >= date;
}

function overlaps(a, b) {
  return a.start <= b.end && a.end >= b.start;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function skillMatch(site, truck) {
  return site.skills.some((skill) => truck.skills.includes(skill));
}

function siteReservations(siteId) {
  return data.trucks.filter((truck) => truck.status === "booked" && truck.linkedSiteId === siteId);
}

function reservedCount(site) {
  return siteReservations(site.id).length;
}

function remainingCount(site) {
  return Math.max(0, Number(site.needed) - reservedCount(site));
}

function siteStatus(site) {
  return remainingCount(site) > 0 ? "open" : "filled";
}

function statusLabel(status) {
  return {
    available: "空き",
    booked: "予約済",
    hold: "仮押さえ",
  }[status] || status;
}

function fakePosition(seed) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return {
    x: 20 + (hash % 58),
    y: 18 + ((hash * 7) % 62),
  };
}

function currentFilters() {
  return {
    query: els.searchInput.value.trim().toLowerCase(),
    skill: els.skillFilter.value,
    date: els.dateFilter.value,
    onlyAvailable: els.onlyAvailable.checked,
  };
}

function filterSite(site, filters) {
  const target = `${site.name} ${site.address} ${site.skills.join(" ")}`.toLowerCase();
  if (filters.query && !target.includes(filters.query)) return false;
  if (filters.skill !== "all" && !site.skills.includes(filters.skill)) return false;
  if (filters.date && !includesDate(site, filters.date)) return false;
  if (state.siteStatus !== "all" && siteStatus(site) !== state.siteStatus) return false;
  return true;
}

function filterTruck(truck, filters) {
  const target = `${truck.company} ${truck.driver} ${truck.address} ${truck.skills.join(" ")}`.toLowerCase();
  if (filters.query && !target.includes(filters.query)) return false;
  if (filters.skill !== "all" && !truck.skills.includes(filters.skill)) return false;
  if (filters.date && !includesDate(truck, filters.date)) return false;
  if (filters.onlyAvailable && truck.status !== "available") return false;
  return true;
}

function matchScore(site, truck) {
  let score = 0;
  if (skillMatch(site, truck)) score += 42;
  if (overlaps(site, truck)) score += 24;
  if (truck.desiredAmount <= site.amount) score += 18;
  const dist = distance(site, truck);
  score += Math.max(0, 16 - Math.round(dist / 5));
  return Math.min(99, score);
}

function matches() {
  return data.sites
    .flatMap((site) =>
      data.trucks
        .filter((truck) => truck.status === "available")
        .filter((truck) => remainingCount(site) > 0 && skillMatch(site, truck) && overlaps(site, truck))
        .map((truck) => ({ site, truck, score: matchScore(site, truck), km: Math.round(distance(site, truck) * 1.8) }))
    )
    .sort((a, b) => b.score - a.score);
}

function render() {
  const filters = currentFilters();
  const today = filters.date || new Date().toISOString().slice(0, 10);
  const openSites = data.sites.filter((site) => remainingCount(site) > 0);
  const availableTrucks = data.trucks.filter((truck) => truck.status === "available");
  const booked = data.trucks.filter((truck) => truck.status === "booked");
  const shortage = data.sites.reduce((sum, site) => sum + remainingCount(site), 0);

  els.todayLabel.textContent = dateLabel(today);
  els.todayDispatch.textContent = `${booked.filter((truck) => includesDate(truck, today)).length}件の配車予定`;
  els.statOpenSites.textContent = openSites.length;
  els.statOpenTrucks.textContent = availableTrucks.length;
  els.statBooked.textContent = booked.length;
  els.statShortage.textContent = shortage;

  renderRole();
  renderMap(filters);
  renderMatches(filters);
  renderSites(filters);
  renderTrucks(filters);
  renderAdmin();
  saveData();
}

function renderRole() {
  const roleText = {
    admin: ["管理者ビュー", "現場と空きダンプをすばやく合わせる"],
    site: ["現場ビュー", "必要台数と予約状況を確認する"],
    truck: ["ダンプビュー", "空き日程に合う現場へ応募する"],
  };
  els.roleCaption.textContent = roleText[state.role][0];
  els.pageTitle.textContent = roleText[state.role][1];
  document.body.dataset.role = state.role;
}

function renderMap(filters) {
  els.mapCanvas.innerHTML = "";
  const sites = data.sites.filter((site) => filterSite(site, filters));
  const trucks = data.trucks.filter((truck) => filterTruck(truck, filters) || truck.status === "booked");

  sites.forEach((site) => {
    const pin = document.createElement("button");
    pin.className = `map-pin site${state.selectedId === site.id ? " is-selected" : ""}`;
    pin.style.left = `${site.x}%`;
    pin.style.top = `${site.y}%`;
    pin.type = "button";
    pin.title = site.name;
    pin.textContent = "現";
    pin.addEventListener("click", () => selectItem(site.id));
    pin.appendChild(mapLabel(site.name, `${remainingCount(site)}台不足`));
    els.mapCanvas.appendChild(pin);
  });

  trucks.forEach((truck) => {
    const pin = document.createElement("button");
    pin.className = `map-pin truck${state.selectedId === truck.id ? " is-selected" : ""}`;
    pin.style.left = `${truck.x}%`;
    pin.style.top = `${truck.y}%`;
    pin.type = "button";
    pin.title = `${truck.company} ${truck.driver}`;
    pin.textContent = "車";
    pin.addEventListener("click", () => selectItem(truck.id));
    pin.appendChild(mapLabel(truck.company, statusLabel(truck.status)));
    els.mapCanvas.appendChild(pin);
  });
}

function mapLabel(title, sub) {
  const label = document.createElement("span");
  label.className = "map-label";
  label.innerHTML = `<strong>${escapeHtml(title)}</strong><br><span>${escapeHtml(sub)}</span>`;
  return label;
}

function renderMatches(filters) {
  const list = matches().filter(({ site, truck }) => {
    if (!filterSite(site, { ...filters, onlyAvailable: false })) return false;
    return filterTruck(truck, { ...filters, onlyAvailable: true });
  });
  els.matchCount.textContent = `${list.length}件`;
  els.matchList.innerHTML = list.length ? "" : emptyState("条件に合う候補はありません");

  list.slice(0, 12).forEach(({ site, truck, score, km }) => {
    const item = document.createElement("article");
    item.className = "match-item";
    item.innerHTML = `
      <div class="match-top">
        <div class="match-title">
          <strong>${escapeHtml(site.name)}</strong>
          <span>${escapeHtml(truck.company)} / ${escapeHtml(truck.driver)}</span>
        </div>
        <div class="match-score">${score}</div>
      </div>
      <div class="match-meta">
        <span class="skill-pill">${site.skills.map(escapeHtml).join("・")}</span>
        <span class="mini-text">${dateLabel(site.start)} - ${dateLabel(site.end)}</span>
        <span class="mini-text">${yen(site.amount)} / 希望 ${yen(truck.desiredAmount)}</span>
        <span class="mini-text">約${km}km</span>
      </div>
      <div class="match-actions">
        <button class="small-button" data-nav="${escapeHtml(site.address)}" type="button">ナビ</button>
        <button class="small-button primary" data-book="${site.id}:${truck.id}" type="button">${state.role === "truck" ? "応募する" : "予約確定"}</button>
      </div>
    `;
    els.matchList.appendChild(item);
  });
}

function renderSites(filters) {
  const sites = data.sites.filter((site) => filterSite(site, filters));
  els.siteCards.innerHTML = sites.length ? "" : emptyState("表示できる現場はありません");

  sites.forEach((site) => {
    const reserved = reservedCount(site);
    const remaining = remainingCount(site);
    const progress = Math.min(100, Math.round((reserved / site.needed) * 100));
    const card = document.createElement("article");
    card.className = "entity-card";
    card.innerHTML = `
      <div class="card-top">
        <div class="card-title">
          <strong>${escapeHtml(site.name)}</strong>
          <span>${escapeHtml(site.address)}</span>
        </div>
        <span class="status-pill ${siteStatus(site)}">${remaining > 0 ? "募集中" : "充足"}</span>
      </div>
      <div class="card-meta">
        ${site.skills.map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`).join("")}
        <span class="mini-text">${dateLabel(site.start)} - ${dateLabel(site.end)}</span>
        <span class="mini-text">${yen(site.amount)}</span>
      </div>
      <div class="card-progress">
        <div class="mini-text">必要 ${site.needed}台 / 予約 ${reserved}台 / 残り ${remaining}台</div>
        <div class="bar" aria-hidden="true"><span style="width:${progress}%"></span></div>
      </div>
      <div class="card-actions">
        <button class="small-button" data-nav="${escapeHtml(site.address)}" type="button">ナビ</button>
        <button class="small-button" data-select="${site.id}" type="button">選択</button>
      </div>
    `;
    els.siteCards.appendChild(card);
  });
}

function renderTrucks(filters) {
  const trucks = data.trucks.filter((truck) => filterTruck(truck, filters) || (!filters.onlyAvailable && filterTruck(truck, { ...filters, onlyAvailable: false })));
  els.truckCards.classList.toggle("is-hidden", state.truckView !== "cards");
  els.truckBoard.classList.toggle("is-hidden", state.truckView !== "board");
  els.truckCards.innerHTML = trucks.length ? "" : emptyState("表示できるダンプはありません");

  trucks.forEach((truck) => {
    const site = data.sites.find((item) => item.id === truck.linkedSiteId);
    const card = document.createElement("article");
    card.className = "entity-card";
    card.innerHTML = truckCardHtml(truck, site);
    els.truckCards.appendChild(card);
  });

  const lanes = [
    ["available", "空き"],
    ["hold", "仮押さえ"],
    ["booked", "予約済"],
  ];
  els.truckBoard.innerHTML = "";
  lanes.forEach(([status, label]) => {
    const lane = document.createElement("section");
    lane.className = "board-lane";
    lane.innerHTML = `<h4>${label}</h4>`;
    data.trucks
      .filter((truck) => truck.status === status)
      .forEach((truck) => {
        const site = data.sites.find((item) => item.id === truck.linkedSiteId);
        const card = document.createElement("div");
        card.className = "board-card";
        card.innerHTML = `
          <strong>${escapeHtml(truck.company)}</strong>
          <span class="mini-text">${escapeHtml(truck.driver)}</span>
          <span class="mini-text">${site ? escapeHtml(site.name) : "未予約"}</span>
        `;
        lane.appendChild(card);
      });
    els.truckBoard.appendChild(lane);
  });
}

function truckCardHtml(truck, site) {
  const statusClass = truck.status === "available" ? "open" : truck.status === "booked" ? "booked" : "warning";
  const releaseButton =
    truck.status === "booked"
      ? `<button class="danger-button" data-release="${truck.id}" type="button">解除</button>`
      : `<button class="small-button" data-select="${truck.id}" type="button">選択</button>`;
  return `
    <div class="card-top">
      <div class="card-title">
        <strong>${escapeHtml(truck.company)}</strong>
        <span>${escapeHtml(truck.driver)} / ${escapeHtml(truck.address)}</span>
      </div>
      <span class="status-pill ${statusClass}">${statusLabel(truck.status)}</span>
    </div>
    <div class="card-meta">
      ${truck.skills.map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`).join("")}
      <span class="mini-text">${dateLabel(truck.start)} - ${dateLabel(truck.end)}</span>
      <span class="mini-text">希望 ${yen(truck.desiredAmount)}</span>
    </div>
    <div class="mini-text">${site ? `予約先: ${escapeHtml(site.name)}` : "予約先: 未定"}</div>
    <div class="card-actions">
      <button class="small-button" data-nav="${escapeHtml(truck.address)}" type="button">現在地</button>
      ${releaseButton}
    </div>
  `;
}

function renderAdmin() {
  els.adminRows.innerHTML = "";
  data.sites.forEach((site) => {
    const assigned = siteReservations(site.id);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${site.id}</td>
      <td><input value="${escapeAttr(site.name)}" data-update-site="${site.id}:name" aria-label="現場名"></td>
      <td><input type="number" min="1" value="${site.needed}" data-update-site="${site.id}:needed" aria-label="必要台数"></td>
      <td>${reservedCount(site)}</td>
      <td><strong>${remainingCount(site)}</strong></td>
      <td><input type="number" min="0" step="1000" value="${site.amount}" data-update-site="${site.id}:amount" aria-label="金額"></td>
      <td>${assigned.length ? assigned.map((truck) => `${truck.id} ${escapeHtml(truck.company)}`).join("<br>") : "未設定"}</td>
      <td>
        <button class="small-button" data-select="${site.id}" type="button">地図</button>
        <button class="small-button" data-nav="${escapeHtml(site.address)}" type="button">ナビ</button>
      </td>
    `;
    els.adminRows.appendChild(row);
  });
}

function emptyState(text) {
  return `<div class="entity-card"><span class="mini-text">${escapeHtml(text)}</span></div>`;
}

function selectItem(id) {
  state.selectedId = state.selectedId === id ? null : id;
  render();
}

function book(siteId, truckId) {
  const site = data.sites.find((item) => item.id === siteId);
  const truck = data.trucks.find((item) => item.id === truckId);
  if (!site || !truck) return;
  if (remainingCount(site) <= 0) {
    showToast("この現場は必要台数を満たしています");
    return;
  }
  truck.status = "booked";
  truck.linkedSiteId = site.id;
  truck.x = Math.max(5, Math.min(95, site.x + 3));
  truck.y = Math.max(5, Math.min(95, site.y + 3));
  showToast(`${truck.company}を${site.name}へ予約しました`);
  render();
}

function releaseTruck(truckId) {
  const truck = data.trucks.find((item) => item.id === truckId);
  if (!truck) return;
  truck.status = "available";
  truck.linkedSiteId = null;
  const pos = fakePosition(truck.address);
  truck.x = pos.x;
  truck.y = pos.y;
  showToast(`${truck.company}の予約を解除しました`);
  render();
}

function openNavigation(address) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function openDrawer(type) {
  els.entryType.value = type;
  const isSite = type === "site";
  els.drawerCaption.textContent = isSite ? "Site" : "Truck";
  els.drawerTitle.textContent = isSite ? "現場追加" : "ダンプ登録";
  els.drawerSubmit.textContent = isSite ? "現場を登録する" : "ダンプを登録する";
  els.siteFields.classList.toggle("is-hidden", !isSite);
  els.truckFields.classList.toggle("is-hidden", isSite);
  setGroupEnabled(els.siteFields, isSite);
  setGroupEnabled(els.truckFields, !isSite);
  els.drawer.classList.add("is-open");
  els.drawer.setAttribute("aria-hidden", "false");
  els.backdrop.hidden = false;
}

function closeDrawer() {
  els.drawer.classList.remove("is-open");
  els.drawer.setAttribute("aria-hidden", "true");
  els.backdrop.hidden = true;
}

function addSite() {
  const pos = fakePosition(document.querySelector("#siteAddress").value);
  data.sites.push({
    id: nextId("S", data.sites.map((site) => site.id)),
    name: document.querySelector("#siteName").value,
    address: document.querySelector("#siteAddress").value,
    start: document.querySelector("#siteStart").value,
    end: document.querySelector("#siteEnd").value,
    needed: Number(document.querySelector("#siteNeeded").value),
    amount: Number(document.querySelector("#siteAmount").value),
    skills: selectedValues(document.querySelector("#siteSkill")),
    ...pos,
  });
  showToast("現場を追加しました");
}

function addTruck() {
  const pos = fakePosition(document.querySelector("#truckAddress").value);
  data.trucks.push({
    id: nextId("D", data.trucks.map((truck) => truck.id)),
    company: document.querySelector("#truckCompany").value,
    driver: document.querySelector("#truckDriver").value,
    address: document.querySelector("#truckAddress").value,
    start: document.querySelector("#truckStart").value,
    end: document.querySelector("#truckEnd").value,
    desiredAmount: Number(document.querySelector("#truckAmount").value),
    skills: selectedValues(document.querySelector("#truckSkill")),
    status: "available",
    linkedSiteId: null,
    ...pos,
  });
  showToast("ダンプを登録しました");
}

function setGroupEnabled(group, enabled) {
  group.querySelectorAll("input, select").forEach((control) => {
    control.disabled = !enabled;
  });
}

function nextId(prefix, ids) {
  const max = ids.reduce((highest, id) => {
    const number = Number(id.split("-")[1] || 0);
    return Math.max(highest, number);
  }, prefix === "S" ? 100 : 200);
  return `${prefix}-${max + 1}`;
}

function updateSiteField(encoded, value) {
  const [id, field] = encoded.split(":");
  const site = data.sites.find((item) => item.id === id);
  if (!site) return;
  site[field] = ["needed", "amount"].includes(field) ? Number(value) : value;
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dumplink-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("JSONを書き出しました");
}

function resetDemo() {
  data = structuredClone(sampleData);
  state.selectedId = null;
  localStorage.removeItem(STORAGE_KEY);
  showToast("初期データに戻しました");
  render();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.dataset.openPanel) openDrawer(target.dataset.openPanel);
  if (target.dataset.book) {
    const [siteId, truckId] = target.dataset.book.split(":");
    book(siteId, truckId);
  }
  if (target.dataset.release) releaseTruck(target.dataset.release);
  if (target.dataset.nav) openNavigation(target.dataset.nav);
  if (target.dataset.select) selectItem(target.dataset.select);
  if (target.dataset.sectionLink) {
    els.navLinks.forEach((link) => link.classList.toggle("is-active", link === target));
  }
});

els.roleTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.role = tab.dataset.role;
    els.roleTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    render();
  });
});

document.querySelectorAll("[data-site-status]").forEach((button) => {
  button.addEventListener("click", () => {
    state.siteStatus = button.dataset.siteStatus;
    document.querySelectorAll("[data-site-status]").forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

document.querySelectorAll("[data-truck-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.truckView = button.dataset.truckView;
    document.querySelectorAll("[data-truck-view]").forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

[els.searchInput, els.skillFilter, els.dateFilter, els.onlyAvailable].forEach((control) => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

els.closeDrawer.addEventListener("click", closeDrawer);
els.backdrop.addEventListener("click", closeDrawer);
document.querySelector("#fitMap").addEventListener("click", () => {
  state.selectedId = null;
  render();
});
document.querySelector("#resetDemo").addEventListener("click", resetDemo);
document.querySelector("#exportJson").addEventListener("click", exportData);

els.entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (els.entryType.value === "site") addSite();
  else addTruck();
  closeDrawer();
  render();
});

els.adminRows.addEventListener("change", (event) => {
  const input = event.target.closest("[data-update-site]");
  if (!input) return;
  updateSiteField(input.dataset.updateSite, input.value);
});

render();
