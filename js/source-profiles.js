/**
 * GAMMALAB - Source Profiles
 * Profili parametrici per 6 tipi di sorgenti gamma/adroniche
 * Basati su osservazioni reali di H.E.S.S., MAGIC, VERITAS
 */

// === CONVERSIONE COSTANTI ===
const DEG_TO_PX = 100; // 1° = 100 pixel

// === PROFILI SORGENTI ===

/**
 * CRAB NEBULA - Pulsar Wind Nebula (Riferimento Standard)
 * La "candela standard" dell'astronomia gamma
 * Caratteristiche: tracce compatte, altamente simmetriche, Alpha~0°
 */
const CRAB_NEBULA_PROFILE = {
    type: 'crab',
    name: 'Crab Nebula',
    displayName: 'Nebulosa del Granchio',
    signatureHint: 'Core estremamente compatto e brillante senza coda estesa.',
    
    // Parametri Hillas (in gradi, convertiti automaticamente in pixel)
    length: { min: 0.20, max: 0.30 },  // 20-30 pixel
    width: { min: 0.05, max: 0.10 },   // 5-10 pixel
    size: { min: 800, max: 1200 },     // photoelectrons
    alpha: { 
        type: 'peaked',
        peak: 0,
        width: 2.5  // Molto concentrato attorno a 0°
    },
    
    // Caratteristiche morfologiche
    elongation: 0.25,  // Length/Width ratio ~ 3
    asymmetry: { mean: 0.05, std: 0.03 },  // Molto simmetrico

    // Firma visiva per la generazione delle tracce
    visualSignature: {
        dispersionScaleX: 0.12,
        dispersionScaleY: 0.12,
        alphaNoiseScale: 0.3,
        centralCoreBoost: true,
        intensityVariance: 0.12,
        lengthScale: 0.95,
        widthScale: 0.85,
        spineTightening: 0.4,
        energyInitialBoost: 1.15,
        energyCoreBoost: 0.65,
        energyRadialFalloff: 1.25,
        energyNoise: 0.04
    },
    
    // Parametri energetici
    energyRange: {
        min: 100,      // GeV
        max: 50000,    // GeV (50 TeV)
        spectralIndex: 2.6  // Γ tipico
    },
    
    // Coerenza inter-camera
    interCameraVariance: 0.05,  // 5% - eccellente coerenza
    
    // Metadati
    description: 'Sorgente di riferimento, PWN con emissione stabile',
    observables: {
        flux: '1 Crab Unit',
        distance: '2 kpc',
        extension: 'puntiforme (<0.1°)'
    }
};

/**
 * PEVATRON - Supernova Remnant (Acceleratore Estremo)
 * Es: RX J1713.7-3946, Cas A, LHAASO sources
 * Caratteristiche: Size estremo (>2000), tracce estese, possibile saturazione
 */
const PEVATRON_PROFILE = {
    type: 'pevatron',
    name: 'PeVatron SNR',
    displayName: 'Resto di Supernova (PeVatron)',
    signatureHint: 'Sciame enorme con filamenti multipli e hot-spot tra i gusci.',
    
    length: { min: 0.30, max: 0.50 },  // 30-50 pixel - ESTESO
    width: { min: 0.10, max: 0.20 },   // 10-20 pixel
    size: { min: 2000, max: 5000 },    // ESTREMO - spesso saturazione
    alpha: { 
        type: 'gaussian',
        mean: 10,
        std: 8  // Distribuito, sorgente estesa
    },
    
    elongation: 0.35,
    asymmetry: { mean: 0.15, std: 0.08 },  // Più irregolare

    visualSignature: {
        dispersionScaleX: 0.48,
        dispersionScaleY: 0.48,
        centerBiasX: 0.12,
        lengthScale: 1.28,
        widthScale: 0.96,
        alphaNoiseScale: 1.35,
        spineTightening: 0.78,
        ringProbability: 0.38,
        ringThickness: 0.55,
        hotspotCount: 4,
        hotspotSpread: 0.82,
        hotspotFill: 0.55,
        hotspotBoost: 1.35,
        intensityVariance: 0.9,
        offAxisShear: 0.25,
        energyInitialBoost: 1.4,
        energyCoreBoost: 0.4,
        energyNoise: 0.2
    },
    
    energyRange: {
        min: 500,       // GeV
        max: 100000,    // GeV (100 TeV - PeV!)
        spectralIndex: 2.2  // Spettro più duro
    },
    
    interCameraVariance: 0.12,  // 12% - estensione causa varianza
    
    description: 'Acceleratore ultra-relativista, può raggiungere PeV',
    observables: {
        flux: '0.5-2 Crab',
        distance: '1-5 kpc',
        extension: 'estesa (0.3-1°)'
    }
};

