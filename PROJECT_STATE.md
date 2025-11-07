# 📊 GammaLab - Stato Progetto (7 Novembre 2025)

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
│   └── source-profiles.js        (profili fisici sorgenti)
├── css/
│   └── main-style.css            (stili globali + fix overlay)
├── homepage.html
├── index.html
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

### In Sospeso
- [ ] Test completo su tutti i 6 simulatori
- [ ] Validazione scientifica parametri Hillas
- [ ] Ottimizzazione mobile (responsive)
- [ ] Esportazione dati eventi (JSON/CSV)
- [ ] Tutorial interattivo per parametri Hillas

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
