// Background script for DappRadar Scraper
// Ce fichier est requis par manifest.json pour l'extension DappRadar

// Constantes
const MAX_CONCURRENT_TABS = 10;
let isProcessing = false;
let shouldStop = false;
let currentBatch = [];
let processedUrls = new Set();
let failedUrls = new Set();
let mainWindowId = null;
let collectedData = []; // Stockage des données collectées
let scrapingWindowId = null;

// Fonction pour ouvrir la fenêtre principale
async function openMainWindow() {
  if (mainWindowId) {
    // Si la fenêtre existe déjà, la mettre au premier plan
    try {
      const window = await chrome.windows.get(mainWindowId);
      chrome.windows.update(mainWindowId, { focused: true });
      return;
    } catch (error) {
      // Si la fenêtre n'existe plus, on la recrée
      mainWindowId = null;
    }
  }

  // Créer une nouvelle fenêtre
  const window = await chrome.windows.create({
    url: 'main.html',
    type: 'popup',
    width: 850,
    height: 800
  });
  mainWindowId = window.id;
}

// Fonction pour démarrer le traitement
async function startProcessing(urls) {
  if (isProcessing) return;
  isProcessing = true;
  shouldStop = false;
  
  // Créer une fenêtre dédiée pour le scraping si besoin
  if (!scrapingWindowId) {
    const win = await chrome.windows.create({
      focused: false,
      type: 'normal',
      state: 'minimized',
      url: 'about:blank'
    });
    scrapingWindowId = win.id;
  }
  
  // Réinitialiser les états
  currentBatch = [...urls];
  processedUrls.clear();
  failedUrls.clear();
  collectedData = []; // Réinitialiser les données collectées
  
  // Sauvegarder l'état initial
  await chrome.storage.local.set({
    processingState: {
      totalUrls: urls.length,
      processedCount: 0,
      failedUrls: [],
      isProcessing: true,
      completed: false,
      stopped: false,
      status: "processing"
    }
  });
  
  // Démarrer le traitement par lots
  processNextBatch();
}

// Fonction pour arrêter le traitement
async function stopProcessing() {
  shouldStop = true;
  isProcessing = false;
  
  // Fermer tous les onglets ouverts dans la fenêtre dédiée
  if (scrapingWindowId) {
    const tabs = await chrome.tabs.query({ windowId: scrapingWindowId });
    for (const tab of tabs) {
      await chrome.tabs.remove(tab.id);
    }
    // Fermer la fenêtre dédiée
    await chrome.windows.remove(scrapingWindowId);
    scrapingWindowId = null;
  }
  
  // Mettre à jour l'état
  await chrome.storage.local.set({
    processingState: {
      isProcessing: false,
      completed: true,
      stopped: true
    }
  });
}

// Fonction pour traiter le prochain lot d'URLs
async function processNextBatch() {
  if (currentBatch.length === 0 || shouldStop) {
    // Tous les lots sont traités ou arrêt demandé
    isProcessing = false;
    const totalProcessed = processedUrls.size + failedUrls.size;
    
    // Mettre à jour l'état final
    await chrome.storage.local.set({
      processingState: {
        isProcessing: false,
        completed: true,
        stopped: shouldStop,
        processedCount: totalProcessed,
        totalUrls: totalProcessed,
        status: shouldStop ? "stopped" : "completed"
      }
    });
    return;
  }

  // Prendre le prochain lot d'URLs
  const batch = currentBatch.splice(0, MAX_CONCURRENT_TABS);
  
  // Traiter chaque URL du lot
  const promises = batch.map(url => processUrl(url));
  await Promise.all(promises);
  
  // Traiter le lot suivant si pas d'arrêt demandé
  if (!shouldStop) {
    processNextBatch();
  }
}

// Fonction pour traiter une URL
async function processUrl(url) {
  if (shouldStop) return;
  
  try {
    // Créer un nouvel onglet dans la fenêtre dédiée
    const tab = await chrome.tabs.create({ url, windowId: scrapingWindowId, active: false });
    
    // Attendre que la page soit chargée
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Exécuter le content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    
    // Attendre la réponse du content script
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(listener);
        chrome.tabs.remove(tab.id);
        failedUrls.add(url);
        collectedData.push({
          url: url,
          title: "",
          status: "Failed",
          error: "Timeout: Page took too long to load"
        });
        saveCollectedData();
        updateProgress();
        resolve();
      }, 10000);

      function listener(message) {
        if (message.type === "PROCESSING_COMPLETE" && message.url === url) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          chrome.tabs.remove(tab.id);
          processedUrls.add(url);
          collectedData.push({
            url: url,
            title: message.title || "",
            status: "Success",
            images: message.images || [],
            itemSpecifics: message.itemSpecifics || {}
          });
          saveCollectedData();
          updateProgress();
          resolve();
        } else if (message.type === "PROCESSING_ERROR" && message.url === url) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          chrome.tabs.remove(tab.id);
          failedUrls.add(url);
          collectedData.push({
            url: url,
            title: "",
            status: "Failed",
            error: message.error || "Unknown error",
            itemSpecifics: message.itemSpecifics || {}
          });
          saveCollectedData();
          updateProgress();
          resolve();
        }
      }

      chrome.runtime.onMessage.addListener(listener);
    });
  } catch (error) {
    failedUrls.add(url);
    collectedData.push({
      url: url,
      title: "",
      status: "Failed",
      error: error.message || "Failed to process URL",
      itemSpecifics: {}
    });
    saveCollectedData();
    updateProgress();
  }
}