/**
 * BLAZAR - Active Galactic Nucleus
 * Es: Mrk 421, Mrk 501, PKS 2155-304
 * Caratteristiche: tracce COMPATTE, L/W alto, Alpha~0°, variabilità estrema
 */
const BLAZAR_PROFILE = {
    type: 'blazar',
    name: 'Blazar/AGN',
    displayName: 'Blazar (AGN)',
    signatureHint: 'Getto stretto ad asse brillante; oltre 10 TeV vira al verde.',
    
    length: { min: 0.10, max: 0.20 },  // 10-20 pixel - COMPATTO
    width: { min: 0.04, max: 0.07 },   // 4-7 pixel - MOLTO stretto
    size: { min: 1000, max: 1500 },
    alpha: { 
        type: 'peaked',
        peak: 0,
        width: 1.5  // Estremamente concentrato
    },
    
    elongation: 0.20,  // L/W ratio ~ 3-4 (alto)
    asymmetry: { mean: 0.08, std: 0.05 },

    visualSignature: {
        dispersionScaleX: 0.08,
        dispersionScaleY: 0.08,
        lengthScale: 0.92,
        widthScale: 0.48,
        alphaNoiseScale: 0.18,
        spineTightening: 0.38,
        tailStrength: 0.18,
        tailDecay: 0.65,
        centralCoreBoost: true,
        hotspotCount: 3,
        hotspotSpread: 0.2,
        hotspotFill: 0.38,
        hotspotBoost: 1.35,
        intensityVariance: 0.16,
        energyInitialBoost: 1.4,
        energyCoreBoost: 0.75,
        energySpineBoost: 1.25,
        energyRadialFalloff: 1.15,
        energyNoise: 0.08
    },
    
    energyRange: {
        min: 100,
        max: 30000,     // GeV (30 TeV, attenuazione EBL)
        spectralIndex: 2.5
    },
    
    interCameraVariance: 0.06,  // 6% - sorgente puntiforme
    
    description: 'Getto relativistico puntato verso di noi, beaming',
    observables: {
        flux: '0.2-5 Crab (variabile!)',
        distance: '100+ Mpc',
        extension: 'puntiforme',
        variability: 'ore-giorni, fattore 2-10×'
    }
};

/**
 * GAMMA-RAY BURST - Esplosione cosmologica
 * Es: GRB 190114C, GRB 221009A "BOAT"
 * Caratteristiche: L/W basso (~1.9), evoluzione temporale, afterglow
 */
const GRB_PROFILE = {
    type: 'grb',
    name: 'Gamma-Ray Burst',
    displayName: 'Lampo Gamma (GRB)',
    signatureHint: 'Coda ampia che si raffredda: sfumatura verso il verde lungo la scia.',
    
    length: { min: 0.10, max: 0.20 },  // 10-20 pixel
    width: { min: 0.05, max: 0.10 },   // 5-10 pixel
    size: { min: 1200, max: 2000 },    // Decade nel tempo
    alpha: { 
        type: 'gaussian',
        mean: 0,
        std: 2.5  // Inizialmente puntiforme
    },
    
    elongation: 0.45,  // L/W ~ 1.9 - FIRMA CHIAVE (più basso)
    asymmetry: { mean: 0.12, std: 0.06 },

    visualSignature: {
        dispersionScaleX: 0.32,
        dispersionScaleY: 0.26,
        lengthScale: 1.35,
        widthScale: 0.78,
        alphaNoiseScale: 0.7,
        tailStrength: 1.25,
        tailDecay: 0.55,
        hotspotCount: 2,
        hotspotSpread: 0.52,
        hotspotFill: 0.34,
        hotspotBoost: 0.95,
        intensityVariance: 0.55,
        energyInitialBoost: 1.5,
        energyTailDrop: 1.05,
        energyCoreBoost: 0.28,
        energyRadialFalloff: 2.9,
        energyNoise: 0.16
    },
    
    energyRange: {
        min: 200,
        max: 20000,     // GeV (afterglow TeV)
        spectralIndex: 2.3
    },
    
    interCameraVariance: 0.08,
    
    description: 'Afterglow TeV di GRB, emissione decrescente',
    observables: {
        flux: '0.5-10 Crab (picco prompt)',
        distance: 'cosmologico (z=0.1-2)',
        extension: 'puntiforme → estesa nel tempo',
        variability: 'estrema, decade t^-α'
    },
    
    // Feature unica: evoluzione temporale
    temporalEvolution: {
        sizeDecay: 0.8,  // Decade a 80% ogni step
        alphaIncrease: 1.2  // Alpha aumenta nel tempo
    }
};

