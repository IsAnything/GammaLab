# 📊 GammaLab - Stato Progetto (20 Gennaio 2025)

## 🎯 Panoramica Progetto

**GammaLab** è una piattaforma educativa interattiva per l'astronomia gamma che simula eventi Cherenkov da telescopi IACT (Imaging Atmospheric Cherenkov Telescope). Il progetto include 6 simulatori di sorgenti gamma, analisi Hillas, ricostruzione stereo e un quiz interattivo.

## ✅ Stato Completamento

### Week 1-6: Base Completa ✅
- ✅ Tutte le pagine di contenuto (intro, 6 sorgenti, confronto)
- ✅ CSS completo con tema dark/light
- ✅ 6 simulatori funzionanti con fisica realistica
- ✅ Quiz completo con timer, scoring, hints

### Week 7: Ottimizzazione Grafica ✅
- ✅ Nuova palette colori (5 stop: cyan→blue→teal→green→yellow)
- ✅ Rendering ottimizzato (fix overlay CSS, colori differenziati)
- ✅ Ellissi aderenti alle tracce (buffer ridotto)
- ✅ Riempimento ellissi visibile (gradient con alpha 0.55)
- ✅ Aumentato numero fotoni (MAX_PHOTONS = 4000)
- ✅ Ricostruzione stereo con visualizzazione geometrica

### Week 8: Sprint 1 + Sprint 2 (UX Enhancement) ✅
- ✅ **P1.1** Menu compatto (padding 12px, font 0.9rem, gap 8px)
- ✅ **P1.2** Hero section homepage (gradient, border, title 2.5rem)
- ✅ **P1.3** Auto-generate eventi (setTimeout 500ms)
- ✅ **P1.4** Crab foto reale (Hubble Space Telescope)
- ✅ **P1.5** Galactic Center foto Sgr A* (Event Horizon Telescope 2022)
- ✅ **P1.6** Layout Blazars/GRB unificato (già ottimale)
- ✅ **P2.1** Homepage tabs (3 tab: Come Funziona, Hillas, Quiz)
- ✅ **P2.4** Intro accordion (6 sezioni collapsable con <details>)
- ✅ **P2.5** SNR interactive image (4 hotspot su Cassiopeia A)
- ✅ **P4.2** Lightbox universale (click-to-zoom, gallery, keyboard nav)

## 📁 Struttura File Chiave

```
GammaLab/
├── pages/
│   ├── crab-nebula.html          (implementazione custom inline)
│   ├── supernova-remnants.html   (usa navigation.js)
│   ├── blazars.html              (usa navigation.js)
│   ├── grb.html                  (usa navigation.js)
│   ├── galactic-center.html      (usa navigation.js)
│   ├── hadronic-background.html  (usa navigation.js)
│   ├── quiz.html                 (usa quiz-engine.js)
│   ├── comparison.html
│   └── intro-cherenkov.html
├── js/
│   ├── core-simulation.js        (generazione eventi + fisica)
│   ├── visualization.js          (rendering + palette + ellissi)
│   ├── hillas-analysis.js        (parametri Hillas)
│   ├── navigation.js             (setup simulatori universale)
│   ├── quiz-engine.js            (logica quiz)
│   ├── stereo-reconstruction.js  (ricostruzione geometrica)
│   ├── source-profiles.js        (profili fisici sorgenti)
│   └── lightbox.js               (✨ NEW: click-to-zoom universale)
├── css/
│   └── main-style.css            (stili globali + UX Week 8)
├── index.html                 (✨ UPDATED: tabs system + hero)
├── PROJECT_STATE.md
└── EVOLUTION_PLAN.md             (✨ NEW: roadmap Week 8-10)
```

---

## 🆕 Week 8 UX Enhancement

### 1. Homepage Tabs System

**File:** `index.html` linee 52-145

**Implementazione:**
- 3 tab collapsable: **Come Funziona** (default), **Parametri Hillas**, **Quiz Interattivo**
- CSS: `.tab-link` con border-bottom 3px su `.active`
- JavaScript inline (linee 180-195): toggle classe active su click
- Animazione fadeIn 0.3s

