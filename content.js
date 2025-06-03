function extractDappRadarInfoAndExport() {
  try {
    // Titre du dapp
    const titleEl = document.querySelector('[data-comp-name="ContentCard"] h1');
    const title = titleEl ? titleEl.innerText.trim() : "-";
    const inputUrl = window.location.href;

    // Image icône (166x166)
    let iconUrl = null;
    const iconImg = document.querySelector('[data-comp-name="ContentCard"] img[alt]');
    if (iconImg && iconImg.src.includes('166x166')) {
      iconUrl = iconImg.src;
    }

    // Liens réseaux sociaux et site web
    let socialLinks = [];
    let website = null;
    // Chercher tous les liens dans la section Socials
    const socialSection = Array.from(document.querySelectorAll('[data-comp-name="ContentCard"] h2')).find(h2 => h2.textContent.trim().toLowerCase().includes('social'));
    if (socialSection) {
      const socialDiv = socialSection.parentElement;
      if (socialDiv) {
        socialLinks = Array.from(socialDiv.querySelectorAll('a[href]'))
          .map(a => {
            // Essayer de deviner le nom du réseau social à partir du href ou du contenu
            let name = a.href.match(/https?:\/\/(www\.)?([a-zA-Z0-9\-]+)\./);
            name = name ? name[2].charAt(0).toUpperCase() + name[2].slice(1) : 'Social';
            return { name, url: a.href };
          })
          .filter(obj => obj.url.startsWith('http'));
      }
    }
    // Chercher le site web (souvent le dernier lien ou un lien avec le nom du projet)
    const websiteLink = socialLinks.find(link => link.url.includes('worldofdypians.com'));
    if (websiteLink) {
      website = websiteLink.url;
      socialLinks = socialLinks.filter(link => link.url !== website);
    }

    // Extraction du site web (nouveau sélecteur)
    if (!website) {
      const websiteLabel = Array.from(document.querySelectorAll('[data-comp-name="ContentCard"] .sc-kAKMhj')).find(el => el.textContent.trim().toLowerCase().startsWith('website'));
      if (websiteLabel) {
        const websiteSpan = websiteLabel.parentElement.querySelector('span.sc-dkrFOg');
        if (websiteSpan) {
          website = websiteSpan.textContent.trim();
        }
      }
    }

    // Liste des blockchains associées (noms)
    let blockchains = [];
    // Sélecteur corrigé pour la liste des blockchains
    const chainRows = document.querySelectorAll('.chain-row-checkbox label span.sc-kJCwM');
    if (chainRows.length > 0) {
      blockchains = Array.from(chainRows).map(el => el.textContent.trim());
    }
    // Nettoyer et dédupliquer
    blockchains = Array.from(new Set(blockchains.filter(Boolean)));

    // Extraction des tags
    let tags = [];
    const tagsContainer = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim().startsWith('Tags'));
    if (tagsContainer) {
      tags = Array.from(tagsContainer.querySelectorAll('a[href*="/tag/"]')).map(a => a.textContent.trim());
    }

    // Extraction des dates (listing et update)
    let dateListed = "-";
    let dateUpdated = "-";
    const detailsSection = Array.from(document.querySelectorAll('[data-comp-name="ContentCard"] .sc-keogpA'))[0];
    if (detailsSection) {
      const detailRows = detailsSection.querySelectorAll('.sc-eeMvmM');
      detailRows.forEach(row => {
        const label = row.querySelector('.sc-cabOPr')?.textContent.trim();
        const value = row.querySelector('.sc-iTFTee')?.textContent.trim();
        if (label && value) {
          if (label.toLowerCase().includes('listed')) dateListed = value;
          if (label.toLowerCase().includes('last updated')) dateUpdated = value;
        }
      });
    }

    // Statut de l'extraction
    const status = iconUrl ? "Succès" : "Aucune image trouvée";

    // Préparer les "item specifics"
    const itemSpecifics = {
      Website: website || "-",
      Socials: socialLinks.length > 0 ? JSON.stringify(socialLinks) : "-",
      Blockchains: blockchains.length > 0 ? blockchains.join(', ') : "-",
      Tags: tags.length > 0 ? tags.join(', ') : "-",
      DateListed: dateListed,
      DateUpdated: dateUpdated
    };

    // Envoyer un message de succès avec les données
    chrome.runtime.sendMessage({
      type: "PROCESSING_COMPLETE",
      url: inputUrl,
      title: title,
      images: iconUrl ? [iconUrl] : [],
      itemSpecifics: itemSpecifics,
      status: status
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
  setTimeout(extractDappRadarInfoAndExport, 2000);
}; 