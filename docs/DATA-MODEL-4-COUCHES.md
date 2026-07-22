# Modèle de données léger — quatre couches

## Références existantes

Les objets, RTM-ID, noms, statuts, coordonnées et sources restent dans `public/data/rtm-public.json`. Les nouveaux fichiers ne copient pas les GeoJSON OSM et n’attribuent aucun RTM-ID supplémentaire.

## Connaissance

`public/data/rtm-knowledge.json` relie chaque dossier à `object_reference`. Un dossier contient :

- `record_id`, `object_reference`, `object_label` ;
- `sources`, `documents`, `evidence`, `observations` ;
- `validation_events`, `version_history` ;
- `confidence_level`, `knowledge_status`, `last_reviewed_at` ;
- les lacunes, contradictions et demandes de vérification nécessaires à l’explication.

Les statuts métier autorisés sont : `importé`, `documenté`, `à vérifier`, `validé`, `contesté`, `archivé`. Le champ `data_nature` distingue les données réelles publiées des données de démonstration.

## Règles

`public/data/rtm-rules.json` contient des règles déclaratives. `condition_type` est interprété par une liste fermée de conditions JavaScript ; aucun code n’est lu depuis le JSON.

Les cinq conditions sont : source absente, preuve publique absente, revue ancienne, contradiction enregistrée et statut public non validé.

## Analyses

`public/data/rtm-analyses.json` décrit le schéma de sortie. Les analyses sont recalculées côté navigateur et contiennent :

- `analysis_id`, `object_reference`, `rule_id` ;
- `finding`, `severity`, `evidence_references`, `confidence` ;
- `generated_at`, `analysis_status`, `human_validation` ;
- la condition examinée et la recommandation de la règle.

Une analyse `NON_DECLENCHEE` prouve que la règle a été exécutée, pas qu’une alerte existe.

## Décisions

`public/data/rtm-decisions.json` définit les actions et la clé de stockage locale. Une décision contient les champs requis et reste marquée « Donnée de démonstration ».

Le navigateur ne réécrit aucun JSON. Seuls la décision humaine locale, le statut local d’une analyse et une demande de vérification sont conservés dans `localStorage`.

## Relations minimales

```text
rtm-public.objects[].id
        ↓ object_reference
rtm-knowledge.records[]
        ↓ rule_id
analyses calculées dans le navigateur
        ↓ analysis_references
décisions locales de démonstration
```
