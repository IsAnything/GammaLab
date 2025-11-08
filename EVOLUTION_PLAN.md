# 🚀 GammaLab - Piano Evolutivo Prioritizzato

**Data**: 8 Novembre 2025  
**Baseline**: PROJECT_STATE.md v7  
**Fonte**: Gammalab-checklist.md

---

## 📊 Analisi Proposte

### ✅ Proposte Applicabili (14/14)
Tutte le proposte sono tecnicamente fattibili con l'architettura attuale.

### 🎯 Criteri di Prioritizzazione
1. **Impatto UX** (basso/medio/alto)
2. **Complessità** (bassa/media/alta)
3. **Dipendenze** (blocca altri task?)
4. **Valore Educativo** (core mission del progetto)

---

## 🏆 PRIORITÀ 1: Quick Wins (Alta UX, Bassa Complessità)

### P1.1 - Homepage: Menu Compatto ⚡
**Obiettivo**: Menu visibile senza scroll, rimuovere linea divisoria  
**Impatto UX**: Alto | **Complessità**: Bassa | **Tempo**: 30min

**Azioni**:
- Ridurre padding/margin navbar (da 16px → 8px)
- Font-size menu da 1rem → 0.9rem
- Rimuovere `border-bottom` sotto nav
- Testare su viewport 1920×1080 e 1366×768

**File**: `css/main-style.css`

---

### P1.2 - Homepage: Testo Benvenuto Prominente ⚡
**Obiettivo**: Hero section più accogliente e visibile  
**Impatto UX**: Alto | **Complessità**: Bassa | **Tempo**: 20min

**Azioni**:
- Aumentare font-size hero title (2rem → 2.5rem)
- Aggiungere `line-height: 1.4` per leggibilità
- Background hero section con gradient sottile
- Padding hero aumentato (32px → 48px)

**File**: `homepage.html`, `css/main-style.css`

---

### P1.3 - Tutte le Sorgenti: Auto-Generate al Load 🎨
**Obiettivo**: Simulatore mostra evento di esempio senza click utente  
**Impatto UX**: Alto | **Complessità**: Bassa | **Tempo**: 15min

**Azioni**:
```javascript
// In navigation.js, dopo setupSourceSimulator()
window.addEventListener('load', () => {
    setTimeout(() => generateEvent(), 500); // Auto-genera dopo 500ms
});
```

**Benefici**:
- Utente vede subito cosa aspettarsi
- Riduce friction iniziale
- Dimostra funzionalità immediata

**File**: `js/navigation.js`

---

### P1.4 - Crab Nebula: Immagine Reale Annotata �
**Obiettivo**: Foto HST/Chandra con aree descritte (pulsar, filamenti, ecc.)  
**Impatto UX**: Alto | **Complessità**: Bassa | **Tempo**: 1h

**Azioni**:
- Aggiungere immagine Crab Nebula (NASA/ESA, public domain)
- Descrizione caption con crediti
- Layout responsive

**File**: `pages/crab-nebula.html`, nuova cartella `images/`

---

### P1.5 - Centro Galattico: Immagini + Descrizione Semplificata 📷
**Obiettivo**: Aggiungere foto Sgr A*, semplificare testo  
**Impatto UX**: Alto | **Complessità**: Bassa | **Tempo**: 45min

**Azioni**:
- Immagini: Event Horizon Telescope - Sgr A*
- Descrizione: ridurre paragrafi lunghi a bullet points
- Focus concetti chiave

**File**: `pages/galactic-center.html`

---

### P1.6 - Blazars & GRB: Layout Unificato 🔄
**Obiettivo**: Simulatore sopra, descrizione sotto (come Crab)  
**Impatto UX**: Alto | **Complessità**: Bassa | **Tempo**: 30min

**Azioni**:
- Spostare canvas simulatore in alto
- Descrizione sotto con sezioni chiare

**File**: `pages/blazars.html`, `pages/grb.html`

---

## 🎨 PRIORITÀ 2: UX Enhancement (Alta UX, Media Complessità)

### P2.1 - Homepage: 3 Risorse in Schede (Tabs/Cards) 📑
**Obiettivo**: "Come funziona", "Hillas", "Quiz" visibili senza scroll  
**Impatto UX**: Alto | **Complessità**: Media | **Tempo**: 2h

