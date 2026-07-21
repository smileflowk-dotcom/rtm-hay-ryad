import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDataDirectory = resolve(root, "public", "data");
const importMetadataPath = resolve(root, "data", "imports", "osm-hay-ryad", "import-metadata.json");

const layers = {
  buildings: "hay-ryad-buildings.geojson",
  roads: "hay-ryad-roads.geojson",
  places: "hay-ryad-places.geojson",
  landuse: "hay-ryad-landuse.geojson",
  observations: "rtm-observations.geojson"
};

const decodeJson = (buffer, file) => {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file}: JSON invalide (${error.message})`);
  }
};

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const uniqueSourceIds = new Set();
const layerMetadata = {};

for (const [key, file] of Object.entries(layers)) {
  const buffer = await readFile(resolve(publicDataDirectory, file));
  const collection = decodeJson(buffer, file);
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error(`${file}: FeatureCollection attendue`);
  }

  for (const feature of collection.features) {
    const sourceId = feature.properties?.source_id;
    if (key !== "observations" && sourceId) uniqueSourceIds.add(sourceId);
  }

  layerMetadata[key] = {
    file,
    features: collection.features.length,
    sha256: sha256(buffer)
  };
}

const importMetadata = decodeJson(await readFile(importMetadataPath), "import-metadata.json");
const publicData = decodeJson(
  await readFile(resolve(publicDataDirectory, "rtm-public.json")),
  "rtm-public.json"
);
const selectedUniqueObjects = importMetadata.raw_extract.selected_thematic_elements;
const publishedUniqueObjects = uniqueSourceIds.size;
const unclassifiedObjects = selectedUniqueObjects - publishedUniqueObjects;

if (unclassifiedObjects < 0) {
  throw new Error("Le nombre d’objets publiés dépasse le nombre d’éléments sélectionnés");
}

const output = {
  schema_version: "1.0-mvo",
  generated_from: "GeoJSON publics et métadonnées d’import versionnées",
  last_updated: [importMetadata.imported_at, publicData.meta.last_updated]
    .sort((a, b) => new Date(b) - new Date(a))[0],
  inventory: {
    source: "OpenStreetMap",
    source_qualification: "Source géographique publique, ouverte et collaborative — données non vérifiées par RTM.",
    licence: importMetadata.licence,
    status: "NON_VERIFIE",
    imported_at: importMetadata.imported_at,
    osm_data_timestamp: importMetadata.osm_data_timestamp,
    extent: {
      bbox: [
        importMetadata.bbox.west,
        importMetadata.bbox.south,
        importMetadata.bbox.east,
        importMetadata.bbox.north
      ],
      crs: importMetadata.bbox.crs,
      status: "PROVISOIRE_NON_OFFICIELLE"
    },
    counts: {
      buildings: layerMetadata.buildings.features,
      roads: layerMetadata.roads.features,
      places: layerMetadata.places.features,
      landuse: layerMetadata.landuse.features,
      observations: layerMetadata.observations.features,
      thematic_representations:
        layerMetadata.buildings.features +
        layerMetadata.roads.features +
        layerMetadata.places.features +
        layerMetadata.landuse.features,
      selected_unique_objects: selectedUniqueObjects,
      published_unique_objects: publishedUniqueObjects,
      unclassified_selected_objects: unclassifiedObjects
    },
    layers: layerMetadata,
    query_sha256: importMetadata.processing.query_sha256,
    raw_extract_sha256: importMetadata.raw_extract.sha256
  },
  documented_rtm: {
    objects: publicData.objects.length,
    sources: publicData.sources.length,
    statuses: [...new Set(publicData.objects.map((object) => object.status))],
    last_updated: publicData.meta.last_updated
  }
};

await writeFile(
  resolve(publicDataDirectory, "mvo-metadata.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8"
);

console.log(
  `Métadonnées MVO générées : ${selectedUniqueObjects} sélectionnés, ` +
  `${publishedUniqueObjects} publiés, ${unclassifiedObjects} non classé(s).`
);
