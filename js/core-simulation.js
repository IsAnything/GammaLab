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
    baseParams.sourceType = sourceProfile.type;
        
        // Aggiungi varianza inter-camera
        const cameraVariance = sourceProfile.interCameraVariance || 0.05;
    const params = this._applyCameraVariance(baseParams, cameraVariance, cameraId);
    params.sourceType = sourceProfile.type;
        
        // Genera energia del fotone primario (custom o random)
        const energy = customParams?.energy || this._sampleEnergy(sourceProfile.energyRange);
        
        // Applica effetti angolo zenitale se fornito
        const zenithAngle = customParams?.zenithAngle || 0;
        if (zenithAngle > 0) {
            this._applyZenithEffects(params, zenithAngle, energy);
        }
        
    // Genera tracce Cherenkov con dimensioni canvas
    const tracks = this._generateTracks(params, energy, canvasW, canvasH, customParams || {});
        
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
            timestamp: Date.now(),
            signatureHint: params.signatureHint || ''
        };
        
        this.currentEvent = event;
        return event;
    }

    /**
     * Genera un evento adronico (background)
     * Gli adroni hanno shower più larghi, meno collimati e più irregolari
     * @param {Number} cameraId - ID camera (1-3)
     * @param {Object} canvasSize - Dimensioni canvas {width, height}
     * @param {Number} energy - Energia in GeV (opzionale)
     * @returns {Object} Evento adronico generato
     */
    generateHadronicEvent(cameraId = 1, canvasSize = null, customParams = null) {
        const canvasW = canvasSize?.width || CANVAS_WIDTH;
        const canvasH = canvasSize?.height || CANVAS_HEIGHT;
        
        // Energia adroni tipicamente 100 GeV - 10 TeV
        const hadronEnergy = (customParams && customParams.energy) || this._randomInRange(100, 10000);
        
        // Parametri tipici adronici (molto diversi dai gamma)
        let hadronSignature = null;
        let hadronHint = '';
        try {
            if (typeof getSourceProfile === 'function') {
                const profile = getSourceProfile('hadron');
                if (profile && profile.visualSignature) {
                    hadronSignature = { ...profile.visualSignature };
                }
                hadronHint = profile && profile.signatureHint ? profile.signatureHint : '';
            }
        } catch (e) {
            hadronSignature = null;
        }

        const params = {
            length: this._randomInRange(0.15, 0.35),  // Più variabile
            width: this._randomInRange(0.08, 0.18),   // Molto più largo (rapporto ~2-3)
            size: this._randomInRange(800, 2500),     // Tanti fotoni
            alpha: this._randomInRange(5, 40),        // Angoli alpha più grandi
            elongation: this._randomInRange(0.15, 0.35),  // Meno allungato
            asymmetry: { mean: 0.25, std: 0.15 },     // Più asimmetrico
            sourceType: 'hadron',
            visualSignature: hadronSignature,
            signatureHint: hadronHint
        };
        
        // Angolo zenitale random
        const zenithAngle = this._randomInRange(0, 45);
        if (zenithAngle > 0) {
            this._applyZenithEffects(params, zenithAngle, hadronEnergy);
        }
        
        // Genera tracce con caratteristiche adroniche
    const tracks = this._generateHadronicTracks(params, hadronEnergy, canvasW, canvasH, customParams || {});
        
        const event = {
            sourceType: 'hadron',
            cameraId: cameraId,
            energy: hadronEnergy,
            zenithAngle: zenithAngle,
            params: params,
            tracks: tracks,
            canvasWidth: canvasW,
            canvasHeight: canvasH,
            timestamp: Date.now(),
            signatureHint: params.signatureHint || ''
        };
        
        this.currentEvent = event;
        return event;
    }

    /**
     * Genera un evento muonico
     * I muoni producono tracce lineari, sottili, con pochi fotoni
     * @param {Number} cameraId - ID camera (1-3)
     * @param {Object} canvasSize - Dimensioni canvas {width, height}
     * @param {Number} energy - Energia in GeV (opzionale)
     * @returns {Object} Evento muonico generato
     */
    generateMuonEvent(cameraId = 1, canvasSize = null, customParams = null) {
        const canvasW = canvasSize?.width || CANVAS_WIDTH;
        const canvasH = canvasSize?.height || CANVAS_HEIGHT;
        
        // Energia muoni tipicamente 50 GeV - 5 TeV
        const muonEnergy = (customParams && customParams.energy) || this._randomInRange(50, 5000);
        
        // Parametri muonici: traccia molto stretta e lineare
        const params = {
            length: this._randomInRange(0.4, 0.8),    // Molto lungo (attraversa camera)
            width: this._randomInRange(0.02, 0.05),   // Estremamente stretto
            size: this._randomInRange(200, 600),      // Pochi fotoni
            alpha: this._randomInRange(0, 15),        // Angolo alpha piccolo
            elongation: 0.95,                         // Quasi perfettamente lineare
            asymmetry: { mean: 0.05, std: 0.02 },     // Molto simmetrico
            sourceType: 'muon',
            visualSignature: null,
            signatureHint: 'Traccia muonica quasi perfettamente lineare.'
        };
        
        // Genera tracce muoniche
    const tracks = this._generateMuonTracks(params, muonEnergy, canvasW, canvasH, customParams || {});
        
        const event = {
            sourceType: 'muon',
            cameraId: cameraId,
            energy: muonEnergy,
            zenithAngle: 0,
            params: params,
            tracks: tracks,
            canvasWidth: canvasW,
            canvasHeight: canvasH,
            timestamp: Date.now(),
            signatureHint: params.signatureHint || ''
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
            asymmetry: profile.asymmetry || { mean: 0.1, std: 0.05 },
            sourceType: profile.type,
            visualSignature: profile.visualSignature ? { ...profile.visualSignature } : null,
            signatureHint: profile.signatureHint || ''
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
            asymmetry: params.asymmetry,
            sourceType: params.sourceType,
            visualSignature: params.visualSignature ? { ...params.visualSignature } : null,
            signatureHint: params.signatureHint || ''
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
    _generateTracks(params, energy, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT, options = {}) {
        // Validazione parametri
        if (!params || typeof params.length !== 'number' || typeof params.width !== 'number' ||
            !isFinite(params.length) || !isFinite(params.width) ||
            !isFinite(params.size)) {
            console.error('❌ Parametri non validi in _generateTracks:', params);
            return [];
        }
        
        const tracks = [];

        // Numero di fotoni dipende dall'energia ma in modo più moderato
        // 100 GeV → pochi fotoni, 5000 GeV → più fotoni (non troppi)
        const energyTeV = energy / 1000;
        const energyBoost = Math.pow(energyTeV, 0.25); // Scala molto sub-lineare (era 0.4)
        const densityFactor = (0.4 + Math.random() * 1.0) * energyBoost; // Ridotta variabilità
        const requestedPhotons = Math.floor(params.size * densityFactor);
        const MAX_PHOTONS = 2500; // Ridotto da 4000
        const numPhotons = Math.min(requestedPhotons, MAX_PHOTONS);

        const sourceType = params.sourceType || options.sourceType || 'generic';

        // Profilo estetico differenziato per sorgente
        const profileConfig = {
            dispersionScaleX: 0.35,
            dispersionScaleY: 0.35,
            centerBiasX: 0,
            centerBiasY: 0,
            lengthScale: 1.0,
            widthScale: 1.0,
            alphaNoiseScale: 1.0,
            spineTightening: 1.0,
            tailStrength: 0,
            tailDecay: 0.6,
            centralCoreBoost: false,
            ringProbability: 0,
            ringThickness: 0.6,
            hotspotCount: 0,
            hotspotSpread: 0.5,
            hotspotFill: 0.0,
            hotspotBoost: 0.8,
            intensityVariance: 0.4,
            offAxisShear: 0,
            energyInitialBoost: 1.0,
            energyTailDrop: 0,
            energyCoreBoost: 0,
            energySpineBoost: 0,
            energyRadialFalloff: 2.0,
            energyNoise: 0.0
        };

        const signatureOverride = params.visualSignature || options.visualSignature || null;
        if (signatureOverride && typeof signatureOverride === 'object') {
            Object.assign(profileConfig, signatureOverride);
        } else if (!signatureOverride) {
            // Fallback to legacy heuristics for sources senza visualSignature
            switch (sourceType) {
                case 'blazar':
                    profileConfig.widthScale = 0.7;
                    profileConfig.spineTightening = 0.5;
                    profileConfig.centralCoreBoost = true;
                    break;
                case 'pevatron':
                    profileConfig.dispersionScaleX = 0.5;
                    profileConfig.dispersionScaleY = 0.5;
                    profileConfig.hotspotCount = 3;
                    profileConfig.hotspotSpread = 0.8;
                    profileConfig.intensityVariance = 0.9;
                    break;
                default:
                    break;
            }
        }

        // Centro della traccia con variazione legata al tipo sorgente
        const dispersionX = canvasWidth * profileConfig.dispersionScaleX;
        const dispersionY = canvasHeight * profileConfig.dispersionScaleY;

        let centerX = canvasWidth / 2;
        let centerY = canvasHeight / 2;

        if (!(options && options.forceCenter)) {
            centerX += (Math.random() - 0.5) * dispersionX;
            centerY += (Math.random() - 0.5) * dispersionY;
        }

        if (profileConfig.centerBiasX) {
            centerX += (Math.random() - 0.5) * canvasWidth * profileConfig.centerBiasX;
        }
        if (profileConfig.centerBiasY) {
            centerY += (Math.random() - 0.5) * canvasHeight * profileConfig.centerBiasY;
        }

        // Converti Length e Width da gradi a pixel (canvas aware)
        const degreeToPixel = canvasWidth / FOV_WIDTH;
        const energyLengthBoost = 1 + (energyTeV - 0.5) * 0.3; // ±30% basato su energia
        let lengthPx = params.length * degreeToPixel * Math.max(0.7, energyLengthBoost) * profileConfig.lengthScale;
        let widthPx = params.width * degreeToPixel * profileConfig.widthScale;

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

        // Calcola orientazione coerente con Alpha del profilo
        const targetAngle = Math.atan2((canvasHeight / 2) - centerY, (canvasWidth / 2) - centerX);
        const alphaRad = ((typeof params.alpha === 'number') ? params.alpha : 0) * Math.PI / 180;
        const alphaJitter = Math.max(0.01, (Math.abs(alphaRad) * 0.3 + 0.02) * profileConfig.alphaNoiseScale);
        let theta = targetAngle + alphaRad;
        if (!isFinite(theta)) {
            theta = Math.random() * 2 * Math.PI;
        }
        theta += this._randomGaussian(0, alphaJitter);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Parametri per asimmetria
        const asymFactor = this._randomFromDistribution(params.asymmetry);
        if (!isFinite(asymFactor)) {
            console.error('❌ asymFactor non valido:', {
                asymmetry: params.asymmetry,
                asymFactor
            });
            return [];
        }

        // Prepara eventuali hotspot multi-component
        let hotspotOffsets = null;
        let hotspotWeightSum = 0;
        if (profileConfig.hotspotCount > 0) {
            hotspotOffsets = [];
            const spread = lengthPx * profileConfig.hotspotSpread;
            for (let h = 0; h < profileConfig.hotspotCount; h++) {
                const offset = {
                    x: this._randomGaussian(0, spread),
                    y: this._randomGaussian(0, widthPx * (0.35 + profileConfig.hotspotSpread * 0.4)),
                    gain: 0.4 + Math.random() * profileConfig.hotspotBoost,
                    weight: 0.5 + Math.random()
                };
                hotspotOffsets.push(offset);
                hotspotWeightSum += offset.weight;
            }
        }

        // Configurazione guscio anulare (PeVatron)
        let ringConfig = null;
        if (profileConfig.ringProbability > 0 && lengthPx > 0) {
            ringConfig = {
                probability: profileConfig.ringProbability,
                radius: lengthPx * (1.2 + Math.random() * 0.4),
                thickness: Math.max(widthPx * profileConfig.ringThickness, widthPx * 0.3)
            };
        }

        const denom = Math.max(1, numPhotons - 1);

        // Genera fotoni
        for (let i = 0; i < numPhotons; i++) {
            const progress = i / denom;

            // Distribuzione ellittica (Box-Muller)
            const r = Math.sqrt(-2 * Math.log(Math.random() + 0.001));
            const angle = Math.random() * 2 * Math.PI;
            const gx = r * Math.cos(angle);
            const gy = r * Math.sin(angle);

            if (!isFinite(gx) || !isFinite(gy)) {
                if (i === 0) console.error('❌ gx/gy non validi:', { r, angle, gx, gy });
                continue;
            }

            let dx = gx * lengthPx * 1.331;
            let dy = gy * widthPx * 1.338;

            if (!isFinite(dx) || !isFinite(dy)) {
                if (i === 0) console.error('❌ dx/dy non validi:', { gx, gy, lengthPx, widthPx, dx, dy });
                continue;
            }

            if (profileConfig.spineTightening !== 1.0) {
                dy *= profileConfig.spineTightening;
            }

            if (dx > 0) {
                dx *= (1 + asymFactor);
            } else {
                dx *= (1 - asymFactor * 0.5);
            }

            if (profileConfig.tailStrength > 0) {
                dx += progress * lengthPx * profileConfig.tailStrength;
                dy += progress * widthPx * 0.2 * profileConfig.tailStrength;
            }

            if (ringConfig && Math.random() < ringConfig.probability) {
                const norm = Math.hypot(dx, dy) || 1;
                const target = ringConfig.radius + this._randomGaussian(0, ringConfig.thickness);
                dx = (dx / norm) * target;
                dy = (dy / norm) * target;
            }

            if (profileConfig.offAxisShear) {
                dy += Math.sin((dx / Math.max(1, lengthPx)) * Math.PI) * widthPx * profileConfig.offAxisShear;
            }

            const rotX = dx * cosTheta - dy * sinTheta;
            const rotY = dx * sinTheta + dy * cosTheta;

            let x = centerX + rotX;
            let y = centerY + rotY;
            let hotspotGain = 0;

            if (hotspotOffsets && profileConfig.hotspotFill > 0 && Math.random() < profileConfig.hotspotFill) {
                const pick = Math.random() * hotspotWeightSum;
                let acc = 0;
                let chosen = hotspotOffsets[0];
                for (const h of hotspotOffsets) {
                    acc += h.weight;
                    if (pick <= acc) {
                        chosen = h;
                        break;
                    }
                }
                x += chosen.x;
                y += chosen.y;
                hotspotGain = chosen.gain;
            }

            if (!isFinite(x) || !isFinite(y)) {
                if (i === 0) console.error('❌ Coordinate finali non valide:', {
                    centerX, centerY, rotX, rotY, x, y,
                    cosTheta, sinTheta, theta
                });
                continue;
            }

            let energyScale = profileConfig.energyInitialBoost || 1.0;

            if (profileConfig.energyTailDrop > 0) {
                const tailFactor = Math.max(0.2, 1 - profileConfig.energyTailDrop * progress);
                energyScale *= tailFactor;
            }

            if (profileConfig.energyCoreBoost > 0) {
                const radial = Math.hypot(x - centerX, y - centerY);
                const coreRadius = Math.max(widthPx * 1.1, lengthPx * 0.18);
                const radialFactor = Math.max(0, 1 - radial / (coreRadius * profileConfig.energyRadialFalloff));
                energyScale *= 1 + profileConfig.energyCoreBoost * radialFactor;
            }

            if (profileConfig.energySpineBoost > 0) {
                const axisRatio = Math.min(1, Math.abs(rotY) / Math.max(1, Math.abs(rotX)));
                const spineFactor = 1 - axisRatio; // vicino all'asse maggiore → valore alto
                energyScale *= 1 + profileConfig.energySpineBoost * spineFactor;
            }

            if (profileConfig.energyNoise > 0) {
                energyScale *= 1 + this._randomGaussian(0, profileConfig.energyNoise);
            }

            energyScale = Math.max(0.25, Math.min(4.0, energyScale));

            const photonEnergy = Math.max(
                PHOTON_ENERGY_MIN,
                Math.min(PHOTON_ENERGY_MAX, this._samplePhotonEnergy(energy) * energyScale)
            );

            let intensity = this._energyToIntensity(photonEnergy);

            if (profileConfig.intensityVariance) {
                const variance = 1 + (Math.random() - 0.5) * profileConfig.intensityVariance;
                intensity *= Math.max(0.2, variance);
            }

            if (profileConfig.centralCoreBoost) {
                const radial = Math.hypot(x - centerX, y - centerY);
                const coreRadius = Math.max(widthPx * 1.2, lengthPx * 0.18);
                if (radial < coreRadius) {
                    intensity *= 1.5;
                }
            }

            if (profileConfig.tailStrength > 0) {
                const decay = Math.max(0.25, 1 - profileConfig.tailDecay * progress);
                intensity *= decay;
            }

            if (hotspotGain > 0) {
                intensity *= 1 + hotspotGain;
            }

            tracks.push({
                x,
                y,
                energy: photonEnergy,
                intensity: intensity * Math.pow(energyScale, 0.35),
                sourceType: sourceType
            });
        }

        return tracks;
    }

    /**
     * Genera tracce adroniche (più larghe, irregolari, con sub-shower)
     */
    _generateHadronicTracks(params, energy, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT, options = {}) {
        const tracks = [];
        
        // Adroni: più fotoni ma distribuiti in modo più disperso
        const densityFactor = 0.8 + Math.random() * 1.0;
        const numPhotons = Math.min(Math.floor(params.size * densityFactor), 2500); // Ridotto da 4000
        
        // Centro traccia principale
        const dispersionX = canvasWidth * 0.35;
        const dispersionY = canvasHeight * 0.35;
        let centerX = canvasWidth / 2 + (Math.random() - 0.5) * dispersionX;
        let centerY = canvasHeight / 2 + (Math.random() - 0.5) * dispersionY;

        if (options && options.forceCenter) {
            centerX = canvasWidth / 2;
            centerY = canvasHeight / 2;
        }
        
        // Angolo principale
        const theta = Math.random() * 2 * Math.PI;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        
        const degreeToPixel = canvasWidth / FOV_WIDTH;
        const lengthPx = params.length * degreeToPixel;
        const widthPx = params.width * degreeToPixel;
        
        // Asimmetria maggiore per adroni
        const asymFactor = this._randomFromDistribution(params.asymmetry);
        
        // Genera fotoni con caratteristiche adroniche
        for (let i = 0; i < numPhotons; i++) {
            const r = Math.sqrt(-2 * Math.log(Math.random() + 0.001));
            const angle = Math.random() * 2 * Math.PI;
            const gx = r * Math.cos(angle);
            const gy = r * Math.sin(angle);
            
            if (!isFinite(gx) || !isFinite(gy)) continue;
            
            // DIFFERENZA CHIAVE: rapporto length/width molto più basso (shower più rotondo)
            let dx = gx * lengthPx * 1.5;  // Meno allungato rispetto ai gamma (2.5)
            let dy = gy * widthPx * 0.8;   // Molto più largo rispetto ai gamma (0.3)
            
            if (!isFinite(dx) || !isFinite(dy)) continue;
            
            // Più asimmetria e irregolarità
            if (dx > 0) {
                dx *= (1 + asymFactor * 1.5);  // 50% più asimmetria
            } else {
                dx *= (1 - asymFactor * 0.8);
            }
            
            // Aggiungi rumore per irregolarità
            const noiseFactor = 1 + (Math.random() - 0.5) * 0.4;
            dx *= noiseFactor;
            dy *= noiseFactor;
            
            if (!isFinite(dx) || !isFinite(dy)) continue;
            
            // Ruota
            const rotX = dx * cosTheta - dy * sinTheta;
            const rotY = dx * sinTheta + dy * cosTheta;
            
            let x = centerX + rotX;
            let y = centerY + rotY;
            
            // 20% dei fotoni vanno in sub-shower secondari (caratteristica adronica)
            if (Math.random() < 0.2) {
                const subAngle = Math.random() * 2 * Math.PI;
                const subDist = Math.random() * lengthPx * 0.8;
                x += Math.cos(subAngle) * subDist;
                y += Math.sin(subAngle) * subDist;
            }
            
            if (!isFinite(x) || !isFinite(y)) continue;
            
            const photonEnergy = this._samplePhotonEnergy(energy);
            const intensity = this._energyToIntensity(photonEnergy);
            
            tracks.push({
                x: x,
                y: y,
                energy: photonEnergy,
                intensity: intensity,
                sourceType: params.sourceType || 'hadron'
            });
        }
        
        // Scale photon intensities so that the total event intensity matches
        // the requested Hillas 'size' in the source profile. The HillasAnalyzer
        // computes `size = cog.totalIntensity / 10`, so to make that value
        // roughly equal to params.size we aim for totalIntensity ~= params.size * 10.
        try {
            const totalIntensity = tracks.reduce((s, t) => s + (t.intensity || 0), 0);
            if (isFinite(totalIntensity) && totalIntensity > 0) {
                const desiredTotal = Math.max(1, params.size * 10);
                let scaleFactor = desiredTotal / totalIntensity;
                // Prevent extreme scaling
                scaleFactor = Math.min(Math.max(scaleFactor, 0.2), 5.0);
                if (Math.abs(scaleFactor - 1.0) > 0.001) {
                    for (let t of tracks) {
                        t.intensity = (t.intensity || 0) * scaleFactor;
                    }
                }
            }
        } catch (e) {
            // If anything goes wrong, return unscaled tracks
            console.warn('Intensity scaling failed:', e);
        }

        return tracks;
    }

    /**
     * Genera tracce muoniche (lineari, sottili, attraversano la camera)
     */
    _generateMuonTracks(params, energy, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT, options = {}) {
        const tracks = [];
        
        const numPhotons = Math.min(Math.floor(params.size), 800);
        
        // Punto di ingresso del muone (bordo della camera)
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let startX, startY, endX, endY;
        
        switch(side) {
            case 0: // Top
                startX = Math.random() * canvasWidth;
                startY = 0;
                endX = Math.random() * canvasWidth;
                endY = canvasHeight;
                break;
            case 1: // Right
                startX = canvasWidth;
                startY = Math.random() * canvasHeight;
                endX = 0;
                endY = Math.random() * canvasHeight;
                break;
            case 2: // Bottom
                startX = Math.random() * canvasWidth;
                startY = canvasHeight;
                endX = Math.random() * canvasWidth;
                endY = 0;
                break;
            case 3: // Left
                startX = 0;
                startY = Math.random() * canvasHeight;
                endX = canvasWidth;
                endY = Math.random() * canvasHeight;
                break;
        }
        
        const degreeToPixel = canvasWidth / FOV_WIDTH;
        const widthPx = params.width * degreeToPixel;

        // If forceCenter is set, create a muon that crosses near the camera center
        if (options && options.forceCenter) {
            // Create a near-central straight muon passing through center
            startX = canvasWidth * 0.1;
            startY = canvasHeight / 2 + (Math.random() - 0.5) * canvasHeight * 0.05;
            endX = canvasWidth * 0.9;
            endY = canvasHeight / 2 + (Math.random() - 0.5) * canvasHeight * 0.05;
        }

        // Genera fotoni lungo la linea
        for (let i = 0; i < numPhotons; i++) {
            // Posizione lungo la linea (parametro t da 0 a 1)
            const t = Math.random();
            const lineX = startX + t * (endX - startX);
            const lineY = startY + t * (endY - startY);
            
            // Piccola dispersione perpendicolare alla linea
            const perpAngle = Math.atan2(endY - startY, endX - startX) + Math.PI / 2;
            const perpDist = (Math.random() - 0.5) * widthPx * 2;
            
            const x = lineX + Math.cos(perpAngle) * perpDist;
            const y = lineY + Math.sin(perpAngle) * perpDist;
            
            if (!isFinite(x) || !isFinite(y)) continue;
            
            const photonEnergy = this._samplePhotonEnergy(energy);
            const intensity = this._energyToIntensity(photonEnergy);
            
            tracks.push({
                x: x,
                y: y,
                energy: photonEnergy,
                intensity: intensity,
                sourceType: params.sourceType || 'muon'
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
