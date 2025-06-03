// État de l'application
let urls = [];
let isProcessing = false;
let progressInterval = null;

// Fonction pour ajouter des URLs
function addUrls() {
  const urlInput = document.getElementById("urlInput");
  const newUrls = urlInput.value
    .split("\n")
    .map(url => url.trim())
    .filter(url => url && url.includes("dappradar.com/dapp/"));

  if (newUrls.length === 0) {
    showStatus("Please enter valid DappRadar dapp URLs", "error");
    return;
  }

  // Ajouter uniquement les nouvelles URLs
  newUrls.forEach(url => {
    if (!urls.includes(url)) {
      urls.push(url);
    }
  });

  updateUrlList();
  urlInput.value = "";
  showStatus(`Added ${newUrls.length} new URLs`, "success");
}

// Fonction pour effacer toutes les URLs
function clearUrls() {
  urls = [];
  updateUrlList();
  showStatus("All URLs cleared", "info");
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

// Fonction pour supprimer une URL
function removeUrl(url) {
  urls = urls.filter(u => u !== url);
  updateUrlList();
  showStatus("URL removed", "info");
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
      `<div class="error-item">Error processing: ${url}</div>`
    ).join("");
  }
  updateLiveTable();
}

// Fonction pour afficher un message de statut
function showStatus(message, type = "info") {
  const statusBar = document.getElementById("statusBar");
  statusBar.style.display = "block";
  statusBar.textContent = message;
  statusBar.style.backgroundColor = type === "error" ? "#ffebee" : 
                                  type === "success" ? "#e8f5e9" : 
                                  "#e3f2fd";
  statusBar.style.color = type === "error" ? "#d32f2f" : 
                         type === "success" ? "#2e7d32" : 
                         "#1565c0";
}

// Fonction pour vérifier la progression
function checkProgress() {
  chrome.runtime.sendMessage({ type: "GET_PROGRESS" }, (response) => {
    if (!response) return;

    // Mettre à jour la progression
    updateProgress(response);

    // Vérifier si le traitement est terminé
    if (response.processedCount === response.totalUrls || response.completed) {
      // Arrêter la vérification de la progression
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Réinitialiser l'interface
      const scrapeBtn = document.getElementById("scrapeBtn");
      const stopBtn = document.getElementById("stopBtn");
      scrapeBtn.disabled = false;
      scrapeBtn.textContent = "Start Scraping";
      stopBtn.style.display = "none";
      
      // Mettre à jour le statut
      if (response.status === "stopped") {
        showStatus("Scraping stopped", "info");
      } else {
        showStatus("Scraping completed!", "success");
      }
    }
  });
}

// Fonction pour arrêter le traitement
function stopProcessing() {
  chrome.runtime.sendMessage({ type: "STOP_PROCESSING" }, (response) => {
    if (response && response.success) {
      // Arrêter la vérification de la progression
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Réinitialiser l'interface
      const scrapeBtn = document.getElementById("scrapeBtn");
      const stopBtn = document.getElementById("stopBtn");
      scrapeBtn.disabled = false;
      scrapeBtn.textContent = "Start Scraping";
      stopBtn.style.display = "none";
      
      showStatus("Scraping stopped", "info");
    }
  });
}

// Gestionnaires d'événements
document.getElementById("addUrlBtn").addEventListener("click", addUrls);
document.getElementById("clearBtn").addEventListener("click", clearUrls);
document.getElementById("stopBtn").addEventListener("click", stopProcessing);

document.getElementById("scrapeBtn").addEventListener("click", () => {
  if (urls.length === 0) {
    showStatus("Please add at least one DappRadar URL", "error");
    return;
  }

  const scrapeBtn = document.getElementById("scrapeBtn");
  const stopBtn = document.getElementById("stopBtn");
  scrapeBtn.disabled = true;
  scrapeBtn.textContent = "Processing...";
  stopBtn.style.display = "inline-block";
  
  // Réinitialiser les erreurs
  document.getElementById("errorList").innerHTML = "";
  document.getElementById("errorList").style.display = "none";
  
  // Démarrer le traitement dans le background script
  chrome.runtime.sendMessage({ 
    type: "START_PROCESSING",
    urls: urls
  }, (response) => {
    if (response && response.success) {
      showStatus("Scraping started...", "info");
      // Démarrer la vérification de la progression
      progressInterval = setInterval(checkProgress, 1000);
    } else {
      showStatus("Failed to start scraping", "error");
      scrapeBtn.disabled = false;
      scrapeBtn.textContent = "Start Scraping";
      stopBtn.style.display = "none";
    }
  });
});

// Ajouter l'écouteur d'événements pour le bouton de collecte CSV
document.getElementById("collectBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "COLLECT_CSV" }, (response) => {
    if (response && response.success) {
      showStatus("CSV file downloaded successfully!", "success");
    } else {
      showStatus("Failed to download CSV file", "error");
    }
  });
});

function isValidUrl(url) {
  return url.includes("dappradar.com/dapp/");
}

function addUrl(url) {
  if (!isValidUrl(url)) {
    alert("Please enter a valid DappRadar dapp URL.");
    return;
  }
  // ... existing code ...
}

// Fonction pour afficher le tableau live des données extraites
function updateLiveTable() {
  chrome.storage.local.get(['processingState'], (result) => {
    const data = (result.processingState && result.processingState.collectedData) || [];
    const liveTableDiv = document.getElementById('liveTable');
    if (!data.length) {
      liveTableDiv.innerHTML = '';
      return;
    }
    // Colonnes principales à afficher
    const columns = [
      'title', 'itemSpecifics.Blockchains', 'itemSpecifics.Tags', 'itemSpecifics.DateListed', 'itemSpecifics.DateUpdated'
    ];
    const headers = ['Titre', 'Blockchains', 'Tags', 'Date de listing', 'Date de mise à jour'];
    let html = '<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">';
    html += '<tr>' + headers.map(h => `<th style=\"border:1px solid #ccc;padding:4px;background:#f0f0f0;\">${h}</th>`).join('') + '</tr>';
    data.forEach(item => {
      html += '<tr>' + columns.map(col => {
        let val = col.split('.').reduce((acc, key) => acc && acc[key], item) || '-';
        return `<td style=\"border:1px solid #ccc;padding:4px;\">${val}</td>`;
      }).join('') + '</tr>';
    });
    html += '</table>';
    liveTableDiv.innerHTML = html;
  });
}

// Appeler updateLiveTable au chargement
window.addEventListener('DOMContentLoaded', updateLiveTable); 