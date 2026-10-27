/* ============================================================
   charts.js — GPA Bar Chart + Pie Chart menggunakan Chart.js
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  buildBarChart();
  buildPieChart();
});

// ── Helper: potong nama untuk label ────────────────────────
function labelName(nama) {
  // Ambil perkataan pertama sahaja
  return nama.split(" ")[0];
}

// ============================================================
// BAR CHART — Perbandingan GPA Sesi 1 & 2: 2025/2026
// ============================================================
function buildBarChart() {
  const sesi1 = examResults["Sesi 1: 2025/2026"];
  const sesi2 = examResults["Sesi 2: 2025/2026"];

  // Hanya pelajar DIT3J (dalam studentList), ikut urutan studentList
  const students = studentList.filter(s =>
    sesi1.some(r => r.id === s.id) || sesi2.some(r => r.id === s.id)
  );

  const labels = students.map(s => labelName(s.nama));
  const data1  = students.map(s => {
    const r = sesi1.find(r => r.id === s.id);
    return r ? r.gpa : null;
  });
  const data2  = students.map(s => {
    const r = sesi2.find(r => r.id === s.id);
    return r ? r.gpa : null;
  });

  const ctx = document.getElementById("chart-bar").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Sesi 1: 2025/2026",
          data: data1,
          backgroundColor: "rgba(30,58,95,0.72)",
          borderColor: "rgba(30,58,95,1)",
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: "Sesi 2: 2025/2026",
          data: data2,
          backgroundColor: "rgba(34,197,94,0.65)",
          borderColor: "rgba(21,128,61,1)",
          borderWidth: 1,
          borderRadius: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            title: function (items) {
              const idx = items[0].dataIndex;
              return students[idx].nama;
            },
            label: function (item) {
              const label = item.dataset.label;
              const val = item.raw;
              return val !== null ? `${label}: GPA ${val.toFixed(2)}` : `${label}: —`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 4.0,
          ticks: { stepSize: 0.5 },
          grid: { color: "rgba(0,0,0,0.06)" },
          title: { display: true, text: "GPA" }
        },
        x: {
          ticks: { font: { size: 9 }, maxRotation: 90 },
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================
// PIE CHART — Taburan GPA Sesi 2: 2025/2026
// ============================================================
function buildPieChart() {
  const sesi2 = examResults["Sesi 2: 2025/2026"];
  const dit3j = sesi2.filter(r => studentList.some(s => s.id === r.id));

  let cemerlang = 0, baik = 0, perhatian = 0;
  dit3j.forEach(r => {
    if (r.gpa >= 3.5)      cemerlang++;
    else if (r.gpa >= 3.0) baik++;
    else                   perhatian++;
  });

  const ctx = document.getElementById("chart-pie").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: [
        `Cemerlang (GPA ≥ 3.5) — ${cemerlang} pelajar`,
        `Baik (GPA 3.0–3.49) — ${baik} pelajar`,
        `Perlu Perhatian (GPA < 3.0) — ${perhatian} pelajar`
      ],
      datasets: [{
        data: [cemerlang, baik, perhatian],
        backgroundColor: [
          "rgba(34,197,94,0.75)",
          "rgba(59,130,246,0.75)",
          "rgba(239,68,68,0.75)"
        ],
        borderColor: ["#16a34a","#2563eb","#dc2626"],
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 11 }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: function (item) {
              const total = cemerlang + baik + perhatian;
              const pct = ((item.raw / total) * 100).toFixed(1);
              return `${item.raw} pelajar (${pct}%)`;
            }
          }
        }
      }
    }
  });
}