**CSS:** `main-style.css` linee 470-510
```css
.tab-link.active {
  color: var(--accent-cyan);
  border-bottom-color: var(--accent-cyan);
}
.tab-content { display: none; animation: fadeIn 0.3s; }
.tab-content.active { display: block; }
```

### 2. Hero Section Enhancement

**File:** `index.html` linee 32-50

**Modifiche:**
- Background: `linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)`
- Border 2px solid accent-blue
- Padding aumentato a 48px
- Title `.hero-title`: **2.5rem** (era 1.8rem)

### 3. Menu Compatto

**CSS:** `main-style.css` linee 48-90

**Ottimizzazioni:**
- Header padding: **12px** (era 20px)
- Menu font-size: **0.9rem** (era 1rem)
- Gap tra link: **8px** (era 16px)
- Border-bottom header: rimosso
- **Risparmio verticale:** ~20px

### 4. Auto-generate Eventi

**File:** `navigation.js` linee 70-75

```javascript
if (options.autoGenerate !== false) {
  setTimeout(() => {
    console.log('🎬 Auto-generating initial event...');
    generateEvent();
  }, 500);
}
```

**Applicato a:** Tutti i simulatori (delay 500ms dopo DOMContentLoaded)

### 5. Immagini Reali Sorgenti

**Crab Nebula** (`crab-nebula.html` linee 34-53):
- 📸 Hubble Space Telescope (Wikimedia Commons)
- Caption: "Crab Nebula - NASA/ESA Hubble (SN 1054)"
- Styling: max-width 100%, border-radius 8px

**Galactic Center** (`galactic-center.html` linee 34-60):
- 📸 Sgr A* - Event Horizon Telescope (2022)
- Caption: "4 million solar masses black hole"
- Testo semplificato a bullet points

### 6. Accordion System (Intro Cherenkov)

**File:** `intro-cherenkov.html`

**Implementazione:**
- HTML5 `<details>/<summary>` per 6 sezioni
- Prime 2 sezioni: conversione manuale
- Restanti 4: **auto-converter script** (linee 380-410)
  ```javascript
  document.querySelectorAll('main > section.card:not(.accordion-card)').forEach(section => {
    const details = document.createElement('details');
    details.className = 'card accordion-card';
    // ... converte section → details
  });
  ```

**CSS:** `main-style.css` linee 512-560
- Arrow rotation: `▶` → `▼` quando `[open]`
- Smooth expand con max-height transition
- Hover highlight su summary

### 7. Interactive SNR Image

**File:** `supernova-remnants.html` linee 34-95

**Hotspots:**
1. **Centro** (45%, 50%): Neutron star core
2. **Top-left** (20%, 30%): Shock front (5000 km/s)
3. **Bottom-right** (70%, 70%): Hot ejecta (Fe, Si, S)
4. **Mid-right** (35%, 85%): Gamma-ray filaments

**CSS:** `main-style.css` linee 562-620
- Pulse animation: box-shadow 0 → 15px (2s infinite)
- Tooltip hover: opacity 0 → 1 with translateY(-5px)
- Arrow pointer con `::after` pseudo-element

### 8. Lightbox Universale ⭐

**File:** `js/lightbox.js` (124 linee, nuovo modulo)

**Features:**
- ✅ Auto-discovery di tutte le immagini `.card img:not(.no-lightbox)`
- ✅ Click-to-zoom (cursor: zoom-in)
- ✅ Gallery navigation (prev/next buttons)
- ✅ Keyboard shortcuts (ESC, arrow keys)
- ✅ Caption extraction da `img.alt` o `<p>` successivo
- ✅ Body scroll lock durante modal
- ✅ Click su overlay per chiudere

**CSS:** `main-style.css` linee 622-730
- Overlay: `rgba(0,0,0,0.95)` full-screen
- Animation: `lightboxZoomIn` (scale 0.8→1, opacity 0→1, 0.3s)
- Controls: close button (48px), prev/next (56px), hover scale 1.1

**Integration:** Script include in 9 pagine HTML