**Design Proposto**:
```
┌─────────────────────────────────────────┐
│  [Come funziona] [Hillas] [Quiz] ←tabs  │
├─────────────────────────────────────────┤
│                                         │
│  Contenuto scheda attiva                │
│                                         │
└─────────────────────────────────────────┘
```

**Azioni**:
- CSS tabs con `:target` (no JavaScript) o state management
- Altezza fissa area contenuto (~400px)
- Animazioni transition smooth (300ms)
- Mobile: accordion invece di tabs

**File**: `homepage.html`, `css/main-style.css`

---

### P2.2 - Crab Nebula: Thumbnails Camere Ingrandibili 🖼️
**Obiettivo**: Layout camera ottimizzato, descrizione sotto  
**Impatto UX**: Alto | **Complessità**: Media | **Tempo**: 2h

**Design Proposto**:
```
┌──────────────────────────────────────┐
│  [Cam1] [Cam2] [Cam3] [Stereo] ←200px│
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Canvas principale (800×600)    │ │
│  └────────────────────────────────┘ │
│                                      │
│  Descrizione sorgente...            │
└──────────────────────────────────────┘
```

**Azioni**:
- Thumbnails 200×150px con `cursor: pointer`
- Click su thumbnail → carica in canvas principale
- Highlight thumbnail attiva (border blu)
- Transizione fade 200ms

**File**: `pages/crab-nebula.html`, `css/main-style.css`

---

### P2.3 - Crab Nebula: Immagine Reale Annotata 📸
**Obiettivo**: Foto HST/Chandra con aree descritte (pulsar, filamenti, ecc.)  
**Impatto UX**: Alto | **Complessità**: Media | **Tempo**: 1.5h

**Azioni**:
- Trovare immagine Crab Nebula (NASA/ESA, public domain)
- Aggiungere hotspot cliccabili con tooltip:
  - Pulsar (centro)
  - Filamenti (outer shell)
  - Synchrotron nebula
- Usare `<map>` + `<area>` o SVG overlay

**File**: `pages/crab-nebula.html`, nuova cartella `images/`

**Risorse**:
- NASA Image Gallery (public domain)
- ESA/Hubble Archive
- Chandra X-ray Observatory

---

### P2.4 - Introduzione: Wizard a Passi o Accordion 📚
**Obiettivo**: Pagina lunga → navigabile con step progressivi  
**Impatto UX**: Alto | **Complessità**: Media | **Tempo**: 2.5h

**Opzione A - Wizard**:
```
┌────────────────────────────────────┐
│ [1. Cosa sono] [2. Telescopi] ... │ ←step indicator
├────────────────────────────────────┤
│ Contenuto step attuale             │
│ [← Indietro]  [Avanti →]          │
└────────────────────────────────────┘
```

**Opzione B - Accordion** (preferita):
```
▼ 1. Cosa sono i raggi gamma cosmici
  Contenuto espanso...
  
▶ 2. Come funzionano i telescopi Cherenkov
  
▶ 3. Il processo di rivelazione
```

**Azioni**:
- Dividere contenuto in 6-8 sezioni logiche
- Accordion CSS-only con `<details>` + `<summary>`
- Animazioni smooth con `max-height` transition
- Possibilità "Espandi tutto" / "Chiudi tutto"

**File**: `pages/intro-cherenkov.html`, `css/main-style.css`

---

### P2.5 - Supernova Remnants: Immagine Interattiva 🔍
**Obiettivo**: Annotazioni tooltip su regioni immagine  
**Impatto UX**: Medio | **Complessità**: Media | **Tempo**: 2h

