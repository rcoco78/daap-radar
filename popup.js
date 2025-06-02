// Stockage des URLs
let urls = [];
let progressInterval = null;

// Fonction pour ajouter une URL à la liste
function addUrl(url) {
  if (!url.includes("ebay.com/itm")) {
    alert("Please enter a valid eBay item URL.");
    return;
  }
  
  if (!urls.includes(url)) {
    urls.push(url);
    updateUrlList();
  }
  
  // Vider le champ de saisie
  document.getElementById("urlInput").value = "";
}

// Fonction pour supprimer une URL de la liste
function removeUrl(url) {
  urls = urls.filter(u => u !== url);
  updateUrlList();
}

// Fonction pour mettre à jour l'affichage de la liste
function updateUrlList() {
  const urlList = document.getElementById("urlList");
  urlList.innerHTML = "";
  
  urls.forEach(url => {
    const urlItem = document.createElement("div");
    urlItem.className = "url-item";
    
    const urlText = document.createElement("span");
    urlText.className = "url-text";
    urlText.textContent = url;
    
    const removeButton = document.createElement("span");
    removeButton.className = "remove-url";
    removeButton.textContent = "×";
    removeButton.onclick = () => removeUrl(url);
    
    urlItem.appendChild(urlText);
    urlItem.appendChild(removeButton);
    urlList.appendChild(urlItem);
  });
}

// Fonction pour mettre à jour la barre de progression
function updateProgress(progress) {
  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const errorList = document.getElementById("errorList");
  
  progressContainer.style.display = "block";
  const percentage = (progress.processedCount / progress.totalUrls) * 100;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${progress.processedCount}/${progress.totalUrls} URLs processed`;
  
  // Afficher les erreurs
  if (progress.failedUrls && progress.failedUrls.length > 0) {
    errorList.style.display = "block";
    errorList.innerHTML = progress.failedUrls.map(url => 
      `<div>Error processing: ${url}</div>`
    ).join("");
  }
}

// Fonction pour vérifier la progression
async function checkProgress() {
  chrome.runtime.sendMessage({ type: "GET_PROGRESS" }, (response) => {
    if (response && response.isProcessing) {
      updateProgress(response);
    } else if (response && response.completed) {
      // Arrêter la vérification de la progression
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Réinitialiser l'interface
      const scrapeBtn = document.getElementById("scrapeBtn");
      scrapeBtn.disabled = false;
      scrapeBtn.textContent = "Scrape & Export CSV";
      
      // Vider la liste des URLs
      urls = [];
      updateUrlList();
    }
  });
}

// Gestionnaire pour le bouton d'ajout d'URL
document.getElementById("addUrlBtn").addEventListener("click", () => {
  const url = document.getElementById("urlInput").value.trim();
  if (url) {
    addUrl(url);
  }
});

// Gestionnaire pour le bouton de scraping
document.getElementById("scrapeBtn").addEventListener("click", async () => {
  if (urls.length === 0) {
    alert("Please add at least one eBay URL.");
    return;
  }

  const scrapeBtn = document.getElementById("scrapeBtn");
  scrapeBtn.disabled = true;
  scrapeBtn.textContent = "Processing...";
  
  // Réinitialiser les erreurs
  document.getElementById("errorList").innerHTML = "";
  document.getElementById("errorList").style.display = "none";
  
  // Démarrer le traitement dans le background script
  chrome.runtime.sendMessage({ 
    type: "START_PROCESSING",
    urls: urls
  }, (response) => {
    if (response && response.success) {
      // Démarrer la vérification de la progression
      progressInterval = setInterval(checkProgress, 1000);
    }
  });
}); 