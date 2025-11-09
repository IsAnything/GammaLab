/**
 * GAMMALAB - Hillas Analysis Module
 * Calcolo robusto dei parametri di Hillas da eventi Cherenkov
 * Implementa algoritmo dei momenti con cleaning e validazione
 */

// === COSTANTI ===
// PIXEL_TO_DEGREE definito in core-simulation.js (0.01)
const MIN_PHOTONS = 50; // Minimo fotoni per analisi valida
const CLEANING_THRESHOLD = 0.3; // Soglia intensità per cleaning

// === CLASSE HILLAS ANALYZER ===
class HillasAnalyzer {
    constructor() {
        this.lastResult = null;
    }

    /**
     * Calcola parametri Hillas da un evento
     * @param {Object} event - Evento generato da SimulationEngine
     * @returns {Object} Parametri Hillas calcolati
     */
    analyze(event) {
        if (!event || !event.tracks || event.tracks.length < MIN_PHOTONS) {
            console.warn('Evento insufficiente per analisi Hillas');
            return null;
        }

        // 1. Image Cleaning
        const cleanedTracks = this._cleanImage(event.tracks);
        
        if (cleanedTracks.length < MIN_PHOTONS) {
            console.warn('Troppo pochi fotoni dopo cleaning');
            return null;
        }

        // 2. Calcola centro di gravità (CoG)
        const cog = this._computeCenterOfGravity(cleanedTracks);

        // 3. Calcola momenti di secondo ordine
        const moments = this._computeSecondMoments(cleanedTracks, cog);

        // 4. Diagonalizza matrice dei momenti
        const eigenvalues = this._diagonalize(moments);

        // 5. Calcola parametri Hillas (passa dimensioni canvas dall'evento)
        const canvasWidth = event.canvasWidth || 1500;
        const canvasHeight = event.canvasHeight || 1000;
        
        console.log(`🔍 Hillas Analysis - Canvas: ${canvasWidth}×${canvasHeight}, Center: (${canvasWidth/2}, ${canvasHeight/2})`);
        
        const params = this._computeHillasParameters(
            cleanedTracks,
            cog,
            moments,
            eigenvalues,
            canvasWidth,
            canvasHeight
        );

        // 6. Validazione
        const validated = this._validateParameters(params);

        this.lastResult = validated;
        return validated;
    }

    /**
     * Image Cleaning - rimuove fotoni sotto soglia
     */
    _cleanImage(tracks) {
        // Trova intensità massima
        const maxIntensity = Math.max(...tracks.map(t => t.intensity));
        const threshold = maxIntensity * CLEANING_THRESHOLD;

        // Filtra fotoni sotto soglia
        return tracks.filter(t => t.intensity >= threshold);
    }

    /**
     * Calcola Centro di Gravità (CoG) pesato per intensità
     */
    _computeCenterOfGravity(tracks) {
        let sumX = 0;
        let sumY = 0;
        let sumIntensity = 0;

        tracks.forEach(track => {
            sumX += track.x * track.intensity;
            sumY += track.y * track.intensity;
            sumIntensity += track.intensity;
        });

        return {
            x: sumX / sumIntensity,
            y: sumY / sumIntensity,
            totalIntensity: sumIntensity
        };
    }

    /**
     * Calcola momenti di secondo ordine
     */
    _computeSecondMoments(tracks, cog) {
        let mxx = 0;
        let myy = 0;
        let mxy = 0;

        tracks.forEach(track => {
            const dx = track.x - cog.x;
            const dy = track.y - cog.y;
            const w = track.intensity;

            mxx += w * dx * dx;
            myy += w * dy * dy;
            mxy += w * dx * dy;
        });

        // Normalizza
        const totalIntensity = cog.totalIntensity;
        mxx /= totalIntensity;
        myy /= totalIntensity;
        mxy /= totalIntensity;

        return { mxx, myy, mxy };
    }

    /**
     * Diagonalizza matrice dei momenti per trovare autovalori
     */
    _diagonalize(moments) {
        const { mxx, myy, mxy } = moments;

        // Calcola autovalori della matrice [[mxx, mxy], [mxy, myy]]
        const trace = mxx + myy;
        const det = mxx * myy - mxy * mxy;
        const discriminant = trace * trace / 4 - det;

        if (discriminant < 0) {
            console.warn('Discriminante negativo nella diagonalizzazione');
            return { lambda1: trace / 2, lambda2: trace / 2, theta: 0 };
        }

        const sqrtDisc = Math.sqrt(discriminant);
        const lambda1 = trace / 2 + sqrtDisc; // Autovalore maggiore
        const lambda2 = trace / 2 - sqrtDisc; // Autovalore minore

        // Angolo dell'asse maggiore
        let theta = 0;
        if (Math.abs(mxy) > 1e-6) {
            theta = Math.atan2(2 * mxy, mxx - myy) / 2;
        } else if (mxx > myy) {
            theta = 0;
        } else {
            theta = Math.PI / 2;
        }

        return { lambda1, lambda2, theta };
    }

