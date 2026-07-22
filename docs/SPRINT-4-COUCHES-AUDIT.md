# Audit ciblé — Sprint quatre couches

## Éléments réutilisés

- Le Dashboard harmonisé, sa séparation entre inventaire OSM et objets RTM documentés, ainsi que ses compteurs générés.
- La carte Leaflet, la recherche normalisée, les six couches, les catégories, badges et fiches de provenance.
- Les trois objets de `public/data/rtm-public.json`, leurs RTM-ID, sources, coordonnées, statuts et niveaux de confiance.
- Les quatre GeoJSON OSM, leurs `14 431` éléments sélectionnés et `14 430` objets cartographiés, sans conversion en objets RTM.
- Le RSU local v1.0 comme mémoire interne conceptuelle ; il est inspecté mais demeure non suivi et non modifié.
- Les moteurs PowerShell Rule Engine et Change Tracking ; ils demeurent inchangés et indépendants.

## Fichiers modifiés

- `public/index.html` : phrase de mission, zone décisionnelle et accès aux dossiers pilotes.
- `public/map.html` : parcours conservé, sans réintroduire le Graphe.
- `public/assets/app.js` : liens vers les dossiers RTM depuis les fiches et cartes existantes.
- `public/assets/styles.css` : hiérarchie des quatre couches, états, responsive et décisions.

## Fichiers créés

- `public/object.html` et `public/assets/four-layers.js` pour l’unique interface Territoire → Connaissance → Intelligence → Décision.
- `public/data/rtm-knowledge.json`, `rtm-rules.json`, `rtm-analyses.json`, `rtm-decisions.json`.
- `docs/RTM-BLUEPRINT.md`, `DATA-MODEL-4-COUCHES.md`, `DEMO-USER-JOURNEY.md`, `TESTS-4-COUCHES.md` et ce rapport.

## Choix techniques

- Trois pilotes uniquement : les trois objets RTM déjà publiés.
- Références aux identifiants existants, sans duplication des géométries OSM.
- Moteur déclaratif fermé et déterministe en JavaScript natif.
- Une seule page de dossier avec quatre onglets accessibles ; aucune application séparée.
- `localStorage` limité aux décisions et statuts locaux de démonstration, avec réinitialisation.
- Contradiction neutre explicitement marquée « Donnée de démonstration » ; aucune administration, preuve ou validation officielle inventée.

## Éléments reportés

- Raccordement complet aux itérations conversationnelles et à la mémoire détaillée du RSU.
- Publication des preuves internes et écriture officielle des décisions.
- Conversion ou qualification en masse des objets OSM.
- Backend, authentification, base territoriale, IA générative et plateforme universelle d’import.
