# Application de Gestion de Budget Personnel (compatible Android)

## Description

Application web de gestion de budget personnel, compatible Android : suivi des dépenses et des revenus, visualisation de la répartition par catégorie, et historique des transactions.

## Fonctionnalités

- **Ajout de transactions** : l'utilisateur peut ajouter des dépenses et des revenus, chacun avec :
  - un montant
  - une catégorie
  - une date
  - une description
- **Catégories** : alimentation, logement, transport, loisirs, santé, autres
- **Création de catégories** : l'utilisateur peut créer de nouvelles catégories directement depuis l'application
- **Tableau de bord** :
  - solde actuel
  - total des revenus
  - total des dépenses
  - graphique de répartition des dépenses par catégorie
  - graphique de répartition des revenus par catégorie
  - historique des transactions, filtrable
- **Changement de devise** : sélecteur dans l'en-tête permettant de basculer entre Euro (€) et Livre Sterling (£) ; le choix est mémorisé et s'applique instantanément partout (solde, totaux, historique, graphiques, libellé du formulaire). Un changement ne **convertit pas** les montants déjà enregistrés (relabellisation uniquement) — une confirmation le rappelle avant d'appliquer le changement.

## Langue et design

- Interface entièrement en français
- Design moderne et épuré
- Compatible Android : interface **mobile-first** (CSS de base pour petit écran, élargie en 2 colonnes à partir de 720px), cibles tactiles ≥ 44px, installable comme PWA (icône sur l'écran d'accueil, ouverture plein écran)
- Devise : Euro (€) par défaut, changeable en Livre Sterling (£) depuis l'en-tête

## Stack technique