    /**
     * Calcola tutti i parametri Hillas
     */
    _computeHillasParameters(tracks, cog, moments, eigenvalues, canvasWidth, canvasHeight) {
        const { lambda1, lambda2, theta } = eigenvalues;

        // Length e Width (RMS lungo assi principali)
        const lengthPx = 2 * Math.sqrt(lambda1); // Fattore 2 per FWHM-like
        const widthPx = 2 * Math.sqrt(lambda2);

        // Converti in gradi
        const length = lengthPx * PIXEL_TO_DEGREE;
        const width = widthPx * PIXEL_TO_DEGREE;

        // Size (intensità totale) - scala in modo più realistico
        // totalIntensity è già proporzionale al numero di fotoni e alla loro energia
        // Dividiamo per avere valori nell'ordine di centinaia/migliaia
        const size = cog.totalIntensity / 10; // Ridotta scala (era *100)

        // Centro camera: usa le dimensioni effettive del canvas
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        console.log(`📐 CoG: (${cog.x.toFixed(1)}, ${cog.y.toFixed(1)}), Center: (${centerX}, ${centerY}), Length: ${lengthPx.toFixed(1)}px, Width: ${widthPx.toFixed(1)}px`);
        
        // Miss (distanza CoG dal centro camera)
        const missPx = Math.sqrt(
            Math.pow(cog.x - centerX, 2) +
            Math.pow(cog.y - centerY, 2)
        );
        const miss = missPx * PIXEL_TO_DEGREE;

        // Alpha (angolo tra asse maggiore e direzione CoG→Centro)
        const dx = centerX - cog.x;
        const dy = centerY - cog.y;
        const psi = Math.atan2(dy, dx);
        let alpha = Math.abs(psi - theta);
        
        // Normalizza Alpha in [0, 90°]
        alpha = Math.min(alpha, Math.PI - alpha);
        alpha = (alpha * 180 / Math.PI);

        // Asimmetria (terzo momento lungo asse maggiore)
        const asymmetry = this._computeAsymmetry(tracks, cog, theta);

        // Elongation (Length/Width ratio)
        const elongation = widthPx > 0 ? lengthPx / widthPx : 0;

        return {
            length,          // gradi
            width,           // gradi
            size,            // photoelectrons
            alpha,           // gradi
            miss,            // gradi
            elongation,      // ratio
            asymmetry,       // [-1, 1]
            lengthPx,        // pixel (utile per debug)
            widthPx,         // pixel
            cogX: cog.x,
            cogY: cog.y,
            theta: theta * 180 / Math.PI,  // orientazione asse maggiore
            numPhotons: tracks.length
        };
    }

    /**
     * Calcola asimmetria (terzo momento)
     */
    _computeAsymmetry(tracks, cog, theta) {
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        let m3 = 0;
        let sumW = 0;

        tracks.forEach(track => {
            const dx = track.x - cog.x;
            const dy = track.y - cog.y;

            // Proietta lungo asse maggiore
            const dLong = dx * cosTheta + dy * sinTheta;
            const w = track.intensity;

            m3 += w * Math.pow(dLong, 3);
            sumW += w;
        });

        m3 /= sumW;

        // Normalizza
        const sigma = Math.sqrt(Math.abs(m3));
        return sigma > 0 ? m3 / Math.pow(sigma, 3) : 0;
    }

    /**
     * Valida parametri calcolati
     */
    _validateParameters(params) {
        const validated = { ...params, valid: true, warnings: [] };

        // Check bounds
        if (params.length < 0.05 || params.length > 1.0) {
            validated.warnings.push('Length fuori range fisico');
        }

        if (params.width < 0.02 || params.width > 0.5) {
            validated.warnings.push('Width fuori range fisico');
        }

        if (params.size < 100 || params.size > 10000) {
            validated.warnings.push('Size fuori range tipico');
        }

        // Elongation aumentata per accettare tracce gamma molto allungate (fino a 50:1)
        if (params.elongation < 1.0 || params.elongation > 50) {
            validated.warnings.push('Elongation anomala');
            validated.valid = false;
        }

        // Se troppi warning, marca come invalido
        if (validated.warnings.length > 2) {
            validated.valid = false;
        }

        return validated;
    }

