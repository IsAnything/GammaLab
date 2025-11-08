/**
 * GAMMALAB - Visualization Module v3.0 MEGA UPGRADE
 * Rendering con palette scientifica cyan-brillante
 * Palette: Cyan → Blue → Teal → Green → Yellow (IACT-style)
 * VERSIONE 3.0 - Fotoni 3× più grandi, glow 5×, alpha potenziato
 */

console.log('🚀 VISUALIZATION.JS V3.0 CARICATO - Fotoni grandi e luminosi!');

// === PALETTE COLORI SCIENTIFICA (5-COLOR GRADIENT) ===
class EnergyColorPalette {
    constructor() {
        // Nuova palette 5 colori: Cyan → Blue → Teal → Green → Yellow
        // Ottimizzata per visibilità su sfondo nero
        this.colorStops = [
            { energy: 50,    color: { r: 20,  g: 120, b: 200 } },  // Cyan brillante (low E)
            { energy: 500,   color: { r: 24,  g: 80,  b: 220 } },  // Deep blue
            { energy: 2000,  color: { r: 20,  g: 160, b: 150 } },  // Teal (cyan-green)
            { energy: 8000,  color: { r: 100, g: 220, b: 80  } },  // Bright green
            { energy: 30000, color: { r: 255, g: 240, b: 80  } }   // Bright yellow
        ];

        this.maxEnergy = 50000; // 50 TeV
        this.minEnergy = 50;    // 50 GeV
    }

    /**
     * Ottieni colore RGB per una data energia
     * @param {Number} energy - Energia in GeV
     * @returns {String} Colore RGB come stringa "rgb(r, g, b)"
     */
    getColor(energy) {
        // Clamp energia
        energy = Math.max(this.minEnergy, Math.min(this.maxEnergy, energy));

        // Debug: log energia e colore ogni 100 fotoni
        if (Math.random() < 0.01) {
            console.log(`🎨 Energia: ${(energy/1000).toFixed(1)} TeV`);
        }

        // Trova intervallo nella palette
        let lower = this.colorStops[0];
        let upper = this.colorStops[this.colorStops.length - 1];

        for (let i = 0; i < this.colorStops.length - 1; i++) {
            if (energy >= this.colorStops[i].energy && energy <= this.colorStops[i + 1].energy) {
                lower = this.colorStops[i];
                upper = this.colorStops[i + 1];
                break;
            }
        }

        // Interpolazione logaritmica (fisica!)
        const logE = Math.log10(energy);
        const logLower = Math.log10(lower.energy);
        const logUpper = Math.log10(upper.energy);
        const t = (logE - logLower) / (logUpper - logLower);

        // Interpolazione RGB lineare
        const r = Math.floor(lower.color.r + t * (upper.color.r - lower.color.r));
        const g = Math.floor(lower.color.g + t * (upper.color.g - lower.color.g));
        const b = Math.floor(lower.color.b + t * (upper.color.b - lower.color.b));

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Helper: get color as [r,g,b] array for hex rendering
     */
    getColorRGB(energy) {
        energy = Math.max(this.minEnergy, Math.min(this.maxEnergy, energy));
        
        let lower = this.colorStops[0];
        let upper = this.colorStops[this.colorStops.length - 1];

        for (let i = 0; i < this.colorStops.length - 1; i++) {
            if (energy >= this.colorStops[i].energy && energy <= this.colorStops[i + 1].energy) {
                lower = this.colorStops[i];
                upper = this.colorStops[i + 1];
                break;
            }
        }

        const logE = Math.log10(energy);
        const logLower = Math.log10(lower.energy);
        const logUpper = Math.log10(upper.energy);
        const t = (logE - logLower) / (logUpper - logLower);

        const r = Math.floor(lower.color.r + t * (upper.color.r - lower.color.r));
        const g = Math.floor(lower.color.g + t * (upper.color.g - lower.color.g));
        const b = Math.floor(lower.color.b + t * (upper.color.b - lower.color.b));

        return [r, g, b];
    }

    /**
     * Map normalized value 0-1 to palette color
     */
    mapNormalized(t) {
        t = Math.max(0, Math.min(1, t));
        const n = this.colorStops.length - 1;
        const idx = Math.min(n - 1, Math.floor(t * n));
        const local = (t * n) - idx;
        
        const a = this.colorStops[idx].color;
        const b = this.colorStops[idx + 1].color;
        
        return [
            Math.round(a.r + (b.r - a.r) * local),
            Math.round(a.g + (b.g - a.g) * local),
            Math.round(a.b + (b.b - a.b) * local)
        ];
    }

    /**
     * Ottieni colore con trasparenza
     */
    getColorWithAlpha(energy, alpha) {
        const rgb = this.getColor(energy);
        return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }

    /**
     * Genera gradiente canvas per legenda
     */
    createLegendGradient(ctx, x, y, width, height) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y);

        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const energy = this.minEnergy * Math.pow(this.maxEnergy / this.minEnergy, t);
            const color = this.getColor(energy);
            gradient.addColorStop(t, color);
        }

        return gradient;
    }

    /**
     * Disegna legenda energia su canvas
     */
    drawEnergyLegend(canvas, position = 'bottom-right') {
        const ctx = canvas.getContext('2d');
        const width = 200;
        const height = 20;
        const margin = 20;

        let x, y;
        switch (position) {
            case 'bottom-right':
                x = canvas.width - width - margin;
                y = canvas.height - height - margin - 40;
                break;
            case 'top-right':
                x = canvas.width - width - margin;
                y = margin;
                break;
            case 'bottom-left':
                x = margin;
                y = canvas.height - height - margin - 40;
                break;
            default:
                x = margin;
                y = margin;
        }

        // Sfondo
        ctx.fillStyle = 'rgba(0, 8, 20, 0.8)';
        ctx.fillRect(x - 5, y - 25, width + 10, height + 55);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('Energia Fotoni', x, y - 10);

        // Gradiente
        const gradient = this.createLegendGradient(ctx, x, y, width, height);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Bordo
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Etichette energia
        ctx.font = '10px "Courier New", monospace';
        ctx.fillText('50 GeV', x, y + height + 15);
        ctx.fillText('1 TeV', x + width / 3, y + height + 15);
        ctx.fillText('10 TeV', x + 2 * width / 3, y + height + 15);
        ctx.fillText('50 TeV', x + width - 35, y + height + 15);
    }
}