---
└── PROJECT_STATE.md              (questo documento)
```

## 🎨 Sistema di Rendering

### Architettura Rendering

**Classe**: `CanvasRenderer` (in `visualization.js`)

**Sequenza Rendering** (implementata in `navigation.js` e `quiz-engine.js`):
```javascript
1. generateEvent()              // Genera fotoni con fisica
2. analyze(event)               // Calcola parametri Hillas
3. adjustHillasToContainTracks() // Scala ellisse per contenere fotoni
4. fillEllipseBackground()      // Disegna riempimento ellisse
5. renderEvent()                // Disegna fotoni sopra riempimento
6. renderHillasOverlay()        // Disegna contorno ellisse su overlay canvas
```

### Palette Colori (EnergyColorPalette)

**5 Stop Logaritmici** (definiti in `visualization.js` linee 10-24):
```javascript
{ energy: 50e9,    r: 20,  g: 120, b: 200 }  // Cyan  (50 GeV)
{ energy: 500e9,   r: 24,  g: 80,  b: 220 }  // Blue  (500 GeV)
{ energy: 2e12,    r: 20,  g: 160, b: 150 }  // Teal  (2 TeV)
{ energy: 8e12,    r: 100, g: 220, b: 80  }  // Green (8 TeV)
{ energy: 30e12,   r: 255, g: 240, b: 80  }  // Yellow (30 TeV)
```

**Interpolazione**: Logaritmica con `Math.log10()` per precisione fisica

### Generazione Fotoni (core-simulation.js)

**Parametri Attuali** (linee 170-176):
```javascript
const requestedPhotons = Math.floor(params.size * 1.2 + Math.random() * params.size * 0.8);
const MAX_PHOTONS = 4000;  // Limite performance
const numPhotons = Math.min(requestedPhotons, MAX_PHOTONS);
```

**Distribuzione**:
- Centro: `canvasWidth/2 ± 15%` (dispersione ridotta)
- Spread: Gaussiano con ellisse orientata casualmente
- Scale factor: `0.7` (aumentato da 0.4 per migliore separazione)

### Rendering Fotoni (visualization.js, linee 387-475)

**Colorazione** (70% intensity + 30% energy):
```javascript
const intensityFactor = clamp(track.intensity, 0, 1);
const energyNorm = Math.log10(track.energy / minE) / Math.log10(maxE / minE);
const colorT = intensityFactor * 0.7 + energyNorm * 0.3;  // Blend 70/30

let baseRGB = palette.mapNormalized(colorT);

// Jitter per varietà visiva
const jitter = (Math.sin((x + y) * 0.12) + (Math.random() - 0.5) * 0.8) * 12;
const r = clamp(baseRGB[0] + jitter + intensityFactor * 35);
const g = clamp(baseRGB[1] + jitter * 0.7 + intensityFactor * 25);
const b = clamp(baseRGB[2] - jitter * 0.5 + intensityFactor * 15);
```

**Struttura Fotone** (3 layer radiali):
```javascript
const radius = 5.0 + intensity * 10.0;  // Range 5-15px
const alpha = Math.min(1, intensity * 1.2 + 0.5);  // Range 0.5-1.0

// Layer 1: Outer glow (radius × 5.0)
// Layer 2: Core circle (radius × 1.5)
// Layer 3: White center (radius × 0.5)
```

### Ellissi Hillas

**Aggiustamento Dimensioni** (`adjustHillasToContainTracks`, linee 221-268):
```javascript
// Buffer considera solo il core del fotone (non glow)
const buffer = intensityToRadius(intensity) * 1.5;  // Era 5.0

// Proiezione nella referenza ellisse
const long = dx * cos(theta) + dy * sin(theta);
const lat = -dx * sin(theta) + dy * cos(theta);

// Distanza normalizzata
const norm = sqrt((long + buffer)² / a² + (lat + buffer)² / b²);

// Scala se necessario con margine minimo
if (maxNorm > 1) {
    scale = maxNorm * 1.02;  // Era 1.06
    a *= scale;
    b *= scale;
}
```

**Riempimento Ellisse** (`fillEllipseBackground`, linee 289-348):
```javascript
// Colore medio da energia fotoni
const avgColor = computeAverageColor(tracks);