// Fonction pour mettre à jour la progression
async function updateProgress() {
  const state = await chrome.storage.local.get(['processingState']);
  const currentState = state.processingState || {};
  
  // Calculer le nombre total d'URLs traitées (succès + échecs)
  const totalProcessed = processedUrls.size + failedUrls.size;
  
  await chrome.storage.local.set({
    processingState: {
      ...currentState,
      processedCount: totalProcessed,
      failedUrls: Array.from(failedUrls),
      isProcessing: true
    }
  });
}

// Fonction pour générer le CSV
function generateCSV(data = collectedData) {
  // Définir l'ordre des colonnes prioritaires
  const priorityColumns = [
    "URL",
    "Title",
    "Images",
    "Images Number",
    "Platform",
    "Statut"
  ];
  
  // Collecter tous les autres item specifics
  const otherItemSpecifics = new Set();
  const socialNames = new Set();
  data.forEach(item => {
    if (item.itemSpecifics) {
      Object.keys(item.itemSpecifics).forEach(key => {
        if (!priorityColumns.includes(key)) {
          if (key === 'Socials' && item.itemSpecifics['Socials'] && item.itemSpecifics['Socials'] !== '-') {
            // Extraire les noms de réseaux sociaux dynamiquement
            try {
              const socialsArr = JSON.parse(item.itemSpecifics['Socials']);
              socialsArr.forEach(social => {
                if (social.name) socialNames.add(social.name);
              });
            } catch (e) {}
          } else {
            otherItemSpecifics.add(key);
          }
        }
      });
    }
  });
  // Colonnes dynamiques pour les réseaux sociaux
  const sortedSocialNames = Array.from(socialNames).sort();
  // Colonnes supplémentaires
  const sortedOtherColumns = Array.from(otherItemSpecifics).sort();

  // Créer l'en-tête du CSV
  let csvContent = priorityColumns.join(";");
  if (sortedSocialNames.length > 0) {
    csvContent += ";" + sortedSocialNames.join(";");
  }
  if (sortedOtherColumns.length > 0) {
    csvContent += ";" + sortedOtherColumns.join(";");
  }
  csvContent += "\n";

  // Ajouter toutes les données collectées
  data.forEach(item => {
    // Échapper les guillemets dans le titre pour le CSV
    const escapedTitle = (item.title || "").replace(/"/g, '""');
    const images = (item.images || []).join(" | ");
    const escapedImages = images.replace(/"/g, '""');
    const imagesCount = item.images ? item.images.length : 0;
    let row = `${item.url};"${escapedTitle || '-'}";"${escapedImages || '-'}";${imagesCount};DappRadar`;
    // Statut
    row += `;"${item.status || '-'}"`;
    // Colonnes dynamiques pour les réseaux sociaux
    let socialsMap = {};
    if (item.itemSpecifics && item.itemSpecifics['Socials'] && item.itemSpecifics['Socials'] !== '-') {
      try {
        const socialsArr = JSON.parse(item.itemSpecifics['Socials']);
        socialsArr.forEach(social => {
          if (social.name) socialsMap[social.name] = social.url;
        });
      } catch (e) {}
    }
    sortedSocialNames.forEach(name => {
      row += `;"${socialsMap[name] || '-'}"`;
    });
    // Autres colonnes
    sortedOtherColumns.forEach(key => {
      const value = item.itemSpecifics?.[key] || "-";
      const escapedValue = value.replace(/"/g, '""');
      row += `;"${escapedValue}"`;
    });
    csvContent += row + "\n";
  });
  return csvContent;
}

// Écouter les messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_PROCESSING") {
    startProcessing(message.urls);
    sendResponse({ success: true });
  } else if (message.type === "STOP_PROCESSING") {
    stopProcessing();
    sendResponse({ success: true });
  } else if (message.type === "GET_PROGRESS") {
    chrome.storage.local.get(['processingState'], (result) => {
      sendResponse(result.processingState || { isProcessing: false });
    });
    return true; // Indique que la réponse sera asynchrone
  } else if (message.type === "COLLECT_CSV") {
    try {
      chrome.storage.local.get(['collectedData'], (result) => {
        const data = result.collectedData || [];
        // Générer le CSV avec les données du storage
        const csvContent = generateCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const reader = new FileReader();
        reader.onload = function() {
          const dataUrl = reader.result;
          chrome.downloads.download({
            url: dataUrl,
            filename: 'dappradar_dapps.csv',
            saveAs: true
          }, () => {
            sendResponse({ success: true });
          });
        };
        reader.onerror = function() {
          console.error('Error reading blob:', reader.error);
          sendResponse({ success: false, error: 'Failed to read blob data' });
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Indique que la réponse sera asynchrone
  }
});

// Écouter les clics sur l'icône de l'extension
chrome.action.onClicked.addListener(() => {
  openMainWindow();
});

// Ajoute cette fonction utilitaire pour sauvegarder les données
function saveCollectedData() {
  chrome.storage.local.set({ collectedData });
} 