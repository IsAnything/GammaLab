/**
 * GAMMALAB - Visualization Module
 * Palette colori energetica e utilities per rendering
 * Gradiente: Blu (bassa E) → Bianco (alta E)
 */

// === PALETTE COLORI ENERGETICA ===
class EnergyColorPalette {
    constructor() {
        // Definizione palette: 7 punti di controllo
        this.colorStops = [
            { energy: 50,    color: { r: 0,   g: 102,  b: 255 } },  // Blu scuro (50 GeV)
            { energy: 200,   color: { r: 0,   g: 180,  b: 255 } },  // Cyan
            { energy: 1000,  color: { r: 0,   g: 255,  b: 180 } },  // Verde-Cyan (1 TeV)
            { energy: 5000,  color: { r: 100, g: 255,  b: 50  } },  // Verde brillante
            { energy: 10000, color: { r: 255, g: 255,  b: 0   } },  // Giallo (10 TeV)
            { energy: 30000, color: { r: 255, g: 150,  b: 0   } },  // Arancione (30 TeV)
            { energy: 50000, color: { r: 255, g: 50,   b: 50  } }   // Rosso-Bianco (50 TeV)
        ];

        // Energia massima per saturazione bianca
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

        // Saturazione bianca per energie ultra-alte
        if (energy >= this.maxEnergy * 0.95) {
            const whiteness = (energy - this.maxEnergy * 0.95) / (this.maxEnergy * 0.05);
            const r = 255;
            const g = 50 + Math.floor(whiteness * 205);
            const b = 50 + Math.floor(whiteness * 205);
            return `rgb(${r}, ${g}, ${b})`;
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
    }

    /**
     * Pulisce entrambi i canvas
     */
    clear() {
        this.ctx.fillStyle = '#000814';
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

        // Ordina tracce per intensità
        const sortedTracks = [...event.tracks].sort((a, b) => a.intensity - b.intensity);

        // Render fotoni
        sortedTracks.forEach(track => {
            this.renderPhoton(track);
        });

        // Griglia (opzionale)
        if (event.showGrid) {
            this.drawGrid();
        }

        // Legenda
        if (showLegend) {
            this.colorPalette.drawEnergyLegend(this.canvas);
        }

        // Info camera
        this.drawCameraInfo(event);
    }

    /**
     * Renderizza singolo fotone
     */
    renderPhoton(track) {
        const color = this.colorPalette.getColor(track.energy);
        const radius = this.intensityToRadius(track.intensity);
        const alpha = Math.min(1, track.intensity * 0.8 + 0.2);

        // Glow esterno
        const gradient = this.ctx.createRadialGradient(
            track.x, track.y, 0,
            track.x, track.y, radius * 2.5
        );
        gradient.addColorStop(0, this.colorPalette.getColorWithAlpha(track.energy, alpha));
        gradient.addColorStop(0.4, this.colorPalette.getColorWithAlpha(track.energy, alpha * 0.6));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(track.x, track.y, radius * 2.5, 0, 2 * Math.PI);
        this.ctx.fill();

        // Core brillante
        this.ctx.fillStyle = this.colorPalette.getColorWithAlpha(track.energy, alpha);
        this.ctx.beginPath();
        this.ctx.arc(track.x, track.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();

        // Punto centrale ultra-brillante
        if (track.intensity > 0.7) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.8) + ')';
            this.ctx.beginPath();
            this.ctx.arc(track.x, track.y, radius * 0.3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    /**
     * Converte intensità in raggio
     */
    intensityToRadius(intensity) {
        return 1.2 + intensity * 2.8;
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

        // Ellisse Hillas
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(theta);

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, hillasParams.lengthPx, hillasParams.widthPx, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Assi
        ctx.strokeStyle = '#ffaa00';
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
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Linea Alpha (CoG → Centro camera)
        const cameraCenterX = this.overlay.width / 2;
        const cameraCenterY = this.overlay.height / 2;
        ctx.strokeStyle = '#4488ff';
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
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.strokeStyle = '#000000';
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

// === EXPORT ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnergyColorPalette,
        CanvasRenderer,
        createHillasPanel,
        animateTransition
    };
}
