# DappRadar Scraper - Extension Chrome

Cette extension Chrome permet d'extraire automatiquement les informations principales des dapps sur DappRadar et de les exporter dans un fichier CSV.

## Fonctionnalités

- Extraction automatique des informations suivantes pour chaque dapp :
  - Titre
  - URL de l'icône (166x166)
  - Liste des blockchains associées
  - Réseaux sociaux (chaque réseau dans une colonne dédiée)
  - Site web officiel
  - Tags
  - Date de listing sur DappRadar
  - Date de dernière mise à jour
- Support du traitement de plusieurs URLs DappRadar en parallèle
- Affichage en temps réel des données extraites dans un tableau sous la zone d'input
- Export automatique au format CSV
- Interface simple et intuitive
- Gestion des erreurs et des URLs problématiques

## Installation

1. Ouvrez Chrome et accédez à `chrome://extensions/`
2. Activez le "Mode développeur" en haut à droite
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `daapradar-extension`

## Utilisation

1. Cliquez sur l'icône de l'extension dans la barre d'outils Chrome
2. Collez une ou plusieurs URLs DappRadar (format : `https://dappradar.com/dapp/...`)
3. Cliquez sur "Add DappRadar URL" pour chaque URL
4. Cliquez sur "Start Scraping" pour lancer l'extraction
5. Suivez la progression et visualisez les données extraites en temps réel dans le tableau
6. Une fois le scraping terminé, cliquez sur "Collect Info CSV" pour télécharger le fichier CSV

## Format du CSV

Le fichier CSV généré contient les colonnes suivantes :
- URL
- Title
- Images
- Images Number
- Platform
- Statut
- Blockchains
- Tags
- Date de listing
- Date de mise à jour
- Website
- (Colonnes dynamiques pour chaque réseau social détecté)

## Dépannage

- Vérifiez que les URLs sont bien au format DappRadar (`https://dappradar.com/dapp/...`)
- Rechargez l'extension si l'interface ne s'affiche pas correctement
- Consultez la console de l'extension pour les éventuelles erreurs

## À propos

Développé pour automatiser la collecte d'informations sur les dapps DappRadar.

---

Pour toute suggestion ou amélioration, ouvrez une issue ou faites une pull request sur le dépôt GitHub.
