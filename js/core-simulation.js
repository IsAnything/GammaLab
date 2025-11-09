/**
 * GAMMALAB - Core Simulation Engine
 * Motore principale per la generazione e rendering di eventi Cherenkov
 * Supporta 6 tipi di sorgenti con parametri Hillas realistici
 */

// === COSTANTI GLOBALI ===
const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 1000;
const FOV_WIDTH = 15.0;  // gradi
const FOV_HEIGHT = 10.0; // gradi
const PIXEL_TO_DEGREE = FOV_WIDTH / CANVAS_WIDTH; // 0.01 gradi/pixel
const DEGREE_TO_PIXEL = CANVAS_WIDTH / FOV_WIDTH; // 100 pixel/grado

// Parametri fisici
const PHOTON_ENERGY_MIN = 50;   // GeV
const PHOTON_ENERGY_MAX = 50000; // GeV (50 TeV)
const TRACK_BASE_PHOTONS = 800;
const TRACK_PHOTONS_VARIANCE = 400;

// Parametri telescopi
const TELESCOPE_POSITIONS = [
    { id: 1, x: 0, y: 0, label: "Tel 1" },
    { id: 2, x: 100, y: 0, label: "Tel 2" },
    { id: 3, x: 50, y: 86.6, label: "Tel 3" }  // triangolo equilatero
];

// === CLASSE PRINCIPALE: SimulationEngine ===
class SimulationEngine {
    constructor() {
        this.currentEvent = null;
        this.colorPalette = null; // Sarà inizializzata da visualization.js
    }

    /**
     * Genera un evento completo per una sorgente specifica
     * @param {Object} sourceProfile - Profilo sorgente da source-profiles.js
     * @param {Number} cameraId - ID camera (1-3)
     * @param {Object} canvasSize - Dimensioni canvas {width, height} (opzionale, default 1500x1000)
     * @param {Object} customParams - Parametri personalizzati: {energy: Number, zenithAngle: Number}
     * @returns {Object} Evento generato con tracce e parametri
     */
    generateEvent(sourceProfile, cameraId = 1, canvasSize = null, customParams = null) {
        // Log per debug
        if (!sourceProfile || !sourceProfile.type) {
            console.error('❌ sourceProfile non valido:', sourceProfile);
            return null;
        }
        
        // Usa dimensioni canvas passate o default
        const canvasW = canvasSize?.width || CANVAS_WIDTH;
        const canvasH = canvasSize?.height || CANVAS_HEIGHT;
        
        // Estrai parametri dal profilo
        const baseParams = this._sampleFromProfile(sourceProfile);
        
        // Aggiungi varianza inter-camera
        const cameraVariance = sourceProfile.interCameraVariance || 0.05;
        const params = this._applyCameraVariance(baseParams, cameraVariance, cameraId);
        
        // Genera energia del fotone primario (custom o random)
        const energy = customParams?.energy || this._sampleEnergy(sourceProfile.energyRange);
        
        // Applica effetti angolo zenitale se fornito
        const zenithAngle = customParams?.zenithAngle || 0;
        if (zenithAngle > 0) {
            this._applyZenithEffects(params, zenithAngle, energy);
        }
        
        // Genera tracce Cherenkov con dimensioni canvas
        const tracks = this._generateTracks(params, energy, canvasW, canvasH);
        
        // Crea l'evento
        const event = {
            sourceType: sourceProfile.type,
            cameraId: cameraId,
            energy: energy,
            zenithAngle: zenithAngle,
            params: params,
            tracks: tracks,
            canvasWidth: canvasW,
            canvasHeight: canvasH,
            timestamp: Date.now()
        };
        
        this.currentEvent = event;
        return event;
    }

    /**
     * Campiona parametri dal profilo sorgente
     */
    _sampleFromProfile(profile) {
        // Validazione profilo
        if (!profile.length || !profile.width || !profile.size) {
            console.error('❌ Profilo incompleto:', {
                type: profile.type,
                name: profile.displayName,
                length: profile.length,
                width: profile.width,
                size: profile.size
            });
            // Valori di fallback
            return {
                length: 0.2,
                width: 0.1,
                size: 1000,
                alpha: 0,
                elongation: 0.3,
                asymmetry: { mean: 0.1, std: 0.05 }
            };
        }
        
        return {
            length: this._randomInRange(profile.length.min, profile.length.max),
            width: this._randomInRange(profile.width.min, profile.width.max),
            size: this._randomInRange(profile.size.min, profile.size.max),
            alpha: this._randomFromDistribution(profile.alpha),
            elongation: profile.elongation || 0.3,
            asymmetry: profile.asymmetry || { mean: 0.1, std: 0.05 }
        };
    }

