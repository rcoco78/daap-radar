# eBay Title Scraper - Extension Chrome

Cette extension Chrome permet d'extraire automatiquement les informations des produits eBay et de les exporter dans un fichier CSV.

## Fonctionnalités

- Extraction des informations des produits eBay :
  - Titre du produit
  - Images (avec URLs en haute résolution)
  - Nombre d'images
  - Item Specifics (caractéristiques du produit)
  - Statut de l'extraction
- Support de plusieurs URLs simultanément (5 onglets en parallèle)
- Barre de progression en temps réel
- Gestion des erreurs avec affichage des URLs problématiques
- Export automatique au format CSV
- Interface simple et intuitive
- Support du glisser-déposer d'URLs
- Gestion d'une liste d'URLs avec possibilité d'ajout/suppression

## Installation

1. Ouvrez Chrome et accédez à `chrome://extensions/`
2. Activez le "Mode développeur" en haut à droite de la page
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `ebay-title-scraper`

## Utilisation

1. Cliquez sur l'icône de l'extension dans la barre d'outils de Chrome
2. Dans la fenêtre popup qui s'ouvre :
   - Collez une URL eBay valide dans le champ de texte
   - Cliquez sur "Add URL" pour l'ajouter à la liste
   - Répétez l'opération pour ajouter plusieurs URLs
   - Vous pouvez supprimer une URL en cliquant sur le "×" à côté
3. Une fois toutes vos URLs ajoutées, cliquez sur "Scrape & Export CSV"
4. Suivez la progression dans la barre de progression
5. Les erreurs éventuelles seront affichées en rouge sous la barre de progression
6. Une fois le traitement terminé, un fichier CSV unique sera téléchargé

## Format du fichier CSV

Le fichier CSV généré contient les colonnes suivantes (dans l'ordre) :

### Colonnes prioritaires
- `URL` : l'URL du produit eBay
- `Title` : le titre du produit
- `Images` : les URLs des images séparées par " | "
- `Images Number` : nombre d'images trouvées
- `Platform` : toujours "eBay"
- `Part Link Number` : numéro de pièce (si disponible)
- `PartNumber` : numéro de pièce alternatif (si disponible)
- `Year` : année (si disponible)
- `Make` : marque (si disponible)
- `Model` : modèle (si disponible)
- `Statut` : statut de l'extraction ("Succès", "Aucune image trouvée" ou message d'erreur)

### Colonnes supplémentaires
- Toutes les autres caractéristiques (Item Specifics) trouvées sur la page

Note : Les valeurs non trouvées sont remplacées par "-" dans le CSV.

## Structure des fichiers

```
ebay-title-scraper/
│
├── manifest.json    # Configuration de l'extension
├── popup.html      # Interface utilisateur
├── popup.js        # Logique de l'interface
├── content.js      # Script d'extraction des données
└── background.js   # Script d'arrière-plan
```

## Dépannage

Si l'extension ne fonctionne pas correctement :

1. Vérifiez que les URLs sont bien des URLs eBay valides (doivent contenir "ebay.com/itm")
2. Assurez-vous que les pages sont complètement chargées
3. Vérifiez que vous avez les permissions nécessaires dans Chrome
4. Essayez de recharger l'extension dans `chrome://extensions/`
5. Consultez la liste des erreurs affichée dans l'interface

## Notes techniques

- L'extension traite 5 URLs simultanément pour optimiser les performances
- Le délai de 1.5 secondes permet d'assurer que la page est complètement chargée
- Les images sont extraites en haute résolution (remplacement de s-l140 par s-l1600)
- Les images sont recherchées à la fois dans la grille d'images et dans le carousel
- Les titres et valeurs contenant des guillemets sont correctement échappés dans le CSV
- Les onglets sont automatiquement fermés après le traitement
- Les erreurs sont affichées en temps réel dans l'interface 