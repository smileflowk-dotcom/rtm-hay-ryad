# Audit factuel du MVO RTM Hay Ryad

## Constats vérifiés

- Le Dashboard présente uniquement les `3` objets de `rtm-public.json` et ses `4` sources. Il ne présente pas l’inventaire OpenStreetMap devenu la partie principale du MVO.
- Le libellé générique « Objets territoriaux » et la métrique « Objets validés » peuvent laisser croire que les trois objets documentés représentent l’ensemble de Hay Ryad.
- Les quatre couches GeoJSON contiennent `7 538` bâtiments, `5 232` voies, `1 320` lieux et services et `738` occupations du sol, soit `14 828` représentations thématiques.
- Ces couches contiennent `14 430` identifiants OSM uniques. Les métadonnées de l’extraction indiquent `14 431` éléments thématiques sélectionnés : `node/5857132581`, portant uniquement l’adresse observée `72`, n’est classé dans aucune couche publiée.
- La date affichée sur l’accueil provient du RSU public (`2026-07-21T16:04:43.0524889Z`) et ne reflète pas l’import OSM plus récent (`2026-07-21T21:03:49.145Z`).
- La carte sépare techniquement les objets RTM, les couches OSM et les observations, mais les libellés « Objets RTM validés », « RTM validé » et « Lieu ouvert non vérifié » n’expliquent pas assez clairement leur statut différent.
- Les fiches OSM conservent correctement la source OpenStreetMap, l’identifiant source, le lien OSM, la licence ODbL, la date d’import, le statut `non_verifie`, l’absence de rattachement RSU et l’absence de RTM-ID. Leur niveau de preuve est `source_ouverte`, jamais `source_officielle`.
- Les objets OSM publiés ne possèdent aucun RTM-ID et aucune référence RSU. Le fichier d’observations contient `0` objet réel et ne publie pas le point d’exemple du kit.
- La page Graphe expose uniquement les trois objets de démonstration documentés. Sa présence dans la navigation principale peut la faire percevoir comme un graphe du territoire complet.
- La carte est déjà utilisable sur mobile : le panneau de filtres devient repliable et passe sous la carte. La navigation se replie correctement, mais le parcours principal n’est pas explicité depuis l’accueil.

## Corrections indispensables

- Présenter deux blocs sans mélange : « Inventaire territorial ouvert » et « Objets de démonstration documentés ».
- Générer les compteurs publics depuis les GeoJSON et les métadonnées d’import, en rendant explicite l’écart d’un objet non classé.
- Afficher la date de l’import OSM sur le Dashboard et qualifier OpenStreetMap de source géographique publique, ouverte et collaborative, non vérifiée par RTM.
- Renommer les libellés de carte pour distinguer les objets RTM documentés, les données OSM non vérifiées et les observations terrain.
- Ajouter un accès direct « Explorer le territoire » et expliquer en une phrase le parcours de validation progressive du RTM.
- Retirer temporairement le Graphe de la navigation principale, sans supprimer sa page ni ses données.

## Éléments à conserver

- La carte Leaflet, les fonds OpenStreetMap, la recherche, les filtres, le chargement différé des couches lourdes et la fiche de traçabilité.
- Les quatre GeoJSON OSM, leurs identifiants source stables, leurs métadonnées, leur licence et leurs statuts non vérifiés.
- Les trois objets RTM documentés, leurs RTM-ID, leurs rattachements RSU, leurs sources, leurs niveaux de confiance, l’alerte AURS et l’historique public.
- Le fichier d’observations vide, qui évite de présenter une observation artificielle.
- La page et les données du Graphe dans le dépôt pour une évolution ultérieure.

## Éléments à reporter en V2

- Classer ou traiter explicitement l’objet OSM brut `node/5857132581` sans inventer de catégorie.
- Remplacer l’emprise rectangulaire provisoire par un périmètre officiel vérifié.
- Réintroduire le Graphe dans la navigation lorsqu’il représentera plus que les trois objets de démonstration.
- Ajouter un parcours de qualification OSM vers le RSU lorsque des preuves officielles ou des observations terrain réelles seront disponibles.
