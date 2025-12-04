/**
 * GAMMALAB - Visualization Module
 * Gestione rendering canvas, griglia esagonale e visualizzazione eventi
 */

class CanvasRenderer {
    constructor(canvasId, overlayId) {
        this.canvas = document.getElementById(canvasId);
        this.overlay = document.getElementById(overlayId);
        
        if (!this.canvas) {
            console.error(`Canvas ${canvasId} not found!`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for non-transparent background
        this.overlayCtx = this.overlay ? this.overlay.getContext('2d') : null;
        
        // Configurazione Camera
        this.pixels = [];
        this.pixelSize = 12; // Dimensione pixel esagonale
        this.gridRadius = 15; // Anelli di pixel
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Stato
        this.currentEvent = null;
        this.colorPalette = null; // Sarà iniettato
        this.sourceType = null;   // Per visualizzazione specifica
        
        // Opzioni visualizzazione
        this.showHillas = true;
        this.showGrid = true;
        this.lightStyle = false; // Nuovo stile chiaro per quiz
        this.signatureHintsEnabled = false; // Disabilita hint visivi per quiz
        this.suppressNoise = false; // Soppressione rumore per quiz
        
        // Opzioni Hillas Overlay
        this.showHillasOnHover = false;
        this.embedHillasOutline = false;
        this.showEllipseOnly = false;
        this.respectExactHillas = false; // Se true, disegna l'ellisse esattamente come calcolata (senza arrotondamenti estetici)
        this.subpixelEnabled = false; // Se true, usa rendering subpixel per maggiore precisione
        
        // Opzioni Alpha Overlay
        this.alphaLabelConfig = {
            mode: 'standard', // 'standard', 'perpendicular'
            alongFraction: 0.5,
            lateralOffset: 0,
            textAlign: 'center'
        };
        this.alphaMarkerConfig = {
            cameraMarkerMode: 'none', // 'none', 'center', 'offset'
            cameraMarkerOffset: 0,
            drawCameraCenterCross: false,
            cameraCenterCrossSize: 10,
            cameraMarkerRadius: 5,
            showAlphaArc: false,
            arcRadiusPx: 100,
            arcLineWidth: 2
        };
        this.alphaDirectionConfig = {
            enabled: false,
            majorAxisColor: 'rgba(255, 255, 0, 0.8)',
            cameraRayColor: 'rgba(0, 255, 255, 0.8)',
            lineWidth: 2,
            arrowSize: 10,
            majorAxisLengthPx: 100,
            cameraRayExtensionPx: 20,
            cameraRayLengthPx: 150,
            cameraRayBacktrackPx: 0
        };
        
        // Opzioni Hover Zoom
        this.hoverZoomConfig = {
            enabled: false,
            scale: 2.0,
            radiusPx: 100,
            offsetX: 0,
            offsetY: 0,
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2,
            overlayFill: 'rgba(0, 0, 0, 0.5)',
            showAlphaArc: false,
            arcColor: 'rgba(255, 255, 0, 0.5)'
        };
        
        // Inizializzazione
        this.initGrid();
        
        // Event listeners
        if (this.overlay) {
            this.overlay.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.overlay.addEventListener('mouseleave', () => this.handleMouseLeave());
        }
        
        // Resize observer per gestire ridimensionamento
        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(this.canvas);
    }

    /**
     * Inizializza la griglia esagonale di pixel
     */
    initGrid() {
        this.pixels = [];
        
        // Generazione griglia esagonale (coordinate assiali)
        for (let q = -this.gridRadius; q <= this.gridRadius; q++) {
            let r1 = Math.max(-this.gridRadius, -q - this.gridRadius);
            let r2 = Math.min(this.gridRadius, -q + this.gridRadius);
            
            for (let r = r1; r <= r2; r++) {
                const x = this.centerX + this.pixelSize * 1.5 * q;
                const y = this.centerY + this.pixelSize * Math.sqrt(3) * (r + q/2);
                
                this.pixels.push({
                    q: q,
                    r: r,
                    x: x,
                    y: y,
                    value: 0, // Fotoni
                    noise: 0  // Rumore NSB
                });
            }
        }
    }

    /**
     * Gestisce il ridimensionamento del canvas
     */
    handleResize() {
        // Aggiorna centro
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Rigenera griglia
        this.initGrid();
        
        // Ridisegna se c'è un evento
        if (this.currentEvent) {
            this.renderEvent(this.currentEvent);
        } else {
            this.clear();
        }
    }

    /**
     * Pulisce il canvas
     */
    clear() {
        // Sfondo scuro realistico o chiaro per quiz
        this.ctx.fillStyle = this.lightStyle ? '#f0f4f8' : '#0a0b10';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.overlayCtx) {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }
        
        // Disegna griglia vuota
        if (this.showGrid) {
            this.drawGrid();
        }
    }

    /**
     * Disegna la griglia esagonale di base
     */
    drawGrid() {
        this.ctx.strokeStyle = this.lightStyle ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;
        
        this.pixels.forEach(pixel => {
            this.drawHexagon(pixel.x, pixel.y, this.pixelSize - 1, false);
        });
    }

    /**
     * Disegna un singolo esagono
     */
    drawHexagon(x, y, size, fill = false) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        
        if (fill) this.ctx.fill();
        else this.ctx.stroke();
    }

