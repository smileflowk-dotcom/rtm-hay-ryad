"use strict";

const dataUrl = "data/rtm-public.json";
const mvoMetadataUrl = "data/mvo-metadata.json";

const mapDatasets = {
  rtm: { label: "Objets RTM documentés", url: null },
  places: { label: "Lieux et services OSM", url: "data/hay-ryad-places.geojson" },
  landuse: { label: "Occupation du sol OSM", url: "data/hay-ryad-landuse.geojson" },
  roads: { label: "Voies OSM", url: "data/hay-ryad-roads.geojson" },
  buildings: { label: "Bâtiments OSM", url: "data/hay-ryad-buildings.geojson" },
  observations: { label: "Observations terrain RTM", url: "data/rtm-observations.geojson" }
};

const mapDrawOrder = ["landuse", "buildings", "roads", "places", "rtm", "observations"];

const categoryStyles = {
  objet_rtm: { color: "#7c2d12", fillColor: "#ea580c", weight: 3, fillOpacity: 0.9, radius: 8 },
  ecole_enseignement: { color: "#1d4ed8", fillColor: "#3b82f6", weight: 1.5, fillOpacity: 0.7, radius: 6 },
  sante: { color: "#b91c1c", fillColor: "#ef4444", weight: 1.5, fillOpacity: 0.7, radius: 6 },
  administration: { color: "#5b21b6", fillColor: "#8b5cf6", weight: 1.5, fillOpacity: 0.7, radius: 6 },
  commerce_service: { color: "#a16207", fillColor: "#eab308", weight: 1.25, fillOpacity: 0.65, radius: 5 },
  equipement: { color: "#0f766e", fillColor: "#14b8a6", weight: 1.25, fillOpacity: 0.65, radius: 5 },
  espace_vert: { color: "#15803d", fillColor: "#4ade80", weight: 1, fillOpacity: 0.28, radius: 5 },
  lieu_point_interet: { color: "#334155", fillColor: "#64748b", weight: 1.25, fillOpacity: 0.65, radius: 5 },
  occupation_sol: { color: "#4d7c0f", fillColor: "#a3e635", weight: 0.8, fillOpacity: 0.16, radius: 4 },
  route_voie: { color: "#2563eb", fillColor: "#60a5fa", weight: 1.5, fillOpacity: 0.25, radius: 3 },
  batiment: { color: "#64748b", fillColor: "#cbd5e1", weight: 0.65, fillOpacity: 0.22, radius: 3 },
  observation: { color: "#be123c", fillColor: "#fb7185", weight: 2, fillOpacity: 0.8, radius: 7 }
};

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

