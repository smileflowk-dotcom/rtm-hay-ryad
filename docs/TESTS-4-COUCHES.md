# Tests — RTM en quatre couches

Date d’exécution locale : 22 juillet 2026.

## Résultats fonctionnels

| Contrôle | Résultat |
|---|---|
| Accueil : promesse quatre couches et trois objets pilotes | Réussi |
| Séparation des compteurs RTM et OpenStreetMap | Réussi |
| Carte : compte initial de 2 060 entités visibles | Réussi |
| Carte : activation et désactivation des six couches | Réussi |
| Objet OSM : aucun RTM-ID ni lien vers un dossier RTM | Réussi |
| Objet RTM : RTM-ID et accès au dossier quatre couches | Réussi |
| Trois dossiers : quatre onglets accessibles | Réussi |
| Cinq règles exécutées pour chacun des trois objets | Réussi |
| Déclenchements déterministes par objet : 1 / 1 / 2 | Réussi |
| `R-004` : scénario neutre explicitement marqué comme démonstration | Réussi |
| Relance d’analyse sans mutation des données sources | Réussi |
| Quatre actions humaines et statuts locaux correspondants | Réussi |
| Persistance après rechargement, limitée à une clé locale | Réussi |
| Réinitialisation ciblée de la démonstration | Réussi |
| Affichage mobile sans débordement horizontal | Réussi |
| Console et requêtes applicatives | Aucune erreur |

## Comptes cartographiques contrôlés

| État de couche | Entités visibles |
|---|---:|
| RTM + lieux + occupation du sol | 2 060 |
| RTM désactivé | 2 058 |
| Lieux désactivés | 740 |
| Occupation du sol désactivée | 1 322 |
| Voies activées | 7 292 |
| Bâtiments activés | 9 598 |

Ces résultats confirment que les volumes du MVO sont conservés et que les objets OSM ne sont pas promus en objets RTM.

## Contrôles d’intégrité à exécuter avant publication

- validation JSON et références croisées des quatre nouvelles ressources ;
- syntaxe JavaScript ;
- encodage UTF-8 ;
- absence de secret, de chemin ou de référence à un espace synchronisé local ;
- absence de modification du RSU et des moteurs métier internes ;
- conservation des fichiers géographiques et de leurs empreintes ;
- contrôle des liens relatifs sur GitHub Pages ;
- vérification du workflow puis du parcours sur l’URL publique.

## Limites assumées

- la démonstration porte sur trois objets pilotes, pas sur tout Hay Ryad ;
- les preuves internes déclarées ne sont pas exposées dans le site public ;
- une contradiction neutre est artificielle et toujours étiquetée « Donnée de démonstration » ;
- les décisions restent dans le stockage local du navigateur ;
- aucun calcul n’emporte validation officielle ni décision automatique.
