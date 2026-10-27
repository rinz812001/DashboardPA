/* ============================================================
   app.js — Logic utama & render semua bahagian dashboard
   ============================================================ */

// ── State semasa ──────────────────────────────────────────
let currentExamSesi   = "Sesi 1: 2025/2026";
let currentCourseSesi = "Sesi 1: 2025/2026";

// ── Helper: cari nama pelajar dari studentList ─────────────
function getNama(id) {
  const s = studentList.find(p => p.id === id);
  return s ? s.nama : id;
}

// ── Helper: singkat nama untuk label carta ─────────────────
function shortName(nama) {
  const parts = nama.split(" ");
  return parts[0];
}

// ── Helper: GPA badge class ────────────────────────────────
function gpaBadgeClass(gpa) {
  if (gpa >= 3.5)  return "badge gpa-high";
  if (gpa >= 3.0)  return "badge gpa-mid";
  if (gpa >= 2.5)  return "badge gpa-low";
  return "badge gpa-alert";
}

// ── Helper: gred badge ─────────────────────────────────────
function gredBadge(gred) {
  if (gred === "lulus") return `<span class="badge badge-lulus">lulus</span>`;
  if (gred === "C1")    return `<span class="badge badge-c1">C1</span>`;
  if (gred === "C2")    return `<span class="badge badge-c2">C2</span>`;
  return `<span class="badge">${gred}</span>`;
}

// ── Helper: status badge ───────────────────────────────────
function statusBadge(status) {
  const map = {
    "AKTIF":    "badge badge-aktif",
    "BERHENTI": "badge badge-berhenti",
    "TANGGUH":  "badge badge-tangguh",
  };
  return `<span class="${map[status] || 'badge'}">${status}</span>`;
}

// ============================================================
// SECTION 1 — SUMMARY CARDS
// ============================================================
function renderSummaryCards() {
  const total = studentList.length;
  const sudahDaftar = studentList.filter(s => sem3Registration[s.id] !== null && sem3Registration[s.id] !== undefined).length;
  const belumDaftar = studentList.filter(s => sem3Registration[s.id] === null || sem3Registration[s.id] === undefined).length;

  // Purata GPA Sesi 2
  const sesi2Data = examResults["Sesi 2: 2025/2026"];
  const dit3jSesi2 = sesi2Data.filter(r => studentList.some(s => s.id === r.id));
  const avgGpa = (dit3jSesi2.reduce((sum, r) => sum + r.gpa, 0) / dit3jSesi2.length).toFixed(2);

  // Pelajar perlu perhatian: belum daftar ATAU status bukan AKTIF
  const perhatian = studentList.filter(s =>
    s.status !== "AKTIF" || sem3Registration[s.id] === null || sem3Registration[s.id] === undefined
  ).length;

  const cards = [
    { icon: "🎓", label: "Jumlah Pelajar DIT3J", value: total, sub: "Semester 3", bg: "bg-blue-50", text: "text-blue-900" },
    { icon: "✅", label: "Sudah Daftar Sem 3", value: sudahDaftar, sub: "Sesi 1: 2026/2027", bg: "bg-green-50", text: "text-green-900" },
    { icon: "⚠️", label: "Belum Daftar", value: belumDaftar, sub: "Perlu tindakan segera", bg: "bg-red-50", text: "text-red-900" },
    { icon: "📊", label: "Purata GPA (Sem 2)", value: avgGpa, sub: "Sesi 2: 2025/2026", bg: "bg-indigo-50", text: "text-indigo-900" },
    { icon: "🔍", label: "Perlu Perhatian", value: perhatian, sub: "Belum daftar / Bukan aktif", bg: "bg-amber-50", text: "text-amber-900" },
  ];

  const container = document.getElementById("summary-cards");
  container.innerHTML = cards.map(c => `
    <div class="summary-card ${c.bg} ${c.text}">
      <div class="card-icon">${c.icon}</div>
      <div class="card-label">${c.label}</div>
      <div class="card-value">${c.value}</div>
      <div class="card-sub">${c.sub}</div>
    </div>
  `).join("");
}