    /**
     * Applica varianza tra camere diverse
     */
    _applyCameraVariance(params, variance, cameraId) {
        const seed = cameraId * 0.1; // Seed diverso per camera
        const factor = 1 + (Math.random() - 0.5) * 2 * variance;
        
        return {
            length: params.length * factor,
            width: params.width * (1 + (Math.random() - 0.5) * variance),
            size: Math.max(100, params.size * factor),
            alpha: params.alpha + (Math.random() - 0.5) * variance * 10,
            elongation: params.elongation,
            asymmetry: params.asymmetry
        };
    }

    /**
     * Applica effetti dell'angolo zenitale ai parametri della cascata
     * @param {Object} params - Parametri Hillas
     * @param {Number} zenithAngle - Angolo zenitale in gradi (0-60)
     * @param {Number} energy - Energia in GeV
     */
    _applyZenithEffects(params, zenithAngle, energy) {
        // A angoli zenitali maggiori:
        // 1. La cascata attraversa più atmosfera → più fotoni Cherenkov
        // 2. La cascata appare più lunga (proiezione geometrica)
        // 3. Width rimane circa costante
        // 4. Più scattering → leggero aumento width per energie basse
        
        const zenithRad = zenithAngle * Math.PI / 180;
        const cosZenith = Math.cos(zenithRad);
        
        // Fattore di allungamento geometrico (1/cos(θ))
        const lengthFactor = 1 / cosZenith;
        
        // Effetto energia: a bassa energia più scattering
        const energyTeV = energy / 1000;
        const scatteringFactor = energyTeV < 1 ? 1 + (1 - energyTeV) * 0.3 : 1;
        
        // Applica modifiche
        params.length *= lengthFactor;
        params.width *= (1 + (1 - cosZenith) * 0.15 * scatteringFactor);
        params.size *= (1 + (1 - cosZenith) * 0.5); // Più fotoni attraverso atmosfera
    }

    /**
     * Campiona energia dalla distribuzione della sorgente
     */
    _sampleEnergy(energyRange) {
        const { min, max, spectralIndex } = energyRange;
        
        // Spettro a legge di potenza: dN/dE ~ E^(-Γ)
        const gamma = spectralIndex || 2.5;
        const g1 = 1 - gamma;
        
        if (Math.abs(g1) < 0.01) {
            // Caso Γ ≈ 1 (logaritmico)
            return min * Math.pow(max / min, Math.random());
        }
        
        // Caso generale
        const r = Math.random();
        const E = Math.pow(
            Math.pow(min, g1) + r * (Math.pow(max, g1) - Math.pow(min, g1)),
            1 / g1
        );
        
        return Math.max(min, Math.min(max, E));
    }

