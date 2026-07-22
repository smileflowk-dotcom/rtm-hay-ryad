# Blueprint minimal du RTM intelligent

## Mission

Le RTM transforme des données territoriales traçables en connaissances, analyses et décisions humaines justifiées.

## Parcours

Observer → Comprendre → Analyser → Décider.

## Couche Territoire

Représenter l’objet, sa géométrie ou sa localisation, son origine, ses identifiants et son statut. L’inventaire OpenStreetMap reste séparé des objets RTM documentés et n’acquiert jamais automatiquement un RTM-ID.

## Couche Connaissance

Rassembler, par référence, les sources, documents, preuves, observations, validations et versions associées à l’objet. Une absence dans le MVO public est affichée comme une absence publique, sans conclure à une absence dans le RSU interne.

## Couche Intelligence

Appliquer cinq règles déclaratives et transparentes aux seuls objets pilotes. Chaque résultat expose la règle, la condition examinée, les références utilisées, le constat, la confiance et la recommandation. Le moteur ne modifie aucune donnée source.

## Couche Décision

Présenter les analyses, preuves disponibles et priorités, puis permettre l’enregistrement local d’une décision humaine de démonstration. Cette décision n’est transmise à aucun système officiel et peut être réinitialisée.

## Principe de prudence

- Aucune donnée non vérifiée ne devient automatiquement officielle.
- Aucune recommandation automatique ne vaut décision.
- Chaque résultat doit être explicable.
- Chaque résultat doit conserver ses sources.
- Toute donnée créée pour le scénario est marquée « Donnée de démonstration ».

## Périmètre de cette version

- Trois objets pilotes déjà documentés dans `rtm-public.json`.
- Quatre couches dans une seule fiche statique.
- Moteur JavaScript déterministe exécuté dans le navigateur.
- Décisions de démonstration conservées uniquement dans `localStorage`.
- Aucun backend, aucune base, aucune IA générative et aucune authentification.