/**
 * GALACTIC CENTER - Centro Galattico
 * Es: HESS J1745-290 (Sgr A*), diffusa, Fermi Bubbles
 * Caratteristiche: Alpha DISPERSO (~8°), multi-componente, varianza alta
 */
const GALACTIC_CENTER_PROFILE = {
    type: 'galactic-center',
    name: 'Galactic Center',
    displayName: 'Centro Galattico',
    
    length: { min: 0.20, max: 0.40 },  // 20-40 pixel - intermedio
    width: { min: 0.10, max: 0.20 },   // 10-20 pixel
    size: { min: 1500, max: 2200 },    // Alto ma < PeVatron
    alpha: { 
        type: 'gaussian',
        mean: 8,        // FIRMA CHIAVE - disperso!
        std: 5          // Ampia distribuzione
    },
    
    elongation: 0.40,  // L/W ~ 2
    asymmetry: { mean: 0.18, std: 0.10 },  // Irregolare

    visualSignature: {
        dispersionScaleX: 0.38,
        dispersionScaleY: 0.34,
        centerBiasX: 0.18,
        centerBiasY: 0.1,
        lengthScale: 1.22,
        widthScale: 0.92,
        spineTightening: 0.82,
        alphaNoiseScale: 1.5,
        hotspotCount: 3,
        hotspotSpread: 0.58,
        hotspotFill: 0.55,
        hotspotBoost: 0.85,
        intensityVariance: 0.95,
        offAxisShear: 0.35,
        energyInitialBoost: 1.2,
        energyCoreBoost: 0.3,
        energyTailDrop: 0.35,
        energyNoise: 0.18
    },
    
    energyRange: {
        min: 200,
        max: 50000,
        spectralIndex: 2.4
    },
    
    interCameraVariance: 0.15,  // 15% - MASSIMA tra sorgenti gamma
    
    description: 'Multi-componente: Sgr A*, diffusa, SNR, nubi molecolari',
    observables: {
        flux: '0.3-1 Crab',
        distance: '8.5 kpc',
        extension: 'complessa (0.1-1°)',
        components: 'puntiforme + diffusa + PeVatron'
    }
};

/**
 * HADRONIC BACKGROUND - Raggi Cosmici (Contaminante)
 * Caratteristiche: Width LARGO (~22px), L/W basso (~1.6), Alpha uniforme
 */
