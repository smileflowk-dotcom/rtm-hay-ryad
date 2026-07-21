# Import OpenStreetMap — Hay Ryad

Ce dossier conserve la traçabilité de l’import public sans inclure la réponse Overpass brute de 12,2 Mo.

- `bbox_hay_ryad.json` est la copie exacte de l’emprise provisoire fournie par le kit.
- `hay_ryad_overpass.query` est la requête exécutée sans modification.
- `import-metadata.json` conserve l’endpoint, les dates, les volumes, les empreintes et les erreurs.
- `IMPORT_REPORT.md` résume le résultat et ses limites.

La réponse brute a servi à la conversion locale, son empreinte SHA-256 est conservée, mais elle n’est ni versionnée ni téléversée par GitHub Pages. Les GeoJSON normalisés sont publiés depuis `public/data/`.

L’emprise n’est pas une limite officielle de Hay Ryad. Les objets OpenStreetMap restent `non_verifie` jusqu’à une validation RTM.
