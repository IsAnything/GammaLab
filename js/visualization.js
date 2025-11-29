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
        ctx.fillRect(x - 5, y - 25, width + 10, height + 85);

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

        ctx.fillStyle = '#dfe9ff';
        ctx.font = '9px "Courier New", monospace';
        ctx.fillText('Core brillante = fotoni ad alta energia', x, y + height + 30);
        ctx.fillText('Asse verde → Blazar | Code verdi → GRB', x, y + height + 42);
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
        this.sourceType = null;
        this.signatureHint = '';
        this._signatureHintEl = null;
        this._signatureHintTextEl = null;
        this._cameraInfoEl = null;
        this._ensureSignatureHintElement();
        this._ensureCameraInfoElement();
        this.signatureHintsEnabled = true;
        this.embedHillasOutline = true;
        this._embeddedHillasParams = null;
        this._embeddingReRender = false;
        this._lastShowLegend = true;
        
        // NEW: Light style flag (default: false = dark theme)
        this.lightStyle = false;
        // When true the renderer will suppress background noise (useful for clean quiz images)
        this.suppressNoise = false;
        // If true, renderer will draw Hillas ellipses using the exact computed semi-axes
        // (useful for quizzes where geometric adherence is required)
    this.respectExactHillas = true;
        // If true, allow sub-pixel placement / small jitter for photon's positions
        // improves realism by avoiding integer-only placement
    this.subpixelEnabled = false;
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

        // Store last event for re-rendering
        this._lastEvent = null;

        // Alpha label placement customization
        this.alphaLabelConfig = {
            mode: 'midpoint', // 'midpoint' keeps label along CoG-camera axis
            alongOffset: 12,
            midpointYOffset: 0,
            alongFraction: 0.5,
            lateralOffset: 48,
            textAlign: 'left'
        };

        // Camera reference marker customization
        this.alphaReferenceConfig = {
            cameraMarkerMode: 'center',
            cameraMarkerOffset: 0,
            cameraMarkerRadius: 6,
            markerClampPadding: 18,
            drawCameraCenterCross: false,
            cameraCenterCrossSize: 12,
            showAlphaArc: false,
            arcRadiusPx: null,
            arcColor: null,
            arcLineWidth: 2.2
        };

        // Optional direction guides for alpha visualization
        this.alphaDirectionGuides = {
            enabled: false,
            majorAxisColor: 'rgba(255, 190, 0, 0.95)',
            cameraRayColor: 'rgba(130, 220, 255, 0.95)',
            lineWidth: 2.2,
            arrowSize: 10,
            majorAxisLengthPx: null,
            cameraRayExtensionPx: 25,
            cameraRayLengthPx: null,
            cameraRayBacktrackPx: 0,
            cameraRayDash: [8, 6],
            majorAxisDash: [12, 6]
        };

        this.hoverZoomConfig = {
            enabled: false,
            scale: 1.9,
            radiusPx: null,
            offsetX: 0,
            offsetY: 0,
            borderColor: 'rgba(255, 255, 255, 0.85)',
            borderWidth: 2.2,
            overlayFill: 'rgba(0, 0, 0, 0.25)',
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowBlur: 18,
            showLabel: true,
            showAlphaArc: false,
            arcColor: null,
            arcLineWidth: 2.2
        };

        this.hoverZoomManual = {
            active: false,
            x: -1,
            y: -1
        };

        this._hoverLensGeometry = null;
        this._hoverZoomHiddenUntilReset = false;
    }

    configureAlphaLabelPlacement(options = {}) {
        if (!this.alphaLabelConfig) {
            this.alphaLabelConfig = {};
        }
        this.alphaLabelConfig = {
            ...this.alphaLabelConfig,
            ...options
        };
    }

    configureAlphaReferenceMarkers(options = {}) {
        if (!this.alphaReferenceConfig) {
            this.alphaReferenceConfig = {};
        }
        this.alphaReferenceConfig = {
            ...this.alphaReferenceConfig,
            ...options
        };
    }

    configureAlphaDirectionGuides(options = {}) {
        if (!this.alphaDirectionGuides) {
            this.alphaDirectionGuides = {};
        }
        this.alphaDirectionGuides = {
            ...this.alphaDirectionGuides,
            ...options
        };
    }

    configureHoverZoom(options = {}) {
        if (!this.hoverZoomConfig) {
            this.hoverZoomConfig = {};
        }
        this.hoverZoomConfig = {
            ...this.hoverZoomConfig,
            ...options
        };
    }

    _clampHoverZoomFocus(x, y) {
        if (!this.canvas) {
            return { x, y };
        }
        const cfg = this.hoverZoomConfig || {};
        const canvasWidth = this.canvas.width || 0;
        const canvasHeight = this.canvas.height || 0;
        const fallbackRadius = Math.min(canvasWidth, canvasHeight) * 0.25;
        const lensRadius = Number.isFinite(cfg.radiusPx) ? cfg.radiusPx : fallbackRadius;
        const padding = cfg.edgePadding ?? 4;
        const minX = lensRadius + padding;
        const maxX = Math.max(minX, canvasWidth - lensRadius - padding);
        const minY = lensRadius + padding;
        const maxY = Math.max(minY, canvasHeight - lensRadius - padding);
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    }

    lockHoverZoom(x, y) {
        if (!this.hoverZoomManual) {
            this.hoverZoomManual = {};
        }
        const clamped = this._clampHoverZoomFocus(x, y);
        this.hoverZoomManual.active = true;
        this.hoverZoomManual.x = clamped.x;
        this.hoverZoomManual.y = clamped.y;
        this.mouseX = clamped.x;
        this.mouseY = clamped.y;
        this.isHovering = true;
        this._hoverZoomHiddenUntilReset = false;
        if (this.hoverZoomConfig) {
            this.hoverZoomConfig.enabled = true;
        }
        this.refreshHillasOverlay();
    }

    unlockHoverZoom() {
        if (!this.hoverZoomManual) {
            this.hoverZoomManual = {};
        }
        this.hoverZoomManual.active = false;
        this.hoverZoomManual.x = -1;
        this.hoverZoomManual.y = -1;
        this.mouseX = -1;
        this.mouseY = -1;
        this.isHovering = false;
        this._hoverLensGeometry = null;
        this._hoverZoomHiddenUntilReset = false;
        this.refreshHillasOverlay();
    }

    isHoverZoomLocked() {
        return !!(this.hoverZoomManual && this.hoverZoomManual.active);
    }

    getHoverZoomFocus() {
        if (this.hoverZoomManual && this.hoverZoomManual.active) {
            return { x: this.hoverZoomManual.x, y: this.hoverZoomManual.y };
        }
        return null;
    }

    getHoverZoomLensGeometry() {
        if (!this._hoverLensGeometry) {
            return null;
        }
        return { ...this._hoverLensGeometry };
    }

    hideHoverZoomUntilExit() {
        const lensLocked = this.isHoverZoomLocked && this.isHoverZoomLocked();
        if (!this.showHillasOnHover || !this.isHovering || lensLocked) {
            return;
        }
        if (this._hoverZoomHiddenUntilReset) {
            return;
        }
        this._hoverZoomHiddenUntilReset = true;
        this.refreshHillasOverlay();
    }

    enableHoverHillasMode() {
        this.showHillasOnHover = true;
        this.embedHillasOutline = false;
        this.showEllipseOnly = false;
        this.respectExactHillas = true;
        this.subpixelEnabled = false;
        if (typeof this.setSignatureHintsEnabled === 'function') {
            this.setSignatureHintsEnabled(false);
        } else {
            this.signatureHintsEnabled = false;
        }
        this.signatureHint = '';
        if (this.overlay && this.overlay.style) {
            this.overlay.style.pointerEvents = 'none';
        }
    }
    
    /**
     * Setup mouse event listeners for hover detection
     */
    _setupMouseListeners() {
        if (!this.canvas) return;

        const listenTarget = this.canvas;

        // Handler unificato per mouse e touch
        const handleMove = (clientX, clientY) => {
            if (!this.showHillasOnHover || !this.currentHillasParams) {
                return;
            }

            if (this.isHoverZoomLocked && this.isHoverZoomLocked()) {
                return;
            }

            const rect = listenTarget.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;

            this.mouseX = x;
            this.mouseY = y;

            // Aumenta leggermente il margine di tolleranza per il touch
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const margin = isTouch ? 1.4 : 1.15;
            const hovering = this._isPointInsideHillas(x, y, this.currentHillasParams, margin);

            if (this._hoverZoomHiddenUntilReset && !hovering) {
                this._hoverZoomHiddenUntilReset = false;
            }

            if (hovering !== this.isHovering) {
                this.isHovering = hovering;
                this._redrawHillasOverlay();
            }
        };

        const handleExit = () => {
            if (!this.showHillasOnHover) {
                return;
            }

            if (this.isHoverZoomLocked && this.isHoverZoomLocked()) {
                return;
            }
            if (this.isHovering) {
                this.isHovering = false;
                this.mouseX = -1;
                this.mouseY = -1;
                this._redrawHillasOverlay();
            }
            this._hoverZoomHiddenUntilReset = false;
        };

        // Mouse events
        listenTarget.addEventListener('mousemove', (ev) => {
            handleMove(ev.clientX, ev.clientY);
        });

        listenTarget.addEventListener('mouseleave', () => {
            handleExit();
        });

        // Touch events (per mobile)
        listenTarget.addEventListener('touchstart', (ev) => {
            // Previene lo scroll solo se stiamo toccando l'ellisse (opzionale, qui preveniamo sempre per interattività fluida)
            // ev.preventDefault(); 
            if (ev.touches.length > 0) {
                handleMove(ev.touches[0].clientX, ev.touches[0].clientY);
            }
        }, { passive: true });

        listenTarget.addEventListener('touchmove', (ev) => {
            // Previene lo scroll durante l'interazione con il canvas
            if (ev.cancelable) ev.preventDefault();
            if (ev.touches.length > 0) {
                handleMove(ev.touches[0].clientX, ev.touches[0].clientY);
            }
        }, { passive: false });

        // Su mobile, NON chiamiamo handleExit su touchend per mantenere lo zoom attivo ("sticky")
        // Lo zoom sparirà solo se l'utente tocca fuori dall'ellisse (gestito da touchstart successivo)
        // o se clicca per chiudere (gestito da navigation.js)
        listenTarget.addEventListener('touchend', (ev) => {
            // Opzionale: prevenire click fantasma
            if (ev.cancelable) ev.preventDefault();
        });
    }

    _ensureSignatureHintElement() {
        if (this._signatureHintEl || !this.canvas) return;

        const parent = this.canvas.parentElement;
        if (!parent) return;

        if (!parent.style.position) {
            parent.style.position = 'relative';
        }

        const container = document.createElement('div');
        container.className = 'signature-hint-badge';
        container.style.display = 'none';
        container.style.alignItems = 'center';
        container.style.borderRadius = '999px';
        container.style.boxShadow = '0 10px 25px rgba(10, 25, 50, 0.35)';
        container.style.fontFamily = '"Courier New", monospace';
        container.style.fontSize = '12px';
        container.style.marginBottom = '10px';
        container.style.zIndex = '2';

        const badge = document.createElement('span');
        badge.textContent = 'Firma sorgente';
        badge.style.textTransform = 'uppercase';
        badge.style.fontWeight = '700';
        badge.style.letterSpacing = '0.04em';
        badge.style.fontSize = '11px';
        badge.style.padding = '3px 10px';
        badge.style.borderRadius = '8px';
        badge.style.background = 'rgba(80, 170, 255, 0.22)';
        const text = document.createElement('span');
        text.style.fontSize = '12px';
        text.style.lineHeight = '1.45';
        text.style.maxWidth = '360px';

        container.appendChild(badge);
        container.appendChild(text);

        parent.insertBefore(container, parent.firstChild);

        this._signatureHintEl = container;
        this._signatureHintTextEl = text;
    }

    setSignatureHintsEnabled(enabled) {
        this.signatureHintsEnabled = !!enabled;
        if (!this.signatureHintsEnabled) {
            if (this._signatureHintEl) {
                this._signatureHintEl.style.display = 'none';
            }
        } else {
            this._updateSignatureHint();
        }
    }

    _ensureCameraInfoElement() {
        if (this._cameraInfoEl || !this.canvas) return;

        const parent = this.canvas.parentElement;
        if (!parent) return;

        if (!parent.style.position) {
            parent.style.position = 'relative';
        }

        const info = document.createElement('div');
        info.className = 'camera-info-overlay';
        info.style.position = 'absolute';
        info.style.top = '-10px';
        info.style.left = '-10px';
        info.style.padding = '8px 12px';
        info.style.background = 'rgba(6, 14, 28, 0.78)';
        info.style.backdropFilter = 'blur(10px)';
        info.style.borderRadius = '14px';
        info.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35)';
        info.style.color = '#f4f9ff';
        info.style.fontFamily = '"Courier New", monospace';
        info.style.fontSize = '12px';
        info.style.lineHeight = '1.5';
        info.style.zIndex = '3';
        info.style.minWidth = '140px';
        info.style.pointerEvents = 'none';
        info.style.whiteSpace = 'nowrap';
        info.style.display = 'none';

        parent.appendChild(info);
        this._cameraInfoEl = info;
    }

    _updateSignatureHint() {
        if (!this._signatureHintEl) {
            this._ensureSignatureHintElement();
        }
        if (!this._signatureHintEl || !this._signatureHintTextEl) return;

        if (!this.signatureHintsEnabled) {
            this._signatureHintEl.style.display = 'none';
            return;
        }

        const text = (this.signatureHint || '').trim();
        if (text) {
            this._signatureHintTextEl.textContent = text;
            this._signatureHintEl.style.display = 'inline-flex';
        } else {
            this._signatureHintTextEl.textContent = '';
            this._signatureHintEl.style.display = 'none';
        }
    }

    _updateCameraInfoOverlay(event) {
        if (!this._cameraInfoEl) {
            this._ensureCameraInfoElement();
        }
        if (!this._cameraInfoEl) return;

        if (!event) {
            this._cameraInfoEl.style.display = 'none';
            this._cameraInfoEl.textContent = '';
            return;
        }

        const energyTeV = event.energy ? (event.energy / 1000).toFixed(2) : '—';
        const photons = event.tracks ? event.tracks.length : '—';
        const camId = event.cameraId ? `Camera ${event.cameraId}` : 'Camera';

        const highlightColor = this.lightStyle ? '#0d2344' : '#0a1731';
        const textColor = this.lightStyle ? '#102645' : '#f4f9ff';
        const badgeColor = this.lightStyle ? '#284a8b' : '#6ab8ff';

        this._cameraInfoEl.style.background = this.lightStyle
            ? 'rgba(245, 249, 255, 0.92)'
            : 'rgba(6, 14, 28, 0.78)';
        this._cameraInfoEl.style.color = textColor;

        this._cameraInfoEl.innerHTML = `
            <div style="font-weight:700; text-transform:uppercase; letter-spacing:0.05em; font-size:11px; color:${badgeColor}; margin-bottom:4px;">${camId}</div>
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span>Energia: <span style="color:${highlightColor}; font-weight:600;">${energyTeV} TeV</span></span>
                <span>Fotoni: <span style="color:${highlightColor}; font-weight:600;">${photons}</span></span>
            </div>
        `;

        this._cameraInfoEl.style.display = 'block';
    }

    _traceHexPath(ctx, width, height, radius) {
        const centerX = width / 2;
        const centerY = height / 2;
        const startAngle = -Math.PI / 3; // flat-top orientation (horizontal upper edge)

        for (let i = 0; i < 6; i++) {
            const angle = startAngle + i * (Math.PI / 3);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
    }

    _roundedRectPath(ctx, x, y, width, height, radius = 4) {
        if (!ctx) return;
        const r = Math.min(radius, width / 2, height / 2);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
    }

    _getHexRadius(width, height, inset = 0) {
        const base = Math.min(width, height) / 2 - 5;
        return Math.max(0, base - inset);
    }

    _withHexClip(callback, inset = 3) {
        if (!this.ctx || typeof callback !== 'function') return;
        const radius = this._getHexRadius(this.canvas.width, this.canvas.height, inset);
        if (radius <= 0) {
            callback();
            return;
        }

        this.ctx.save();
        this.ctx.beginPath();
        this._traceHexPath(this.ctx, this.canvas.width, this.canvas.height, radius);
        this.ctx.clip();
        try {
            callback();
        } finally {
            this.ctx.restore();
        }
    }

    _withOverlayHexClip(callback, inset = 3) {
        if (!this.overlayCtx || !this.overlay || typeof callback !== 'function') {
            if (typeof callback === 'function') callback();
            return;
        }

        const radius = this._getHexRadius(this.overlay.width, this.overlay.height, inset);
        if (radius <= 0) {
            callback();
            return;
        }

        this.overlayCtx.save();
        this.overlayCtx.beginPath();
        this._traceHexPath(this.overlayCtx, this.overlay.width, this.overlay.height, radius);
        this.overlayCtx.clip();
        try {
            callback();
        } finally {
            this.overlayCtx.restore();
        }
    }

    _isPointInsideHillas(x, y, hillas, threshold = 1.15) {
        if (!hillas || !hillas.valid) return false;

        const a = Math.max(hillas.lengthPx || 0, 1);
        const b = Math.max(hillas.widthPx || 0, 1);
        const theta = (hillas.theta || 0) * Math.PI / 180;

        const dx = x - hillas.cogX;
        const dy = y - hillas.cogY;

        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const xr = dx * cosT + dy * sinT;
        const yr = -dx * sinT + dy * cosT;

        const normalized = (xr * xr) / (a * a) + (yr * yr) / (b * b);
        return normalized <= threshold; 
    }

    _computePhotonCentroid(tracks) {
        if (!tracks || !tracks.length) {
            return null;
        }

        let sumW = 0;
        let sumX = 0;
        let sumY = 0;

        tracks.forEach(track => {
            if (!track) return;
            const weight = Number.isFinite(track.intensity) ? Math.max(track.intensity, 0.0001) : 1;
            const x = Number.isFinite(track.x) ? track.x : 0;
            const y = Number.isFinite(track.y) ? track.y : 0;
            sumW += weight;
            sumX += x * weight;
            sumY += y * weight;
        });

        if (sumW <= 0) {
            return null;
        }

        return {
            x: sumX / sumW,
            y: sumY / sumW
        };
    }

    _computePhotonCovariance(tracks, centroid) {
        if (!centroid || !tracks || tracks.length < 2) {
            return null;
        }

        let sumW = 0;
        let sumXX = 0;
        let sumYY = 0;
        let sumXY = 0;

        tracks.forEach(track => {
            if (!track) return;
            const weight = Number.isFinite(track.intensity) ? Math.max(track.intensity, 0.0001) : 1;
            const x = Number.isFinite(track.x) ? track.x : centroid.x;
            const y = Number.isFinite(track.y) ? track.y : centroid.y;
            const dx = x - centroid.x;
            const dy = y - centroid.y;
            sumW += weight;
            sumXX += weight * dx * dx;
            sumYY += weight * dy * dy;
            sumXY += weight * dx * dy;
        });

        if (sumW <= 0) {
            return null;
        }

        return {
            xx: sumXX / sumW,
            yy: sumYY / sumW,
            xy: sumXY / sumW,
            weight: sumW
        };
    }

    _getPixelToDegreeFactor() {
        const widthPx = (this._lastEvent && this._lastEvent.canvasWidth) || (this.canvas && this.canvas.width);
        if (!widthPx || !isFinite(widthPx) || widthPx <= 0) {
            return null;
        }

        const DEFAULT_FOV_DEG = 15;
        return DEFAULT_FOV_DEG / widthPx;
    }

    _fitEllipseToPhotonCluster(hillas, tracks) {
        if (!hillas || !hillas.valid || !tracks || tracks.length < 3) {
            return hillas;
        }

        const centroid = this._computePhotonCentroid(tracks);
        if (!centroid) {
            return hillas;
        }

        const covariance = this._computePhotonCovariance(tracks, centroid);
        if (!covariance) {
            return {
                ...hillas,
                cogX: centroid.x,
                cogY: centroid.y
            };
        }

        const trace = covariance.xx + covariance.yy;
        const det = covariance.xx * covariance.yy - covariance.xy * covariance.xy;
        const sqrtDisc = Math.sqrt(Math.max(0, Math.pow(trace / 2, 2) - det));
        let lambdaMajor = trace / 2 + sqrtDisc;
        let lambdaMinor = trace / 2 - sqrtDisc;

        if (!isFinite(lambdaMajor) || lambdaMajor <= 0) {
            lambdaMajor = Math.max(lambdaMinor, 1);
        }
        if (!isFinite(lambdaMinor) || lambdaMinor <= 0) {
            lambdaMinor = Math.min(lambdaMajor, 0.5);
        }

        if (lambdaMajor < lambdaMinor) {
            const tmp = lambdaMajor;
            lambdaMajor = lambdaMinor;
            lambdaMinor = tmp;
        }

        const sigmaMajor = Math.sqrt(Math.max(lambdaMajor, 1e-4));
        const sigmaMinor = Math.sqrt(Math.max(lambdaMinor, 1e-4));
        const majorScale = 2.35;
        const minorScale = 2.0;
        const lengthPx = Math.max(sigmaMajor * majorScale, 6);
        const widthPx = Math.max(sigmaMinor * minorScale, 4);

        const thetaRad = 0.5 * Math.atan2(2 * covariance.xy, covariance.xx - covariance.yy) || 0;
        const pxToDeg = this._getPixelToDegreeFactor();

        const updated = {
            ...hillas,
            cogX: centroid.x,
            cogY: centroid.y,
            theta: thetaRad * 180 / Math.PI,
            lengthPx,
            widthPx
        };

        if (pxToDeg) {
            updated.length = lengthPx * pxToDeg;
            updated.width = widthPx * pxToDeg;
        }

        if (typeof updated.centerX !== 'undefined') updated.centerX = centroid.x;
        if (typeof updated.centerY !== 'undefined') updated.centerY = centroid.y;

        return updated;
    }

    _alignHillasToPhotonCluster(hillas, tracks) {
        if (!hillas || !hillas.valid) {
            return hillas;
        }

        const centroid = this._computePhotonCentroid(tracks);
        if (!centroid) {
            return hillas;
        }

        const aligned = { ...hillas, cogX: centroid.x, cogY: centroid.y };
        if (typeof aligned.centerX !== 'undefined') aligned.centerX = centroid.x;
        if (typeof aligned.centerY !== 'undefined') aligned.centerY = centroid.y;
        return aligned;
    }

    _weightedQuantile(pairs, q) {
        if (!pairs || !pairs.length) {
            return null;
        }

        const filtered = pairs.filter(item => Number.isFinite(item.value) && item.value >= 0 && Number.isFinite(item.weight) && item.weight > 0);
        if (!filtered.length) {
            return null;
        }

        filtered.sort((a, b) => a.value - b.value);

        const totalWeight = filtered.reduce((acc, cur) => acc + cur.weight, 0);
        if (totalWeight <= 0) {
            return null;
        }

        const targetWeight = totalWeight * Math.min(Math.max(q, 0), 1);
        let cumulative = 0;
        for (let i = 0; i < filtered.length; i++) {
            cumulative += filtered[i].weight;
            if (cumulative >= targetWeight) {
                return filtered[i].value;
            }
        }

        return filtered[filtered.length - 1].value;
    }

    _shrinkHillasToFitCluster(hillas, tracks, percentile = 0.6) {
        if (!hillas || !hillas.valid || !tracks || tracks.length < 3) {
            return hillas;
        }

        const theta = (hillas.theta || 0) * Math.PI / 180;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const majorPairs = [];
        const minorPairs = [];

        tracks.forEach(track => {
            const dx = (track.x || 0) - hillas.cogX;
            const dy = (track.y || 0) - hillas.cogY;
            const xr = Math.abs(dx * cosT + dy * sinT);
            const yr = Math.abs(-dx * sinT + dy * cosT);
            const weight = Number.isFinite(track.intensity) ? Math.max(track.intensity, 0.0001) : 1;
            if (Number.isFinite(xr)) majorPairs.push({ value: xr, weight });
            if (Number.isFinite(yr)) minorPairs.push({ value: yr, weight });
        });

        if (!majorPairs.length || !minorPairs.length) {
            return hillas;
        }

        const clampPercentile = Math.max(0.35, Math.min(percentile, 0.85));
        const majorQuantile = this._weightedQuantile(majorPairs, clampPercentile);
        const minorQuantile = this._weightedQuantile(minorPairs, clampPercentile);

        if (!Number.isFinite(majorQuantile) || !Number.isFinite(minorQuantile)) {
            return hillas;
        }

        const targetMajor = Math.max(majorQuantile * 0.85, 4);
        const targetMinor = Math.max(minorQuantile * 0.85, 3);

        const originalLength = Math.max(hillas.lengthPx || 0, 4);
        const originalWidth = Math.max(hillas.widthPx || 0, 3);

        const newLength = Math.min(originalLength, targetMajor);
        const newWidth = Math.min(originalWidth, targetMinor);

        return {
            ...hillas,
            lengthPx: newLength,
            widthPx: newWidth
        };
    }

    _redrawHillasOverlay() {
        if (!this.overlayCtx || !this.overlay) return;

        this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        this._hoverLensGeometry = null;

        if (!this.currentHillasParams || !this.currentHillasParams.valid) {
            return;
        }

        const hoverLocked = typeof this.isHoverZoomLocked === 'function' && this.isHoverZoomLocked();

        if (this.showHillasOnHover && !this.isHovering && !hoverLocked) {
            return;
        }

        if (!this.showHillasOnHover && this.embedHillasOutline) {
            return;
        }

        this._drawHillasOverlay(this.currentHillasParams);
    }

    refreshHillasOverlay() {
        try {
            this._redrawHillasOverlay();
        } catch (err) {
            console.warn('refreshHillasOverlay failed:', err);
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

        this._withHexClip(() => {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-over';

            const gradRadius = Math.max(a, b) * 1.8;
            const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, gradRadius);
            const rgbaCenter = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, 0.55)`;
            const rgbaMid = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, 0.28)`;
            const rgbaEdge = `rgba(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}, 0.08)`;
            grad.addColorStop(0, rgbaCenter);
            grad.addColorStop(0.35, rgbaMid);
            grad.addColorStop(0.7, rgbaEdge);
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            this.ctx.translate(cx, cy);
            this.ctx.rotate(theta);

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, a, b, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.restore();
        }, 8);

        this.ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Pulisce entrambi i canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this._withHexClip(() => {
            // Background: light gray for light style, dark blue for dark style
            this.ctx.fillStyle = this.lightStyle ? '#e0e0e0' : '#000814';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Disegna griglia esagonale (honeycomb) solo per light style
            if (this.lightStyle) {
                this.drawHexagonalGrid();
            }
        });

        // Bordo esagonale sempre visibile
        this.drawCameraBorder();

        if (this.overlayCtx) {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }

        this._updateCameraInfoOverlay(null);
        if (this._signatureHintEl) {
            this._signatureHintEl.style.display = 'none';
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
    }

    /**
     * Disegna bordo esagonale della camera
     */
    drawCameraBorder() {
        const radius = this._getHexRadius(this.canvas.width, this.canvas.height, 0);
        if (radius <= 0) return;

        this.ctx.save();
        this.ctx.strokeStyle = '#999999';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this._traceHexPath(this.ctx, this.canvas.width, this.canvas.height, radius);
        this.ctx.stroke();
        this.ctx.restore();
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
        this._lastShowLegend = showLegend;
        this.sourceType = (event && (event.sourceType || (event.params && event.params.sourceType))) || null;
        this.signatureHint = (event && (event.signatureHint || (event.params && event.params.signatureHint))) || '';

        this.clear();
        this._updateSignatureHint();

        let embeddedHillas = (!this.showEllipseOnly && event && event.__embeddedHillas && event.__embeddedHillas.valid)
            ? event.__embeddedHillas
            : null;

        if (embeddedHillas && event && event.tracks && event.tracks.length) {
            embeddedHillas = this._alignHillasToPhotonCluster(embeddedHillas, event.tracks);
            embeddedHillas = this._shrinkHillasToFitCluster(embeddedHillas, event.tracks);
            embeddedHillas = this._fitEllipseToPhotonCluster(embeddedHillas, event.tracks);
            event.__embeddedHillas = embeddedHillas;
        }

        this._embeddedHillasParams = embeddedHillas || null;

        if (embeddedHillas) {
            this._withHexClip(() => {
                this._drawEmbeddedHillasUnderTracks(embeddedHillas);
            });
        }

        if (this.showEllipseOnly) {
            this._withHexClip(() => {
                this.renderEllipseOnlyMode(event, showLegend, { clipProvided: true });
            });
            this.drawCameraBorder();
            this.drawCameraInfo(event);
            return;
        }

        this._withHexClip(() => {
            if (this.showEllipseOnly) {
                this.renderEllipseOnlyMode(event, showLegend, { clipProvided: true });
            } else {
                if (this.lightStyle && !this.suppressNoise) {
                    this.renderBackgroundNoise();
                }

                if (event.showGrid) {
                    this.drawGrid();
                }

                if (showLegend) {
                    this.colorPalette.drawEnergyLegend(this.canvas, 'top-right');
                }

                if (showLegend) {
                    this.renderEnergyHistogram(event);
                }
            }
        });

        // Renderizza le tracce con clipping esagonale per mostrare solo quelle dentro la camera
        if (!this.showEllipseOnly) {
            this._withHexClip(() => {
                const sortedTracks = [...event.tracks].sort((a, b) => a.intensity - b.intensity);
                sortedTracks.forEach(track => {
                    this.renderPhoton(track);
                });
            }, 0); // Ridotto inset per esagono più grande
        }

        // Bordo in primo piano
        this.drawCameraBorder();
        this.drawCameraInfo(event);
    }

    /**
     * Renderizza evento con animazione temporale
     * Simula l'arrivo progressivo dei fotoni Cherenkov
     */
    renderEventAnimated(event, showLegend = true) {
        // Keep a reference to the last rendered event so UI controls can re-render live
        try { this._lastEvent = event; } catch (e) {}
        this._lastShowLegend = showLegend;
        this.sourceType = (event && (event.sourceType || (event.params && event.params.sourceType))) || null;
        this.signatureHint = (event && (event.signatureHint || (event.params && event.params.signatureHint))) || '';

        this.clear();
        this._updateSignatureHint();

        let embeddedHillas = (event && event.__embeddedHillas && event.__embeddedHillas.valid) ? event.__embeddedHillas : null;

        if (embeddedHillas && event && event.tracks && event.tracks.length) {
            embeddedHillas = this._alignHillasToPhotonCluster(embeddedHillas, event.tracks);
            embeddedHillas = this._shrinkHillasToFitCluster(embeddedHillas, event.tracks);
            embeddedHillas = this._fitEllipseToPhotonCluster(embeddedHillas, event.tracks);
            event.__embeddedHillas = embeddedHillas;
        }

        this._embeddedHillasParams = embeddedHillas || null;

        if (embeddedHillas) {
            this._withHexClip(() => {
                this._drawEmbeddedHillasUnderTracks(embeddedHillas);
            });
        }

        this.drawCameraInfo(event);
        
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
            // Renderizza le tracce con clipping esagonale
            this._withHexClip(() => {
                const batch = sortedTracks.slice(currentIndex, currentIndex + batchSize);
                batch.forEach(track => {
                    this.renderPhoton(track);
                });
            }, 0); // Ridotto inset per esagono più grande

            currentIndex += batchSize;

            if (currentIndex < sortedTracks.length) {
                requestAnimationFrame(renderBatch);
            } else {
                // Animazione completata
                this._withHexClip(() => {
                    if (this.lightStyle && !this.suppressNoise) {
                        this.renderBackgroundNoise();
                    }
                    if (showLegend) {
                        this.colorPalette.drawEnergyLegend(this.canvas, 'top-right');
                    }
                    this.renderEnergyHistogram(event);
                });
            }

            this.drawCameraBorder();
            if (currentIndex >= sortedTracks.length) {
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
    renderEllipseOnlyMode(event, showLegend = true, options = {}) {
        const clipProvided = options && options.clipProvided === true;

        const drawContent = () => {
            let hillasParams = null;
            try {
                if (typeof HillasAnalyzer !== 'undefined') {
                    const analyzer = new HillasAnalyzer();
                    hillasParams = analyzer.analyze(event);
                }
            } catch (e) {
                console.warn('HillasAnalyzer not available:', e);
            }

            if (!hillasParams || !hillasParams.valid) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '16px system-ui';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Modalità Ellisse: Hillas non disponibile', this.canvas.width / 2, this.canvas.height / 2);
                return;
            }

            const cx = hillasParams.cogX;
            const cy = hillasParams.cogY;
            const a = hillasParams.lengthPx;
            const b = hillasParams.widthPx;
            const theta = (hillasParams.theta * Math.PI / 180);

            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(theta);

            this.ctx.fillStyle = 'rgba(0, 200, 255, 0.15)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, a, b, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, a, b, 0, 0, 2 * Math.PI);
            this.ctx.stroke();

            this.ctx.strokeStyle = '#ffaa00';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 3]);
            this.ctx.beginPath();
            this.ctx.moveTo(-a, 0);
            this.ctx.lineTo(a, 0);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, -b);
            this.ctx.lineTo(0, b);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            this.ctx.restore();

            this.ctx.fillStyle = '#ff0055';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'left';
            const infoX = Math.max(60, this.canvas.width * 0.18);
            let infoY = Math.max(40, this.canvas.height * 0.12);
            this.ctx.fillText(`Length: ${hillasParams.length.toFixed(3)}° (${hillasParams.lengthPx.toFixed(1)} px)`, infoX, infoY);
            infoY += 20;
            this.ctx.fillText(`Width: ${hillasParams.width.toFixed(3)}° (${hillasParams.widthPx.toFixed(1)} px)`, infoX, infoY);
            infoY += 20;
            this.ctx.fillText(`L/W Ratio: ${hillasParams.elongation.toFixed(2)}`, infoX, infoY);
            infoY += 20;
            this.ctx.fillText(`Size: ${hillasParams.size.toFixed(0)} p.e.`, infoX, infoY);
            infoY += 20;
            this.ctx.fillText(`Alpha: ${hillasParams.alpha.toFixed(1)}°`, infoX, infoY);

            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
            this.ctx.font = 'bold 16px system-ui';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Modalità Ellisse (solo outline)', this.canvas.width / 2, this.canvas.height - 20);

            if (showLegend) {
                this.colorPalette.drawEnergyLegend(this.canvas, 'top-right');
            }
        };

        if (clipProvided) {
            drawContent();
        } else {
            this._withHexClip(drawContent);
            this.drawCameraBorder();
        }
    }

    _mixRGBTowards(baseRGB, targetRGB, factor) {
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const t = clamp(isFinite(factor) ? factor : 0, 0, 1);
        return [
            Math.round(baseRGB[0] + (targetRGB[0] - baseRGB[0]) * t),
            Math.round(baseRGB[1] + (targetRGB[1] - baseRGB[1]) * t),
            Math.round(baseRGB[2] + (targetRGB[2] - baseRGB[2]) * t)
        ];
    }

    _applyHighEnergyTint(baseRGB, track) {
        if (!track || !track.energy || !isFinite(track.energy)) {
            return baseRGB;
        }

        const sourceTag = track.sourceType || this.sourceType;
        if (sourceTag !== 'blazar' && sourceTag !== 'grb') {
            return baseRGB;
        }

        const energyTeV = (track.energy || 0) / 1000;
        if (energyTeV < 10) {
            return baseRGB;
        }

        const overThreshold = Math.max(0, energyTeV - 10);
        let tintStrength;
        if (sourceTag === 'blazar') {
            tintStrength = Math.min(0.9, 0.25 + 0.08 * overThreshold);
        } else {
            tintStrength = Math.min(0.7, 0.18 + 0.05 * overThreshold);
        }
        if (tintStrength <= 0) {
            return baseRGB;
        }

        const target = sourceTag === 'blazar'
            ? [90, 255, 170]
            : [60, 235, 210];

        return this._mixRGBTowards(baseRGB, target, tintStrength);
    }

    _applySourceDifferentiation(baseRGB, intensityFactor, track) {
        if (!track) {
            return { rgb: baseRGB, intensity: intensityFactor };
        }

        const sourceTag = track.sourceType || this.sourceType;
        let rgb = baseRGB;
        let intensity = intensityFactor;

        const longitudinal = typeof track.longitudinalNormalized === 'number'
            ? Math.max(-1.5, Math.min(1.5, track.longitudinalNormalized))
            : null;
        const radialNorm = typeof track.radialNormalized === 'number'
            ? Math.max(0, Math.min(1, track.radialNormalized))
            : null;

        const axisCenterWeight = longitudinal !== null
            ? Math.max(0, 1 - Math.min(1, Math.abs(longitudinal)))
            : null;
        const axialProgress = longitudinal !== null
            ? Math.max(0, Math.min(1, 0.5 + longitudinal * 0.5))
            : null;

        if (sourceTag === 'blazar' && axisCenterWeight !== null) {
            intensity = Math.min(1, intensity * (0.85 + axisCenterWeight * 0.6));
            rgb = this._mixRGBTowards(rgb, [120, 255, 200], axisCenterWeight * 0.35);
        } else if (sourceTag === 'grb' && axialProgress !== null) {
            rgb = this._mixRGBTowards(rgb, [70, 220, 130], axialProgress * 0.85);
            intensity = Math.min(1, intensity * (0.75 + (1 - axialProgress) * 0.45));
        } else if ((sourceTag === 'pevatron' || sourceTag === 'galactic-center') && radialNorm !== null) {
            const focus = 1 - radialNorm * 0.7;
            intensity = Math.min(1, intensity * (0.85 + focus * 0.45));
            rgb = this._mixRGBTowards(rgb, [120, 200, 255], (1 - focus) * 0.25);
        }

        return { rgb, intensity };
    }

    _getSourceJitterMultiplier(sourceTag) {
        switch (sourceTag) {
            case 'blazar':
                return 0.75;
            case 'grb':
                return 1.25;
            case 'pevatron':
                return 0.8;
            case 'galactic-center':
                return 0.85;
            default:
                return 1;
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

        const trackSourceTag = track.sourceType || this.sourceType;
        const isHadronic = this._isHadronicSource(trackSourceTag);
        const isGammaLike = !isHadronic;

        // Light style: rendering con pixel esagonali
        if (this.lightStyle) {
            this.renderPhotonHexagonal(track);
            return;
        }

        // Dark style: rendering tradizionale con glow
        let intensityFactor = Math.max(0, Math.min(1, track.intensity || 0));

        // Color mapping: combine energy and intensity, then tone-map for photographic dynamic range
        let baseRGB = this.colorPalette.getColorRGB(track.energy || this.colorPalette.minEnergy);
        try {
            const energyNorm = Math.log10(track.energy / this.colorPalette.minEnergy) /
                              Math.log10(this.colorPalette.maxEnergy / this.colorPalette.minEnergy);
            const colorT = (intensityFactor * 0.7 + energyNorm * 0.3);
            baseRGB = this.colorPalette.mapNormalized(colorT);
            baseRGB = this._applyHighEnergyTint(baseRGB, track);

            const sourceAdjust = this._applySourceDifferentiation(baseRGB, intensityFactor, track);
            baseRGB = sourceAdjust.rgb;
            intensityFactor = sourceAdjust.intensity;

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
        let jitterAttenuation = isGammaLike ? 0.55 : 1.0;
        jitterAttenuation *= this._getSourceJitterMultiplier(trackSourceTag);
        const sinPattern = Math.sin((track.x + track.y) * 0.12) * 0.3 * jitterAttenuation;
        const jitterMag = this.subpixelEnabled ? (Math.random() - 0.5) * 0.6 * jitterAttenuation : 0.0;
        const jitterY = (this.subpixelEnabled ? (Math.random() - 0.5) * 0.5 : 0.0) * jitterAttenuation;
        const hadronicShearX = isHadronic ? (Math.random() - 0.5) * 0.35 : 0;
        const hadronicShearY = isHadronic ? (Math.random() - 0.5) * 0.6 : 0;
        const offsetX = sinPattern + jitterMag + hadronicShearX;
        const offsetY = Math.cos((track.x - track.y) * 0.09) * 0.28 * jitterAttenuation + jitterY + hadronicShearY;

        const drawX = track.x + offsetX;
        const drawY = track.y + offsetY;

        const radius = this.intensityToRadius(track.intensity);
        let alpha = Math.min(1, track.intensity * 1.2 + 0.5);

        const longitudinal = typeof track.longitudinalNormalized === 'number'
            ? Math.max(-1.5, Math.min(1.5, track.longitudinalNormalized))
            : null;
        if (trackSourceTag === 'grb' && longitudinal !== null) {
            const axialProgress = Math.max(0, Math.min(1, 0.5 + longitudinal * 0.5));
            alpha *= Math.max(0.3, 0.85 + (1 - axialProgress) * 0.25);
        } else if (trackSourceTag === 'blazar' && longitudinal !== null) {
            const axisCenterWeight = Math.max(0, 1 - Math.min(1, Math.abs(longitudinal)));
            alpha = Math.min(1, alpha * (0.85 + axisCenterWeight * 0.35));
        }

        if (!isFinite(radius) || radius <= 0) return;

        // Glow esterno: use computed final color with alpha ramp
        // Ridotto glow radius (da 5.0 → 2.5) per rendere ellissi più definite
        let glowScale = 1 + (Math.max(0, (this.exposureK || 4.0) - 4.0)) * 0.28; // modest per-step increase
        glowScale *= isHadronic ? 1.35 : 0.92;
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

    renderEnergyHistogram(event) {
        if (!this.ctx || !event || !Array.isArray(event.tracks) || event.tracks.length === 0) {
            return;
        }

        const bins = [
            { label: '<1 TeV', min: 0, max: 1000, sample: 500 },
            { label: '1-3 TeV', min: 1000, max: 3000, sample: 2000 },
            { label: '3-10 TeV', min: 3000, max: 10000, sample: 6000 },
            { label: '>10 TeV', min: 10000, max: Infinity, sample: 20000 }
        ];

        const counts = bins.map(() => 0);
        let maxCount = 0;

        event.tracks.forEach(track => {
            const energy = track && track.energy;
            if (!energy || !isFinite(energy)) return;

            for (let i = 0; i < bins.length; i++) {
                const bin = bins[i];
                if (energy >= bin.min && energy < bin.max) {
                    counts[i]++;
                    if (counts[i] > maxCount) maxCount = counts[i];
                    break;
                }
            }
        });

        if (maxCount === 0) {
            return;
        }

        const panelWidth = 164;
        const panelHeight = 96;
        const margin = 18;
        const baseX = margin;
        const baseY = this.canvas.height - panelHeight - margin;

        const bgColor = this.lightStyle ? 'rgba(245, 248, 255, 0.88)' : 'rgba(0, 8, 20, 0.82)';
        const borderColor = this.lightStyle ? 'rgba(40, 70, 110, 0.55)' : 'rgba(180, 220, 255, 0.4)';
        const textColor = this.lightStyle ? '#0f2b46' : '#dfe9ff';

        this.ctx.save();
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(baseX, baseY, panelWidth, panelHeight);
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(baseX, baseY, panelWidth, panelHeight);

        this.ctx.fillStyle = textColor;
        this.ctx.font = '10px "Courier New", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Distribuzione energia', baseX + 8, baseY + 14);

        const graphTop = baseY + 24;
        const graphHeight = panelHeight - 40;
        const gap = 6;
        const usableWidth = panelWidth - gap * (bins.length + 1);
        const barWidth = Math.max(12, usableWidth / bins.length);

        for (let i = 0; i < bins.length; i++) {
            const count = counts[i];
            const bin = bins[i];
            const barX = baseX + gap + i * (barWidth + gap);
            const norm = count / maxCount;
            const barH = Math.max(2, norm * graphHeight);
            const barY = graphTop + (graphHeight - barH);

            const rgb = this.colorPalette.getColorRGB(bin.sample);
            this.ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${this.lightStyle ? 0.75 : 0.9})`;
            this.ctx.fillRect(barX, barY, barWidth, barH);

            const highlightBar = (
                (this.sourceType === 'blazar' && i === 3) ||
                (this.sourceType === 'grb' && (i === 2 || i === 3)) ||
                (this.sourceType === 'crab' && i === 0)
            );
            if (highlightBar) {
                this.ctx.strokeStyle = this.sourceType === 'crab' ? '#ffd966' : '#7cffc9';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barH + 2);
            }

            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(bin.label, barX + barWidth / 2, graphTop + graphHeight + 12);

            if (count > 0) {
                this.ctx.fillText(`${count}`, barX + barWidth / 2, barY - 4);
            }
        }

        this.ctx.restore();
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
        const trackSourceTag = track.sourceType || this.sourceType;
        const isHadronic = this._isHadronicSource(trackSourceTag);

        // Parametri source-specific (default: Crab Nebula)
        let longMultiplier = 10;
        let shortMultiplier = 2.0;
        let maxPixels = 22;
        let densityMin = 0.7;
        let densityMax = 1.0;

        switch (this.sourceType) {
            case 'pevatron':
                longMultiplier = 25;
                shortMultiplier = 5.0;
                maxPixels = 60;
                densityMin = 0.8;
                densityMax = 1.5;
                break;
            case 'blazar':
                longMultiplier = 6;
                shortMultiplier = 0.8;
                maxPixels = 15;
                densityMin = 0.9;
                densityMax = 1.0;
                break;
            case 'grb':
                longMultiplier = 8;
                shortMultiplier = 4.0;
                maxPixels = 35;
                densityMin = 0.5;
                densityMax = 1.4;
                break;
            case 'galactic-center':
                longMultiplier = 14;
                shortMultiplier = 3.5;
                maxPixels = 45;
                densityMin = 0.2;
                densityMax = 1.8;
                break;
            default:
                break;
        }

        if (isHadronic) {
            longMultiplier *= 1.35;
            shortMultiplier *= 1.55;
            maxPixels = Math.round(maxPixels * 1.35);
            densityMin *= 1.1;
            densityMax *= 1.3;
        }

        const pixelRadius = 4;
        const radiusBase = this.intensityToRadius(track.intensity);
        const spreadRadiusLong = radiusBase * longMultiplier;
        const spreadRadiusShort = radiusBase * shortMultiplier;

        const densityVariation = densityMin + Math.random() * (densityMax - densityMin);
        const radialExponent = isHadronic ? 1.4 : 2.2;
        const numPixels = Math.max(5, Math.floor(intensityFactor * maxPixels * densityVariation));
        const minDistance = pixelRadius * 3;

        const pixels = [];
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const margin = pixelRadius * 2;

        const trackAngle = Math.random() * Math.PI * 2;
        const cosAngle = Math.cos(trackAngle);
        const sinAngle = Math.sin(trackAngle);

        // --- MODIFICA: Generazione Sub-Clusters per Adroni (Effetto "Macchia Sporca") ---
        const subClusters = [];
        if (isHadronic) {
            // Aumenta drasticamente il numero e la dispersione dei frammenti
            const numSubClusters = 3 + Math.floor(Math.random() * 4); // 3-6 isole
            for (let k = 0; k < numSubClusters; k++) {
                // Distanza molto maggiore dal centro per separare bene le isole
                const dist = spreadRadiusLong * (0.8 + Math.random() * 1.2); 
                const ang = Math.random() * Math.PI * 2;
                subClusters.push({
                    dx: Math.cos(ang) * dist,
                    dy: Math.sin(ang) * dist,
                    radius: spreadRadiusShort * (0.5 + Math.random() * 0.6),
                    // Non usiamo 'pixels' qui, ma la probabilità nel loop principale
                });
            }
        }
        // -----------------------------------------------------

        for (let i = 0; i < numPixels; i++) {
            let attempts = 0;
            let validPosition = false;
            let px = track.x;
            let py = track.y;

            // --- MODIFICA: Selezione Cluster ---
            let currentCluster = null;
            // 65% di probabilità di finire in un frammento esterno (molto frammentato)
            if (isHadronic && subClusters.length > 0 && Math.random() < 0.65) {
                currentCluster = subClusters[Math.floor(Math.random() * subClusters.length)];
            }
            // -----------------------------------

            while (!validPosition && attempts < 32) {
                let localX, localY;

                if (currentCluster) {
                    // Generazione pixel nel sub-cluster
                    const t = Math.random() * Math.PI * 2;
                    // Distribuzione uniforme nel cerchio del cluster (più "piatta", meno nucleo)
                    const r = Math.sqrt(Math.random()) * currentCluster.radius;
                    localX = currentCluster.dx + Math.cos(t) * r;
                    localY = currentCluster.dy + Math.sin(t) * r;
                    
                    // Rotazione coerente con la traccia (opzionale, ma aiuta il realismo)
                    const rotX = localX * cosAngle - localY * sinAngle;
                    const rotY = localX * sinAngle + localY * cosAngle;
                    px = track.x + rotX;
                    py = track.y + rotY;

                } else {
                    // Generazione standard (ellisse principale o residuo centrale)
                    const t = Math.random() * Math.PI * 2;
                    // Per adroni, anche il centro è meno concentrato (esponente più basso)
                    const exp = isHadronic ? 1.0 : radialExponent; 
                    const radiusFactor = Math.pow(Math.random(), exp);

                    const lx = Math.cos(t) * spreadRadiusLong * radiusFactor;
                    const ly = Math.sin(t) * spreadRadiusShort * radiusFactor;

                    const rotX = lx * cosAngle - ly * sinAngle;
                    const rotY = lx * sinAngle + ly * cosAngle;

                    px = track.x + rotX;
                    py = track.y + rotY;
                }

                if (px < margin || px > canvasW - margin || py < margin || py > canvasH - margin) {
                    attempts++;
                    continue;
                }

                validPosition = true;
                for (const existing of pixels) {
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

            if (!validPosition) {
                continue;
            }

            const dx = px - track.x;
            const dy = py - track.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = Math.max(1, Math.sqrt(spreadRadiusLong * spreadRadiusLong + spreadRadiusShort * spreadRadiusShort) * 0.5);
            const distanceFactor = 1 - Math.min(1, distance / maxDistance);

            const exposureK = (typeof this.exposureK === 'number') ? this.exposureK : 4.0;
            const exposureBoost = 1 + (Math.max(0, exposureK - 4.0)) * 0.28;

            const energyMin = this.colorPalette?.minEnergy || 1;
            const energyMax = this.colorPalette?.maxEnergy || (energyMin * 10);
            let energyNorm = 0.5;
            try {
                const clampedEnergy = Math.min(energyMax, Math.max(energyMin, track.energy || energyMin));
                const logSpan = Math.log10(energyMax / energyMin) || 1;
                const baseNorm = Math.log10(clampedEnergy / energyMin) / logSpan;
                const energyVariation = (Math.random() - 0.5) * 0.3;
                energyNorm = Math.min(1, Math.max(0, baseNorm + energyVariation));
            } catch (_) {
                energyNorm = 0.5;
            }

            const tone = this.colorPalette.toneMap(energyNorm, exposureK);
            let colorRGB = this.colorPalette.mapNormalized(energyNorm);

            const brightness = Math.max(0.15, tone * exposureBoost * (0.8 + 0.4 * intensityFactor) * (0.6 + 0.4 * distanceFactor));
            colorRGB = this.colorPalette.applyBrightnessToRGB(colorRGB, brightness);

            const pixelAlpha = Math.min(0.95, (0.55 + 0.45 * intensityFactor) * Math.pow(Math.max(0, distanceFactor), 0.4));

            let drawX = px;
            let drawY = py;
            if (this.subpixelEnabled) {
                const jitterScale = isHadronic ? 1 : 0.6;
                drawX += (Math.random() - 0.5) * 0.6 * jitterScale;
                drawY += (Math.random() - 0.5) * 0.6 * jitterScale;
            }

            const isHotspot = distanceFactor > 0.8 && Math.random() < 0.25;
            const r = isHotspot ? 255 : Math.min(255, Math.round(colorRGB[0]));
            const g = isHotspot ? 255 : Math.min(255, Math.round(colorRGB[1]));
            const b = isHotspot ? 255 : Math.min(255, Math.round(colorRGB[2]));

            pixels.push({
                x: drawX,
                y: drawY,
                alpha: Math.min(1, isHotspot ? pixelAlpha + 0.1 : pixelAlpha),
                r,
                g,
                b,
                isWhite: isHotspot
            });
        }

        pixels.forEach(pixel => {
            this.ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(pixel.x, pixel.y, pixelRadius, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.strokeStyle = `rgba(50, 50, 50, ${pixel.alpha * 0.5})`;
            this.ctx.lineWidth = pixel.isWhite ? 2 : 1.5;
            this.ctx.stroke();
        });

        const centerNorm = (() => {
            const energyMin = this.colorPalette?.minEnergy || 1;
            const energyMax = this.colorPalette?.maxEnergy || (energyMin * 10);
            const clampedEnergy = Math.min(energyMax, Math.max(energyMin, track.energy || energyMin));
            const logSpan = Math.log10(energyMax / energyMin) || 1;
            return Math.log10(clampedEnergy / energyMin) / logSpan;
        })();

        const centerTone = this.colorPalette.toneMap(centerNorm, this.exposureK || 4.0);
        const baseCenterColor = this.colorPalette.mapNormalized(centerNorm);
        const centerBoost = 1 + (Math.max(0, (this.exposureK || 4.0) - 4.0)) * 0.35;
        const centerRGB = this.colorPalette.applyBrightnessToRGB(
            baseCenterColor,
            Math.max(0.5, centerTone * (0.9 + 0.6 * intensityFactor) * centerBoost)
        );

        const cr = Math.min(255, Math.round(centerRGB[0] + 32));
        const cg = Math.min(255, Math.round(centerRGB[1] + 32));
        const cb = Math.min(255, Math.round(centerRGB[2] + 32));

        this.ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(1, intensityFactor * 1.15)})`;
        this.ctx.beginPath();
        this.ctx.arc(track.x, track.y, pixelRadius * 1.4, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(50, 50, 50, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    _isHadronicSource(sourceTag) {
        if (!sourceTag && !this.sourceType) {
            return false;
        }
        const tag = (sourceTag || this.sourceType || '').toString().toLowerCase();
        // Rimosso 'pevatron', 'snr', 'galactic-center' perché nel simulatore osserviamo i GAMMA da queste sorgenti
        const hadronicTags = ['hadron', 'hadronic', 'proton', 'iron', 'cosmic-ray'];
        return hadronicTags.includes(tag);
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
        this._updateCameraInfoOverlay(event);
    }

    /**
     * Renderizza parametri Hillas su overlay
     */
    renderHillasOverlay(hillasParams) {
        if (!this.overlayCtx || !this.overlay) return;

        if (hillasParams && hillasParams.valid) {
            this.currentHillasParams = hillasParams;
        } else {
            this.currentHillasParams = null;
            this.isHovering = false;
            this._redrawHillasOverlay();
            return;
        }

        if (this._lastEvent && this._lastEvent.tracks && this._lastEvent.tracks.length) {
            this.currentHillasParams = this._alignHillasToPhotonCluster(this.currentHillasParams, this._lastEvent.tracks);
            this.currentHillasParams = this._shrinkHillasToFitCluster(this.currentHillasParams, this._lastEvent.tracks);
            this.currentHillasParams = this._fitEllipseToPhotonCluster(this.currentHillasParams, this._lastEvent.tracks);
        }

        if (this.embedHillasOutline && !this.showHillasOnHover && this._lastEvent && this._lastEvent.tracks) {
            try {
                const embedded = { ...this.currentHillasParams };
                embedded.valid = true;
                if (this._lastEvent && this._lastEvent.tracks && this._lastEvent.tracks.length) {
                    const aligned = this._alignHillasToPhotonCluster(embedded, this._lastEvent.tracks);
                    const trimmed = this._shrinkHillasToFitCluster(aligned, this._lastEvent.tracks);
                    this._embeddedHillasParams = this._fitEllipseToPhotonCluster(trimmed, this._lastEvent.tracks);
                } else {
                    this._embeddedHillasParams = embedded;
                }
                this._lastEvent.__embeddedHillas = this._embeddedHillasParams;
                if (!this._embeddingReRender) {
                    this._embeddingReRender = true;
                    this.renderEvent(this._lastEvent, this._lastShowLegend);
                    this._embeddingReRender = false;
                }
            } catch (err) {
                console.warn('Embedding Hillas outline failed:', err);
            }
        } else if (this._lastEvent && this._lastEvent.__embeddedHillas && (this.showHillasOnHover || !this.embedHillasOutline)) {
            this._lastEvent.__embeddedHillas = null;
            this._embeddedHillasParams = null;
        }

        const hoverLocked = typeof this.isHoverZoomLocked === 'function' && this.isHoverZoomLocked();
        if (hoverLocked) {
            this.isHovering = true;
            this._hoverZoomHiddenUntilReset = false;
        } else if (this.showHillasOnHover) {
            if (this.mouseX >= 0 && this.mouseY >= 0) {
                this.isHovering = this._isPointInsideHillas(this.mouseX, this.mouseY, this.currentHillasParams);
            } else {
                this.isHovering = false;
            }
        } else if (!this.showHillasOnHover) {
            this.isHovering = false;
        }

        this._redrawHillasOverlay();
    }

    _drawEmbeddedHillasUnderTracks(hillasParams) {
        if (!hillasParams || !hillasParams.valid || !this.ctx) return;

        const ctx = this.ctx;
        const centerX = hillasParams.cogX;
        const centerY = hillasParams.cogY;
        const theta = (hillasParams.theta || 0) * Math.PI / 180;

        const lengthScale = this.respectExactHillas ? 1.0 : 1.02;
        const widthScale = this.respectExactHillas ? 1.0 : 1.02;
        const ellipseBoost = this.lightStyle ? 1.28 : 1.24;
        const lengthPx = Math.max((hillasParams.lengthPx || 0) * lengthScale * ellipseBoost, 8);
        const widthPx = Math.max((hillasParams.widthPx || 0) * widthScale * ellipseBoost, 5);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(theta);

        const fillColor = this.lightStyle ? 'rgba(210, 60, 140, 0.12)' : 'rgba(0, 160, 140, 0.15)';
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, lengthPx, widthPx, 0, 0, 2 * Math.PI);
        ctx.fill();

        ctx.lineWidth = this.lightStyle ? 1.1 : 1.3;
        ctx.strokeStyle = this.lightStyle ? 'rgba(220, 60, 150, 0.6)' : 'rgba(0, 230, 190, 0.65)';
        ctx.beginPath();
        ctx.ellipse(0, 0, lengthPx, widthPx, 0, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.lineWidth = this.lightStyle ? 0.7 : 0.9;
        ctx.strokeStyle = this.lightStyle ? 'rgba(40, 60, 140, 0.45)' : 'rgba(40, 150, 255, 0.45)';
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(-lengthPx, 0);
        ctx.lineTo(lengthPx, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -widthPx);
        ctx.lineTo(0, widthPx);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    _drawHillasOverlay(hillasParams) {
        if (!this.overlayCtx || !this.overlay || !hillasParams || !hillasParams.valid) return;

        const ctx = this.overlayCtx;
        const referenceCfg = this.alphaReferenceConfig || {};
        const clampPadding = referenceCfg.markerClampPadding ?? 16;
        const hoverLocked = typeof this.isHoverZoomLocked === 'function' && this.isHoverZoomLocked();
        const shouldDrawZoom = this.hoverZoomConfig
            && this.hoverZoomConfig.enabled
            && (this.isHovering || hoverLocked)
            && !this._hoverZoomHiddenUntilReset;
        let pendingZoomDraw = null;

        this._withOverlayHexClip(() => {
            const centerX = hillasParams.cogX;
            const centerY = hillasParams.cogY;
            const theta = hillasParams.theta * Math.PI / 180;

            console.log(`🎨 Rendering Hillas: CoG(${centerX.toFixed(1)}, ${centerY.toFixed(1)}), Canvas: ${this.overlay.width}×${this.overlay.height}`);

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(theta);

            let displayLengthPx = hillasParams.lengthPx;
            let displayWidthPx = hillasParams.widthPx;

            const overlayLengthScale = this.respectExactHillas ? 1.0 : 1.02;
            const overlayWidthScale = this.respectExactHillas ? 1.0 : 1.02;
            const overlayBoost = this.lightStyle ? 1.35 : 1.3;
            displayLengthPx = Math.max(displayLengthPx * overlayLengthScale * overlayBoost, 10);
            displayWidthPx = Math.max(displayWidthPx * overlayWidthScale * overlayBoost, 6);

            if (!isFinite(displayLengthPx) || displayLengthPx <= 0) displayLengthPx = 10;
            if (!isFinite(displayWidthPx) || displayWidthPx <= 0) displayWidthPx = 5;

            const outlineColor = this.lightStyle ? 'rgba(210, 40, 140, 0.88)' : 'rgba(0, 255, 205, 0.8)';
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth = this.lightStyle ? 1.4 : 1.6;
            ctx.strokeStyle = outlineColor;
            ctx.shadowBlur = this.lightStyle ? 6 : 10;
            ctx.shadowColor = outlineColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, displayLengthPx, displayWidthPx, 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'source-over';

            const axisColor = this.lightStyle ? 'rgba(40, 60, 140, 0.7)' : 'rgba(80, 180, 255, 0.66)';
            ctx.strokeStyle = axisColor;
            ctx.lineWidth = this.lightStyle ? 0.9 : 1.0;
            ctx.setLineDash([9, 7]);
            ctx.beginPath();
            ctx.moveTo(-displayLengthPx, 0);
            ctx.lineTo(displayLengthPx, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -displayWidthPx);
            ctx.lineTo(0, displayWidthPx);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.restore();

            ctx.fillStyle = this.lightStyle ? 'rgba(210, 40, 140, 0.9)' : 'rgba(255, 70, 120, 0.85)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = this.lightStyle ? 'rgba(250, 230, 255, 0.8)' : 'rgba(255, 255, 255, 0.88)';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            const cameraCenterX = this.overlay.width / 2;
            const cameraCenterY = this.overlay.height / 2;
            const dxCamera = cameraCenterX - centerX;
            const dyCamera = cameraCenterY - centerY;
            const distanceToCamera = Math.sqrt(dxCamera * dxCamera + dyCamera * dyCamera) || 1;
            const unitToCameraX = dxCamera / distanceToCamera;
            const unitToCameraY = dyCamera / distanceToCamera;
            const markerMode = referenceCfg.cameraMarkerMode || 'center';
            const markerOffset = referenceCfg.cameraMarkerOffset || 0;
            const markerRadius = referenceCfg.cameraMarkerRadius ?? 6;
            let markerX = cameraCenterX;
            let markerY = cameraCenterY;
            if (markerMode === 'offset' && Math.abs(markerOffset) > 0.5) {
                markerX = cameraCenterX + unitToCameraX * markerOffset;
                markerY = cameraCenterY + unitToCameraY * markerOffset;
            }
            markerX = Math.max(clampPadding, Math.min(this.overlay.width - clampPadding, markerX));
            markerY = Math.max(clampPadding, Math.min(this.overlay.height - clampPadding, markerY));

            const lineEndX = markerX;
            const lineEndY = markerY;
            const directionCfg = this.alphaDirectionGuides || {};
            let rayForwardEndX = lineEndX;
            let rayForwardEndY = lineEndY;
            let backtrackStartX = null;
            let backtrackStartY = null;

            if (directionCfg.enabled) {
                const baseLength = Math.sqrt((lineEndX - centerX) ** 2 + (lineEndY - centerY) ** 2) || distanceToCamera;
                const forwardLength = Math.max(12, directionCfg.cameraRayLengthPx ?? (baseLength + (directionCfg.cameraRayExtensionPx ?? 0)));
                rayForwardEndX = centerX + unitToCameraX * forwardLength;
                rayForwardEndY = centerY + unitToCameraY * forwardLength;
                rayForwardEndX = Math.max(clampPadding, Math.min(this.overlay.width - clampPadding, rayForwardEndX));
                rayForwardEndY = Math.max(clampPadding, Math.min(this.overlay.height - clampPadding, rayForwardEndY));

                const backtrack = Math.max(0, directionCfg.cameraRayBacktrackPx || 0);
                if (backtrack > 0) {
                    backtrackStartX = centerX - unitToCameraX * backtrack;
                    backtrackStartY = centerY - unitToCameraY * backtrack;
                    backtrackStartX = Math.max(clampPadding, Math.min(this.overlay.width - clampPadding, backtrackStartX));
                    backtrackStartY = Math.max(clampPadding, Math.min(this.overlay.height - clampPadding, backtrackStartY));
                }
            }

            ctx.strokeStyle = this.lightStyle ? 'rgba(0, 102, 204, 0.7)' : 'rgba(68, 136, 255, 0.6)';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([8, 6]);

            if (directionCfg.enabled && backtrackStartX !== null && backtrackStartY !== null) {
                ctx.beginPath();
                ctx.moveTo(backtrackStartX, backtrackStartY);
                ctx.lineTo(centerX, centerY);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(directionCfg.enabled ? rayForwardEndX : lineEndX, directionCfg.enabled ? rayForwardEndY : lineEndY);
            ctx.stroke();
            ctx.setLineDash([]);

            if (directionCfg.enabled) {
                const majorAxisLength = directionCfg.majorAxisLengthPx ?? Math.max(displayLengthPx * 1.15, 40);
                const majorEndX = centerX + Math.cos(theta) * majorAxisLength;
                const majorEndY = centerY + Math.sin(theta) * majorAxisLength;
                this._drawArrow(ctx, centerX, centerY, majorEndX, majorEndY, {
                    color: directionCfg.majorAxisColor || (this.lightStyle ? 'rgba(255, 200, 120, 0.95)' : 'rgba(255, 200, 120, 0.95)'),
                    lineWidth: directionCfg.lineWidth || 2.2,
                    arrowSize: directionCfg.arrowSize || 12,
                    dash: directionCfg.majorAxisDash || [12, 6]
                });

                this._drawArrow(ctx, centerX, centerY, rayForwardEndX, rayForwardEndY, {
                    color: directionCfg.cameraRayColor || (this.lightStyle ? 'rgba(120, 220, 255, 0.95)' : 'rgba(120, 220, 255, 0.95)'),
                    lineWidth: directionCfg.lineWidth || 2.2,
                    arrowSize: directionCfg.arrowSize || 12,
                    dash: directionCfg.cameraRayDash || [8, 6]
                });
            }

            if (referenceCfg.drawCameraCenterCross) {
                const crossSize = referenceCfg.cameraCenterCrossSize ?? 12;
                ctx.save();
                ctx.strokeStyle = this.lightStyle ? 'rgba(255, 255, 190, 0.85)' : 'rgba(255, 255, 160, 0.85)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(cameraCenterX - crossSize, cameraCenterY);
                ctx.lineTo(cameraCenterX + crossSize, cameraCenterY);
                ctx.moveTo(cameraCenterX, cameraCenterY - crossSize);
                ctx.lineTo(cameraCenterX, cameraCenterY + crossSize);
                ctx.stroke();
                ctx.restore();
            }

            const midX = (centerX + cameraCenterX) / 2;
            const midY = (centerY + cameraCenterY) / 2;
            const alphaLabel = `α = ${hillasParams.alpha.toFixed(1)}°`;
            ctx.font = '700 18px "Courier New", monospace';
            ctx.textBaseline = 'middle';

            const labelCfg = this.alphaLabelConfig || {};
            const mode = labelCfg.mode || 'midpoint';
            let textX = midX + (labelCfg.alongOffset ?? 12);
            let textY = midY + (labelCfg.midpointYOffset ?? 0);
            let labelTextAlign = labelCfg.textAlign || 'left';

            if (mode === 'perpendicular') {
                const alongFraction = Math.max(0, Math.min(1, labelCfg.alongFraction ?? 0.5));
                const baseX = centerX + dxCamera * alongFraction;
                const baseY = centerY + dyCamera * alongFraction;
                const lateralOffset = labelCfg.lateralOffset ?? 48;
                const perpX = -dyCamera / distanceToCamera;
                const perpY = dxCamera / distanceToCamera;
                const side = labelCfg.preferPositiveSide === false ? -1 : 1;
                textX = baseX + perpX * lateralOffset * side;
                textY = baseY + perpY * lateralOffset * side;
                labelTextAlign = labelCfg.textAlign || 'center';
            }

            ctx.textAlign = labelTextAlign;
            const metrics = ctx.measureText(alphaLabel);
            const textHeight = (metrics.actualBoundingBoxAscent || 10) + (metrics.actualBoundingBoxDescent || 4);
            const padX = 12;
            const padY = 6;
            const lensGeometry = (this.hoverZoomConfig && this.hoverZoomConfig.enabled && (this.isHovering || hoverLocked))
                ? this._getHoverLensGeometry(centerX, centerY, displayLengthPx, displayWidthPx)
                : null;

            const recomputeBox = () => {
                const boxWidth = metrics.width + padX * 2;
                const boxHeight = textHeight + padY * 2;
                let boxX = textX - padX;
                if (labelTextAlign === 'center') {
                    boxX -= metrics.width / 2;
                } else if (labelTextAlign === 'right') {
                    boxX -= metrics.width;
                }
                const boxY = textY - boxHeight / 2;
                return { boxWidth, boxHeight, boxX, boxY };
            };

            let { boxWidth, boxHeight, boxX, boxY } = recomputeBox();
            const updateLabelPosition = (dxShift, dyShift) => {
                textX += dxShift;
                textY += dyShift;
                ({ boxWidth, boxHeight, boxX, boxY } = recomputeBox());
            };

            if (lensGeometry) {
                // Keep alpha label away from the hover zoom lens so it stays readable
                const labelHalfDiag = Math.sqrt((boxWidth / 2) ** 2 + (boxHeight / 2) ** 2);
                const avoidPadding = labelCfg.lensAvoidancePadding ?? (this.hoverZoomConfig.labelAvoidancePadding ?? 12);
                let labelCenterX = boxX + boxWidth / 2;
                let labelCenterY = boxY + boxHeight / 2;
                let dxLens = labelCenterX - lensGeometry.centerX;
                let dyLens = labelCenterY - lensGeometry.centerY;
                let distance = Math.sqrt(dxLens * dxLens + dyLens * dyLens);
                const safeDistance = lensGeometry.radius + labelHalfDiag + avoidPadding;
                if (distance < safeDistance) {
                    if (distance === 0) {
                        const fallbackAngle = theta + Math.PI / 2;
                        dxLens = Math.cos(fallbackAngle);
                        dyLens = Math.sin(fallbackAngle);
                        distance = 1;
                    }
                    const normX = dxLens / distance;
                    const normY = dyLens / distance;
                    const delta = safeDistance - distance;
                    updateLabelPosition(normX * delta, normY * delta);
                }
            }

            const boundsPadding = labelCfg.boundsPadding ?? 10;
            if (this.overlay) {
                const ensureWithinBounds = () => {
                    let shifted = false;
                    if (boxX < boundsPadding) {
                        updateLabelPosition(boundsPadding - boxX, 0);
                        shifted = true;
                    } else if (boxX + boxWidth > this.overlay.width - boundsPadding) {
                        updateLabelPosition((this.overlay.width - boundsPadding) - (boxX + boxWidth), 0);
                        shifted = true;
                    }
                    if (boxY < boundsPadding) {
                        updateLabelPosition(0, boundsPadding - boxY);
                        shifted = true;
                    } else if (boxY + boxHeight > this.overlay.height - boundsPadding) {
                        updateLabelPosition(0, (this.overlay.height - boundsPadding) - (boxY + boxHeight));
                        shifted = true;
                    }
                    return shifted;
                };
                ensureWithinBounds();
            }

            ctx.save();
            ctx.beginPath();
            this._roundedRectPath(ctx, boxX, boxY, boxWidth, boxHeight, 6);
            ctx.fillStyle = this.lightStyle ? 'rgba(0, 0, 0, 0.7)' : 'rgba(4, 6, 14, 0.82)';
            ctx.strokeStyle = this.lightStyle ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1.4;
            ctx.shadowColor = this.lightStyle ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = this.lightStyle ? '#fefefe' : '#ffffff';
            ctx.strokeStyle = this.lightStyle ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.85)';
            ctx.lineWidth = 0.9;
            ctx.shadowColor = this.lightStyle ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 6;
            ctx.strokeText(alphaLabel, textX, textY);
            ctx.fillText(alphaLabel, textX, textY);
            ctx.restore();

            if (referenceCfg.showAlphaArc) {
                const normalizeAngle = (angle) => {
                    let a = angle;
                    while (a <= -Math.PI) a += Math.PI * 2;
                    while (a > Math.PI) a -= Math.PI * 2;
                    return a;
                };
                const delta = normalizeAngle(Math.atan2(dyCamera, dxCamera) - theta);
                const arcRadius = referenceCfg.arcRadiusPx ?? Math.min(Math.max(displayLengthPx * 0.65, 40), 150);
                const arcEnd = theta + delta;
                ctx.save();
                ctx.strokeStyle = referenceCfg.arcColor || (this.lightStyle ? 'rgba(255, 210, 120, 0.92)' : 'rgba(255, 230, 120, 0.9)');
                ctx.lineWidth = referenceCfg.arcLineWidth ?? 2.2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.arc(centerX, centerY, arcRadius, theta, arcEnd, delta < 0);
                ctx.stroke();
                ctx.setLineDash([]);
                const arcMarkerRadius = 4;
                const startMarkerX = centerX + Math.cos(theta) * arcRadius;
                const startMarkerY = centerY + Math.sin(theta) * arcRadius;
                const endMarkerX = centerX + Math.cos(arcEnd) * arcRadius;
                const endMarkerY = centerY + Math.sin(arcEnd) * arcRadius;
                ctx.fillStyle = referenceCfg.arcColor || (this.lightStyle ? '#ffe082' : '#ffdd66');
                ctx.beginPath();
                ctx.arc(startMarkerX, startMarkerY, arcMarkerRadius, 0, 2 * Math.PI);
                ctx.arc(endMarkerX, endMarkerY, arcMarkerRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();
            }

            if (shouldDrawZoom) {
                pendingZoomDraw = {
                    centerX,
                    centerY,
                    displayLengthPx,
                    displayWidthPx,
                    theta,
                    hillasParams,
                    cameraCenterX,
                    cameraCenterY
                };
            }

            try {
                const dx = centerX - cameraCenterX;
                const dy = centerY - cameraCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (this.respectExactHillas) {
                    console.log(`🔎 HillasOverlay: CoG(${centerX.toFixed(1)},${centerY.toFixed(1)}), CameraCenter(${cameraCenterX.toFixed(1)},${cameraCenterY.toFixed(1)}), Δ=(${dx.toFixed(1)},${dy.toFixed(1)}) px, r=${dist.toFixed(1)} px, canvas=${this.overlay.width}x${this.overlay.height}`);
                }

                ctx.save();
                ctx.fillStyle = '#ffff66';
                ctx.beginPath();
                ctx.arc(markerX, markerY, markerRadius, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = '#222200';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(markerX, markerY, markerRadius + 4, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.strokeStyle = this.lightStyle ? '#ffff00' : '#ffee00';
                ctx.lineWidth = 1.8;
                const s = Math.max(16, markerRadius * 2.4);
                ctx.beginPath();
                ctx.moveTo(markerX - s, markerY);
                ctx.lineTo(markerX + s, markerY);
                ctx.moveTo(markerX, markerY - s);
                ctx.lineTo(markerX, markerY + s);
                ctx.stroke();
                ctx.restore();

                try {
                    if (this.ctx) {
                        const main = this.ctx;
                        main.save();
                        main.strokeStyle = 'rgba(255, 255, 102, 0.9)';
                        main.fillStyle = 'rgba(255, 255, 102, 0.25)';
                        main.lineWidth = 2;
                        main.beginPath();
                        main.arc(markerX, markerY, markerRadius, 0, 2 * Math.PI);
                        main.fill();
                        main.stroke();

                        main.beginPath();
                        main.moveTo(markerX - 12, markerY);
                        main.lineTo(markerX + 12, markerY);
                        main.moveTo(markerX, markerY - 12);
                        main.lineTo(markerX, markerY + 12);
                        main.stroke();

                        if (referenceCfg.drawCameraCenterCross) {
                            const crossSize = referenceCfg.cameraCenterCrossSize ?? 12;
                            main.strokeStyle = 'rgba(255, 255, 170, 0.8)';
                            main.lineWidth = 1.2;
                            main.beginPath();
                            main.moveTo(cameraCenterX - crossSize, cameraCenterY);
                            main.lineTo(cameraCenterX + crossSize, cameraCenterY);
                            main.moveTo(cameraCenterX, cameraCenterY - crossSize);
                            main.lineTo(cameraCenterX, cameraCenterY + crossSize);
                            main.stroke();
                        }

                        main.fillStyle = 'rgba(204, 0, 102, 0.95)';
                        main.strokeStyle = 'rgba(255,255,255,0.9)';
                        main.lineWidth = 2;
                        main.beginPath();
                        main.arc(centerX, centerY, 6, 0, 2 * Math.PI);
                        main.fill();
                        main.stroke();
                        main.restore();
                    }
                } catch (innerErr) {
                    console.warn('Errore disegno CoG main canvas:', innerErr);
                }
            } catch (diagErr) {
                console.warn('Errore diagnostico HillasOverlay:', diagErr);
            }
        }, 4);

        if (pendingZoomDraw) {
            this._drawHoverZoomLens(
                ctx,
                pendingZoomDraw.centerX,
                pendingZoomDraw.centerY,
                pendingZoomDraw.displayLengthPx,
                pendingZoomDraw.displayWidthPx,
                pendingZoomDraw.theta,
                pendingZoomDraw.hillasParams,
                pendingZoomDraw.cameraCenterX,
                pendingZoomDraw.cameraCenterY
            );
        }
    }

    _drawArrow(ctx, startX, startY, endX, endY, options = {}) {
        if (!ctx) return;
        const color = options.color || '#ffffff';
        const lineWidth = options.lineWidth || 2;
        const arrowSize = options.arrowSize || 10;
        const dash = options.dash || null;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        if (Array.isArray(dash) && dash.length) {
            ctx.setLineDash(dash);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = arrowSize;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 8), endY - headLength * Math.sin(angle - Math.PI / 8));
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 8), endY - headLength * Math.sin(angle + Math.PI / 8));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    _getHoverLensGeometry(centerX, centerY, displayLengthPx, displayWidthPx) {
        if (!this.overlay || !this.hoverZoomConfig || !this.hoverZoomConfig.enabled) {
            return null;
        }
        const cfg = this.hoverZoomConfig;
        const zoomScale = Math.max(1.2, cfg.scale || 1.8);
        const lensRadius = cfg.radiusPx || Math.max(displayLengthPx, displayWidthPx) * zoomScale * 0.65;
        const padding = cfg.edgePadding ?? 4;
        const hoverLocked = typeof this.isHoverZoomLocked === 'function' && this.isHoverZoomLocked();
        let focusX = centerX;
        let focusY = centerY;
        if (hoverLocked) {
            const manualFocus = typeof this.getHoverZoomFocus === 'function' ? this.getHoverZoomFocus() : null;
            if (manualFocus && Number.isFinite(manualFocus.x) && Number.isFinite(manualFocus.y)) {
                focusX = manualFocus.x;
                focusY = manualFocus.y;
            }
        }

        const offsetX = hoverLocked ? 0 : (cfg.offsetX || 0);
        const offsetY = hoverLocked ? 0 : (cfg.offsetY || 0);
        const rawX = focusX + offsetX;
        const rawY = focusY + offsetY;
        const lensCenterX = Math.max(lensRadius + padding, Math.min(this.overlay.width - lensRadius - padding, rawX));
        const lensCenterY = Math.max(lensRadius + padding, Math.min(this.overlay.height - lensRadius - padding, rawY));
        return { centerX: lensCenterX, centerY: lensCenterY, radius: lensRadius, zoomScale };
    }

    _drawHoverZoomLens(ctx, centerX, centerY, displayLengthPx, displayWidthPx, theta, hillasParams, cameraCenterX, cameraCenterY) {
        const hoverLocked = typeof this.isHoverZoomLocked === 'function' && this.isHoverZoomLocked();
        if (!ctx || !this.hoverZoomConfig || !this.hoverZoomConfig.enabled) {
            return;
        }
        if (!hoverLocked && !this.isHovering) {
            return;
        }
        if (!this.canvas) return;

        const cfg = this.hoverZoomConfig;
        const lensGeometry = this._getHoverLensGeometry(centerX, centerY, displayLengthPx, displayWidthPx);
        if (!lensGeometry) return;
        const { centerX: lensCenterX, centerY: lensCenterY, radius: lensRadius, zoomScale } = lensGeometry;
        const manualFocus = hoverLocked && typeof this.getHoverZoomFocus === 'function' ? this.getHoverZoomFocus() : null;
        const focusX = manualFocus && Number.isFinite(manualFocus.x) ? manualFocus.x : centerX;
        const focusY = manualFocus && Number.isFinite(manualFocus.y) ? manualFocus.y : centerY;
        this._hoverLensGeometry = {
            centerX: lensCenterX,
            centerY: lensCenterY,
            radius: lensRadius
        };
        const directionCfg = this.alphaDirectionGuides || {};
        const dxCamera = (cameraCenterX ?? this.overlay.width / 2) - centerX;
        const dyCamera = (cameraCenterY ?? this.overlay.height / 2) - centerY;
        const distanceToCamera = Math.sqrt(dxCamera * dxCamera + dyCamera * dyCamera) || 1;
        const unitToCameraX = dxCamera / distanceToCamera;
        const unitToCameraY = dyCamera / distanceToCamera;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const unitCameraRotX = unitToCameraX * cosT + unitToCameraY * sinT;
        const unitCameraRotY = -unitToCameraX * sinT + unitToCameraY * cosT;

        ctx.save();
        ctx.beginPath();
        ctx.arc(lensCenterX, lensCenterY, lensRadius, 0, Math.PI * 2);
        ctx.closePath();
        if (cfg.overlayFill) {
            ctx.shadowColor = cfg.shadowColor || 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = cfg.shadowBlur ?? 18;
            ctx.fillStyle = cfg.overlayFill;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.clip();

        ctx.save();
        ctx.translate(lensCenterX - focusX * zoomScale, lensCenterY - focusY * zoomScale);
        ctx.scale(zoomScale, zoomScale);
        ctx.drawImage(this.canvas, 0, 0);
        ctx.restore();

        ctx.save();
        ctx.translate(lensCenterX - focusX * zoomScale, lensCenterY - focusY * zoomScale);
        ctx.scale(zoomScale, zoomScale);
        ctx.translate(centerX, centerY);
        ctx.rotate(theta);
        const zoomOutlineColor = this.lightStyle ? 'rgba(210, 40, 140, 0.85)' : 'rgba(0, 255, 205, 0.8)';
        ctx.lineWidth = (this.lightStyle ? 1.4 : 1.6) / zoomScale;
        ctx.strokeStyle = zoomOutlineColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, displayLengthPx, displayWidthPx, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([10 / zoomScale, 6 / zoomScale]);
        ctx.strokeStyle = this.lightStyle ? 'rgba(40, 60, 140, 0.55)' : 'rgba(80, 180, 255, 0.55)';
        ctx.beginPath();
        ctx.moveTo(-displayLengthPx, 0);
        ctx.lineTo(displayLengthPx, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -displayWidthPx);
        ctx.lineTo(0, displayWidthPx);
        ctx.stroke();

        if (directionCfg.enabled) {
            const majorAxisLength = directionCfg.majorAxisLengthPx ?? Math.max(displayLengthPx * 1.15, 40);
            const majorEndX = majorAxisLength;
            const majorEndY = 0;
            this._drawArrow(ctx, 0, 0, majorEndX, majorEndY, {
                color: directionCfg.majorAxisColor || (this.lightStyle ? 'rgba(255, 200, 120, 0.95)' : 'rgba(255, 200, 120, 0.95)'),
                lineWidth: (directionCfg.lineWidth || 2.2) / zoomScale,
                arrowSize: (directionCfg.arrowSize || 12) / zoomScale,
                dash: (directionCfg.majorAxisDash || [12, 6]).map(value => value / zoomScale)
            });

            const cameraRayLength = directionCfg.cameraRayLengthPx ?? (distanceToCamera + (directionCfg.cameraRayExtensionPx || 0));
            const rayEndX = unitCameraRotX * cameraRayLength;
            const rayEndY = unitCameraRotY * cameraRayLength;
            this._drawArrow(ctx, 0, 0, rayEndX, rayEndY, {
                color: directionCfg.cameraRayColor || (this.lightStyle ? 'rgba(120, 220, 255, 0.95)' : 'rgba(120, 220, 255, 0.95)'),
                lineWidth: (directionCfg.lineWidth || 2.2) / zoomScale,
                arrowSize: (directionCfg.arrowSize || 12) / zoomScale,
                dash: (directionCfg.cameraRayDash || [8, 6]).map(value => value / zoomScale)
            });

            const backtrack = Math.max(0, directionCfg.cameraRayBacktrackPx || 0);
            if (backtrack > 0) {
                ctx.save();
                ctx.setLineDash((directionCfg.cameraRayDash || [8, 6]).map(value => value / zoomScale));
                ctx.strokeStyle = directionCfg.cameraRayColor || (this.lightStyle ? 'rgba(120, 220, 255, 0.95)' : 'rgba(120, 220, 255, 0.95)');
                ctx.lineWidth = (directionCfg.lineWidth || 2.2) / zoomScale;
                ctx.beginPath();
                ctx.moveTo(-unitCameraRotX * backtrack, -unitCameraRotY * backtrack);
                ctx.lineTo(0, 0);
                ctx.stroke();
                ctx.restore();
            }
        }

        if (this.hoverZoomConfig.showAlphaArc && hillasParams) {
            const delta = Math.atan2(unitCameraRotY, unitCameraRotX);
            ctx.save();
            ctx.setLineDash([6 / zoomScale, 4 / zoomScale]);
            ctx.strokeStyle = this.hoverZoomConfig.arcColor || (this.lightStyle ? 'rgba(255, 210, 120, 0.85)' : 'rgba(255, 230, 120, 0.85)');
            ctx.lineWidth = (this.hoverZoomConfig.arcLineWidth || 2.2) / zoomScale;
            const arcRadius = Math.min(Math.max(displayLengthPx * 0.65, 40), 150);
            ctx.beginPath();
            ctx.arc(0, 0, arcRadius, 0, delta, delta < 0);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(lensCenterX, lensCenterY, lensRadius, 0, Math.PI * 2);
        ctx.strokeStyle = cfg.borderColor || 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = cfg.borderWidth || 2;
        ctx.stroke();
        ctx.restore();

        if (cfg.showLabel) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Zoom ×' + zoomScale.toFixed(1), lensCenterX, lensCenterY + lensRadius + 14);
            ctx.restore();
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

// Exposure/Sub-pixel UI helper rimosso (non più necessario)