- HTML
- CSS
- JavaScript pur (vanilla, sans framework)
- [Chart.js](https://www.chartjs.org/) v4.4.4, chargé depuis le CDN jsdelivr (`cdn.jsdelivr.net/npm/chart.js@4.4.4/...`) — cdnjs ne sert pas cette librairie sous ce chemin
- Stockage des données en local via `localStorage` (pas de backend)
- PWA : `manifest.json` + service worker (`sw.js`) pour l'installabilité et un fonctionnement hors-ligne basique

## Arborescence

```
Mon-budget android/
├── CLAUDE.md
├── manifest.json           # manifeste PWA : nom, icônes, display standalone
├── sw.js                   # service worker : met en cache l'app shell pour le hors-ligne
├── index.html              # page unique : structure, formulaire, graphiques, historique
├── icons/
│   ├── icon-192.png        # icône PWA (générée via Pillow, monogramme € sur fond primaire)
│   └── icon-512.png
├── css/
│   └── style.css           # mobile-first, variables CSS, composants
└── js/
    ├── categories.js       # source unique de vérité : catégories par défaut + personnalisées
    ├── devise.js            # devise active (EUR/GBP), persistée, sélecteur dans l'en-tête
    ├── storage.js          # accès localStorage (CRUD transactions), défensif
    ├── transactions.js     # logique métier pure (solde, totaux, filtres)
    ├── chart.js             # intégration Chart.js (graphiques dépenses/revenus)
    ├── ui.js                 # rendu DOM (formulaire, catégories, solde, historique, filtres)
    └── app.js                # point d'entrée : câblage des modules, boucle de rendu, service worker
```

Pas de build, pas de bundler : les fichiers sont servis tels quels. `index.html` charge les scripts en balises `<script>` classiques, dans l'ordre de dépendance : Chart.js (CDN) → `categories.js` → `devise.js` → `storage.js` → `transactions.js` → `chart.js` → `ui.js` → `app.js`.

## Architecture

Reprend le pattern déjà validé sur le projet jumeau `Application-Budget` :

- **Application à une seule page**, sans routeur, sans framework JS, modules en IIFE (`const Nom = (() => {...; return {...};})();`) exposant un objet global, pas d'imports/exports ES.
- **`categories.js`** : source unique de vérité pour les catégories (`{ cle, libelle, couleur }`). Combine `CATEGORIES_PAR_DEFAUT` (6 entrées codées en dur) et les catégories personnalisées persistées dans `localStorage` (`budget_categories_personnalisees`, lecture protégée par `try/catch`). La liste fusionnée est mise en cache en mémoire (`listeEnCache`, invalidée uniquement quand `ajouterCategorie` réussit) pour éviter de reconstruire le tableau à chaque `obtenirLibelle`/`obtenirCouleur`. Expose `obtenirLibelle(cle)`, `obtenirCouleur(cle)` (fallback gris si clé inconnue), `peuplerSelect(select, { avecOptionToutes })`, et `ajouterCategorie(libelle, couleur)` (génère une clé en slug, valide, refuse les doublons, retourne `{ succes, categorie }` ou `{ succes: false, erreur }`).
- **`devise.js`** : gère la devise active parmi `LISTE` (EUR, GBP), persistée dans `localStorage` (`budget_devise`, clé exposée via `CLE_STOCKAGE`). Lecture `localStorage` protégée par `try/catch` (repli sur EUR en cas d'échec), et code résolu mis en cache en mémoire (`codeEnCache`) — invalidé par `invaliderCache()` (utilisé par `app.js` lors d'un changement de devise détecté dans un autre onglet) ou automatiquement après un `definir()` réussi. Expose `obtenirCode()`, `obtenirSymbole()`, `definir(code)`, `peuplerSelect(select)`, `invaliderCache()` et `CLE_STOCKAGE`. `UI.formaterMontant()` est la seule fonction qui lit `Devise.obtenirSymbole()` — tout le reste de l'app en dépend indirectement via elle.
- **`storage.js`** : seul module qui touche `localStorage`. `try/catch` séparés sur la lecture brute (`localStorage.getItem`) et sur le `JSON.parse`, copie de secours horodatée si JSON corrompu, `addTransaction`/`saveTransactions` retournent `false`/`null` en cas d'échec (erreur affichée à l'utilisateur). Le même double `try/catch` (lecture + parse) protège aussi `categories.js` et `devise.js`.
- **`transactions.js`** : logique métier pure — `calculerSolde`, `totalParType(liste, type)` (totaux revenus/dépenses), `totauxParCategorie(liste, type)`, `filtrerTransactions`. Ignore les montants non numériques ; catégorie manquante comptée sous `"autres"`.
- **`chart.js`** : `initChart()` crée deux instances Chart.js (dépenses/revenus), `mettreAJourChart(liste)` les met à jour, délègue libellés/couleurs à `Categories` et le formatage des infobulles à `UI.formaterMontant`.
- **`ui.js`** : rendu DOM et écouteurs d'événements (formulaire, création de catégorie via `initGestionCategories()` — restaure la valeur du filtre catégorie après repeuplement du select pour ne pas réinitialiser silencieusement un filtre actif —, changement de devise via `initDevise()` — demande confirmation avant d'appliquer un changement (les montants ne sont pas convertis), vérifie le retour de `Devise.definir()` et affiche `#devise-erreur` en cas d'échec —, filtres, historique. `actualiserAffichageDevise()` (exposée) resynchronise le select et le libellé « Montant (…) » sans déclencher de nouvelle confirmation — utilisée par `app.js` lors d'un changement de devise détecté dans un autre onglet. `formaterDate()` retourne « Date inconnue » plutôt que de lever une exception si la date d'une transaction est manquante/corrompue. L'historique est construit via `createElement`/`textContent`, jamais `innerHTML` avec des données utilisateur (évite l'injection). Expose aussi `lireFiltres()` et `formaterMontant()`.
- **`app.js`** : orchestrateur. `render()` relit `Storage.getTransactions()`, calcule la liste filtrée une seule fois et l'utilise pour l'historique **et** les deux graphiques (cohérents avec les filtres actifs) ; seul le solde reste sur la liste complète. Écoute l'événement `storage` pour se resynchroniser entre onglets : un changement de `budget_transactions` déclenche `render()`, un changement de `budget_devise` invalide le cache de `Devise`, resynchronise l'affichage (`UI.actualiserAffichageDevise()`) puis appelle `render()`. Enregistre le service worker (`sw.js`).
- **Modèle de données** (une transaction) : `{ id, type: "depense" | "revenu", montant: number, categorie: string, date: "YYYY-MM-DD", description: string }`, stocké comme tableau JSON sous la clé `budget_transactions`.

## Conventions

- **Code et commentaires en français** : noms de fonctions/variables en français, accents inclus. Clés techniques (`type`, `id`, propriétés Chart.js) en anglais car imposées par les données/la librairie.
- **Clés de catégorie** : minuscules, sans accent, mot unique ou slug séparé par un tiret (générées automatiquement par `Categories.ajouterCategorie`).
- **Pattern module** : `const NomDuModule = (() => { ...privé...; return { ...API publique... }; })();`.
- **Formatage des montants** : toujours via `UI.formaterMontant()` (`fr-FR`, 2 décimales, suffixe le symbole de `Devise.obtenirSymbole()`) — jamais reformaté manuellement ailleurs (y compris dans les callbacks Chart.js), pour que tout l'affichage reste cohérent avec la devise active.
- **Variables CSS** : couleurs de thème dans `:root` (`--color-*`), jamais codées en dur. Couleurs de catégorie uniquement dans `js/categories.js`, appliquées en style inline.
- **Pas d'`innerHTML` avec des données utilisateur** : toujours `textContent`/`createElement`.
- **Mobile-first** : les styles de base ciblent le petit écran ; `@media (min-width: 720px)` élargit la mise en page, pas l'inverse.
- **Pas de build/transpilation** : JavaScript ES2017+ natif, compatible navigateurs modernes.

### Ajouter une catégorie

Depuis l'application (bouton « + Nouvelle catégorie »), persistée dans `localStorage` — aucune modification de code nécessaire. Pour une catégorie par défaut (codée en dur), ajouter une entrée à `CATEGORIES_PAR_DEFAUT` dans `js/categories.js`.

## Notes d'implémentation

- Date du jour par défaut calculée en **heure locale** (`getFullYear/getMonth/getDate`), pas `valueAsDate` (UTC, peut afficher la mauvaise date selon le fuseau horaire).
- Le filtrage (catégorie, type, période) affecte l'historique **et** les deux graphiques, mais pas le solde.
- PWA : `manifest.json` (nom, icônes 192/512 `any` + `maskable`, `display: standalone`) et `sw.js` (cache l'app shell à l'installation, sert depuis le cache avec repli réseau puis repli sur `index.html`, nettoie les anciens caches à l'activation). Les deux handlers (`install` et `fetch`) journalisent toute erreur via `console.error` plutôt que d'échouer silencieusement. Penser à incrémenter `NOM_CACHE` (actuellement `mon-budget-v3`) à chaque modification de la liste `FICHIERS_A_METTRE_EN_CACHE` ou du contenu des fichiers mis en cache, pour forcer la mise à jour du cache côté client.

## Lancer le projet en local

```bash
cd "Mon-budget android"
python3 -m http.server 8788
```

Puis ouvrir `http://localhost:8788/index.html`. Toujours passer par un serveur HTTP local (`file://` casse le CDN Chart.js et l'enregistrement du service worker).

## Application Android (.apk)

En plus de la PWA, un véritable `.apk` Android installable est généré avec **Bubblewrap** (Trusted Web Activity officielle de Google) : l'app Android ouvre le site déjà déployé dans une WebView système, sans dupliquer le code.

- **Dossier de build** : `android-twa-build/` (exclu de git) — contient le projet Android généré, le keystore de signature (`android.keystore`) et les fichiers `app-release-signed.apk` / `app-release-bundle.aab` produits.
- **Package ID** : `io.github.ibraheemabuhamzah_svg.twa`
- **`minSdkVersion`** : 24 (Android 7.0+) — la valeur par défaut de 21 proposée par Bubblewrap est trop basse pour la dépendance `androidbrowserhelper`.
- **Mode plein écran sans barre d'adresse** : nécessite `.well-known/assetlinks.json` à la racine du site (committé dans ce dépôt), qui lie l'empreinte SHA-256 du certificat de signature de l'APK à ce domaine. **`.nojekyll`** est aussi requis à la racine : sans lui, Jekyll (moteur par défaut de GitHub Pages) ignore silencieusement tout dossier commençant par un point, empêchant `.well-known/` d'être servi (404).
- **Téléchargement** : l'APK signé est publié en tant que [GitHub Release](https://github.com/ibraheemabuhamzah-svg/mon-budget-android/releases/latest) (pas commité dans le dépôt — `android-twa-build/` reste exclu via `.gitignore`). Pour publier une nouvelle version après un rebuild : `gh release create vX.Y.Z android-twa-build/app-release-signed.apk --repo ibraheemabuhamzah-svg/mon-budget-android --title "Mon Budget vX.Y.Z" --notes "..."`.
- **Reconstruire l'APK** (ex. après une mise à jour du site) :
  ```bash
  cd "Mon-budget android/android-twa-build"
  ~/.local/bin/bubblewrap build
  ```
  Redemande les mots de passe du keystore à chaque build (saisie interactive, jamais stockée en clair).
- **⚠️ Keystore** : `android-twa-build/android.keystore` est **essentiel à conserver**. Toute future mise à jour de l'app doit être signée avec cette même clé, sinon Android refusera d'installer la mise à jour par-dessus l'app existante (il faudrait désinstaller puis réinstaller, perdant les données locales de l'utilisateur).
- **Outils installés sans sudo/Homebrew pour ce build** : Node.js (`~/.local/lib/node-v24.21.0-darwin-x64`, symlinké dans `~/.local/bin`), Bubblewrap CLI (`npm install -g @bubblewrap/cli`), JDK 17 et Android SDK build-tools (téléchargés automatiquement par Bubblewrap dans `~/.bubblewrap/`).