// Gradiente radiale 4-stop
const gradRadius = Math.max(a, b) * 1.8;
grad.addColorStop(0,    rgba(avgColor, 0.55));  // Centro opaco
grad.addColorStop(0.35, rgba(avgColor, 0.28));  // Mid
grad.addColorStop(0.7,  rgba(avgColor, 0.08));  // Edge
grad.addColorStop(1,    rgba(0, 0, 0, 0));      // Trasparente
```

## 🔧 Fix Critici Applicati

### Fix 1: Overlay Canvas Transparency
**File**: `css/main-style.css` (linee 199-207)
```css
.overlay-canvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    background: transparent !important;  /* CRITICO: era #000 */
}
```
**Problema**: Overlay copriva fotoni con background nero
**Soluzione**: `background: transparent !important`

### Fix 2: Ellissi Sovradimensionate
**File**: `visualization.js` (adjustHillasToContainTracks)
```javascript
// PRIMA: buffer = radius × 5.0 (glow completo)
// DOPO:  buffer = radius × 1.5 (solo core)

// PRIMA: scale = maxNorm × 1.06 (margine 6%)
// DOPO:  scale = maxNorm × 1.02 (margine 2%)
```
**Risultato**: Ellissi ~3× più piccole e aderenti

### Fix 3: Colori Monotoni
**File**: `visualization.js` (renderPhoton)
```javascript
// PRIMA: solo intensity (0-1)
// DOPO:  70% intensity + 30% energy normalization

// PRIMA: jitter = ... × 6
// DOPO:  jitter = ... × 12