async function loadMvoMetadata() {
  const response = await fetch(mvoMetadataUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Métadonnées MVO indisponibles (${response.status})`);
  return response.json();
}

function sourceLabel(data, sourceId) {
  const source = data.sources.find((item) => item.id === sourceId);
  return source?.organization || sourceId;
}

function renderDashboard(data, metadata) {
  const numberFormat = new Intl.NumberFormat("fr-FR");
  const counts = metadata.inventory.counts;
  document.querySelector("#last-updated").textContent = formatDate(metadata.last_updated);
  document.querySelector("#global-status").textContent = "Inventaire disponible · OSM non vérifié";

  const inventoryMetrics = [
    ["Objets OSM uniques sélectionnés", counts.selected_unique_objects],
    ["Bâtiments", counts.buildings],
    ["Voies", counts.roads],
    ["Lieux et services", counts.places],
    ["Occupations du sol", counts.landuse]
  ];
  document.querySelector("#inventory-metrics").innerHTML = inventoryMetrics.map(([label, value]) =>
    `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(numberFormat.format(value))}</strong></article>`
  ).join("");

  const unpublished = counts.unclassified_selected_objects;
  document.querySelector("#inventory-method").innerHTML = `
    <p><strong>${escapeHtml(numberFormat.format(counts.published_unique_objects))}</strong> objets sont cartographiés dans les quatre couches thématiques ;
    <strong>${escapeHtml(numberFormat.format(unpublished))}</strong> élément d’adresse sélectionné reste non classé.</p>
    <p>${escapeHtml(numberFormat.format(counts.thematic_representations))} représentations thématiques au total — un même objet OSM peut appartenir à plusieurs couches.</p>
    <p>Licence ${escapeHtml(metadata.inventory.licence)} · Emprise ${escapeHtml(metadata.inventory.extent.status.toLowerCase().replaceAll("_", " "))} · Import du ${escapeHtml(formatDate(metadata.inventory.imported_at))}.</p>`;

  document.querySelector("#documented-count").textContent =
    `${numberFormat.format(data.objects.length)} objet${data.objects.length > 1 ? "s" : ""}`;

  document.querySelector("#objects").innerHTML = data.objects.map((object) => `
    <article class="object-card">
      <h3>${escapeHtml(object.name)}</h3>
      <p class="muted">Rattachement RSU : ${escapeHtml(object.id)} · ${escapeHtml(object.territory)}</p>
      <span class="tag good">Statut RSU : ${escapeHtml(object.status)}</span>
      <span class="tag">Confiance ${escapeHtml(object.confidence)}</span>
      <p><strong>RTM-ID :</strong> ${escapeHtml(object.rtm_id)}</p>
      <p><strong>Sources documentaires :</strong></p>
      <ul class="source-list compact">${object.source_ids.map((id) => {
        const source = data.sources.find((item) => item.id === id);
        const label = escapeHtml(source?.organization || source?.title || id);
        const sourceName = source?.url
          ? `<a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${label}</a>`
          : label;
        return `<li>${sourceName} <span class="tag">${escapeHtml(source?.availability || "NON_RENSEIGNE")}</span></li>`;
      }).join("")}</ul>
      <p>${object.evidence_count} preuve(s) enregistrée(s), non publiée(s) dans ce MVO.</p>
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

async function renderMap(data) {
  if (typeof L === "undefined") throw new Error("Leaflet est indisponible.");

  const bounds = L.latLngBounds([[33.94, -6.895], [33.985, -6.835]]);
  const map = L.map("map", {
    preferCanvas: true,
    zoomControl: true,
    minZoom: 11,
    maxZoom: 20
  });
  map.fitBounds(bounds, { padding: [18, 18] });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  L.rectangle(bounds, {
    color: "#b45309",
    weight: 2,
    dashArray: "7 7",
    fill: false,
    interactive: false
  }).addTo(map).bindTooltip("Emprise de travail provisoire — non officielle");

  const status = document.querySelector("#map-status");
  const visibleCount = document.querySelector("#visible-count");
  const detail = document.querySelector("#map-detail");
  const search = document.querySelector("#map-search");
  const searchResults = document.querySelector("#map-search-results");
  const datasetCache = new Map();
  const renderedLayers = new Map();
  const numberFormat = new Intl.NumberFormat("fr-FR");

  const rtmFeatures = data.objects.filter((object) => object.coordinates).map((object) => ({
    type: "Feature",
    id: object.rtm_id,
    geometry: {
      type: "Point",
      coordinates: [object.coordinates.longitude, object.coordinates.latitude]
    },
    properties: {
      rtm_id: object.rtm_id,
      categorie_rtm: "objet_rtm",
      nom: object.name,
      adresse_humaine: object.territory,
      source_originale: object.source_ids.map((id) => sourceLabel(data, id)).join(", "),
      source_id: object.source_ids.join(", "),
      source_url: null,
      date_import: object.updated_at,
      statut_validation: object.status.toLowerCase(),
      niveau_preuve: "source_officielle",
      reference_rsu: object.id,
      licence_source: null,
      confiance: object.confidence
    }
  }));
  datasetCache.set("rtm", { type: "FeatureCollection", features: rtmFeatures });

  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

  const selectedCategories = () => new Set(
    [...document.querySelectorAll("[data-category]:checked")].map((input) => input.dataset.category)
  );

  const isLayerActive = (key) => Boolean(document.querySelector(`[data-layer="${key}"]`)?.checked);

  const ensureDataset = async (key) => {
    if (datasetCache.has(key)) return datasetCache.get(key);
    const config = mapDatasets[key];
    status.textContent = `Chargement : ${config.label}…`;
    const response = await fetch(config.url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${config.label} indisponible (${response.status})`);
    const collection = await response.json();
    if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
      throw new Error(`${config.label} : GeoJSON invalide`);
    }
    datasetCache.set(key, collection);
    return collection;
  };

  const styleForFeature = (feature) => {
    const category = feature.properties?.categorie_rtm || "lieu_point_interet";
    return categoryStyles[category] || categoryStyles.lieu_point_interet;
  };

  const safeDate = (value) => {
    if (!value) return "Non renseignée";
    try { return formatDate(value); } catch { return String(value); }
  };

  const showFeature = (feature) => {
    const properties = feature.properties || {};
    const name = properties.nom || "Objet sans nom observé";
    const isOsm = properties.source_originale === "OpenStreetMap" ||
      properties.source_url?.startsWith("https://www.openstreetmap.org/");
    const location = feature.geometry?.type === "Point"
      ? `${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}`
      : `Géométrie ${feature.geometry?.type || "non renseignée"}`;
    const sourceLink = isOsm
      ? `<a href="${escapeHtml(properties.source_url)}" target="_blank" rel="noopener noreferrer">Voir l’objet sur OpenStreetMap</a>`
      : "Aucun lien public associé";
    const displayedSource = isOsm
      ? "OpenStreetMap — source géographique publique, ouverte et collaborative"
      : properties.source_originale || "Non renseignée";
    const displayedStatus = isOsm
      ? "Non vérifié par RTM"
      : properties.statut_validation || "Non renseigné";
    const evidenceLabel = isOsm ? "Qualification RTM" : "Niveau de preuve";
    const evidenceValue = isOsm
      ? "Donnée ouverte collaborative, non vérifiée"
      : properties.niveau_preuve || "Non renseigné";
    const rsuReference = isOsm ? "Aucun rattachement" : properties.reference_rsu || "Non rattachée";
    const rtmId = isOsm ? "Non attribué" : properties.rtm_id || "Non attribué";
    detail.innerHTML = `
      <p class="eyebrow dark">Fiche objet</p>
      <h2>${escapeHtml(name)}</h2>
      <p><span class="tag">${escapeHtml(properties.categorie_rtm || "non_classé")}</span>
      <span class="tag ${isOsm ? "warn" : "good"}">${escapeHtml(displayedStatus)}</span></p>
      <dl class="feature-details">
        <div><dt>Catégorie</dt><dd>${escapeHtml(properties.categorie_rtm || "Non classée")}</dd></div>
        <div><dt>Adresse observée</dt><dd>${escapeHtml(properties.adresse_humaine || "Non renseignée")}</dd></div>
        <div><dt>Localisation</dt><dd>${escapeHtml(location)}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(displayedSource)}</dd></div>
        <div><dt>Identifiant ${isOsm ? "OSM" : "source"}</dt><dd>${escapeHtml(properties.source_id || "Non renseigné")}</dd></div>
        <div><dt>Statut</dt><dd>${escapeHtml(displayedStatus)}</dd></div>
        <div><dt>${escapeHtml(evidenceLabel)}</dt><dd>${escapeHtml(evidenceValue)}</dd></div>
        <div><dt>Rattachement RSU</dt><dd>${escapeHtml(rsuReference)}</dd></div>
        <div><dt>RTM-ID</dt><dd>${escapeHtml(rtmId)}</dd></div>
        <div><dt>Date d’import</dt><dd>${escapeHtml(safeDate(properties.date_import))}</dd></div>
        <div><dt>Licence</dt><dd>${escapeHtml(properties.licence_source || "Selon la source")}</dd></div>
        <div><dt>Objet source</dt><dd>${sourceLink}</dd></div>
      </dl>`;
    if (window.matchMedia("(max-width: 820px)").matches) {
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const makeGeoJsonLayer = (features) => L.geoJSON({ type: "FeatureCollection", features }, {
    style: styleForFeature,
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, styleForFeature(feature)),
    onEachFeature: (feature, layer) => {
      const properties = feature.properties || {};
      const label = properties.nom || properties.categorie_rtm || "Objet sans nom observé";
      layer.bindTooltip(escapeHtml(label), { sticky: true, direction: "top" });
      layer.on("click", () => showFeature(feature));
    }
  });

  const renderSearchResults = (features, query) => {
    if (!query) {
      searchResults.replaceChildren();
      return;
    }
    const unique = new Map();
    for (const feature of features) {
      const key = feature.properties?.source_id || feature.id;
      if (!unique.has(key)) unique.set(key, feature);
    }
    const matches = [...unique.values()].slice(0, 8);
    if (!matches.length) {
      searchResults.innerHTML = '<p class="muted">Aucun nom correspondant dans les couches actives.</p>';
      return;
    }
    searchResults.innerHTML = matches.map((feature, index) => `
      <button type="button" data-search-result="${index}">
        <strong>${escapeHtml(feature.properties?.nom || "Objet sans nom observé")}</strong>
        <span>${escapeHtml(feature.properties?.categorie_rtm || "non_classé")}</span>
      </button>`).join("");
    searchResults.querySelectorAll("[data-search-result]").forEach((button) => {
      button.addEventListener("click", () => {
        const feature = matches[Number(button.dataset.searchResult)];
        showFeature(feature);
        if (feature.geometry?.type === "Point") {
          map.setView([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], Math.max(map.getZoom(), 17));
        } else {
          const featureBounds = L.geoJSON(feature).getBounds();
          if (featureBounds.isValid()) map.fitBounds(featureBounds, { padding: [35, 35], maxZoom: 18 });
        }
      });
    });
  };

  const renderActiveLayers = () => {
    for (const layer of renderedLayers.values()) map.removeLayer(layer);
    renderedLayers.clear();
    const categories = selectedCategories();
    const query = normalize(search.value.trim());
    let count = 0;
    const matches = [];

    for (const key of mapDrawOrder) {
      if (!isLayerActive(key) || !datasetCache.has(key)) continue;
      const collection = datasetCache.get(key);
      const features = collection.features.filter((feature) => {
        const properties = feature.properties || {};
        if (!categories.has(properties.categorie_rtm)) return false;
        return !query || normalize(properties.nom).includes(query);
      });
      const layer = makeGeoJsonLayer(features).addTo(map);
      renderedLayers.set(key, layer);
      count += features.length;
      matches.push(...features);
    }

    renderSearchResults(matches, query);
    visibleCount.textContent = `${numberFormat.format(count)} visible${count > 1 ? "s" : ""}`;
    status.textContent = query
      ? `${numberFormat.format(count)} résultat${count > 1 ? "s" : ""} dans les couches actives.`
      : "Carte prête. Les couches lourdes se chargent uniquement à la demande.";
  };

  document.querySelectorAll("[data-layer]").forEach((input) => {
    input.addEventListener("change", async () => {
      if (!input.checked) {
        renderActiveLayers();
        return;
      }
      try {
        await ensureDataset(input.dataset.layer);
        renderActiveLayers();
      } catch (error) {
        input.checked = false;
        status.textContent = error.message;
        status.classList.add("error-text");
      }
    });
  });

  document.querySelectorAll("[data-category]").forEach((input) => {
    input.addEventListener("change", renderActiveLayers);
  });

  let searchTimer;
  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderActiveLayers, 180);
  });

  document.querySelector("#map-recenter").addEventListener("click", () => {
    map.fitBounds(bounds, { padding: [18, 18] });
  });

  window.addEventListener("resize", () => map.invalidateSize(), { passive: true });
  document.querySelector("#map-controls").addEventListener("toggle", () => {
    setTimeout(() => map.invalidateSize(), 120);
  });

  try {
    for (const key of ["places", "landuse"]) await ensureDataset(key);
    renderActiveLayers();
    map.getContainer().dataset.ready = "true";
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error-text");
    renderActiveLayers();
  }
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

loadPublicData().then(async (data) => {
  const page = document.body.dataset.page;
  if (page === "dashboard") renderDashboard(data, await loadMvoMetadata());
  if (page === "map") await renderMap(data);
  if (page === "relations") renderRelations(data);
}).catch((error) => {
  const main = document.querySelector("main");
  const message = document.createElement("p");
  message.className = "error";
  message.textContent = `Erreur de chargement des données publiques : ${error.message}`;
  main.prepend(message);
});
