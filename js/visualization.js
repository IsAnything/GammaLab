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
     * Tone mapping + gamma correction helper
     * - Applies an exponential exposure curve then gamma-corrects
     * @param {number} v normalized value 0..1
     * @param {number} k exposure strength
     */
    toneMap(v, k = 4.0) {
        v = Math.max(0, Math.min(1, v));
        // exponential exposure operator (filmic-like)
        const mapped = 1 - Math.exp(-k * v);
        // gamma correction (approx sRGB/gamma)
        const gamma = 1 / 2.2;
        return Math.pow(mapped, gamma);
    }

    /**
     * Scales an RGB array by a brightness factor and clamps
     */
    applyBrightnessToRGB(rgbArr, brightness) {
        const b = Math.max(0, Math.min(1, brightness));
        return [
            Math.min(255, Math.round(rgbArr[0] * b)),
            Math.min(255, Math.round(rgbArr[1] * b)),
            Math.min(255, Math.round(rgbArr[2] * b))
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
        // When true the renderer will suppress background noise (useful for clean quiz images)
        this.suppressNoise = false;
        // If true, renderer will draw Hillas ellipses using the exact computed semi-axes
        // (useful for quizzes where geometric adherence is required)
        this.respectExactHillas = false;
        // If true, allow sub-pixel placement / small jitter for photon's positions
        // improves realism by avoiding integer-only placement
        this.subpixelEnabled = true;
        // Exposure parameter for tone-mapping (higher = brighter / more responsive highlights)
        this.exposureK = 4.0;
        // NEW: If true, render only the Hillas ellipse outline (no photons) for didactic clarity
        this.showEllipseOnly = false;
        
        // NEW: Mouse hover detection for showing Hillas ellipse on hover
        this.showHillasOnHover = true; // default: show ellipse only on hover
        this.isHovering = false;
        this.mouseX = -1;
        this.mouseY = -1;
        this.currentHillasParams = null; // store last Hillas params for hover check
        
        // Setup mouse listeners for hover detection
        this._setupMouseListeners();
    }
    
    /**
     * Setup mouse event listeners for hover detection
     */
    _setupMouseListeners() {
        if (!this.canvas) return;
        
        // Listen to both canvas and overlay for mouse events
        const listenCanvas = this.overlay || this.canvas;
        
        listenCanvas.addEventListener('mousemove', (e) => {
            const rect = listenCanvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            // Check if hovering over trace (if we have Hillas params)
            if (this.currentHillasParams && this.showHillasOnHover) {
                const wasHovering = this.isHovering;
                this.isHovering = this._isMouseOverTrace(this.mouseX, this.mouseY, this.currentHillasParams);
                
                // Debug log
                if (wasHovering !== this.isHovering) {
                    console.log('🖱️ Hover state changed:', this.isHovering, 'at', this.mouseX, this.mouseY);
                }
                
                // Re-render if hover state changed
                if (wasHovering !== this.isHovering) {
                    this._redrawHillasOverlay();
                }
            }
        });
        
        listenCanvas.addEventListener('mouseleave', () => {
            if (this.isHovering) {
                this.isHovering = false;
                this._redrawHillasOverlay();
                console.log('🖱️ Mouse left, hiding ellipse');
            }
            this.mouseX = -1;
            this.mouseY = -1;
        });
    }
    
    /**
     * Check if mouse is over the trace (within ellipse bounds + buffer)
     */
    _isMouseOverTrace(mx, my, hillas) {
        if (!hillas || !hillas.valid) {
            console.log('🖱️ No valid hillas params');
            return false;
        }
        
        const cx = hillas.cogX;
        const cy = hillas.cogY;
        const a = hillas.lengthPx * 1.5; // Add 50% buffer
        const b = hillas.widthPx * 1.5;
        const theta = (hillas.theta || 0) * Math.PI / 180;
        
        // Rotate mouse position to ellipse frame
        const dx = mx - cx;
        const dy = my - cy;
        const cosT = Math.cos(-theta);
        const sinT = Math.sin(-theta);
        const rotX = dx * cosT - dy * sinT;
        const rotY = dx * sinT + dy * cosT;
        
        // Check if inside ellipse
        const normalized = (rotX * rotX) / (a * a) + (rotY * rotY) / (b * b);
        const isInside = normalized <= 1.0;
        
        // Debug log occasionally
        if (Math.random() < 0.05) {
            console.log('🖱️ Mouse at', mx.toFixed(0), my.toFixed(0), 
                       'CoG:', cx.toFixed(0), cy.toFixed(0), 
                       'normalized:', normalized.toFixed(2), 
                       'inside:', isInside);
        }
        
        return isInside;
    }
    
    /**
     * Redraw only the Hillas overlay (if overlay canvas exists)
     */
    _redrawHillasOverlay() {
        if (!this.overlay || !this.overlayCtx || !this.currentHillasParams) {
            console.log('🖱️ Cannot redraw: overlay=', !!this.overlay, 'ctx=', !!this.overlayCtx, 'params=', !!this.currentHillasParams);
            return;
        }
        
        // Clear overlay
        this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        
        // Draw Hillas only if hovering (when showHillasOnHover is true)
        if (this.showHillasOnHover) {
            if (this.isHovering) {
                console.log('✅ Drawing ellipse on hover');
                this.renderHillasOverlay(this.currentHillasParams);
            } else {
                console.log('⏸️ Hiding ellipse (not hovering)');
            }
        } else {
            // Always show if showHillasOnHover is false
            console.log('✅ Drawing ellipse (hover mode disabled)');
            this.renderHillasOverlay(this.currentHillasParams);
        }
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
        
        // Disegna griglia esagonale (honeycomb) solo per light style
        if (this.lightStyle) {
            this.drawHexagonalGrid();
        }
        
        if (this.overlayCtx) {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }
    }

    /**
     * Disegna griglia esagonale (PMT pixels)
     */
    drawHexagonalGrid() {
        const hexRadius = 8; // Raggio pixel PMT
        const hexHeight = hexRadius * Math.sqrt(3);
        const hexWidth = hexRadius * 2;
        const vertDist = hexHeight;
        const horizDist = hexWidth * 0.75;

        this.ctx.strokeStyle = '#d0d0d0'; // Grigio chiaro per le linee
        this.ctx.lineWidth = 0.5;

        // Disegna esagoni in pattern honeycomb
        for (let row = 0; row < Math.ceil(this.canvas.height / vertDist) + 2; row++) {
            for (let col = 0; col < Math.ceil(this.canvas.width / horizDist) + 2; col++) {
                const x = col * horizDist;
                const y = row * vertDist + (col % 2 === 1 ? vertDist / 2 : 0);
                
                this.drawHexagon(x, y, hexRadius);
            }
        }
        
        // Disegna bordo esagonale della camera
        this.drawCameraBorder();
    }

    /**
     * Disegna bordo esagonale della camera
     */
    drawCameraBorder() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) / 2 - 5;
        
        this.ctx.strokeStyle = '#999999'; // Grigio medio
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2; // Ruotato per avere flat-top
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    /**
     * Disegna singolo esagono
     */
    drawHexagon(cx, cy, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    /**
     * Renderizza evento con effetti glow
     */
    renderEvent(event, showLegend = true) {
        // Keep a reference to the last rendered event so UI controls can re-render live
        try { this._lastEvent = event; } catch (e) {}

        this.clear();

        // Se showEllipseOnly è attivo, disegna solo l'ellisse Hillas senza fotoni
        if (this.showEllipseOnly) {
            this.renderEllipseOnlyMode(event, showLegend);
            return;
        }

        // Ordina tracce per intensità (prima i deboli, poi i brillanti)
        const sortedTracks = [...event.tracks].sort((a, b) => a.intensity - b.intensity);

        // Render fotoni
        sortedTracks.forEach(track => {
            this.renderPhoton(track);
        });

        // Aggiungi rumore di background (solo light style)
        if (this.lightStyle && !this.suppressNoise) {
            this.renderBackgroundNoise();
        }

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
     * Renderizza evento con animazione temporale
     * Simula l'arrivo progressivo dei fotoni Cherenkov
     */
    renderEventAnimated(event, showLegend = true) {
        // Keep a reference to the last rendered event so UI controls can re-render live
        try { this._lastEvent = event; } catch (e) {}

        this.clear();
        
        // Ordina tracce per tempo di arrivo simulato
        const sortedTracks = [...event.tracks].sort((a, b) => {
            // I fotoni arrivano con timing basato su energia e posizione radiale
            const radiusA = Math.sqrt(Math.pow(a.x - event.params.centerX, 2) + Math.pow(a.y - event.params.centerY, 2));
            const radiusB = Math.sqrt(Math.pow(b.x - event.params.centerX, 2) + Math.pow(b.y - event.params.centerY, 2));
            return radiusA - radiusB; // Prima il centro, poi i bordi
        });

        const totalDuration = 2000; // 2 secondi totali
        const batchSize = Math.ceil(sortedTracks.length / 50); // 50 frame
        let currentIndex = 0;

        const renderBatch = () => {
            const batch = sortedTracks.slice(currentIndex, currentIndex + batchSize);
            
            batch.forEach(track => {
                this.renderPhoton(track);
            });

            currentIndex += batchSize;

            if (currentIndex < sortedTracks.length) {
                requestAnimationFrame(renderBatch);
            } else {
                // Animazione completata
                if (this.lightStyle) {
                    if (!this.suppressNoise) this.renderBackgroundNoise();
                }
                if (showLegend) {
                    this.colorPalette.drawEnergyLegend(this.canvas, 'top-right');
                }
                this.drawCameraInfo(event);
            }
        };

        // Inizia animazione
        requestAnimationFrame(renderBatch);
    }

    /**
     * Re-render the last event currently stored in the renderer.
     * Useful to apply live parameter changes (exposure, subpixel) without
     * regenerating the whole event.
     */
    reRenderLastEvent(showLegend = true) {
        try {
            if (this._lastEvent) {
                // Prefer non-animated re-render for immediate visual feedback
                this.renderEvent(this._lastEvent, showLegend);
            }
        } catch (e) {
            console.warn('reRenderLastEvent failed:', e);
        }
    }

    /**
     * Modalità didattica: renderizza solo ellisse Hillas (no fotoni)
     * Calcola i parametri Hillas dall'evento e disegna l'ellisse teorica
     */
    renderEllipseOnlyMode(event, showLegend = true) {
        // Sfondo nero
        this.ctx.fillStyle = '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calcola Hillas dall'evento (richiede HillasAnalyzer)
        let hillasParams = null;
        try {
            // Se disponibile usa HillasAnalyzer globale
            if (typeof HillasAnalyzer !== 'undefined') {
                const analyzer = new HillasAnalyzer();
                hillasParams = analyzer.analyze(event);
            }
        } catch (e) {
            console.warn('HillasAnalyzer not available:', e);
        }

        if (!hillasParams || !hillasParams.valid) {
            // Fallback: disegna messaggio
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px system-ui';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Modalità Ellisse: Hillas non disponibile', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        // Disegna ellisse Hillas
        const cx = hillasParams.cogX;
        const cy = hillasParams.cogY;
        const a = hillasParams.lengthPx;
        const b = hillasParams.widthPx;
        const theta = (hillasParams.theta * Math.PI / 180);

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(theta);

        // Ellisse riempita (semi-trasparente)
        this.ctx.fillStyle = 'rgba(0, 200, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, a, b, 0, 0, 2 * Math.PI);
        this.ctx.fill();

        // Ellisse outline (brillante)
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, a, b, 0, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Assi principali
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);
        // Asse maggiore
        this.ctx.beginPath();
        this.ctx.moveTo(-a, 0);
        this.ctx.lineTo(a, 0);
        this.ctx.stroke();
        // Asse minore
        this.ctx.beginPath();
        this.ctx.moveTo(0, -b);
        this.ctx.lineTo(0, b);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.restore();

        // Centro di gravità
        this.ctx.fillStyle = '#ff0055';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        this.ctx.fill();

        // Annotazioni parametri
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        const infoX = 20;
        let infoY = 30;
        this.ctx.fillText(`Length: ${hillasParams.length.toFixed(3)}° (${hillasParams.lengthPx.toFixed(1)} px)`, infoX, infoY);
        infoY += 20;
        this.ctx.fillText(`Width: ${hillasParams.width.toFixed(3)}° (${hillasParams.widthPx.toFixed(1)} px)`, infoX, infoY);
        infoY += 20;
        this.ctx.fillText(`L/W Ratio: ${hillasParams.elongation.toFixed(2)}`, infoX, infoY);
        infoY += 20;
        this.ctx.fillText(`Size: ${hillasParams.size.toFixed(0)} p.e.`, infoX, infoY);
        infoY += 20;
        this.ctx.fillText(`Alpha: ${hillasParams.alpha.toFixed(1)}°`, infoX, infoY);

        // Label modalità
        this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
        this.ctx.font = 'bold 16px system-ui';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Modalità Ellisse (solo outline)', this.canvas.width / 2, this.canvas.height - 20);

        if (showLegend) {
            this.colorPalette.drawEnergyLegend(this.canvas, 'top-right');
        }
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

        // Light style: rendering con pixel esagonali
        if (this.lightStyle) {
            this.renderPhotonHexagonal(track);
            return;
        }

        // Dark style: rendering tradizionale con glow
        const intensityFactor = Math.max(0, Math.min(1, track.intensity || 0));

        // Color mapping: combine energy and intensity, then tone-map for photographic dynamic range
        let baseRGB = this.colorPalette.getColorRGB(track.energy || this.colorPalette.minEnergy);
        try {
            const energyNorm = Math.log10(track.energy / this.colorPalette.minEnergy) /
                              Math.log10(this.colorPalette.maxEnergy / this.colorPalette.minEnergy);
            const colorT = (intensityFactor * 0.7 + energyNorm * 0.3);
            baseRGB = this.colorPalette.mapNormalized(colorT);

            // Exposure / tone-mapping -> brightness scalar in 0..1
            const exposureK = this.exposureK || 4.0; // use renderer property if available
            const brightness = this.colorPalette.toneMap(colorT, exposureK);

            // Mix intensity into final brightness for extra punch for brighter photons
            // Make exposureK have a stronger, perceptible effect:
            // exposureFactor grows ~1.2^(exposure-4) for visible amplification when slider is moved.
            const exposureFactor = Math.pow(1.18, (Math.max(0, (this.exposureK || 4.0) - 4.0)));
            const finalBrightness = Math.max(0.02, brightness * (0.7 + 0.6 * intensityFactor) * exposureFactor);

            // Apply brightness to base color
            const finalRGB = this.colorPalette.applyBrightnessToRGB(baseRGB, finalBrightness);

            // keep integer RGB for drawing
            var r = finalRGB[0];
            var g = finalRGB[1];
            var b = finalRGB[2];
        } catch (e) {
            r = baseRGB[0]; g = baseRGB[1]; b = baseRGB[2];
        }

        // Sub-pixel jitter / small deterministic pattern (kept small to avoid large offsets)
        const sinPattern = Math.sin((track.x + track.y) * 0.12) * 0.3;
        const jitterMag = this.subpixelEnabled ? (Math.random() - 0.5) * 0.6 : 0.0;
        const offsetX = sinPattern + jitterMag;
        const offsetY = Math.cos((track.x - track.y) * 0.09) * 0.28 + (this.subpixelEnabled ? (Math.random() - 0.5) * 0.5 : 0.0);

        const drawX = track.x + offsetX;
        const drawY = track.y + offsetY;

        const radius = this.intensityToRadius(track.intensity);
        const alpha = Math.min(1, track.intensity * 1.2 + 0.5);

        if (!isFinite(radius) || radius <= 0) return;

        // Glow esterno: use computed final color with alpha ramp
        // Ridotto glow radius (da 5.0 → 2.5) per rendere ellissi più definite
        const glowScale = 1 + (Math.max(0, (this.exposureK || 4.0) - 4.0)) * 0.28; // modest per-step increase
        const gradient = this.ctx.createRadialGradient(
            drawX, drawY, 0,
            drawX, drawY, radius * 2.5 * glowScale
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha * 0.75)})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha * 0.35)})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, radius * 2.5 * glowScale, 0, 2 * Math.PI);
        this.ctx.fill();

        // Core brillante
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, radius * 1.5, 0, 2 * Math.PI);
        this.ctx.fill();

        // Punto centrale ultra-brillante
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, radius * 0.5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Renderizza circoletti grigi di background (rumore/eventi cosmici)
     */
    renderBackgroundNoise() {
        if (!this.lightStyle) return;
        
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const numNoise = Math.floor(15 + Math.random() * 15); // 15-30 pixel di rumore
        const pixelRadius = 4;
        
        for (let i = 0; i < numNoise; i++) {
            const x = pixelRadius + Math.random() * (canvasW - 2 * pixelRadius);
            const y = pixelRadius + Math.random() * (canvasH - 2 * pixelRadius);
            const alpha = 0.15 + Math.random() * 0.25; // Opacità bassa 0.15-0.4
            
            // Circoletto grigio
            this.ctx.fillStyle = `rgba(120, 120, 120, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, pixelRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Bordo scuro
            this.ctx.strokeStyle = `rgba(80, 80, 80, ${alpha * 0.6})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    /**
     * Renderizza fotone con pixel esagonali (stile light)
     */
    renderPhotonHexagonal(track) {
        const intensityFactor = Math.max(0, Math.min(1, track.intensity || 0));
        
        // Parametri source-specific (default: Crab Nebula)
        let longMultiplier = 10;
        let shortMultiplier = 2.0;
        let maxPixels = 22;
        let densityMin = 0.7;
        let densityMax = 1.0;
        
        // Personalizza in base al tipo di sorgente
        switch(this.sourceType) {
            case 'pevatron': // SNR - tracce MOLTO ESTESE, SATURATE
                longMultiplier = 25;
                shortMultiplier = 5.0;
                maxPixels = 60;
                densityMin = 0.8;
                densityMax = 1.5;
                break;
            case 'blazar': // Tracce MOLTO COMPATTE, SOTTILI
                longMultiplier = 6;
                shortMultiplier = 0.8;
                maxPixels = 15;
                densityMin = 0.9;
                densityMax = 1.0;
                break;
            case 'grb': // L/W MOLTO BASSO, tracce LARGHE
                longMultiplier = 8;
                shortMultiplier = 4.0;
                maxPixels = 35;
                densityMin = 0.5;
                densityMax = 1.4;
                break;
            case 'galactic-center': // ALTA DISPERSIONE, molto irregolare
                longMultiplier = 14;
                shortMultiplier = 3.5;
                maxPixels = 45;
                densityMin = 0.2;
                densityMax = 1.8;
                break;
            default: // Crab Nebula (crab o undefined) - STANDARD
                // Usa valori di default già impostati
                break;
        }
        
        const pixelRadius = 4;
        const spreadRadiusLong = this.intensityToRadius(track.intensity) * longMultiplier;
        const spreadRadiusShort = this.intensityToRadius(track.intensity) * shortMultiplier;
        
        const densityVariation = densityMin + Math.random() * (densityMax - densityMin);
        const numPixels = Math.max(5, Math.floor(intensityFactor * maxPixels * densityVariation));
        const minDistance = pixelRadius * 3;

        const pixels = [];
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const margin = pixelRadius * 2;
        
        // Angolo casuale per orientamento della traccia ellittica
        const trackAngle = Math.random() * Math.PI * 2;
        const cosAngle = Math.cos(trackAngle);
        const sinAngle = Math.sin(trackAngle);
        
        // Genera posizioni dei pixel evitando sovrapposizioni (distribuzione ellittica)
        // Con probabilità decrescente verso l'esterno (forma affusolata)
        for (let i = 0; i < numPixels; i++) {
            let attempts = 0;
            let px, py;
            let validPosition = false;
            
            while (!validPosition && attempts < 30) {
                // Distribuzione ellittica con bias verso il centro (affusolata)
                const t = Math.random() * Math.PI * 2;
                // Uso Math.pow per concentrare i pixel al centro
                const radiusFactor = Math.pow(Math.random(), 1.8); // Esponente >1 = più concentrato al centro
                
                // Coordinate ellittiche locali
                const localX = Math.cos(t) * spreadRadiusLong * radiusFactor;
                const localY = Math.sin(t) * spreadRadiusShort * radiusFactor;
                
                // Ruota secondo trackAngle
                const rotX = localX * cosAngle - localY * sinAngle;
                const rotY = localX * sinAngle + localY * cosAngle;
                
                px = track.x + rotX;
                py = track.y + rotY;
                
                // Verifica che sia dentro i bordi del canvas
                if (px < margin || px > canvasW - margin || py < margin || py > canvasH - margin) {
                    attempts++;
                    continue;
                }
                
                // Verifica che non sia troppo vicino ad altri pixel
                validPosition = true;
                for (let existing of pixels) {
                    const dx = px - existing.x;
                    const dy = py - existing.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }
            
            if (validPosition) {
                // Intensità diminuisce con la distanza dal centro
                const dx = px - track.x;
                const dy = py - track.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = Math.sqrt(spreadRadiusLong * spreadRadiusLong + spreadRadiusShort * spreadRadiusShort) / 2;
                const distanceFactor = 1 - (distance / maxDistance);
                const pixelAlpha = Math.min(0.95, (intensityFactor * 0.5 + 0.5) * Math.pow(distanceFactor, 0.5)); // Aumentata opacità
                
                // Colore più vario: mix tra energia del fotone e posizione
                // Aggiungi variazione casuale per più diversità
                const energyVariation = Math.random() * 0.3; // ±30% variazione
                const energyNorm = Math.min(1, Math.max(0, (1 - distanceFactor) + energyVariation));
                // Apply tone-mapping/exposure to better control dynamic range even in lightStyle
                const exposureK = (typeof this.exposureK === 'number') ? this.exposureK : 4.0;
                const tone = this.colorPalette.toneMap(energyNorm, exposureK);
                let colorRGB = this.colorPalette.mapNormalized(energyNorm);

                // Brightness scalar derived from tone and intensity/distance
                // Include exposureK to make brightness differences more visible
                const exposureK_local = (typeof this.exposureK === 'number') ? this.exposureK : 4.0;
                const exposureBoost = 1 + (Math.max(0, exposureK_local - 4.0)) * 0.28; // modest boost per step
                const brightScalar = Math.max(0.04, tone * (0.6 + 0.6 * intensityFactor) * Math.pow(distanceFactor, 0.4) * exposureBoost);
                const toned = this.colorPalette.applyBrightnessToRGB(colorRGB, brightScalar);

                // Small saturation/darken tweak (keeps hue while increasing contrast)
                const darkenFactor = 0.85;
                const saturationBoost = 1.4;
                const r = Math.min(255, Math.max(0, Math.round(toned[0] * saturationBoost * darkenFactor)));
                const g = Math.min(255, Math.max(0, Math.round(toned[1] * saturationBoost * darkenFactor)));
                const b = Math.min(255, Math.max(0, Math.round(toned[2] * saturationBoost * darkenFactor)));
                
                // Apply optional sub-pixel jitter for more natural placement
                let drawX = px;
                let drawY = py;
                if (this.subpixelEnabled) {
                    drawX = px + (Math.random() - 0.5) * 0.6; // sub-pixel jitter ±0.3px
                    drawY = py + (Math.random() - 0.5) * 0.6;
                }

                pixels.push({ x: drawX, y: drawY, alpha: pixelAlpha, r, g, b, isWhite: false });
            }
        }

        // Aggiungi più pixel bianchi nella zona centrale per forma affusolata
        const numWhitePixels = Math.max(2, Math.floor(intensityFactor * 8)); // Ridotto: 2-8 pixel bianchi (era 3-12)
        for (let i = 0; i < numWhitePixels; i++) {
            let attempts = 0;
            let px, py;
            let validPosition = false;
            
            while (!validPosition && attempts < 20) {
                // Distribuzione ellittica concentrata al centro (30% interno)
                const t = Math.random() * Math.PI * 2;
                const radiusFactor = Math.pow(Math.random(), 2) * 0.4; // Molto concentrato al centro
                
                const localX = Math.cos(t) * spreadRadiusLong * radiusFactor;
                const localY = Math.sin(t) * spreadRadiusShort * radiusFactor;
                
                const rotX = localX * cosAngle - localY * sinAngle;
                const rotY = localX * sinAngle + localY * cosAngle;
                
                px = track.x + rotX;
                py = track.y + rotY;
                
                if (px < margin || px > canvasW - margin || py < margin || py > canvasH - margin) {
                    attempts++;
                    continue;
                }
                
                validPosition = true;
                for (let existing of pixels) {
                    const dx = px - existing.x;
                    const dy = py - existing.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }
            
            if (validPosition) {
                const pixelAlpha = 0.75 + Math.random() * 0.25; // 0.75-1.0 (più brillanti)
                let drawX = px;
                let drawY = py;
                if (this.subpixelEnabled) {
                    drawX = px + (Math.random() - 0.5) * 0.6;
                    drawY = py + (Math.random() - 0.5) * 0.6;
                }
                pixels.push({ x: drawX, y: drawY, alpha: pixelAlpha, r: 255, g: 255, b: 255, isWhite: true });
            }
        }

        // Disegna i pixel separati con colori diversi
        pixels.forEach(pixel => {
            // Cerchio pieno colorato o bianco
            this.ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(pixel.x, pixel.y, pixelRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Bordo scuro per definizione
            this.ctx.strokeStyle = `rgba(50, 50, 50, ${pixel.alpha * 0.5})`;
            this.ctx.lineWidth = pixel.isWhite ? 2 : 1.5;
            this.ctx.stroke();
        });

        // Pixel centrale più brillante (giallo/bianco - massima energia)
    // Central core color uses tone-mapped palette for consistency
    const centerEnergyNorm = 0; // max energy mapping index in mapNormalized
    const centerTone = this.colorPalette.toneMap(centerEnergyNorm, this.exposureK || 4.0);
    const centerColor = this.colorPalette.mapNormalized(centerEnergyNorm);
    // Boost central core brightness when exposure is high so it's easier to spot
    const centerBoost = 1 + (Math.max(0, (this.exposureK || 4.0) - 4.0)) * 0.35;
    const centerRGB = this.colorPalette.applyBrightnessToRGB(centerColor, Math.max(0.5, centerTone * (0.9 + 0.6 * intensityFactor) * centerBoost));

    const cr = Math.min(255, Math.round(centerRGB[0] + 32));
    const cg = Math.min(255, Math.round(centerRGB[1] + 32));
    const cb = Math.min(255, Math.round(centerRGB[2] + 32));

    this.ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(1, intensityFactor * 1.15)})`;
        this.ctx.beginPath();
        this.ctx.arc(track.x, track.y, pixelRadius * 1.4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = `rgba(50, 50, 50, 0.7)`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Converte intensità in raggio (ridotto per ellissi più definite)
     */
    intensityToRadius(intensity) {
        if (typeof intensity !== 'number' || !isFinite(intensity)) {
            console.warn('⚠️ Intensity non valida:', intensity);
            return 3.0; // Valore di default ridotto
        }
        // Ridotto da 5.0 + intensity * 10.0 → 2.0 + intensity * 5.0 per fotoni più piccoli e ellissi più visibili
        return 2.0 + intensity * 5.0;
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
        // Show current exposure and subpixel settings for immediate feedback
        try {
            const exp = (typeof this.exposureK === 'number') ? this.exposureK.toFixed(1) : '4.0';
            const sp = !!this.subpixelEnabled ? 'ON' : 'OFF';
            this.ctx.fillStyle = 'rgba(255, 230, 180, 0.95)';
            this.ctx.font = '12px "Courier New", monospace';
            this.ctx.fillText(`Exposure: ${exp}`, 20, 82);
            this.ctx.fillText(`Sub-pixel: ${sp}`, 20, 98);
        } catch (e) {
            // ignore drawing errors
        }
    }

    /**
     * Renderizza parametri Hillas su overlay
     */
    renderHillasOverlay(hillasParams) {
        if (!this.overlayCtx || !hillasParams || !hillasParams.valid) return;

        // Store current Hillas params for hover detection
        this.currentHillasParams = hillasParams;
        
        // If showHillasOnHover is enabled, only draw when hovering
        if (this.showHillasOnHover && !this.isHovering) {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            return;
        }

        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

        const centerX = hillasParams.cogX;
        const centerY = hillasParams.cogY;
        const theta = hillasParams.theta * Math.PI / 180;

        console.log(`🎨 Rendering Hillas: CoG(${centerX.toFixed(1)}, ${centerY.toFixed(1)}), Canvas: ${this.overlay.width}×${this.overlay.height}`);

        // Ellisse Hillas - bordeaux scuro per light style, verde per dark style
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(theta);

        // By default use the computed semi-axes
        let displayLengthPx = hillasParams.lengthPx;
        let displayWidthPx = hillasParams.widthPx;

        // For lightStyle the renderer previously enlarged the minor axis for visibility.
        // If respectExactHillas is true we override that behaviour and use the exact values
        // computed by the Hillas analyzer to ensure geometric adherence.
        if (!this.respectExactHillas) {
            if (this.lightStyle) {
                displayWidthPx = Math.max(hillasParams.widthPx * 3, hillasParams.lengthPx * 0.2);  // Min 20% della lunghezza
            }
        }

        // Colore più scuro e contrastante per light style
        ctx.strokeStyle = this.lightStyle ? '#cc0066' : '#00ff88';  // Bordeaux scuro per light style
        ctx.lineWidth = 4; // Aumentato ulteriormente per massima visibilità
        ctx.beginPath();
        ctx.ellipse(0, 0, displayLengthPx, displayWidthPx, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Assi
        ctx.strokeStyle = this.lightStyle ? '#cc0066' : '#ffaa00';  // Stesso bordeaux scuro
        ctx.lineWidth = 2.5; // Aumentato per maggiore visibilità
        // Asse maggiore
        ctx.beginPath();
        ctx.moveTo(-displayLengthPx, 0);
        ctx.lineTo(displayLengthPx, 0);
        ctx.stroke();
        // Asse minore
        ctx.beginPath();
        ctx.moveTo(0, -displayWidthPx);
        ctx.lineTo(0, displayWidthPx);
        ctx.stroke();

        ctx.restore();

        // Centro di gravità - più grande e contrastante
        ctx.fillStyle = this.lightStyle ? '#cc0066' : '#ff0055';  // Bordeaux scuro
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);  // Aumentato da 6 a 8
        ctx.fill();
        ctx.strokeStyle = this.lightStyle ? '#ffffff' : '#ffffff';  // Bordo bianco sempre
        ctx.lineWidth = 3;  // Aumentato da 2
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
        // Diagnostic: draw camera center marker and log offset when exact-hillas mode is enabled
        try {
            const dx = centerX - cameraCenterX;
            const dy = centerY - cameraCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (this.respectExactHillas) {
                console.log(`🔎 HillasOverlay: CoG(${centerX.toFixed(1)},${centerY.toFixed(1)}), CameraCenter(${cameraCenterX.toFixed(1)},${cameraCenterY.toFixed(1)}), Δ=(${dx.toFixed(1)},${dy.toFixed(1)}) px, r=${dist.toFixed(1)} px, canvas=${this.overlay.width}x${this.overlay.height}`);
            }

            // Draw a prominent marker at camera center for visual inspection
            ctx.save();
            // Filled circle for high contrast
            ctx.fillStyle = '#ffff66';
            ctx.beginPath();
            ctx.arc(cameraCenterX, cameraCenterY, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Outer ring
            ctx.strokeStyle = '#222200';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cameraCenterX, cameraCenterY, 10, 0, 2 * Math.PI);
            ctx.stroke();

            // Large cross for visibility
            ctx.strokeStyle = this.lightStyle ? '#ffff00' : '#ffee00';
            ctx.lineWidth = 3;
            const s = 18;
            ctx.beginPath();
            ctx.moveTo(cameraCenterX - s, cameraCenterY);
            ctx.lineTo(cameraCenterX + s, cameraCenterY);
            ctx.moveTo(cameraCenterX, cameraCenterY - s);
            ctx.lineTo(cameraCenterX, cameraCenterY + s);
            ctx.stroke();
            ctx.restore();
            // --- Also draw camera center and CoG marker on the main canvas for visual comparison ---
            try {
                if (this.ctx) {
                    const main = this.ctx;
                    // small translucent marker at camera center on main canvas
                    main.save();
                    main.strokeStyle = 'rgba(255, 255, 102, 0.9)';
                    main.fillStyle = 'rgba(255, 255, 102, 0.25)';
                    main.lineWidth = 2;
                    main.beginPath();
                    main.arc(cameraCenterX, cameraCenterY, 6, 0, 2 * Math.PI);
                    main.fill();
                    main.stroke();

                    // cross
                    main.beginPath();
                    main.moveTo(cameraCenterX - 12, cameraCenterY);
                    main.lineTo(cameraCenterX + 12, cameraCenterY);
                    main.moveTo(cameraCenterX, cameraCenterY - 12);
                    main.lineTo(cameraCenterX, cameraCenterY + 12);
                    main.stroke();

                    // Draw CoG position on main canvas (magenta)
                    main.fillStyle = 'rgba(204, 0, 102, 0.95)';
                    main.strokeStyle = 'rgba(255,255,255,0.9)';
                    main.lineWidth = 2;
                    main.beginPath();
                    main.arc(centerX, centerY, 6, 0, 2 * Math.PI);
                    main.fill();
                    main.stroke();
                    main.restore();
                }
            } catch (e) {
                // ignore
            }
// === FUNZIONI UTILITY ===
        } catch (e) {
            console.warn('Errore diagnostico HillasOverlay:', e);
        }
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
                
                // Tonemap: sqrt for better visibility then apply exposure/gamma
                v = Math.sqrt(Math.max(0, v));
                v = Math.min(1, v / opts.normMax);

                // Apply palette tone mapping (exposure) then map to RGB and apply brightness
                const exposureK = opts.exposureK || 4.0;
                const vTone = palette.toneMap(v, exposureK);
                let col = palette.mapNormalized(vTone);
                const brightScalar = Math.max(0.04, vTone * 1.1);
                col = palette.applyBrightnessToRGB(col, brightScalar);

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

// If pages haven't loaded navigation.js, provide a lightweight addExposureControls helper here
if (typeof window !== 'undefined' && typeof window.addExposureControls !== 'function') {
    window.addExposureControls = function(renderers, generateBtn) {
        try {
            const controlsContainer = document.createElement('div');
            controlsContainer.style.display = 'flex';
            controlsContainer.style.alignItems = 'center';
            controlsContainer.style.gap = '12px';
            controlsContainer.style.marginTop = '10px';

            const expLabel = document.createElement('label');
            expLabel.style.color = '#ffffff';
            expLabel.style.fontFamily = '"Courier New", monospace';
            expLabel.style.fontSize = '13px';
            expLabel.textContent = 'Exposure:';

            const expValue = document.createElement('span');
            expValue.style.color = '#ffd966';
            expValue.style.marginLeft = '6px';
            expValue.style.minWidth = '44px';
            expValue.textContent = (renderers[0] && renderers[0].exposureK) ? renderers[0].exposureK.toFixed(1) : '4.0';

            const expSlider = document.createElement('input');
            expSlider.type = 'range';
            expSlider.min = '1.0';
            expSlider.max = '8.0';
            expSlider.step = '0.1';
            expSlider.value = (renderers[0] && renderers[0].exposureK) ? renderers[0].exposureK : 4.0;
            expSlider.style.width = '220px';
            expSlider.addEventListener('input', (ev) => {
                const v = parseFloat(ev.target.value);
                expValue.textContent = v.toFixed(1);
                renderers.forEach(r => { r.exposureK = v; try { if (typeof r.reRenderLastEvent === 'function') r.reRenderLastEvent(); } catch(e) {} });
                console.log('🔧 exposureK set to', v);
            });

            const spLabel = document.createElement('label');
            spLabel.style.color = '#ffffff';
            spLabel.style.fontFamily = '"Courier New", monospace';
            spLabel.style.fontSize = '13px';
            spLabel.style.marginLeft = '8px';
            spLabel.textContent = 'Sub-pixel:';

            const spCheckbox = document.createElement('input');
            spCheckbox.type = 'checkbox';
            spCheckbox.checked = (renderers[0] && !!renderers[0].subpixelEnabled);
            spCheckbox.style.marginLeft = '6px';
            spCheckbox.addEventListener('change', (ev) => {
                const enabled = !!ev.target.checked;
                renderers.forEach(r => { r.subpixelEnabled = enabled; try { if (typeof r.reRenderLastEvent === 'function') r.reRenderLastEvent(); } catch(e) {} });
                console.log('🔧 subpixelEnabled set to', enabled);
            });

            // NEW: Ellipse-only checkbox
            const ellLabel = document.createElement('label');
            ellLabel.style.color = '#ffffff';
            ellLabel.style.fontFamily = '"Courier New", monospace';
            ellLabel.style.fontSize = '13px';
            ellLabel.style.marginLeft = '12px';
            ellLabel.textContent = 'Solo Ellisse:';

            const ellCheckbox = document.createElement('input');
            ellCheckbox.type = 'checkbox';
            ellCheckbox.checked = (renderers[0] && !!renderers[0].showEllipseOnly);
            ellCheckbox.style.marginLeft = '6px';
            ellCheckbox.addEventListener('change', (ev) => {
                const enabled = !!ev.target.checked;
                renderers.forEach(r => { r.showEllipseOnly = enabled; try { if (typeof r.reRenderLastEvent === 'function') r.reRenderLastEvent(); } catch(e) {} });
                console.log('🔧 showEllipseOnly set to', enabled);
            });

            // NEW: Hillas on hover checkbox
            const hoverLabel = document.createElement('label');
            hoverLabel.style.color = '#ffffff';
            hoverLabel.style.fontFamily = '"Courier New", monospace';
            hoverLabel.style.fontSize = '13px';
            hoverLabel.style.marginLeft = '12px';
            hoverLabel.textContent = 'Hillas su Hover:';

            const hoverCheckbox = document.createElement('input');
            hoverCheckbox.type = 'checkbox';
            hoverCheckbox.checked = (renderers[0] && !!renderers[0].showHillasOnHover);
            hoverCheckbox.style.marginLeft = '6px';
            hoverCheckbox.addEventListener('change', (ev) => {
                const enabled = !!ev.target.checked;
                renderers.forEach(r => { 
                    r.showHillasOnHover = enabled; 
                    if (!enabled) {
                        // If disabling hover mode, force show ellipse immediately
                        r.isHovering = true;
                        try { if (typeof r._redrawHillasOverlay === 'function') r._redrawHillasOverlay(); } catch(e) {}
                    } else {
                        // If enabling hover mode, hide ellipse until hover
                        r.isHovering = false;
                        try { if (typeof r._redrawHillasOverlay === 'function') r._redrawHillasOverlay(); } catch(e) {}
                    }
                });
                console.log('🔧 showHillasOnHover set to', enabled);
            });

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.appendChild(expLabel);
            left.appendChild(expValue);
            left.appendChild(expSlider);

            const right = document.createElement('div');
            right.style.display = 'flex';
            right.style.alignItems = 'center';
            right.appendChild(spLabel);
            right.appendChild(spCheckbox);
            right.appendChild(ellLabel);
            right.appendChild(ellCheckbox);
            right.appendChild(hoverLabel);
            right.appendChild(hoverCheckbox);

            controlsContainer.appendChild(left);
            controlsContainer.appendChild(right);

            // Compact explanatory label (fallback)
            (function() {
                const help = document.createElement('span');
                help.style.fontFamily = '"Courier New", monospace';
                help.style.fontSize = '12px';
                help.style.color = '#dfe9ff';
                help.style.marginLeft = '8px';
                help.style.maxWidth = '420px';
                help.textContent = 'Exposure: regola luminosità e glow (consigliato 2–6).';
                help.title = 'Exposure: regola luminosità e dimensione del glow attorno ai fotoni. Sub-pixel attiva un leggero jitter per migliorare la texture.';
                controlsContainer.appendChild(help);
            })();

            if (generateBtn && generateBtn.parentNode) {
                generateBtn.parentNode.insertBefore(controlsContainer, generateBtn.nextSibling);
            } else {
                document.body.appendChild(controlsContainer);
            }
        } catch (e) {
            console.warn('Errore in addExposureControls (visualization fallback):', e);
        }
    };
}
