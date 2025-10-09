const CACHE_NAME = 'rpgemini-cache-v1';
const URLS_TO_CACHE = [
  // Core files
  '/',
  '/index.html',
  '/manifest.json',
  '/App.tsx',
  '/index.tsx',
  '/types.ts',
  '/trophies.ts',
  '/statuses.ts',

  // PWA Icons (as defined in manifest.json)
  '/icon-192.png',
  '/icon-512.png',

  // Components
  '/components/AdventureCreationScreen.tsx',
  '/components/AmbiancePanel.tsx',
  '/components/CharacterSheetPanel.tsx',
  '/components/ChatPanel.tsx',
  '/components/CombatActionModal.tsx',
  '/components/CombatScreen.tsx',
  '/components/DiceRoller.tsx',
  '/components/HistoryPanel.tsx',
  '/components/InputBar.tsx',
  '/components/InventoryPanel.tsx',
  '/components/MapPanel.tsx',
  '/components/QuestLogPanel.tsx',
  '/components/SettingsPanel.tsx',
  '/components/TokenUsageIndicator.tsx',
  '/components/TrophiesPanel.tsx',

  // Icons
  '/components/icons/ArrowDownIcon.tsx',
  '/components/icons/ArrowLeftIcon.tsx',
  '/components/icons/ArrowRightIcon.tsx',
  '/components/icons/ArrowUpIcon.tsx',
  '/components/icons/BackpackIcon.tsx',
  '/components/icons/BleedIcon.tsx',
  '/components/icons/BlessedIcon.tsx',
  '/components/icons/BookIcon.tsx',
  '/components/icons/BurnIcon.tsx',
  '/components/icons/ChevronDownIcon.tsx',
  '/components/icons/CloudIcon.tsx',
  '/components/icons/CoinIcon.tsx',
  '/components/icons/CursedIcon.tsx',
  '/components/icons/D20Icon.tsx',
  '/components/icons/ExitIcon.tsx',
  '/components/icons/EyeIcon.tsx',
  '/components/icons/GearIcon.tsx',
  '/components/icons/HistoryIcon.tsx',
  '/components/icons/ImageIcon.tsx',
  '/components/icons/JournalIcon.tsx',
  '/components/icons/MapIcon.tsx',
  '/components/icons/MaskIcon.tsx',
  '/components/icons/MonsterIcon.tsx',
  '/components/icons/MoonIcon.tsx',
  '/components/icons/MusicNoteIcon.tsx',
  '/components/icons/PlayerMarkerIcon.tsx',
  '/components/icons/PoisonIcon.tsx',
  '/components/icons/QuillIcon.tsx',
  '/components/icons/RestartIcon.tsx',
  '/components/icons/ScrollIcon.tsx',
  '/components/icons/SettingsIcon.tsx',
  '/components/icons/ShieldIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/SpeechBubbleIcon.tsx',
  '/components/icons/StunIcon.tsx',
  '/components/icons/SunIcon.tsx',
  '/components/icons/SwordIcon.tsx',
  '/components/icons/TheaterMaskIcon.tsx',
  '/components/icons/TrashIcon.tsx',
  '/components/icons/TrophyIcon.tsx',
  '/components/icons/UserCircleIcon.tsx',
  '/components/icons/UsersIcon.tsx',

  // External assets
  'https://www.transparenttextures.com/patterns/dark-wood.png',
  'https://www.transparenttextures.com/patterns/old-parchment.png',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&display=swap',
];

// Installe le service worker et met en cache le shell de l'application
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Sert le contenu mis en cache en cas de déconnexion
self.addEventListener('fetch', (event) => {
  // Pour les requêtes à des API externes, allez toujours sur le réseau.
  if (event.request.url.includes('googleapis.com') && !event.request.url.includes('fonts.googleapis.com')) {
    return; // Laissez le navigateur gérer
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Le cache a trouvé une correspondance - retourne la réponse
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Vérifie si nous avons reçu une réponse valide
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Événement d'activation : nettoie les anciens caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