// PRIMA: RGB += [20, 10, 5]
// DOPO:  RGB += [35, 25, 15]
```
**Risultato**: Varietà cromatica visibile legata all'energia

### Fix 4: Ellissi non aderenti in modalità Quiz (correzione)
**File**: `js/visualization.js`, `js/quiz-engine.js`
```javascript
// Nuova opzione nel CanvasRenderer
renderer.respectExactHillas = true;
// renderHillasOverlay usa i semiassi calcolati quando respectExactHillas=true
```
**Problema**: In modalità `lightStyle` (quiz) l'ellisse veniva ingrandita artificialmente sull'asse minore per visibilità, causando apparente disallineamento geometrico con le tracce.
**Soluzione**: Aggiunto il flag `respectExactHillas` per permettere di disabilitare l'allargamento visivo; i renderer usati dal quiz impostano `respectExactHillas = true` così le ellissi disegnate nel quiz corrispondono esattamente ai semiassi calcolati dall'analisi di Hillas.
**Risultato**: Le ellissi nel quiz sono ora geometricamente aderenti alle tracce quando `respectExactHillas` è attivo. Il comportamento visivo di default rimane invariato per le altre pagine dove può essere utile l'allargamento per chiarezza.


## 📊 Profili Sorgenti

**File**: `js/source-profiles.js`

### Crab Nebula (PWN)
```javascript
energy: { min: 100e9, max: 20e12, spectralIndex: -2.6 }
size: { mean: 800, sigma: 150 }
length: { mean: 25, sigma: 4 }
width: { mean: 8, sigma: 1.5 }
alpha: { mean: 0, sigma: 3 }      // Puntuale
```

### Supernova Remnants (PeVatron)
```javascript
energy: { min: 500e9, max: 1e15, spectralIndex: -2.3 }
size: { mean: 2200, sigma: 400 }  // Eventi enormi
length: { mean: 40, sigma: 6 }
width: { mean: 15, sigma: 3 }
alpha: { mean: 10, sigma: 6 }     // Diffuso
```

### Blazars (AGN)
```javascript
energy: { min: 80e9, max: 30e12, spectralIndex: -2.2 }
size: { mean: 700, sigma: 140 }
length: { mean: 15, sigma: 3 }
width: { mean: 5, sigma: 1 }
alpha: { mean: 0, sigma: 2 }      // Molto puntuale
```

### Gamma-Ray Bursts (GRB)
```javascript
energy: { min: 100e9, max: 100e12, spectralIndex: -2.0 }
size: { mean: 600, sigma: 120 }
length: { mean: 15, sigma: 3 }
width: { mean: 8, sigma: 1.5 }
alpha: { mean: 0, sigma: 2 }
elongation: { mean: 1.9, sigma: 0.15 }  // Caratteristica distintiva
```

### Galactic Center
```javascript
energy: { min: 150e9, max: 40e12, spectralIndex: -2.5 }
size: { mean: 1800, sigma: 350 }
length: { mean: 30, sigma: 5 }
width: { mean: 12, sigma: 2 }
alpha: { mean: 8, sigma: 5 }      // Parzialmente diffuso
```

### Hadronic Background
```javascript
energy: { min: 50e9, max: 10e12, spectralIndex: -2.7 }
size: { mean: 1200, sigma: 300 }
length: { mean: 35, sigma: 8 }
width: { mean: 22, sigma: 5 }     // Meno elongato
elongation: { mean: 1.6, sigma: 0.2 }
alpha: uniforme [0, 90]            // NON puntuale
```

## 🧮 Analisi Hillas

**File**: `js/hillas-analysis.js`

### Parametri Calcolati
```javascript
{
    lengthPx: float,    // Semiasse maggiore (px)
    widthPx: float,     // Semiasse minore (px)
    length: float,      // Semiasse maggiore (gradi)
    width: float,       // Semiasse minore (gradi)
    cogX: float,        // Centro gravità X
    cogY: float,        // Centro gravità Y
    theta: float,       // Orientazione (gradi)
    size: float,        // Somma intensità
    alpha: float,       // Angolo miss (gradi)
    miss: float,        // Distanza miss (px)
    elongation: float,  // Rapporto length/width
    asymmetry: float,   // Asimmetria long
    valid: boolean      // Flag validità
}
```

### Pipeline Analisi
```javascript
1. _cleanImage(tracks)           // Rimuove fotoni < 30% max intensity
2. _computeCenterOfGravity()     // CoG pesato per intensity
3. _computeSecondMoments()       // Mxx, Myy, Mxy
4. _diagonalize(moments)         // Eigenvalues → lambda1, lambda2, theta
5. _computeHillasParameters()    // Tutti i parametri finali
```

## 🔬 Ricostruzione Stereo

**File**: `js/stereo-reconstruction.js`

### Configurazione 3 Camere
```javascript
Camera 1: (-200, 0)   // Sinistra
Camera 2: (0, -173)   // Basso
Camera 3: (200, 0)    // Destra
```

### Visualizzazione
- **Triangoli**: Posizioni camere (blu/rosso/verde)
- **Ellissi colorate**: Parametri Hillas per camera (C1/C2/C3)
- **Frecce**: Direzioni major axis
- **Ellisse gialla**: Media pesata delle 3 camere

### Algoritmo
```javascript
// Media pesata per size
const weights = hillasParams.map(h => h.size);
const totalWeight = sum(weights);

reconstructed.lengthPx = weightedAverage(lengths, weights);
reconstructed.widthPx = weightedAverage(widths, weights);
reconstructed.cogX = weightedAverage(cogXs, weights);
reconstructed.cogY = weightedAverage(cogYs, weights);
reconstructed.theta = circularMean(thetas, weights);  // Media circolare!
```

## 🎮 Sistema Quiz

**File**: `js/quiz-engine.js`

### Meccanica
- **10 domande**: Random da 6 sorgenti (ripetizioni possibili)
- **Timer**: 60 secondi per domanda
- **Hints**: 3 progressivi (riducono punteggio)
- **Scoring**: 
  - 0 hint: +100 punti
  - 1 hint: +70 punti
  - 2 hint: +40 punti
  - 3 hint: +20 punti
  - Sbagliata: 0 punti
- **Streak**: Bonus moltiplicatore per risposte consecutive

### Hint System
```javascript
Hint 1: "Sorgente [tipo], osserva [parametro specifico]"
Hint 2: "Range [parametro] è [valore ± range]"
Hint 3: "Questa è la sorgente [nome esatto]"
```

## 🐛 Problemi Risolti (History)

### Problema 1: Hex Rendering Invisibile
- **Sintomo**: Rendering hex produceva 99.14% pixel neri
- **Causa**: Conversione vector→raster perdeva segnale
- **Soluzione**: Abbandonato hex, ottimizzato standard rendering

### Problema 2: Fotoni Invisibili
- **Sintomo**: Canvas vuoto nonostante console.log confermasse rendering
- **Causa**: Overlay canvas con `background: #000` copriva tutto
- **Soluzione**: `background: transparent !important` in CSS