    /**
     * Renderizza un evento completo
     */
    renderEvent(event, animate = false) {
        this.currentEvent = event;
        this.clear();
        
        // Mappa i fotoni sui pixel
        // Reset valori
        this.pixels.forEach(p => {
            p.value = 0;
            p.noise = 0;
        });
        
        // Aggiungi segnale
        event.photons.forEach(photon => {
            // Trova pixel più vicino (semplificato)
            // In una simulazione reale si userebbe la geometria esagonale corretta
            let minDist = Infinity;
            let nearestPixel = null;
            
            // Ottimizzazione: cerca solo nei dintorni
            // Per ora scansione lineare (si può ottimizzare con mappa spaziale)
            this.pixels.forEach(pixel => {
                const dx = pixel.x - photon.x;
                const dy = pixel.y - photon.y;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < this.pixelSize * this.pixelSize * 4) { // Cutoff
                    if (distSq < minDist) {
                        minDist = distSq;
                        nearestPixel = pixel;
                    }
                }
            });
            
            if (nearestPixel && minDist < this.pixelSize * this.pixelSize) {
                nearestPixel.value += 1;
            }
        });
        
        // Aggiungi rumore (se presente nell'evento e non soppresso)
        if (event.noise && !this.suppressNoise) {
            event.noise.forEach(noisePhoton => {
                // Logica simile per il rumore
                let minDist = Infinity;
                let nearestPixel = null;
                
                this.pixels.forEach(pixel => {
                    const dx = pixel.x - noisePhoton.x;
                    const dy = pixel.y - noisePhoton.y;
                    const distSq = dx*dx + dy*dy;
                    
                    if (distSq < minDist) {
                        minDist = distSq;
                        nearestPixel = pixel;
                    }
                });
                
                if (nearestPixel && minDist < this.pixelSize * this.pixelSize) {
                    nearestPixel.noise += 1;
                }
            });
        }
        
        // Disegna pixel attivi
        this.pixels.forEach(pixel => {
            const totalSignal = pixel.value + pixel.noise;
            
            if (totalSignal > 0) {
                // Colore basato su intensità (scala logaritmica)
                // Usa palette se disponibile
                let color;
                if (this.colorPalette) {
                    // Normalizza segnale (0-100 p.e.)
                    const intensity = Math.min(1, totalSignal / 50);
                    color = this.colorPalette.getColor(intensity, this.sourceType);
                } else {
                    // Fallback
                    const intensity = Math.min(255, totalSignal * 10);
                    color = `rgb(${intensity}, ${intensity}, 255)`;
                }
                
                this.ctx.fillStyle = color;
                this.drawHexagon(pixel.x, pixel.y, this.pixelSize - 0.5, true);
            }
        });
        