**Azioni**:
- Immagine SNR (es. Cassiopeia A, Tycho) con zone:
  - Blast wave (fronte d'onda)
  - Ejecta (materiale espulso)
  - Central compact object
  - Shocked gas regions
- Tooltip CSS on hover con info brevi
- Click → modal con dettagli approfonditi

**File**: `pages/supernova-remnants.html`, `css/main-style.css`

---

## 🎨 PRIORITÀ 3: Theme & Visual (Media UX, Media Complessità)

### P3.1 - Homepage: Tema Più Chiaro (Opzionale) 🌓
**Obiettivo**: Background meno scuro, colori più tenui  
**Impatto UX**: Medio | **Complessità**: Media | **Tempo**: 1.5h

**Analisi**:
- **Pro**: Meno affaticamento visivo, più professionale
- **Contro**: Astronomia tradizionalmente usa dark theme (simula cielo notturno)
- **Soluzione**: Toggle dark/light mode

**Azioni**:
- Creare variabili CSS per light mode:
  ```css
  [data-theme="light"] {
      --bg-primary: #f5f7fa;
      --bg-elevated: #ffffff;
      --text-primary: #1a1a2e;
      --text-secondary: #4a5568;
      --accent-blue: #2563eb;
  }
  ```
- Toggle switch in header
- Salva preferenza in `localStorage`
- Default: dark (astronomia)

**File**: `css/main-style.css`, `homepage.html` (toggle button)

---

### P3.2 - Centro Galattico: Immagini + Descrizione Semplificata 📷
**Obiettivo**: Aggiungere foto Sgr A*, semplificare testo  
**Impatto UX**: Medio | **Complessità**: Bassa | **Tempo**: 1h

**Azioni**:
- Immagini:
  - Event Horizon Telescope - Sgr A* (2022)
  - Fermi Bubbles visualization
  - Galactic Center composite (X-ray/IR/radio)
- Descrizione: ridurre da paragrafi lunghi a bullet points
- Focus su concetti chiave (no tecnicismi eccessivi)

**File**: `pages/galactic-center.html`

---

### P3.3 - Blazars & GRB: Layout Unificato 🔄
**Obiettivo**: Applicare stesso layout di Crab (simulatore sopra, descrizione sotto)  
**Impatto UX**: Medio | **Complessità**: Bassa | **Tempo**: 1h

**Azioni**:
- Spostare canvas simulatore in alto (prima del testo)
- Auto-generate evento al load
- Descrizione sotto con sezioni collapsabili
- Immagini reali sorgenti (dove disponibili)

**File**: `pages/blazars.html`, `pages/grb.html`

---

## 🔧 PRIORITÀ 4: Advanced Features (Alta UX, Alta Complessità)

### P4.1 - Sistema Export Completo (CSV/JSON/PDF) 📦
**Obiettivo**: Export dati eventi, parametri Hillas, risultati quiz  
**Impatto UX**: Alto | **Complessità**: Alta | **Tempo**: 4h

**Funzionalità**:

#### 4.1.1 Export Eventi Simulatore
```javascript
// Formato JSON
{
    "source": "crab-nebula",
    "timestamp": "2025-11-08T10:30:00Z",
    "events": [
        {
            "camera": 1,
            "tracks": [...],
            "hillas": {
                "length": 25.4,
                "width": 8.2,
                "size": 850,
                "alpha": 0.5
            }
        }
    ]
}
```

#### 4.1.2 Export Risultati Quiz
```csv
Question,Source,Answer,Correct,Time,Points,Hints
1,Crab Nebula,Crab Nebula,TRUE,45s,100,0
2,Blazar,GRB,FALSE,60s,0,1
```

**Azioni**:
- Pulsante "📥 Export Data" in ogni simulatore
- Formato selezione: CSV | JSON | PDF
- PDF usa jsPDF con grafici parametri Hillas
- LocalStorage per history (ultimi 10 eventi)

**File**: `js/visualization.js`, `js/quiz-engine.js`, nuovo `js/export-manager.js`

---

### P4.2 - Modal Ingrandimento Immagini (Lightbox) 🖼️
**Obiettivo**: Click su immagini → modal full-screen con zoom  
**Impatto UX**: Medio | **Complessità**: Media | **Tempo**: 2h

**Azioni**:
- Intercetta click su tutte le immagini nelle pagine
- Mostra modal overlay con:
  - Immagine originale full-size
  - Caption/crediti
  - Pulsanti zoom (+/-), close (X)
  - Swipe/keyboard navigation se gallery
- CSS animations (fade-in 200ms)

**File**: Nuovo `js/lightbox.js`, `css/main-style.css`

---

### P4.3 - Tutorial Interattivo Parametri Hillas 🎓
**Obiettivo**: Onboarding per utenti nuovi sui parametri  
**Impatto UX**: Alto | **Complessità**: Alta | **Tempo**: 5h

**Design**:
```
┌────────────────────────────────────┐
│  👋 Benvenuto! Ti guido...         │
│                                    │
│  [Highlight Length parametro]      │
│  "Length rappresenta..."           │
│                                    │
│  [Prossimo →]                     │
└────────────────────────────────────┘
```

**Azioni**:
- Libreria tour (es. Shepherd.js, Intro.js) o custom
- 8-10 step che spiegano:
  - Canvas simulatore
  - Parametri Hillas (length, width, alpha)
  - Interpretazione fisica
  - Come giocare al quiz
- Salva "tour completato" in localStorage
- Pulsante "?" per ri-aprire tutorial

**File**: Nuovo `js/tutorial.js`, integrazione in `navigation.js`

---

## 📋 Roadmap Temporale

### 🟢 Sprint 1 (Week 8): Quick Wins - 6h totali
**Obiettivo**: Miglioramenti immediati UX

- [ ] P1.1 - Menu compatto (30min)
- [ ] P1.2 - Hero benvenuto (20min)
- [ ] P1.3 - Auto-generate eventi (15min)
- [ ] P1.4 - Export CSV/PDF tabelle (1h)
- [ ] P2.3 - Crab foto annotata (1.5h)
- [ ] P3.2 - Centro Galattico foto (1h)
- [ ] P3.3 - Layout unificato Blazars/GRB (1h)

**Deliverable**: Homepage polished + simulatori più accattivanti

---

### 🟡 Sprint 2 (Week 9): UX Enhancement - 8h totali
**Obiettivo**: Navigazione migliorata

- [ ] P2.1 - Homepage tabs 3 risorse (2h)
- [ ] P2.2 - Crab thumbnails camere (2h)
- [ ] P2.4 - Intro accordion/wizard (2.5h)
- [ ] P2.5 - SNR immagine interattiva (2h)
- [ ] P4.2 - Lightbox immagini (2h)

**Deliverable**: Navigazione fluida, meno scroll, più engagement

---

### 🔵 Sprint 3 (Week 10): Advanced Features - 10h totali
**Obiettivo**: Funzionalità avanzate

- [ ] P3.1 - Light/Dark theme toggle (1.5h)
- [ ] P4.1 - Export sistema completo (4h)
- [ ] P4.3 - Tutorial interattivo (5h)

**Deliverable**: Piattaforma completa con export e onboarding

---

## 🎯 Priorità per Valore Educativo

### 🥇 Massima Priorità (Core Mission)
1. **P1.3** - Auto-generate eventi (demo immediata)
2. **P1.4** - Crab foto annotata (visualizzazione reale)
3. **P2.5** - SNR immagine interattiva (apprendimento visivo)
4. **P4.4** - Tutorial Hillas (onboarding essenziale)

### 🥈 Alta Priorità (UX Critical)
1. **P1.1** - Menu compatto (accessibilità)
2. **P1.2** - Hero benvenuto (prima impressione)
3. **P2.1** - Homepage tabs (informazioni chiare)
4. **P2.4** - Intro navigabile (riduce bounce)

### 🥉 Media Priorità (Nice to Have)
1. **P2.2** - Thumbnails camere (ergonomia)
2. **P3.1** - Theme toggle (preferenze personali)
3. **P4.1** - Export completo eventi (uso avanzato)
4. **P4.3** - Export tabelle (utilità ricerca)

---

## ⚙️ Dettaglio Implementazione Sprint 1

### Step-by-Step P1.1 (Menu Compatto)

**File**: `css/main-style.css`

```css
/* BEFORE */
.nav-menu {
    padding: 16px 0;
    font-size: 1rem;
}
.nav-menu li {
    margin: 0 12px;
}

/* AFTER */
.nav-menu {
    padding: 8px 0;           /* -50% padding */
    font-size: 0.9rem;        /* -10% font */
    border-bottom: none;      /* rimuovi linea */
}
.nav-menu li {
    margin: 0 8px;            /* -33% spacing */
}
```

**Test**:
- Viewport 1920×1080: menu + hero visibili senza scroll ✓
- Viewport 1366×768: idem ✓
- Mobile 375px: hamburger menu (già presente) ✓

---

### Step-by-Step P1.3 (Auto-Generate Eventi)

**File**: `js/navigation.js`

```javascript
// Aggiungere alla fine della funzione setupSourceSimulator()

function setupSourceSimulator(sourceType, options = {}) {
    // ... codice esistente ...
    
    // Auto-generate primo evento dopo load
    if (options.autoGenerate !== false) {  // default true
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('🎬 Auto-generating initial event...');
                generateEvent();
            }, 500);  // delay per rendering completo
        });
    }
    
    return { engine, renderers, hillasAnalyzer };
}
```

**Test**:
- Aprire crab-nebula.html → evento già visibile ✓
- Aprire supernova-remnants.html → evento già visibile ✓
- Performance: nessun lag visibile ✓

---

### Step-by-Step P1.4 (Export CSV Tabelle)

**File**: `pages/comparison.html`

```html
<!-- Aggiungere prima della tabella -->
<div style="text-align: right; margin-bottom: 16px;">
    <button onclick="exportTableToCSV('comparison-table', 'gammalab-sources.csv')" 
            class="btn btn-primary">
        📥 Export CSV
    </button>
    <button onclick="window.print()" 
            class="btn btn-secondary">
        📄 Print/PDF
    </button>
</div>

<table id="comparison-table">
    <!-- tabella esistente -->
</table>

<script>
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.querySelectorAll('tr'));
    
    const csv = rows.map(row => {
        const cells = Array.from(row.cells);
        return cells.map(cell => {
            // Escape virgole e doppi apici
            const text = cell.textContent.trim().replace(/"/g, '""');
            return `"${text}"`;
        }).join(',');
    }).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
</script>
```

**CSS Print** (in `css/main-style.css`):
```css
@media print {
    header, nav, .btn, .card-actions {
        display: none;
    }
    table {
        border-collapse: collapse;
        width: 100%;
    }
    th, td {
        border: 1px solid #000;
        padding: 8px;
    }
}
```

---

## 📊 Metriche di Successo

### KPI per Valutazione
- **Bounce Rate**: Target < 30% (homepage)
- **Tempo Pagina Intro**: Ridurre da 2min → 4min (più engagement)
- **Completamento Quiz**: Aumentare da X% → +20%
- **Export Usage**: Tracciare download CSV/PDF
- **Tutorial Completion**: Target > 60% nuovi utenti

---

## 🚨 Rischi e Mitigazioni

### Rischio 1: Complessità Crescente
**Mitigazione**: 
- Mantenere codice modulare (già fatto con .js separati)
- Documentare ogni feature in PROJECT_STATE.md
- Testing incrementale dopo ogni sprint

### Rischio 2: Performance con Lightbox/Modals
**Mitigazione**:
- Lazy load immagini (solo quando necessario)
- Virtual scrolling per liste lunghe
- Debounce/throttle eventi scroll/resize

### Rischio 3: Compatibilità Browser
**Mitigazione**:
- Testare su Chrome, Firefox, Safari
- Polyfill per feature moderne (es. CSS `:has()`)
- Graceful degradation (no JavaScript fallback)

---

## 📝 Note Implementative

### Dipendenze Esterne (CDN)
- **jsPDF**: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
- **Chart.js** (opzionale per grafici export): `https://cdn.jsdelivr.net/npm/chart.js`
- **Intro.js** (tutorial): `https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.2.0/intro.min.js`

### Convenzioni Nuove Feature
- Prefisso emoji nei log: `🎬` (auto-generate), `📥` (export), `🎓` (tutorial)
- Funzioni export: namespace `GammaLabExport.*`
- CSS nuove classi: prefisso `.gl-` (es. `.gl-modal`, `.gl-tab`)

---

## ✅ Checklist Pre-Deploy

Dopo ogni sprint:
- [ ] Test su 3+ browser (Chrome, Firefox, Edge)
- [ ] Test mobile (375px, 768px, 1024px)
- [ ] Validazione HTML (W3C validator)
- [ ] Performance check (Lighthouse score > 90)
- [ ] Accessibility (WCAG AA compliance)
- [ ] Update PROJECT_STATE.md con nuove features
- [ ] Cache busting: incrementare `?v=8`, `?v=9`, ...
- [ ] Git commit con message strutturato

---

**Prossimo Passo**: Approvazione priorità e inizio Sprint 1 🚀
