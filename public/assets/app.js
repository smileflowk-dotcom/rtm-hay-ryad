"use strict";

const dataUrl = "data/rtm-public.json";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatDate = (value) => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris"
}).format(new Date(value));

async function loadPublicData() {
  const response = await fetch(dataUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Chargement impossible (${response.status})`);
  return response.json();
}

function sourceLabel(data, sourceId) {
  const source = data.sources.find((item) => item.id === sourceId);
  return source?.organization || sourceId;
}

function renderDashboard(data) {
  document.querySelector("#last-updated").textContent = formatDate(data.meta.last_updated);
  document.querySelector("#global-status").textContent = data.meta.global_status;

  const metrics = [
    ["Objets", data.metrics.objects],
    ["Sources", data.metrics.sources],
    ["Objets validés", data.metrics.validated_objects],
    ["À vérifier", data.metrics.to_verify_objects],
    ["Alertes ouvertes", data.metrics.open_alerts]
  ];
  document.querySelector("#metrics").innerHTML = metrics.map(([label, value]) =>
    `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`
  ).join("");

  document.querySelector("#objects").innerHTML = data.objects.map((object) => `
    <article class="object-card">
      <h3>${escapeHtml(object.name)}</h3>
      <p class="muted">${escapeHtml(object.id)} · ${escapeHtml(object.territory)}</p>
      <span class="tag good">${escapeHtml(object.status)}</span>
      <span class="tag">Confiance ${escapeHtml(object.confidence)}</span>
      <p>${object.source_ids.length} source(s) · ${object.evidence_count} preuve(s) validée(s)</p>
    </article>`).join("");

  document.querySelector("#alerts").innerHTML = data.alerts.map((alert) => `
    <article class="alert">
      <h3>${escapeHtml(alert.severity)} · ${escapeHtml(alert.rule_id)}</h3>
      <p>${escapeHtml(alert.message)}</p>
      <p class="muted">Source : ${escapeHtml(alert.source_id)}</p>
    </article>`).join("");

  document.querySelector("#history").innerHTML = data.history.map((event) => `
    <tr>
      <td>${escapeHtml(formatDate(event.timestamp))}</td>
      <td>${escapeHtml(event.change_type)}</td>
      <td>${escapeHtml(event.object_id)}</td>
      <td>${event.source_ids.map((id) => escapeHtml(sourceLabel(data, id))).join(", ")}</td>
    </tr>`).join("");
}

function renderMap(data) {
  const points = data.objects.filter((object) => object.coordinates);
  const root = document.querySelector("#map");
  if (!points.length) {
    root.textContent = "Aucune coordonnée publique disponible.";
    return;
  }
  const lats = points.map((point) => point.coordinates.latitude);
  const lons = points.map((point) => point.coordinates.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const scale = (value, min, max, start, end) => min === max ? (start + end) / 2 : start + ((value - min) / (max - min)) * (end - start);
  root.innerHTML = `
    <svg viewBox="0 0 900 540" role="img" aria-label="Objets disposant de coordonnées prouvées">
      <rect x="35" y="25" width="830" height="480" rx="12" fill="#f7f9fc" stroke="#cbd7e6" />
      ${points.map((point, index) => {
        const x = scale(point.coordinates.longitude, minLon, maxLon, 90, 760);
        const y = scale(point.coordinates.latitude, minLat, maxLat, 450, 80);
        const labelOnLeft = x > 600;
        const labelX = labelOnLeft ? x - 18 : x + 18;
        const textAnchor = labelOnLeft ? "end" : "start";
        return `<g class="map-marker" tabindex="0" role="button" data-index="${index}" aria-label="Afficher ${escapeHtml(point.name)}">
          <circle cx="${x}" cy="${y}" r="12" fill="#117a43" />
          <text x="${labelX}" y="${y + 5}" text-anchor="${textAnchor}" font-size="16" fill="#172033">${escapeHtml(point.name)}</text>
        </g>`;
      }).join("")}
    </svg>`;

  const show = (index) => {
    const point = points[index];
    document.querySelector("#map-detail").textContent = [
      `${point.name} (${point.id})`,
      `Statut : ${point.status} · Confiance : ${point.confidence}`,
      `Latitude : ${point.coordinates.latitude} · Longitude : ${point.coordinates.longitude}`,
      `Sources : ${point.source_ids.map((id) => sourceLabel(data, id)).join(", ")}`,
      `Dernière mise à jour : ${formatDate(point.updated_at)}`
    ].join("\n");
  };
  root.querySelectorAll(".map-marker").forEach((marker) => {
    marker.addEventListener("click", () => show(Number(marker.dataset.index)));
    marker.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(Number(marker.dataset.index));
      }
    });
  });
}

function renderRelations(data) {
  document.querySelector("#relations").innerHTML = data.objects.map((object) => `
    <article class="relation-card">
      <h3>${escapeHtml(object.name)}</h3>
      <p class="muted">${escapeHtml(object.id)} · ${escapeHtml(object.rtm_id)}</p>
      <div class="relation-flow">
        <span class="node">Objet territorial</span><span class="arrow">→ possède →</span><span class="node">RTM-ID</span>
      </div>
      <p><strong>Observé dans :</strong></p>
      <ul class="source-list">${object.source_ids.map((id) => {
        const source = data.sources.find((item) => item.id === id);
        const label = escapeHtml(source?.organization || id);
        return `<li>${source?.url ? `<a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${label}</a>` : label} <span class="tag">${escapeHtml(id)}</span></li>`;
      }).join("")}</ul>
      <p>${object.evidence_count} preuve(s) validée(s), non publiée(s) dans cette version assainie.</p>
    </article>`).join("");
}

loadPublicData().then((data) => {
  const page = document.body.dataset.page;
  if (page === "dashboard") renderDashboard(data);
  if (page === "map") renderMap(data);
  if (page === "relations") renderRelations(data);
}).catch((error) => {
  const main = document.querySelector("main");
  const message = document.createElement("p");
  message.className = "error";
  message.textContent = `Erreur de chargement des données publiques : ${error.message}`;
  main.prepend(message);
});