        // Disegna hint firma sorgente (se abilitato)
        if (this.signatureHintsEnabled && this.sourceType) {
            this.drawSignatureHint();
        }
    }

    /**
     * Disegna hint visivi specifici per la sorgente (didattica)
     */
    drawSignatureHint() {
        if (!this.overlayCtx) return;
        
        const ctx = this.overlayCtx;
        const w = this.overlay.width;
        const h = this.overlay.height;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        
        switch(this.sourceType) {
            case 'crab':
                // Cerchio centrale (puntiforme)
                ctx.beginPath();
                ctx.arc(w/2, h/2, 30, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'pevatron':
                // Cerchio grande (esteso)
                ctx.beginPath();
                ctx.arc(w/2, h/2, 80, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'blazar':
                // Mirino (puntiforme preciso)
                ctx.beginPath();
                ctx.moveTo(w/2 - 20, h/2);
                ctx.lineTo(w/2 + 20, h/2);
                ctx.moveTo(w/2, h/2 - 20);
                ctx.lineTo(w/2, h/2 + 20);
                ctx.stroke();
                break;
                
            case 'hadron':
                // Sparso (nessun hint geometrico preciso)
                break;
        }
        
        ctx.restore();
    }

    /**
     * Disegna overlay parametri Hillas
     */
    renderHillasOverlay(hillas) {
        if (!this.overlayCtx || !hillas || !hillas.valid) return;
        
        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        
        // Se embedHillasOutline è attivo, disegna l'ellisse direttamente nel canvas principale
        // Altrimenti disegna nell'overlay
        const targetCtx = this.embedHillasOutline ? this.ctx : ctx;
        
        targetCtx.save();
        
        // Coordinate centro di gravità
        const cx = hillas.cogX;
        const cy = hillas.cogY;
        
        // Assi
        const length = hillas.lengthPx;
        const width = hillas.widthPx;
        const delta = hillas.delta; // Angolo in radianti
        
        // Trasformazione per disegnare ellisse ruotata
        targetCtx.translate(cx, cy);
        targetCtx.rotate(delta);
        
        // Disegna ellisse
        targetCtx.beginPath();
        
        // Se respectExactHillas è true, usa le dimensioni esatte calcolate
        // Altrimenti usa un fattore di scala (spesso 2.0 o 1.5) per visibilità
        const scaleFactor = this.respectExactHillas ? 2.0 : 2.0; 
        
        targetCtx.ellipse(0, 0, length * scaleFactor, width * scaleFactor, 0, 0, 2 * Math.PI);
        
        // Stile ellisse
        if (this.lightStyle) {
            targetCtx.strokeStyle = 'rgba(0, 100, 255, 0.8)'; // Blu scuro per sfondo chiaro
            targetCtx.lineWidth = 2;
        } else {
            targetCtx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Ciano per sfondo scuro
            targetCtx.lineWidth = 2;
        }
        
        targetCtx.stroke();
        
        // Assi principali (solo se non showEllipseOnly)
        if (!this.showEllipseOnly) {
            // Asse maggiore
            targetCtx.beginPath();
            targetCtx.moveTo(-length * 2.5, 0);
            targetCtx.lineTo(length * 2.5, 0);
            targetCtx.strokeStyle = this.lightStyle ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';
            targetCtx.setLineDash([5, 5]);
            targetCtx.stroke();
            
            // Asse minore
            targetCtx.beginPath();
            targetCtx.moveTo(0, -width * 2.5);
            targetCtx.lineTo(0, width * 2.5);
            targetCtx.stroke();
        }
        
        targetCtx.restore();
        
        // Disegna CoG
        if (!this.showEllipseOnly) {
            targetCtx.beginPath();
            targetCtx.arc(cx, cy, 4, 0, Math.PI * 2);
            targetCtx.fillStyle = '#ff0000';
            targetCtx.fill();
        }

        // Disegna Alpha Direction Guides (se abilitato)
        if (this.alphaDirectionConfig.enabled && !this.showEllipseOnly) {
            this._drawAlphaDirectionGuides(targetCtx, hillas);
        }

        // Disegna Alpha Reference Markers (se abilitato)
        if (this.alphaMarkerConfig.cameraMarkerMode !== 'none' && !this.showEllipseOnly) {
            this._drawAlphaReferenceMarkers(targetCtx, hillas);
        }
    }

    /**
     * Disegna guide visuali per l'angolo Alpha
     */
    _drawAlphaDirectionGuides(ctx, hillas) {
        const cfg = this.alphaDirectionConfig;
        const cx = hillas.cogX;
        const cy = hillas.cogY;
        const delta = hillas.delta; // Angolo asse maggiore in radianti

        ctx.save();
        ctx.lineWidth = cfg.lineWidth;

        // 1. Linea lungo l'asse maggiore (estesa)
        ctx.strokeStyle = cfg.majorAxisColor;
        ctx.beginPath();
        // Calcola punti estremi lungo l'asse maggiore
        const len = cfg.majorAxisLengthPx;
        const x1 = cx - len * Math.cos(delta);
        const y1 = cy - len * Math.sin(delta);
        const x2 = cx + len * Math.cos(delta);
        const y2 = cy + len * Math.sin(delta);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // 2. Linea dal CoG verso il centro camera (o punto di riferimento)
        // Assumiamo centro camera per Alpha standard
        const camCenterX = this.canvas.width / 2;
        const camCenterY = this.canvas.height / 2;
        
        // Vettore CoG -> Centro Camera
        const dx = camCenterX - cx;
        const dy = camCenterY - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angleToCenter = Math.atan2(dy, dx);

        // Disegna raggio verso il centro
        ctx.strokeStyle = cfg.cameraRayColor;
        ctx.beginPath();
        
        // Backtrack (estensione all'indietro dal CoG)
        const backX = cx - cfg.cameraRayBacktrackPx * Math.cos(angleToCenter);
        const backY = cy - cfg.cameraRayBacktrackPx * Math.sin(angleToCenter);
        
        // Forward (estensione verso/oltre il centro)
        const fwdLen = dist + cfg.cameraRayExtensionPx;
        const fwdX = cx + fwdLen * Math.cos(angleToCenter);
        const fwdY = cy + fwdLen * Math.sin(angleToCenter);

        ctx.moveTo(backX, backY);
        ctx.lineTo(fwdX, fwdY);
        ctx.stroke();

        // Freccia verso il centro camera
        if (cfg.arrowSize > 0) {
            this._drawArrowHead(ctx, fwdX, fwdY, angleToCenter, cfg.arrowSize);
        }

        ctx.restore();
    }

    /**
     * Disegna marker di riferimento per Alpha (centro camera, arco angolo)
     */
    _drawAlphaReferenceMarkers(ctx, hillas) {
        const cfg = this.alphaMarkerConfig;
        const camCenterX = this.canvas.width / 2;
        const camCenterY = this.canvas.height / 2;

        ctx.save();

        // 1. Marker Centro Camera
        if (cfg.drawCameraCenterCross) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            const s = cfg.cameraCenterCrossSize;
            ctx.beginPath();
            ctx.moveTo(camCenterX - s, camCenterY);
            ctx.lineTo(camCenterX + s, camCenterY);
            ctx.moveTo(camCenterX, camCenterY - s);
            ctx.lineTo(camCenterX, camCenterY + s);
            ctx.stroke();
        }

        // 2. Marker Offset (se mode è 'offset')
        // Utile per mostrare il punto di impatto ricostruito vs centro camera
        if (cfg.cameraMarkerMode === 'offset') {
            // Calcola punto di intersezione asse maggiore con linea CoG-Centro
            // (Semplificazione visuale: proiettiamo lungo l'asse maggiore verso il centro)
            // In realtà Alpha è l'angolo tra queste due linee.
            
            // Disegna arco Alpha
            if (cfg.showAlphaArc) {
                const cx = hillas.cogX;
                const cy = hillas.cogY;
                const delta = hillas.delta;
                
                // Angolo verso il centro
                const angleToCenter = Math.atan2(camCenterY - cy, camCenterX - cx);
                
                // Normalizza angoli
                let startAngle = delta;
                let endAngle = angleToCenter;
                
                // Assicura arco minore
                let diff = endAngle - startAngle;
                while (diff <= -Math.PI) diff += 2*Math.PI;
                while (diff > Math.PI) diff -= 2*Math.PI;
                
                if (diff < 0) {
                    const temp = startAngle;
                    startAngle = endAngle;
                    endAngle = temp;
                }

                ctx.beginPath();
                ctx.arc(cx, cy, cfg.arcRadiusPx, startAngle, endAngle);
                ctx.strokeStyle = 'rgba(255, 210, 120, 0.8)'; // Colore Alpha
                ctx.lineWidth = cfg.arcLineWidth;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                
                // Label "α"
                const midAngle = startAngle + diff/2;
                const labelR = cfg.arcRadiusPx + 15;
                const lx = cx + labelR * Math.cos(midAngle);
                const ly = cy + labelR * Math.sin(midAngle);
                
                ctx.fillStyle = 'rgba(255, 210, 120, 1)';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('α', lx, ly);
            }
        }

        ctx.restore();
    }

    /**
     * Helper per disegnare punta freccia
     */
    _drawArrowHead(ctx, x, y, angle, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    /**
     * Gestione movimento mouse per hover effects
     */
    handleMouseMove(e) {
        if (!this.showHillasOnHover || !this.currentEvent) return;
        
        // Se abbiamo un evento e Hillas è valido, mostra overlay
        // Nota: Hillas params dovrebbero essere calcolati esternamente e passati
        // Qui assumiamo che renderHillasOverlay venga chiamato dal main loop o evento
        
        // Implementazione Hover Zoom (Lente d'ingrandimento)
        if (this.hoverZoomConfig.enabled) {
            const rect = this.overlay.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            
            this._renderHoverZoom(mx, my);
        }
    }

    handleMouseLeave() {
        if (this.hoverZoomConfig.enabled) {
            // Ridisegna normale senza zoom
            // Richiede accesso all'ultimo stato Hillas... 
            // Per ora puliamo solo l'overlay extra se presente, ma renderHillasOverlay pulisce tutto.
            // Idealmente dovremmo ridisegnare l'ultimo frame valido.
            // Hack: forziamo un redraw se possibile o lasciamo pulito se non c'è persistenza
        }
    }

    /**
     * Renderizza la lente d'ingrandimento
     */
    _renderHoverZoom(mx, my) {
        if (!this.overlayCtx) return;
        const ctx = this.overlayCtx;
        const cfg = this.hoverZoomConfig;
        
        // Non pulire tutto, disegna sopra!
        
        ctx.save();
        
        // Clip region circolare per la lente
        ctx.beginPath();
        ctx.arc(mx + cfg.offsetX, my + cfg.offsetY, cfg.radiusPx, 0, Math.PI * 2);
        ctx.clip();
        
        // Sfondo lente (scuro semitrasparente per contrasto)
        ctx.fillStyle = cfg.overlayFill;
        ctx.fill();
        
        // Disegna contenuto ingrandito
        // Copia dal canvas principale
        // source: (mx - r/scale, my - r/scale, 2r/scale, 2r/scale)
        // dest: (mx - r, my - r, 2r, 2r)
        
        const s = cfg.scale;
        const r = cfg.radiusPx;
        const srcW = (r * 2) / s;
        const srcH = (r * 2) / s;
        const srcX = mx - srcW / 2;
        const srcY = my - srcH / 2;
        
        const dstX = mx + cfg.offsetX - r;
        const dstY = my + cfg.offsetY - r;
        const dstW = r * 2;
        const dstH = r * 2;
        
        // Disegna immagine ingrandita
        ctx.drawImage(this.canvas, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
        
        // Bordo lente
        ctx.beginPath();
        ctx.arc(mx + cfg.offsetX, my + cfg.offsetY, r, 0, Math.PI * 2);
        ctx.strokeStyle = cfg.borderColor;
        ctx.lineWidth = cfg.borderWidth;
        ctx.stroke();
        
        ctx.restore();
    }

    // Metodi di configurazione
    setSignatureHintsEnabled(enabled) {
        this.signatureHintsEnabled = enabled;
    }

    enableHoverHillasMode() {
        this.showHillasOnHover = true;
    }

    configureAlphaLabelPlacement(config) {
        this.alphaLabelConfig = { ...this.alphaLabelConfig, ...config };
    }

    configureAlphaReferenceMarkers(config) {
        this.alphaMarkerConfig = { ...this.alphaMarkerConfig, ...config };
    }

    configureAlphaDirectionGuides(config) {
        this.alphaDirectionConfig = { ...this.alphaDirectionConfig, ...config };
    }

    configureHoverZoom(config) {
        this.hoverZoomConfig = { ...this.hoverZoomConfig, ...config };
    }
}

/**
 * Funzione helper per renderizzare camera esagonale (legacy support)
 */
function renderHexCamera(canvasId, event, options = {}) {
    const renderer = new CanvasRenderer(canvasId, null);
    if (options.lightStyle) renderer.lightStyle = true;
    if (options.suppressNoise) renderer.suppressNoise = true;
    
    renderer.renderEvent(event);
    return renderer;
}