### Problema 3: Ellissi Giganti
- **Sintomo**: Ellissi 3× più grandi della distribuzione fotoni
- **Causa**: Buffer glow 5× + margine 6%
- **Soluzione**: Buffer 1.5× + margine 2%

### Problema 4: Colori Monotoni
- **Sintomo**: Tutti fotoni stesso colore
- **Causa**: Solo intensity, jitter minimo
- **Soluzione**: 70/30 intensity/energy + jitter×2

## 🚀 Performance

### Ottimizzazioni Applicate
- **MAX_PHOTONS = 4000**: Cap per evitare freeze
- **Canvas size**: 900×600 (simulatori), 960×480 (stereo)
- **Cleaning threshold**: 30% max intensity (riduce calcoli Hillas)
- **Rendering batch**: Un solo `fillStyle` per fotone (no state thrashing)

### Metriche Tipiche
- **Fotoni per evento**: 1200-3500 (dipende da size sorgente)
- **Tempo rendering**: ~30ms per camera (60fps OK)
- **Eventi al secondo**: ~30 su hardware medio

## 📝 Convenzioni Codice

### Naming
- **Classes**: PascalCase (`CanvasRenderer`, `HillasAnalyzer`)
- **Functions**: camelCase (`generateEvent`, `renderPhoton`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PHOTONS`, `PIXEL_TO_DEGREE`)
- **Private methods**: Prefisso `_` (`_cleanImage`, `_diagonalize`)

### Logging
- `🎨` : Palette/colori
- `🔷` : Rendering fotoni
- `🔧` : Aggiustamenti ellisse
- `⚠️` : Warning/errori gestiti
- `🧮` : Calcoli Hillas
- `🎯` : Quiz/scoring

### Error Handling
```javascript
try {
    renderer.adjustHillasToContainTracks(hillas, tracks);
} catch (e) {
    console.warn('⚠️ adjustHillasToContainTracks failed:', e);
}
```

## 🔄 Cache Busting

Tutti gli script usano `?v=7` per invalidare cache:
```html
<script src="../js/core-simulation.js?v=7"></script>
<script src="../js/visualization.js?v=7"></script>
```

## 📋 TODO / Prossimi Step

### Completati Recentemente ✅
- [x] Ellissi aderenti alle tracce (buffer 1.5×, margine 1.02×)
- [x] Aumentato fotoni (MAX_PHOTONS = 4000)
- [x] Colori differenziati (70/30 intensity/energy)
- [x] Riempimento ellissi (alpha 0.55)
- [x] Fix quiz rendering (applicata stessa pipeline)
 - [x] Modalità 1 (Quiz CLEAN: solo sorgenti gamma, senza rumore/trace adroniche/muoniche)

### In Sospeso
- [ ] Test completo su tutti i 6 simulatori
- [ ] Validazione scientifica parametri Hillas
- [ ] Ottimizzazione mobile (responsive)
- [ ] Esportazione dati eventi (JSON/CSV)
- [ ] Tutorial interattivo per parametri Hillas

## 🔔 Modalità 1 - Quiz "Clean" (IMPLEMENTATO)

Breve descrizione:
- Modalità didattica per il quiz che genera immagini "pulite" pensate per l'apprendimento: solo sorgenti gamma, senza rumore di fondo e senza tracce adroniche/muoniche, con ellissi di Hillas geometricamente aderenti alla traccia.

File coinvolti:
- `js/quiz-engine.js`  — nuova flag `quizGammaOnly` (default true), logica di resampling con `forceCenter` per rigenerare eventi gamma finché il CoG è vicino al centro camera (max 8 tentativi, r di accettazione ~12 px). Inoltre passa `onlyGamma`/`forceCenter` a `generateEvent`.
- `js/visualization.js` — nuovo flag `CanvasRenderer.suppressNoise`; renderer del quiz imposta `suppressNoise = true` quando Modalità 1 è attiva; `renderHillasOverlay` rispetta `respectExactHillas = true` per disegnare i semiassi esatti.
- `js/core-simulation.js` — `generateEvent` e generatori interni accettano `customParams` (`forceCenter`, `onlyGamma`) per supportare posizionamento centrato quando richiesto.

Flag e comportamento:
- `quizGammaOnly` (QuizEngine): abilita Modalità 1 (default ON)
- `suppressNoise` (CanvasRenderer): sopprime il rendering del background/noise quando true
- `respectExactHillas` (CanvasRenderer): disegna i semiassi esatti calcolati dall'analisi Hillas (usato nel quiz)
- `forceCenter` / resampling: quando richiesto e per profili gamma, il quiz rigenera l'evento fino a 8 volte finché il centro di gravità (CoG) è entro ~12 px dal centro della camera; non forzato per hadron/muon

Verifica veloce (consigliata):
1. Aprire `pages/quiz.html` e ricaricare la pagina.
2. Aprire la Console del browser (F12) e cercare i log diagnostici come:
  - "🔎 HillasOverlay: CoG(...), CameraCenter(...), Δ=(...,...) px, r=... px"
  - "🔁 Resampling event ... - CoG dist ... px"
3. Le immagini del quiz dovrebbero mostrare tracce centrali e le ellissi rosse dovrebbero contenere visivamente la traccia principale.
4. Se vuoi testare casi realistici (adronici/muonici), disabilita `quizGammaOnly` nel costruttore `QuizEngine` o aggiungi un toggle UI (prossimo step opzionale).

Note tecniche:
- Il comportamento mantiene realismo per le domande che richiedono hadron/muon: in quei casi non viene forzato il centramento.
- Il resampling evita di alterare la fisica degli eventi adronici/muonici; rigenerazione è limitata per evitare blocchi.

### Aggiornamento Visuale Adroni (29 Novembre 2025)
- **Unificazione Logica**: Il Quiz ora utilizza lo stesso profilo `HADRON_BACKGROUND_PROFILE` del simulatore dedicato.
- **Effetti Visivi**: Abilitati sub-clusters ("isole"), bordi irregolari e disattivata la soppressione del rumore (`suppressNoise = false`) per gli eventi adronici nel quiz.
- **Obiettivo**: Rendere gli eventi di background visivamente distinti (più "sporchi" e caotici) rispetto ai segnali gamma puliti.

Stato: Implementato e committato nel codice. Resto disponibile per aggiungere un toggle UI nel pannello quiz se desideri un controllo in tempo reale.

## 🔗 Dipendenze

### JavaScript Puro (No Framework)
- **Canvas API**: Rendering 2D
- **Math.js**: Calcoli trigonometrici/statistici nativi
- **No jQuery**: Vanilla DOM manipulation

### Browser Support
- **Chrome/Edge**: ✅ Testato
- **Firefox**: ✅ Testato
- **Safari**: ⚠️ Non testato
- **Mobile**: ⚠️ Layout non ottimizzato

## 📞 Informazioni Tecniche Aggiuntive

### Conversione Pixel ↔ Gradi
```javascript
const PIXEL_TO_DEGREE = 0.005;  // 1px = 0.005°
const DEGREE_TO_PIXEL = 200;    // 1° = 200px
```

### Canvas Contexts
- **Main canvas**: `background: #000`, rendering fotoni + fill
- **Overlay canvas**: `transparent`, solo ellisse Hillas
- **Stereo canvas**: `background: #1a1a2e`, visualizzazione geometrica

### Color Format
- **Interno**: `[r, g, b]` array (0-255)
- **Rendering**: `rgba(r, g, b, alpha)` string

---

**Ultima Modifica**: 7 Novembre 2025  
**Versione Codice**: v7  
**Stato**: ✅ Stabile e Funzionante