    /**
     * Genera le tracce Cherenkov sul piano camera
     */
    _generateTracks(params, energy, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT) {
        // Validazione parametri
        if (!params || typeof params.length !== 'number' || typeof params.width !== 'number' ||
            !isFinite(params.length) || !isFinite(params.width) ||
            !isFinite(params.size)) {
            console.error('❌ Parametri non validi in _generateTracks:', params);
            return [];
        }
        
        const tracks = [];
        
    // Numero di fotoni proporzionale a Size con maggiore variabilità
    // Alcune tracce dense, altre rarefatte
    const densityFactor = 0.3 + Math.random() * 1.4; // Fattore 0.3-1.7 (variabilità ~5x)
    const requestedPhotons = Math.floor(params.size * densityFactor);
    const MAX_PHOTONS = 4000;
    const numPhotons = Math.min(requestedPhotons, MAX_PHOTONS);
        
        // Centro della traccia - maggiore dispersione per tracce anche vicino ai bordi
        const dispersionX = canvasWidth * 0.35;  // 35% della larghezza (era 15%)
        const dispersionY = canvasHeight * 0.35; // 35% dell'altezza (era 15%)
        const centerX = canvasWidth / 2 + (Math.random() - 0.5) * dispersionX;
        const centerY = canvasHeight / 2 + (Math.random() - 0.5) * dispersionY;
        
        // Angolo di orientazione (random)
        const theta = Math.random() * 2 * Math.PI;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        
        // Converti Length e Width da gradi a pixel
        // Scala in base alle dimensioni effettive del canvas
        const degreeToPixel = canvasWidth / FOV_WIDTH; // Ricalcola per canvas corrente
        const lengthPx = params.length * degreeToPixel;
        const widthPx = params.width * degreeToPixel;
        
        // Validazione conversione
        if (!isFinite(lengthPx) || !isFinite(widthPx) || lengthPx <= 0 || widthPx <= 0) {
            console.error('❌ Conversione pixel non valida:', {
                length: params.length,
                width: params.width,
                degreeToPixel,
                lengthPx,
                widthPx
            });
            return [];
        }
        
        // Parametri per asimmetria
        const asymFactor = this._randomFromDistribution(params.asymmetry);
        
        // Validazione asimmetria
        if (!isFinite(asymFactor)) {
            console.error('❌ asymFactor non valido:', {
                asymmetry: params.asymmetry,
                asymFactor
            });
            return [];
        }
        
        // Genera fotoni
        for (let i = 0; i < numPhotons; i++) {
            // Distribuzione ellittica con asimmetria
            const u = Math.random() - 0.5;
            const v = Math.random() - 0.5;
            
            // Trasformazione Box-Muller per gaussiana 2D
            const r = Math.sqrt(-2 * Math.log(Math.random() + 0.001));
            const angle = Math.random() * 2 * Math.PI;
            const gx = r * Math.cos(angle);
            const gy = r * Math.sin(angle);
            
            // Validazione gx/gy
            if (!isFinite(gx) || !isFinite(gy)) {
                if (i === 0) console.error('❌ gx/gy non validi:', { r, angle, gx, gy });
                continue; // Salta questo fotone
            }
            
            // Scala con Length/Width - tracce ESTREMAMENTE allungate (gamma-like)
            let dx = gx * lengthPx * 2.5;  // Era 1.8, ora 2.5 per ellissi molto pronunciate
            let dy = gy * widthPx * 0.3;   // Era 0.4, ora 0.3 per mantenere molto strette (rapporto ~8:1)
            
            // Validazione dx/dy
            if (!isFinite(dx) || !isFinite(dy)) {
                if (i === 0) console.error('❌ dx/dy non validi:', { gx, gy, lengthPx, widthPx, dx, dy });
                continue; // Salta questo fotone
            }
            
            // Applica asimmetria (shift lungo asse maggiore)
            if (dx > 0) {
                dx *= (1 + asymFactor);
            } else {
                dx *= (1 - asymFactor * 0.5);
            }
            
            // Validazione dopo asimmetria
            if (!isFinite(dx) || !isFinite(dy)) {
                if (i === 0) console.error('❌ dx/dy dopo asimmetria non validi:', { dx, dy, asymFactor });
                continue; // Salta questo fotone
            }
            
            // Ruota secondo theta
            const rotX = dx * cosTheta - dy * sinTheta;
            const rotY = dx * sinTheta + dy * cosTheta;
            
            const x = centerX + rotX;
            const y = centerY + rotY;
            
            // Validazione coordinate finali
            if (!isFinite(x) || !isFinite(y)) {
                if (i === 0) console.error('❌ Coordinate finali non valide:', {
                    centerX, centerY, rotX, rotY, x, y,
                    cosTheta, sinTheta, theta
                });
                continue; // Salta questo fotone
            }
            
            // Energia del fotone (distribuzione realistica)
            const photonEnergy = this._samplePhotonEnergy(energy);
            
            // Intensità (photoelectrons)
            const intensity = this._energyToIntensity(photonEnergy);
            
            tracks.push({
                x: x,
                y: y,
                energy: photonEnergy,
                intensity: intensity
            });
        }
        
        return tracks;
    }

    /**
     * Campiona energia fotone Cherenkov dalla distribuzione
     */
    _samplePhotonEnergy(primaryEnergy) {
        // Energia fotoni Cherenkov proporzionale a energia primaria
        // con distribuzione che favorisce energie più basse
        const t = Math.random();
        const normalized = Math.pow(t, 1.5); // Skew verso basse energie
        
        const minE = Math.max(PHOTON_ENERGY_MIN, primaryEnergy * 0.01);
        const maxE = Math.min(PHOTON_ENERGY_MAX, primaryEnergy * 0.5);
        
        return minE + normalized * (maxE - minE);
    }

    /**
     * Converte energia in intensità (photoelectrons)
     */
    _energyToIntensity(energy) {
        // Validazione input
        if (typeof energy !== 'number' || !isFinite(energy) || energy <= 0) {
            console.warn('⚠️ Energy non valida in _energyToIntensity:', energy);
            return 0.2; // Valore di default
        }
        
        // Efficienza quantica del PMT + fattore di scala
        const qe = 0.25; // 25% efficienza media
        const logE = Math.log10(energy / 100); // Normalizza a 100 GeV
        const base = 1 + logE * 0.5;
        
        const result = Math.max(0.1, base * qe * (0.8 + Math.random() * 0.4));
        
        // Validazione output
        if (!isFinite(result)) {
            console.warn('⚠️ Intensity non finita:', result, 'da energy:', energy);
            return 0.2;
        }
        
        return result;
    }