// === RENDERING UTILITIES ===

/**
 * Classe per gestire rendering multi-canvas
 */
class CanvasRenderer {
    constructor(canvasId, overlayId = null) {
        this.canvas = document.getElementById(canvasId);
        this.overlay = overlayId ? document.getElementById(overlayId) : null;
        
        if (!this.canvas) {
            console.error(`Canvas '${canvasId}' non trovato`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.overlayCtx = this.overlay ? this.overlay.getContext('2d') : null;
        
        this.colorPalette = new EnergyColorPalette();
        
        // NEW: Light style flag (default: false = dark theme)
        this.lightStyle = false;
    }

    /**
     * Aggiusta i parametri Hillas in modo che l'ellisse contenga tutti i fotoni
     * accetta hillas (oggetto risultato) e lista di tracks (event.tracks)
     */
    adjustHillasToContainTracks(hillas, tracks) {
        if (!hillas || !tracks || !tracks.length) return hillas;

        // Usa lengthPx/widthPx come semiassi
        let a = hillas.lengthPx || 1;
        let b = hillas.widthPx || 1;
        const cx = hillas.cogX;
        const cy = hillas.cogY;
        const thetaRad = (hillas.theta || 0) * Math.PI / 180;
        const cosT = Math.cos(thetaRad);
        const sinT = Math.sin(thetaRad);

        // Protezioni minime per semiassi
        if (!isFinite(a) || a <= 1) a = 1;
        if (!isFinite(b) || b <= 1) b = 1;

        let maxNormalized = 0.0001;
        tracks.forEach(t => {
            const dx = t.x - cx;
            const dy = t.y - cy;
            // Proietta nella referenza dell'ellisse (rotate -theta)
            const long = dx * cosT + dy * sinT;
            const lat = -dx * sinT + dy * cosT;

            // Considera solo il raggio core del fotone (non il glow)
            // Light style: tighter buffer (1.2×) for compact ellipses
            let buffer = 0;
            try {
                const bufferFactor = this.lightStyle ? 1.2 : 1.5;
                buffer = Math.abs(this.intensityToRadius(t.intensity) * bufferFactor);
            } catch (e) {
                buffer = 0;
            }

            const longAbs = Math.abs(long) + buffer;
            const latAbs = Math.abs(lat) + buffer;

            const norm = Math.sqrt(Math.pow(longAbs / a, 2) + Math.pow(latAbs / b, 2));
            if (norm > maxNormalized) maxNormalized = norm;
        });

        // Se esiste qualche fotone fuori dall'ellisse (norm>1), ingrandire mantenendo proporzione
        if (maxNormalized > 1) {
            const scale = maxNormalized * 1.02; // margine minimo
            console.log(`🔧 adjustHillas: found outliers (maxNorm=${maxNormalized.toFixed(2)}), scaling ellipse by ${scale.toFixed(2)}`);
            a *= scale;
            b *= scale;
            hillas.lengthPx = a;
            hillas.widthPx = b;
            // Aggiorna anche le versioni in gradi (se presenti e PIXEL_TO_DEGREE definito)
            try {
                if (typeof PIXEL_TO_DEGREE !== 'undefined') {
                    hillas.length = a * PIXEL_TO_DEGREE;
                    hillas.width = b * PIXEL_TO_DEGREE;
                }
            } catch (e) {
                // ignore
            }
        }

        return hillas;
    }

    /**
     * Disegna un riempimento diffuso (soft glow) all'interno dell'ellisse Hillas
     * Questo viene disegnato sul canvas principale usando 'destination-over' in modo
     * da risultare sotto i fotoni già renderizzati ma sopra lo sfondo.
     * @param {Object} hillas - parametri Hillas (cogX, cogY, lengthPx, widthPx, theta)
     * @param {Array} tracks - array di fotoni (opzionale) per determinare colore medio
     */
    fillEllipseBackground(hillas, tracks = []) {
        if (!hillas || !this.ctx) return;

        const cx = hillas.cogX;
        const cy = hillas.cogY;
        const a = hillas.lengthPx || 1;
        const b = hillas.widthPx || 1;
        const theta = (hillas.theta || 0) * Math.PI / 180;

        // Calcola colore medio dei fotoni (se disponibili)
        let avgColor = [20, 119, 200]; // fallback cyan
        if (tracks && tracks.length) {
            let r = 0, g = 0, bcol = 0, n = 0;
            tracks.forEach(t => {
                try {
                    const c = this.colorPalette.getColorRGB(t.energy);
                    r += c[0]; g += c[1]; bcol += c[2]; n++;
                } catch (e) {}
            });
            if (n > 0) {
                avgColor = [Math.round(r / n), Math.round(g / n), Math.round(bcol / n)];
            }
        }

        // Disegna il riempimento dietro i fotoni
        this.ctx.save();
    // Disegnamo il fill sopra lo sfondo (ma prima dei fotoni), normale compositing
    this.ctx.globalCompositeOperation = 'source-over';

        // Crea gradiente radiale più visibile per riempire l'ellisse
        const gradRadius = Math.max(a, b) * 1.8;
        const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, gradRadius);
        // Aumentiamo significativamente l'alpha per rendere il riempimento ben visibile
        const rgbaCenter = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, 0.55)`;
        const rgbaMid = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, 0.28)`;
        const rgbaEdge = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, 0.08)`;
        grad.addColorStop(0, rgbaCenter);
        grad.addColorStop(0.35, rgbaMid);
        grad.addColorStop(0.7, rgbaEdge);
        grad.addColorStop(1, 'rgba(0,0,0,0)');        // Trasforma contesto per ruotare l'ellisse
        this.ctx.translate(cx, cy);
        this.ctx.rotate(theta);

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, a, b, 0, 0, 2 * Math.PI);
        this.ctx.fill();

    // Ripristina trasformazioni e compositing
    this.ctx.restore();
    this.ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Pulisce entrambi i canvas
     */
    clear() {
        // Background: light gray for light style, dark blue for dark style
        this.ctx.fillStyle = this.lightStyle ? '#e0e0e0' : '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.overlayCtx) {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }
    }

    /**
     * Renderizza evento con effetti glow
     */
    renderEvent(event, showLegend = true) {
        this.clear();

        // Ordina tracce per intensità (prima i deboli, poi i brillanti)
        const sortedTracks = [...event.tracks].sort((a, b) => a.intensity - b.intensity);

        // Render fotoni
        sortedTracks.forEach(track => {
            this.renderPhoton(track);
        });

        // Se disponibile, possiamo applicare un leggero riempimento diffuso sotto i fotoni
        // chiamando fillEllipseBackground separatamente da navigation.js quando abbiamo i parametri Hillas.

        // Griglia (opzionale)
        if (event.showGrid) {
            this.drawGrid();
        }

        // Legenda (spostata in alto a destra per non coprire i fotoni)
        if (showLegend) {
            this.colorPalette.drawEnergyLegend(this.canvas, 'top-right');
        }

        // Info camera
        this.drawCameraInfo(event);
    }

    /**
     * Renderizza singolo fotone
     */
    renderPhoton(track) {
        // Validazione input
        if (!track || typeof track.x !== 'number' || typeof track.y !== 'number' || 
            !isFinite(track.x) || !isFinite(track.y) || 
            !track.intensity || !isFinite(track.intensity) ||
            !track.energy || !isFinite(track.energy)) {
            console.warn(`⚠️ Track non valido: x=${track?.x}, y=${track?.y}, energy=${track?.energy}, intensity=${track?.intensity}`);
            return;
        }

    // Usa intensity per scegliere colore dalla palette (visualizzazione energia più chiara)
    // Normalizza intensity a [0,1]
    const intensityFactor = Math.max(0, Math.min(1, track.intensity || 0));
    
    // Mappa intensity→colore usando la palette (ritorna [r,g,b])
    // Aggiungiamo anche variazione basata sull'energia per maggiore differenziazione
    let baseRGB;
    try {
        // Combina intensity (0-1) con energia normalizzata per più varietà
        const energyNorm = Math.log10(track.energy / this.colorPalette.minEnergy) / 
                          Math.log10(this.colorPalette.maxEnergy / this.colorPalette.minEnergy);
        const colorT = (intensityFactor * 0.7 + energyNorm * 0.3); // 70% intensity, 30% energia
        baseRGB = this.colorPalette.mapNormalized(colorT);
    } catch (e) {
        baseRGB = this.colorPalette.getColorRGB(track.energy || this.colorPalette.minEnergy);
    }

    // Aggiungi jitter posizionale per evitare colori identici
    const jitter = (Math.sin((track.x + track.y) * 0.12) + (Math.random() - 0.5) * 0.8) * 12;
    
    // Light style: boost saturation by 40% for more vivid colors
    const saturationBoost = this.lightStyle ? 1.4 : 1.0;
    let r = Math.min(255, Math.max(0, Math.round(baseRGB[0] * saturationBoost + jitter + intensityFactor * 35)));
    let g = Math.min(255, Math.max(0, Math.round(baseRGB[1] * saturationBoost + jitter * 0.7 + intensityFactor * 25)));
    let b = Math.min(255, Math.max(0, Math.round(baseRGB[2] * saturationBoost - jitter * 0.5 + intensityFactor * 15)));

    const color = `rgb(${r}, ${g}, ${b})`;
    const radius = this.intensityToRadius(track.intensity);
    const alpha = Math.min(1, track.intensity * 1.2 + 0.5); // Alpha molto più alto!

        // Debug: mostra valori di rendering ogni 50 fotoni
        if (Math.random() < 0.02) {
            console.log(`🔷 Fotone: E=${(track.energy/1000).toFixed(1)}TeV, radius=${radius.toFixed(1)}px, alpha=${alpha.toFixed(2)}, color=${color}`);
        }

        // Validazione radius
        if (!isFinite(radius) || radius <= 0) {
            console.warn('⚠️ Radius non valido:', radius, 'per track:', track);
            return;
        }

        // Glow esterno molto ampio (effetto drammatico)
        const gradient = this.ctx.createRadialGradient(
            track.x, track.y, 0,
            track.x, track.y, radius * 5.0  // Alone MOLTO ampio (5× il raggio)
        );
        gradient.addColorStop(0, this.colorPalette.getColorWithAlpha(track.energy, alpha));
        gradient.addColorStop(0.2, this.colorPalette.getColorWithAlpha(track.energy, alpha * 0.8));
        gradient.addColorStop(0.5, this.colorPalette.getColorWithAlpha(track.energy, alpha * 0.4));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(track.x, track.y, radius * 5.0, 0, 2 * Math.PI);
        this.ctx.fill();

        // Core brillante (più grande e visibile)
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(track.x, track.y, radius * 1.5, 0, 2 * Math.PI);
        this.ctx.fill();

    // Punto centrale ultra-brillante (sempre presente)
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    this.ctx.beginPath();
    this.ctx.arc(track.x, track.y, radius * 0.5, 0, 2 * Math.PI);
    this.ctx.fill();
    }

    /**
     * Converte intensità in raggio (aumentato per migliore visibilità)
     */
    intensityToRadius(intensity) {
        if (typeof intensity !== 'number' || !isFinite(intensity)) {
            console.warn('⚠️ Intensity non valida:', intensity);
            return 8.0; // Valore di default molto più grande
        }
        return 5.0 + intensity * 10.0; // Raggi MOLTO più grandi (5-15px)!
    }

    /**
     * Disegna griglia di riferimento
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.15)';
        this.ctx.lineWidth = 1;

        // Griglia ogni 1° (100 pixel)
        for (let x = 0; x <= this.canvas.width; x += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Centro camera
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 25, cy);
        this.ctx.lineTo(cx + 25, cy);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - 25);
        this.ctx.lineTo(cx, cy + 25);
        this.ctx.stroke();
    }

    /**
     * Disegna info camera
     */
    drawCameraInfo(event) {
        if (!event.cameraId) return;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillText(`Camera ${event.cameraId}`, 20, 30);

        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.fillText(`Energia: ${(event.energy / 1000).toFixed(1)} TeV`, 20, 50);
        this.ctx.fillText(`Fotoni: ${event.tracks.length}`, 20, 65);
    }

    /**
     * Renderizza parametri Hillas su overlay
     */
    renderHillasOverlay(hillasParams) {
        if (!this.overlayCtx || !hillasParams || !hillasParams.valid) return;

        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

        const centerX = hillasParams.cogX;
        const centerY = hillasParams.cogY;
        const theta = hillasParams.theta * Math.PI / 180;

        // Ellisse Hillas - magenta for light style, green for dark style
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(theta);

        ctx.strokeStyle = this.lightStyle ? '#ff1493' : '#00ff88';  // Deep pink (magenta) for light style
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, hillasParams.lengthPx, hillasParams.widthPx, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Assi
        ctx.strokeStyle = this.lightStyle ? '#ff1493' : '#ffaa00';
        ctx.lineWidth = 1.5;
        // Asse maggiore
        ctx.beginPath();
        ctx.moveTo(-hillasParams.lengthPx, 0);
        ctx.lineTo(hillasParams.lengthPx, 0);
        ctx.stroke();
        // Asse minore
        ctx.beginPath();
        ctx.moveTo(0, -hillasParams.widthPx);
        ctx.lineTo(0, hillasParams.widthPx);
        ctx.stroke();

        ctx.restore();

        // Centro di gravità
        ctx.fillStyle = this.lightStyle ? '#ff1493' : '#ff0055';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = this.lightStyle ? '#333333' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Linea Alpha (CoG → Centro camera)
        const cameraCenterX = this.overlay.width / 2;
        const cameraCenterY = this.overlay.height / 2;
        ctx.strokeStyle = this.lightStyle ? '#0066cc' : '#4488ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(cameraCenterX, cameraCenterY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Alpha
        const midX = (centerX + cameraCenterX) / 2;
        const midY = (centerY + cameraCenterY) / 2;
        ctx.fillStyle = this.lightStyle ? '#000000' : '#ffffff';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.strokeStyle = this.lightStyle ? '#ffffff' : '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(`α = ${hillasParams.alpha.toFixed(1)}°`, midX + 10, midY);
        ctx.fillText(`α = ${hillasParams.alpha.toFixed(1)}°`, midX + 10, midY);
    }
}

// === FUNZIONI UTILITY ===

/**
 * Crea pannello HTML con parametri Hillas formattati
 */
function createHillasPanel(hillasParams, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!hillasParams || !hillasParams.valid) {
        container.innerHTML = '<p style="color: #ff4444;">Parametri Hillas non validi</p>';
        return;
    }

    const html = `
        <div class="hillas-params">
            <h4>Parametri di Hillas</h4>
            <table class="params-table">
                <tr>
                    <td><strong>Length:</strong></td>
                    <td>${hillasParams.length.toFixed(3)}° (${hillasParams.lengthPx.toFixed(1)} px)</td>
                </tr>
                <tr>
                    <td><strong>Width:</strong></td>
                    <td>${hillasParams.width.toFixed(3)}° (${hillasParams.widthPx.toFixed(1)} px)</td>
                </tr>
                <tr>
                    <td><strong>Size:</strong></td>
                    <td>${hillasParams.size.toFixed(0)} p.e.</td>
                </tr>
                <tr>
                    <td><strong>Alpha:</strong></td>
                    <td>${hillasParams.alpha.toFixed(1)}°</td>
                </tr>
                <tr>
                    <td><strong>L/W Ratio:</strong></td>
                    <td>${hillasParams.elongation.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Miss:</strong></td>
                    <td>${hillasParams.miss.toFixed(2)}°</td>
                </tr>
                <tr>
                    <td><strong>Asymmetry:</strong></td>
                    <td>${hillasParams.asymmetry.toFixed(3)}</td>
                </tr>
                <tr>
                    <td><strong>Fotoni:</strong></td>
                    <td>${hillasParams.numPhotons}</td>
                </tr>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Anima transizione tra eventi
 */
function animateTransition(canvasRenderer, callback) {
    const ctx = canvasRenderer.ctx;
    let alpha = 1;
    
    const fadeOut = setInterval(() => {
        ctx.fillStyle = `rgba(0, 8, 20, ${1 - alpha})`;
        ctx.fillRect(0, 0, canvasRenderer.canvas.width, canvasRenderer.canvas.height);
        alpha -= 0.1;
        
        if (alpha <= 0) {
            clearInterval(fadeOut);
            if (callback) callback();
        }
    }, 30);
}

// === HEX RENDERING (PMT ESAGONALI) ===

/**
 * Renderizza camera con sensori esagonali (come veri PMT Cherenkov)
 * Integrato con sistema esistente - fallback automatico a rendering quadrato
 */
function renderHexCamera(eventData, canvas, options = {}) {
    console.log('🎨 renderHexCamera chiamata:', { 
        canvasId: canvas.id, 
        tracks: eventData?.tracks?.length,
        options 
    });
    
    const ctx = canvas.getContext('2d');
    const opts = {
        useHexRendering: true,
        cellRadius: 6,
        normMax: 1.0,
        showEnhanced: true,
        ...options
    };

    // Se useHexRendering=false, usa rendering standard
    if (!opts.useHexRendering) {
        // Fallback al renderer esistente
        const renderer = new CanvasRenderer(canvas.id);
        renderer.renderEvent(eventData, opts.showLegend !== false);
        return;
    }

    // === HEX RENDERING MODE ===
    const W = canvas.width;
    const H = canvas.height;

    // Costruisci Float32Array da eventData.tracks
    const img = new Float32Array(W * H);
    
    // Background noise floor
    for (let i = 0; i < img.length; i++) {
        img[i] = 0.004 + (Math.random() - 0.5) * 0.008;
    }

    // Aggiungi fotoni dall'evento
    if (eventData && eventData.tracks && Array.isArray(eventData.tracks)) {
        console.log(`  📊 Rendering ${eventData.tracks.length} tracks in modalità esagonale`);
        let validTracks = 0;
        
        eventData.tracks.forEach(track => {
            if (!track || !isFinite(track.x) || !isFinite(track.y) || !isFinite(track.intensity)) {
                return;
            }
            validTracks++;

            const cx = Math.floor(track.x);
            const cy = Math.floor(track.y);
            const intensity = track.intensity || 0.5;
            const radius = 8 + intensity * 12; // Spread basato su intensità

            // Gaussian splat
            const r2 = radius * radius;
            const x0 = Math.max(0, cx - Math.ceil(radius * 2));
            const x1 = Math.min(W - 1, cx + Math.ceil(radius * 2));
            const y0 = Math.max(0, cy - Math.ceil(radius * 2));
            const y1 = Math.min(H - 1, cy + Math.ceil(radius * 2));

            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < r2 * 4) {
                        const gauss = Math.exp(-d2 / (2 * r2));
                        img[y * W + x] += intensity * gauss * 0.8;
                    }
                }
            }
        });
        console.log(`  ✅ ${validTracks} tracks validi renderizzati in immagine Float32Array`);
    } else {
        console.warn('  ⚠️ Nessun track valido in eventData');
    }

    // Clear canvas
    ctx.fillStyle = 'rgb(40,10,40)'; // Deep purple background
    ctx.fillRect(0, 0, W, H);

    // Parametri griglia esagonale
    const cellR = Math.max(3, Math.round(opts.cellRadius * (W / 900)));
    const hexH = Math.sqrt(3) * cellR;
    const stepX = 1.5 * cellR;
    const stepY = hexH;

    // Palette instance
    const palette = new EnergyColorPalette();

    // Draw hexagons
    let hexCount = 0;
    let brightHexCount = 0;
    for (let row = 0, y = cellR; y < H + cellR; row++, y += stepY) {
        const offsetX = (row % 2) ? (stepX / 2) : 0;
        for (let x = cellR + offsetX; x < W + cellR; x += stepX) {
            // Sample image at this hex center
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            if (ix >= 0 && ix < W && iy >= 0 && iy < H) {
                let v = img[iy * W + ix];
                
                // Tonemap: sqrt for better visibility
                v = Math.sqrt(Math.max(0, v));
                v = Math.min(1, v / opts.normMax);

                // Get color from palette
                const col = palette.mapNormalized(v);

                // Draw hexagon
                ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
                drawHexagon(ctx, x, y, cellR);

                // Hex border
                ctx.strokeStyle = 'rgba(20,8,20,0.6)';
                ctx.lineWidth = Math.max(1, Math.round(cellR * 0.12));
                ctx.stroke();
                
                hexCount++;
                if (v > 0.1) brightHexCount++;
            }
        }
    }
    console.log(`  🔷 Disegnati ${hexCount} esagoni (${brightHexCount} luminosi)`);

    // Vignette overlay
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    vg.addColorStop(0.0, 'rgba(0,0,0,0.0)');
    vg.addColorStop(0.7, 'rgba(0,0,0,0.06)');
    vg.addColorStop(1.0, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Top light gradient
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0.0, 'rgba(255,255,255,0.02)');
    lg.addColorStop(1.0, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    // Camera info overlay
    if (opts.showEnhanced && eventData) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText(`Camera ${eventData.cameraId || ''}`, 20, 30);

        ctx.font = '12px "Courier New", monospace';
        if (eventData.energy) {
            ctx.fillText(`Energia: ${(eventData.energy / 1000).toFixed(1)} TeV`, 20, 50);
        }
        if (eventData.tracks) {
            ctx.fillText(`Fotoni: ${eventData.tracks.length}`, 20, 65);
        }
    }
}

/**
 * Draw hexagon helper
 */
function drawHexagon(ctx, cx, cy, r) {
    const ang30 = Math.PI / 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = ang30 + i * Math.PI / 3;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

// === EXPORT FUNCTIONS TO GLOBAL SCOPE ===
// Necessario per compatibilità con navigation.js e altre pagine
if (typeof window !== 'undefined') {
    window.renderHexCamera = renderHexCamera;
    window.drawHexagon = drawHexagon;
}