// ============================================================
// SECTION 2 — EXAM RESULTS
// ============================================================
function renderExamTable(query = "") {
  const data = examResults[currentExamSesi];
  const q = query.toLowerCase();

  // Tapis: hanya pelajar DIT3J (dari studentList) + search
  const filtered = data.filter(r => {
    const nama = getNama(r.id).toLowerCase();
    const matchSearch = !q || r.id.toLowerCase().includes(q) || nama.includes(q);
    const inClass = studentList.some(s => s.id === r.id);
    return matchSearch && inClass;
  });

  const tbody = document.getElementById("exam-tbody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400 py-6">Tiada rekod dijumpai.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, i) => {
    const kursusHtml = r.kursus.map(k =>
      `<span class="badge ${k.gred === 'lulus' ? 'badge-lulus' : k.gred === 'C1' ? 'badge-c1' : 'badge-c2'}" style="margin:1px;">${k.kod}: ${k.gred}</span>`
    ).join(" ");

    return `
      <tr>
        <td class="text-gray-400">${i + 1}</td>
        <td class="font-mono text-xs">${r.id}</td>
        <td class="font-medium">${getNama(r.id)}</td>
        <td>${kursusHtml}</td>
        <td><span class="badge ${gpaBadgeClass(r.gpa)}">${r.gpa.toFixed(2)}</span></td>
        <td><span class="badge ${gpaBadgeClass(r.cgpa)}">${r.cgpa.toFixed(2)}</span></td>
      </tr>
    `;
  }).join("");
}

// ============================================================
// SECTION 3 — COURSE REGISTRATION
// ============================================================
function renderCourseTable(query = "") {
  const q = query.toLowerCase();

  let rows;
  if (currentCourseSesi === "Sesi 1: 2026/2027") {
    // Sem 3 — dari sem3Registration, only DIT3J students
    rows = studentList.map(s => ({
      id: s.id,
      kursus: sem3Registration[s.id] || null
    }));
  } else {
    const regData = courseRegistration[currentCourseSesi];
    rows = studentList
      .filter(s => regData[s.id])
      .map(s => ({ id: s.id, kursus: regData[s.id] }));
    // tambah 21DIT25F1128 jika ada
    if (regData["21DIT25F1128"]) {
      rows.push({ id: "21DIT25F1128", kursus: regData["21DIT25F1128"] });
    }
  }

  const filtered = rows.filter(r => {
    const nama = getNama(r.id).toLowerCase();
    return !q || r.id.toLowerCase().includes(q) || nama.includes(q);
  });

  const tbody = document.getElementById("course-tbody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-6">Tiada rekod dijumpai.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, i) => {
    const belum = r.kursus === null;
    const rowClass = belum ? "row-danger" : "";
    const kursusHtml = belum
      ? `<span class="badge badge-belum">BELUM DAFTAR</span>`
      : r.kursus.map(k => `<span class="course-tag">${k}</span>`).join("");
    const count = belum ? "—" : r.kursus.length;

    return `
      <tr class="${rowClass}">
        <td class="text-gray-400">${i + 1}</td>
        <td class="font-mono text-xs">${r.id}</td>
        <td class="font-medium">${getNama(r.id)}</td>
        <td>${kursusHtml}</td>
        <td class="text-center font-semibold">${count}</td>
      </tr>
    `;
  }).join("");
}

// ============================================================
// SECTION 4 — STUDENT STATUS
// ============================================================
function renderStatusTable(query = "") {
  const q = query.toLowerCase();
  const filtered = studentList.filter(s => {
    return !q || s.id.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q);
  });

  const tbody = document.getElementById("status-tbody");
  tbody.innerHTML = filtered.map((s, i) => {
    const sem3 = sem3Registration[s.id];
    const daftar = sem3 !== null && sem3 !== undefined;
    const daftarBadge = daftar
      ? `<span class="badge badge-daftar">Daftar</span>`
      : `<span class="badge badge-belum">Belum Daftar</span>`;

    let rowClass = "";
    if (s.status === "BERHENTI") rowClass = "row-danger";
    else if (s.status === "TANGGUH" || !daftar) rowClass = "row-warning";

    return `
      <tr class="${rowClass}">
        <td class="text-gray-400">${i + 1}</td>
        <td class="font-mono text-xs">${s.id}</td>
        <td class="font-medium">${s.nama}</td>
        <td>${statusBadge(s.status)}</td>
        <td>${daftarBadge}</td>
      </tr>
    `;
  }).join("");
}