    /**
     * Renderizza evento su canvas
     */
    renderEvent(event, canvas, colorPalette) {
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Ordina tracce per intensità (render dal più debole al più forte)
        const sortedTracks = [...event.tracks].sort((a, b) => a.intensity - b.intensity);
        
        // Render fotoni
        sortedTracks.forEach(track => {
            const color = colorPalette.getColor(track.energy);
            const radius = this._intensityToRadius(track.intensity);
            const alpha = Math.min(1, track.intensity * 0.8);
            
            // Glow effect
            const gradient = ctx.createRadialGradient(
                track.x, track.y, 0,
                track.x, track.y, radius * 2
            );
            gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
            gradient.addColorStop(0.5, color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(track.x, track.y, radius * 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Core più brillante
            ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(track.x, track.y, radius * 0.5, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Aggiungi griglia di riferimento (opzionale)
        this._drawGrid(ctx);
    }

    /**
     * Disegna griglia di riferimento
     */
    _drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
        ctx.lineWidth = 1;
        
        // Griglia ogni 1° (100 pixel)
        for (let x = 0; x < CANVAS_WIDTH; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        
        for (let y = 0; y < CANVAS_HEIGHT; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
        
        // Centro
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 - 20, CANVAS_HEIGHT / 2);
        ctx.lineTo(CANVAS_WIDTH / 2 + 20, CANVAS_HEIGHT / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.stroke();
    }

    /**
     * Converte intensità in raggio pixel
     */
    _intensityToRadius(intensity) {
        return 1.5 + intensity * 2.5;
    }

    // === UTILITY FUNCTIONS ===

    _randomInRange(min, max) {
        return min + Math.random() * (max - min);
    }

    _randomFromDistribution(dist) {
        if (typeof dist === 'number') return dist;
        if (dist.type === 'uniform') {
            return this._randomInRange(dist.min, dist.max);
        }
        if (dist.type === 'gaussian' || dist.mean !== undefined) {
            return this._randomGaussian(dist.mean, dist.std || dist.sigma || 1);
        }
        if (dist.type === 'peaked') {
            // Distribuzione piccata attorno a peak
            const u = Math.random();
            const sigma = dist.width || 2;
            return dist.peak + this._randomGaussian(0, sigma);
        }
        return dist.mean || 0;
    }

    _randomGaussian(mean, std) {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * std;
    }
}

// === FUNZIONI HELPER PER RENDERING STEREOSCOPICO ===

/**
 * Combina eventi da 3 camere per ricostruzione stereoscopica
 */
function combineStereoscopicEvents(events) {
    if (events.length < 2) {
        console.warn('Ricostruzione stereo richiede almeno 2 camere');
        return null;
    }
    
    // Media pesata dei parametri
    const avgParams = {
        length: 0,
        width: 0,
        size: 0,
        alpha: 0
    };
    
    let totalWeight = 0;
    
    events.forEach(event => {
        const weight = event.params.size; // Peso basato su Size
        avgParams.length += event.params.length * weight;
        avgParams.width += event.params.width * weight;
        avgParams.size += event.params.size * weight;
        avgParams.alpha += event.params.alpha * weight;
        totalWeight += weight;
    });
    
    Object.keys(avgParams).forEach(key => {
        avgParams[key] /= totalWeight;
    });
    
    return {
        type: events[0].sourceType,
        numCameras: events.length,
        params: avgParams,
        events: events,
        coherence: calculateCoherence(events)
    };
}

/**
 * Calcola coerenza stereoscopica
 */
function calculateCoherence(events) {
    if (events.length < 2) return 1.0;
    
    // Calcola varianza relativa dei parametri
    const params = events.map(e => e.params);
    const mean = {
        length: params.reduce((s, p) => s + p.length, 0) / params.length,
        width: params.reduce((s, p) => s + p.width, 0) / params.length,
        size: params.reduce((s, p) => s + p.size, 0) / params.length
    };
    
    const variance = {
        length: params.reduce((s, p) => s + Math.pow(p.length - mean.length, 2), 0),
        width: params.reduce((s, p) => s + Math.pow(p.width - mean.width, 2), 0),
        size: params.reduce((s, p) => s + Math.pow(p.size - mean.size, 2), 0)
    };
    
    // Coerenza = 1 - (varianza normalizzata)
    const relVar = (
        variance.length / Math.pow(mean.length, 2) +
        variance.width / Math.pow(mean.width, 2) +
        variance.size / Math.pow(mean.size, 2)
    ) / 3;
    
    return Math.max(0, 1 - relVar);
}
