# Parcours de démonstration — RTM en quatre couches

Durée cible : moins de cinq minutes. Le parcours utilise uniquement les trois objets RTM déjà publiés.

## 1. Territoire — observer (0:00 à 1:00)

1. Ouvrir `index.html`.
2. Constater la séparation entre l’inventaire OpenStreetMap, explicitement non vérifié par RTM, et les trois objets RTM documentés.
3. Ouvrir `map.html` puis rechercher « Agence Urbaine ».
4. Désactiver au besoin la couche des lieux OSM pour isoler les objets RTM.
5. Ouvrir le dossier quatre couches depuis la fiche cartographique RTM.

Résultat attendu : l’objet conserve son identifiant RTM, ses sources et son statut. Aucun objet OSM ne reçoit de RTM-ID.

## 2. Connaissance — comprendre (1:00 à 2:00)

1. Ouvrir l’onglet « Connaissance ».
2. Parcourir les sources, documents, validations, informations manquantes et contradictions.
3. Vérifier que l’absence de preuve publique consultable est distinguée de l’existence de preuves déclarées dans le RSU assaini.

Résultat attendu : chaque donnée réelle reste traçable ; les preuves internes ne sont pas publiées.

## 3. Intelligence — analyser (2:00 à 3:30)

1. Ouvrir l’onglet « Intelligence ».
2. Examiner les cinq règles `R-001` à `R-005`, leur condition, leur résultat, leurs références et leur recommandation.
3. Relancer l’analyse pour constater son exécution déterministe dans le navigateur.
4. Sélectionner la Trésorerie Générale du Royaume pour observer le scénario neutre de contradiction, toujours marqué « Donnée de démonstration ».

Résultat attendu : aucune règle ne modifie une source, un objet ou le RSU ; une ambiguïté reste soumise à validation humaine.

## 4. Décision — agir humainement (3:30 à 5:00)

1. Ouvrir l’onglet « Décision ».
2. Choisir une analyse déclenchée.
3. Essayer une action : approuver, rejeter, demander une vérification ou marquer comme traité.
4. Recharger la page pour vérifier la persistance locale.
5. Utiliser « Réinitialiser les décisions locales ».

Résultat attendu : seule la décision de démonstration est mémorisée dans le navigateur sous la clé `rtm-demo-decisions-v1`. Elle n’est transmise à aucun système officiel et n’altère aucune donnée publique ou interne.

## Message de clôture

Le RTM relie un objet territorial observé à ses connaissances traçables, produit une analyse explicable, puis réserve la décision à un humain.
