function extractTitleAndExport() {
  try {
    const titleEl = document.querySelector("h1.x-item-title__mainTitle span");

    if (!titleEl) {
      throw new Error("Title not found on this eBay page");
    }

    const title = titleEl.innerText.trim();
    const inputUrl = window.location.href;

    // Extraire les URLs des images et les convertir en haute résolution
    let imageUrls = [];
    
    // Essayer d'abord la grille d'images
    const imageElements = document.querySelectorAll('.ux-image-grid-item img');
    if (imageElements.length > 0) {
      imageUrls = Array.from(imageElements).map(img => {
        // Remplacer s-l140 par s-l1600 pour obtenir une image en haute résolution
        return img.src.replace('s-l140', 's-l1600');
      });
    } else {
      // Si pas d'images dans la grille, chercher dans le carousel
      const carouselImage = document.querySelector('.ux-image-carousel-item img');
      if (carouselImage) {
        imageUrls = [carouselImage.src.replace('s-l140', 's-l1600')];
      }
    }

    // Extraire les informations de la section Item specifics
    const itemSpecifics = {};
    const itemSpecificsElements = document.querySelectorAll('.ux-labels-values');
    itemSpecificsElements.forEach(element => {
      const label = element.querySelector('.ux-labels-values__labels .ux-textspans')?.textContent.trim();
      const value = element.querySelector('.ux-labels-values__values .ux-textspans')?.textContent.trim();
      if (label && value) {
        itemSpecifics[label] = value;
      }
    });

    // Envoyer un message de succès avec les données
    chrome.runtime.sendMessage({
      type: "PROCESSING_COMPLETE",
      url: inputUrl,
      title: title,
      images: imageUrls,
      itemSpecifics: itemSpecifics,
      status: imageUrls.length > 0 ? "Succès" : "Aucune image trouvée"
    });
  } catch (error) {
    // Envoyer un message d'erreur
    chrome.runtime.sendMessage({
      type: "PROCESSING_ERROR",
      url: window.location.href,
      error: error.message,
      status: "Erreur: " + error.message
    });
  }
}

// Attendre que la page soit complètement chargée
window.onload = () => {
  setTimeout(extractTitleAndExport, 1500);
}; 