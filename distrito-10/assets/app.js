let charts = [];

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return await res.json();
}

function percentage(value, total) {
  return total ? (value / total) * 100 : 0;
}

function destroyCharts() {
  charts.forEach((c) => c.destroy());
  charts = [];
}

function titleCase(text) {
  return String(text || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function verdictPill(value) {
  const cls = value >= 70 ? "pass" : "fail";
  const label = value >= 70 ? "Sólido" : "Crítico";
  return `<span class="pill ${cls}">${label}</span>`;
}

function renderHeader(summary) {
  document.getElementById("districtTitle").textContent = summary.display_name || summary.district_slug || "Distrito";
  document.getElementById("districtSubtitle").textContent = `${summary.company || "Compañía"} · Resumen ejecutivo distrital`;
  document.title = `${summary.display_name || summary.district_slug} · Dashboard distrital`;
}

function renderSummary(summary) {
  document.getElementById("totalLocations").textContent = summary.total_locations ?? 0;
  document.getElementById("totalPizzas").textContent = summary.total_pizzas ?? 0;
  document.getElementById("avgScore").textContent = Number(summary.average_score ?? 0).toFixed(1);
  document.getElementById("passFail").textContent = `${summary.pass_count ?? 0} / ${summary.fail_count ?? 0}`;
  document.getElementById("passRate").textContent = `${percentage(summary.pass_count ?? 0, summary.total_pizzas ?? 0).toFixed(1)}% pass`;
}

function renderCharts(summary) {
  destroyCharts();

  charts.push(
    new Chart(document.getElementById("passFailChart"), {
      type: "doughnut",
      data: {
        labels: ["PASS", "FAIL"],
        datasets: [{
          data: [summary.pass_count ?? 0, summary.fail_count ?? 0],
          backgroundColor: ["#1f7a5a", "#d98a8a"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  );

  charts.push(
    new Chart(document.getElementById("issuesChart"), {
      type: "bar",
      data: {
        labels: ["Burbuja", "Grasa", "Bordes sucios"],
        datasets: [{
          label: "Incidentes",
          data: [
            summary.burbuja_count ?? 0,
            summary.grasa_count ?? 0,
            summary.bordes_count ?? 0
          ],
          backgroundColor: ["#86b6f6", "#e7b35a", "#b49cf0"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  );
}

function renderLocations(rows) {
  const tbody = document.getElementById("locationsBody");
  tbody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${titleCase(row.location)}</td>
      <td><strong>${Number(row.average_score ?? 0).toFixed(1)}</strong> ${verdictPill(Number(row.average_score ?? 0))}</td>
      <td>${row.total_pizzas ?? 0}</td>
      <td>${row.pass_count ?? 0}</td>
      <td>${row.fail_count ?? 0}</td>
      <td>${row.burbuja_count ?? 0}</td>
      <td>${row.grasa_count ?? 0}</td>
      <td>${row.bordes_count ?? 0}</td>
      <td><a href="${row.relative_url}">Abrir</a></td>
    `;
    tbody.appendChild(tr);
  });
}

async function main() {
  const [summary, locations] = await Promise.all([
    fetchJson("./json/district_summary.json"),
    fetchJson("./json/district_locations.json")
  ]);

  renderHeader(summary);
  renderSummary(summary);
  renderCharts(summary);
  renderLocations(locations.locations || []);
}

main().catch((err) => {
  console.error(err);
  alert(`Error cargando dashboard distrital: ${err.message}`);
});