    /**
     * Formatta parametri per visualizzazione
     */
    formatParameters(params) {
        if (!params) return 'N/A';

        return {
            Length: `${params.length.toFixed(3)}° (${params.lengthPx.toFixed(1)} px)`,
            Width: `${params.width.toFixed(3)}° (${params.widthPx.toFixed(1)} px)`,
            Size: `${params.size.toFixed(0)} p.e.`,
            Alpha: `${params.alpha.toFixed(1)}°`,
            Miss: `${params.miss.toFixed(2)}°`,
            'L/W': `${params.elongation.toFixed(2)}`,
            Asymmetry: `${params.asymmetry.toFixed(3)}`,
            Photons: params.numPhotons,
            Valid: params.valid ? '✓' : '✗'
        };
    }

    /**
     * Renderizza parametri Hillas su overlay canvas
     */
    drawHillasOverlay(params, canvas, cog) {
        if (!params || !params.valid) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = cog?.x || params.cogX;
        const centerY = cog?.y || params.cogY;
        const theta = (params.theta * Math.PI / 180);

        // Disegna ellisse Hillas
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(theta);

        // Ellisse (2σ)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, params.lengthPx, params.widthPx, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Assi principali
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-params.lengthPx, 0);
        ctx.lineTo(params.lengthPx, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -params.widthPx);
        ctx.lineTo(0, params.widthPx);
        ctx.stroke();

        ctx.restore();

        // Centro di gravità
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Linea verso centro camera (per Alpha)
        const cameraCenterX = canvas.width / 2;
        const cameraCenterY = canvas.height / 2;
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(cameraCenterX, cameraCenterY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// === FUNZIONI DI UTILITY ===

/**
 * Confronta parametri Hillas tra multiple camere
 */
function compareHillasAcrossCameras(hillasArray) {
    if (hillasArray.length < 2) return null;

    const avg = {
        length: 0,
        width: 0,
        size: 0,
        alpha: 0
    };

    hillasArray.forEach(h => {
        avg.length += h.length;
        avg.width += h.width;
        avg.size += h.size;
        avg.alpha += h.alpha;
    });

    const n = hillasArray.length;
    Object.keys(avg).forEach(key => {
        avg[key] /= n;
    });

    // Calcola varianza
    const variance = {
        length: 0,
        width: 0,
        size: 0,
        alpha: 0
    };

    hillasArray.forEach(h => {
        variance.length += Math.pow(h.length - avg.length, 2);
        variance.width += Math.pow(h.width - avg.width, 2);
        variance.size += Math.pow(h.size - avg.size, 2);
        variance.alpha += Math.pow(h.alpha - avg.alpha, 2);
    });

    Object.keys(variance).forEach(key => {
        variance[key] = Math.sqrt(variance[key] / n);
    });

    // Coerenza (1 - CV medio)
    const cv = {
        length: variance.length / avg.length,
        width: variance.width / avg.width,
        size: variance.size / avg.size,
        alpha: avg.alpha > 0 ? variance.alpha / avg.alpha : 0
    };

    const avgCV = (cv.length + cv.width + cv.size + cv.alpha) / 4;
    const coherence = Math.max(0, 1 - avgCV);

    return {
        average: avg,
        variance: variance,
        coherence: coherence * 100, // percentuale
        numCameras: n
    };
}

/**
 * Applica tagli Hillas standard per selezione gamma
 */
function applyStandardCuts(params) {
    const cuts = {
        passed: true,
        details: {}
    };

    // Width cut (più discriminante)
    cuts.details.widthCut = params.width < 0.20; // < 0.20° = 20 px
    if (!cuts.details.widthCut) cuts.passed = false;

    // Size cut (minimo segnale)
    cuts.details.sizeCut = params.size > 200;
    if (!cuts.details.sizeCut) cuts.passed = false;

    // Alpha cut (sorgente puntiforme)
    cuts.details.alphaCut = params.alpha < 15; // < 15°
    if (!cuts.details.alphaCut) cuts.passed = false;

    // Elongation cut (evita eventi troppo rotondi o troppo allungati)
    cuts.details.elongationCut = params.elongation > 1.5 && params.elongation < 5;
    if (!cuts.details.elongationCut) cuts.passed = false;

    return cuts;
}