const HADRON_BACKGROUND_PROFILE = {
    type: 'hadron',
    name: 'Hadronic Background',
    displayName: 'Fondo Adronico (CR)',
    
    length: { min: 0.20, max: 0.35 },  // 20-35 pixel - Leggermente più lunghe
    width: { min: 0.15, max: 0.25 },   // 15-25 pixel - Più larghe (più "grasse")
    size: { min: 600, max: 3500 },     // Size leggermente aumentata per visibilità
    alpha: { 
        type: 'uniform',
        min: 0,
        max: 90  // UNIFORME - nessun picco!
    },
    
    elongation: 0.65,  // L/W ~ 1.5 - Molto meno allungate dei gamma
    asymmetry: { mean: 0.55, std: 0.25 },  // MOLTO asimmetrico

    visualSignature: {
        dispersionScaleX: 0.9,      // Molto disperso (bordi frastagliati)
        dispersionScaleY: 0.9,
        hotspotCount: 6,            // Più frammenti
        hotspotSpread: 2.2,         // Frammenti molto separati
        hotspotFill: 0.7,           // Meno densità nei frammenti
        hotspotBoost: 0.9,          // Frammenti brillanti
        intensityVariance: 1.8,     // Altissimo rumore
        energyInitialBoost: 1.0,
        energyNoise: 0.5,           // Rumore energetico massimo

        offAxisShear: 0.4           // Distorsione laterale
    },
    
    energyRange: {
        min: 50,
        max: 100000,    // Tutto lo spettro
        spectralIndex: 2.7
    },
    
    interCameraVariance: 0.25,  // 25% - ALTISSIMA incoerenza
    
    description: 'Sciami adronici, ~1000× più frequenti dei gamma',
    observables: {
        flux: 'dominante senza tagli',
        morphology: 'irregolare, grumosa, sub-showers',
        rejection: '95-99% con Hillas cuts + stereo'
    },
    
    // Features distintive
    signatures: {
        widthMean: 0.22,  // 22 pixel - FIRMA PRINCIPALE
        lowElongation: 1.6,
        uniformAlpha: true,
        highAsymmetry: true,
        muonRings: 0.3  // 30% contiene anelli di muoni
    }
};

// === MAPPA PROFILI ===
const SOURCE_PROFILES = {
    'crab': CRAB_NEBULA_PROFILE,
    'pevatron': PEVATRON_PROFILE,
    'blazar': BLAZAR_PROFILE,
    'grb': GRB_PROFILE,
    'galactic-center': GALACTIC_CENTER_PROFILE,
    'hadron': HADRON_BACKGROUND_PROFILE
};

// === FUNZIONI HELPER ===

/**
 * Ottieni profilo per tipo sorgente
 */
function getSourceProfile(sourceType) {
    const profile = SOURCE_PROFILES[sourceType];
    if (!profile) {
        console.error(`Profilo sorgente '${sourceType}' non trovato`);
        return CRAB_NEBULA_PROFILE; // Fallback
    }
    return profile;
}

/**
 * Ottieni profilo casuale (per quiz)
 */
function getRandomSourceProfile(includeHadron = true) {
    const types = Object.keys(SOURCE_PROFILES);
    if (!includeHadron) {
        types.splice(types.indexOf('hadron'), 1);
    }
    const randomType = types[Math.floor(Math.random() * types.length)];
    return SOURCE_PROFILES[randomType];
}

/**
 * Ottieni lista di tutti i profili
 */
function getAllProfiles() {
    return Object.values(SOURCE_PROFILES);
}

/**
 * Confronta parametri con profili per identificazione
 * Ritorna array di match con score
 */
function identifySource(params) {
    const scores = [];
    
    Object.values(SOURCE_PROFILES).forEach(profile => {
        let score = 0;
        let matches = 0;
        
        // Check Length
        if (params.length >= profile.length.min && params.length <= profile.length.max) {
            score += 20;
            matches++;
        }
        
        // Check Width (peso doppio - molto discriminante)
        if (params.width >= profile.width.min && params.width <= profile.width.max) {
            score += 40;
            matches++;
        }
        
        // Check Size
        if (params.size >= profile.size.min && params.size <= profile.size.max) {
            score += 20;
            matches++;
        }
        
        // Check Alpha (dipende dal tipo)
        const alphaScore = scoreAlpha(params.alpha, profile.alpha);
        score += alphaScore * 20;
        
        scores.push({
            type: profile.type,
            name: profile.displayName,
            score: score,
            matches: matches,
            confidence: score / 100
        });
    });
    
    // Ordina per score
    scores.sort((a, b) => b.score - a.score);
    
    return scores;
}

/**
 * Calcola score per Alpha
 */
function scoreAlpha(observedAlpha, profileAlpha) {
    if (profileAlpha.type === 'uniform') {
        return 0.5; // Sempre possibile
    }
    
    const mean = profileAlpha.peak || profileAlpha.mean || 0;
    const width = profileAlpha.width || profileAlpha.std || 5;
    
    const diff = Math.abs(observedAlpha - mean);
    if (diff < width) return 1.0;
    if (diff < width * 2) return 0.7;
    if (diff < width * 3) return 0.4;
    return 0.1;
}