// ============================================================
// SECTION 5 — CHECKLIST PENDAFTARAN
// ============================================================
const checklistSteps = [
  "Semak status hutang yuran — tiada tunggakan",
  "Semak had kredit semester (min 12, maks 20 kredit)",
  "Senarai kursus wajib Semester 3 telah dikenal pasti",
  "Prasyarat (prerequisite) kursus dipenuhi",
  "Jadual kursus diperiksa (tiada pertindihan masa)",
  "Kelulusan penasihat akademik diberikan",
  "Pendaftaran kursus dilengkapkan dalam sistem",
  "Slip pendaftaran dicetak / disimpan sebagai bukti",
];

function getChecklistState(id) {
  const raw = localStorage.getItem(`checklist_${id}`);
  return raw ? JSON.parse(raw) : Array(checklistSteps.length).fill(false);
}

function saveChecklistState(id, state) {
  localStorage.setItem(`checklist_${id}`, JSON.stringify(state));
}

function renderChecklist() {
  const belumDaftar = studentList.filter(s =>
    sem3Registration[s.id] === null || sem3Registration[s.id] === undefined
  );

  const container = document.getElementById("checklist-cards");
  container.innerHTML = belumDaftar.map(s => {
    const state = getChecklistState(s.id);
    const done = state.filter(Boolean).length;
    const pct = Math.round((done / checklistSteps.length) * 100);

    const itemsHtml = checklistSteps.map((step, idx) => `
      <div class="checklist-item ${state[idx] ? 'checked' : ''}" id="item-${s.id}-${idx}">
        <input type="checkbox" id="chk-${s.id}-${idx}" ${state[idx] ? 'checked' : ''}
          onchange="toggleCheck('${s.id}', ${idx})" />
        <label for="chk-${s.id}-${idx}">${step}</label>
      </div>
    `).join("");

    return `
      <div class="checklist-card" id="card-${s.id}">
        <div class="student-name">${s.nama}</div>
        <div class="student-id">${s.id} &nbsp;|&nbsp; ${statusBadge(s.status)}</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="prog-${s.id}" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-gray-500 mb-3" id="pct-${s.id}">${done}/${checklistSteps.length} langkah selesai (${pct}%)</div>
        ${itemsHtml}
        <button onclick="resetChecklist('${s.id}')"
          class="mt-3 text-xs text-red-500 hover:text-red-700 underline cursor-pointer bg-transparent border-none p-0">
          🔄 Reset Checklist
        </button>
      </div>
    `;
  }).join("");
}

function toggleCheck(id, idx) {
  const state = getChecklistState(id);
  state[idx] = !state[idx];
  saveChecklistState(id, state);

  // Update UI
  const item = document.getElementById(`item-${id}-${idx}`);
  if (state[idx]) item.classList.add("checked");
  else item.classList.remove("checked");

  const done = state.filter(Boolean).length;
  const pct = Math.round((done / checklistSteps.length) * 100);
  document.getElementById(`prog-${id}`).style.width = `${pct}%`;
  document.getElementById(`pct-${id}`).textContent = `${done}/${checklistSteps.length} langkah selesai (${pct}%)`;
}

function resetChecklist(id) {
  saveChecklistState(id, Array(checklistSteps.length).fill(false));
  renderChecklist();
}

// ============================================================
// TAB & SEARCH EVENT HANDLERS
// ============================================================
function setupTabHandlers() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      const val = this.dataset.val;
      document.querySelectorAll(`.tab-btn[data-tab="${tab}"]`).forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      if (tab === "exam") {
        currentExamSesi = val;
        renderExamTable(document.getElementById("exam-search").value);
      } else if (tab === "course") {
        currentCourseSesi = val;
        renderCourseTable(document.getElementById("course-search").value);
      }
    });
  });

  document.getElementById("exam-search").addEventListener("input", function () {
    renderExamTable(this.value);
  });
  document.getElementById("course-search").addEventListener("input", function () {
    renderCourseTable(this.value);
  });
  document.getElementById("status-search").addEventListener("input", function () {
    renderStatusTable(this.value);
  });
}

// ── Nav tab scroll to section ──────────────────────────────
function setupNavTabs() {
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const target = document.getElementById(this.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  renderSummaryCards();
  renderExamTable();
  renderCourseTable();
  renderStatusTable();
  renderChecklist();
  setupTabHandlers();
  setupNavTabs();
});
