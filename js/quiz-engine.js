/**
 * GAMMALAB - Quiz Engine
 * Sistema completo di quiz interattivo per identificazione sorgenti gamma
 * Features: timer 60s, hints progressivi, scoring con streak, feedback educativo
 */

// === CONFIGURAZIONE QUIZ ===
const QUIZ_CONFIG = {
    totalQuestions: 10,      // Ridotto a 10 domande per sessione
    timeLimit: 60,           // secondi per domanda
    basePoints: 100,         // punti base per risposta corretta
    hintPenalties: [30, 30, 20], // penalità per hint 1, 2, 3
    streakBonus: 10,         // bonus per streak consecutivo
    maxStreakBonus: 50       // bonus massimo da streak
};

// === TIPI DI DOMANDE ===
const QUESTION_TYPES = {
    SOURCE_IDENTIFICATION: 'source',      // Classica: "Quale sorgente?"
    PARTICLE_TYPE: 'particle',            // "È un gamma o un adrone?"
    ENERGY_LEVEL: 'energy',               // "Energia alta o bassa?"
    MUON_DETECTION: 'muon',               // "È un muone?"
    SHOWER_SHAPE: 'shape',                // "Ellisse stretta o larga?"
    THEORETICAL: 'theoretical'            // Domanda teorica a risposta multipla
};

// Database Domande Teoriche
const THEORETICAL_QUESTIONS = [
    {
        id: 'cherenkov_cause',
        question: "Qual è la causa principale dell'emissione di luce Cherenkov nell'atmosfera?",
        options: [
            { value: 'vacuum', label: "Particelle più veloci della luce nel vuoto" },
            { value: 'medium', label: "Particelle più veloci della luce nel mezzo (atmosfera)" },
            { value: 'magnetic', label: "Interazione con il campo magnetico terrestre" },
            { value: 'friction', label: "Attrito delle particelle con l'aria" }
        ],
        correctAnswer: 'medium',
        explanation: "La luce Cherenkov viene emessa quando una particella carica attraversa un dielettrico a una velocità superiore alla velocità di fase della luce in quel mezzo (c/n)."
    },
    {
        id: 'hillas_alpha',
        question: "Cosa indica il parametro di Hillas 'Alpha' (α)?",
        options: [
            { value: 'energy', label: "L'energia totale dello sciame" },
            { value: 'width', label: "La larghezza dell'ellisse" },
            { value: 'orientation', label: "L'angolo tra l'asse maggiore e la direzione della sorgente" },
            { value: 'altitude', label: "L'altitudine dello sciame" }
        ],
        correctAnswer: 'orientation',
        explanation: "Alpha è l'angolo di orientamento dell'immagine rispetto alla posizione della sorgente. Per sorgenti puntiformi, Alpha tende a 0° (l'asse punta alla sorgente)."
    },
    {
        id: 'gamma_hadron',
        question: "Qual è la differenza principale tra sciami gamma e sciami adronici?",
        options: [
            { value: 'color', label: "I gamma sono rossi, gli adroni blu" },
            { value: 'shape', label: "I gamma sono ellissi regolari, gli adroni sono irregolari/larghi" },
            { value: 'light', label: "Gli adroni non producono luce Cherenkov" },
            { value: 'time', label: "Gli adroni sono molto più lenti" }
        ],
        correctAnswer: 'shape',
        explanation: "Gli sciami elettromagnetici (gamma) sono compatti e regolari. Gli sciami adronici (protoni) sono più larghi, irregolari e frammentati."
    },
    {
        id: 'stereo_advantage',
        question: "Qual è il vantaggio principale della tecnica stereoscopica (più telescopi)?",
        options: [
            { value: 'daytime', label: "Permette di osservare di giorno" },
            { value: 'cost', label: "Riduce i costi di costruzione" },
            { value: 'reconstruction', label: "Migliora la ricostruzione della direzione e la reiezione del fondo" },
            { value: 'brightness', label: "Aumenta solo la luminosità dell'immagine" }
        ],
        correctAnswer: 'reconstruction',
        explanation: "La stereoscopia permette di vedere lo sciame da diverse angolazioni, migliorando drasticamente la precisione geometrica e la distinzione gamma/adrone."
    },
    {
        id: 'size_meaning',
        question: "A cosa è proporzionale il parametro 'Size' (carica totale)?",
        options: [
            { value: 'energy', label: "All'energia del fotone primario" },
            { value: 'distance', label: "Alla distanza della sorgente" },
            { value: 'age', label: "All'età della sorgente" },
            { value: 'noise', label: "Al rumore di fondo" }
        ],
        correctAnswer: 'energy',
        explanation: "Il parametro Size rappresenta la quantità totale di luce raccolta ed è approssimativamente proporzionale all'energia della particella primaria."
    },
    {
        id: 'standard_candle',
        question: "Quale sorgente è considerata la 'candela standard' dell'astronomia gamma VHE?",
        options: [
            { value: 'crab', label: "Crab Nebula" },
            { value: 'sun', label: "Il Sole" },
            { value: 'sag_a', label: "Sagittarius A*" },
            { value: 'moon', label: "La Luna" }
        ],
        correctAnswer: 'crab',
        explanation: "La Crab Nebula è una sorgente stabile e molto luminosa, usata per calibrare i telescopi e come unità di misura (1 Crab)."
    },
    {
        id: 'atmosphere_role',
        question: "Qual è il ruolo dell'atmosfera nei telescopi Cherenkov?",
        options: [
            { value: 'filter', label: "Filtra i raggi cosmici dannosi" },
            { value: 'calorimeter', label: "Agisce come calorimetro dove si sviluppa lo sciame" },
            { value: 'lens', label: "Focalizza la luce verso il telescopio" },
            { value: 'noise', label: "È solo una fonte di rumore da eliminare" }
        ],
        correctAnswer: 'calorimeter',
        explanation: "L'atmosfera è il mezzo in cui la particella primaria interagisce creando lo sciame di particelle secondarie che emettono luce Cherenkov."
    },
    {
        id: 'pmt_function',
        question: "Cosa fa un Fotomoltiplicatore (PMT) nella camera del telescopio?",
        options: [
            { value: 'focus', label: "Focalizza la luce" },
            { value: 'convert', label: "Converte singoli fotoni in un segnale elettrico amplificato" },
            { value: 'store', label: "Memorizza l'immagine digitalmente" },
            { value: 'cool', label: "Raffredda l'elettronica" }
        ],
        correctAnswer: 'convert',
        explanation: "I PMT sono sensori estremamente sensibili capaci di rilevare singoli fotoni e convertirli in impulsi elettrici misurabili."
    },
    {
        id: 'nsb_noise',
        question: "Cos'è il 'Night Sky Background' (NSB)?",
        options: [
            { value: 'pollution', label: "Inquinamento luminoso delle città" },
            { value: 'stars', label: "Luce diffusa da stelle, airglow e luce zodiacale" },
            { value: 'clouds', label: "Riflessione delle nuvole" },
            { value: 'electronics', label: "Rumore elettronico dei sensori" }
        ],
        correctAnswer: 'stars',
        explanation: "Il NSB è la luce di fondo naturale del cielo notturno che costituisce il principale rumore per le osservazioni Cherenkov."
    },
    {
        id: 'muon_ring',
        question: "Perché i muoni appaiono spesso come anelli o archi?",
        options: [
            { value: 'lens_defect', label: "Difetto delle lenti del telescopio" },
            { value: 'cone', label: "Emettono un cono di luce che viene proiettato come un anello" },
            { value: 'spin', label: "Ruotano molto velocemente su se stessi" },
            { value: 'diffraction', label: "È un effetto di diffrazione atmosferica" }
        ],
        correctAnswer: 'cone',
        explanation: "Un muone è una singola particella carica che viaggia quasi dritta emettendo un cono di luce Cherenkov, che appare come un cerchio sulla camera."
    },
    {
        id: 'impact_parameter',
        question: "Cos'è il 'Parametro d'Impatto'?",
        options: [
            { value: 'force', label: "La forza con cui la particella colpisce l'atmosfera" },
            { value: 'distance', label: "La distanza tra l'asse dello sciame e il telescopio" },
            { value: 'size', label: "La dimensione dello specchio" },
            { value: 'damage', label: "Il danno causato alle ottiche" }
        ],
        correctAnswer: 'distance',
        explanation: "Il parametro d'impatto è la distanza perpendicolare tra la traiettoria della particella primaria (core dello sciame) e il telescopio."
    },
    {
        id: 'coincidence_trigger',
        question: "A cosa serve il 'Trigger di Coincidenza'?",
        options: [
            { value: 'speed', label: "A velocizzare l'acquisizione dati" },
            { value: 'noise', label: "A scartare il rumore casuale del cielo notturno (NSB)" },
            { value: 'align', label: "Ad allineare i telescopi" },
            { value: 'color', label: "A distinguere i colori dei fotoni" }
        ],
        correctAnswer: 'noise',
        explanation: "Richiedere che più pixel o più telescopi vedano un segnale contemporaneamente elimina i segnali casuali dovuti al fondo del cielo."
    },
    {
        id: 'energy_threshold',
        question: "Cosa determina principalmente la soglia di energia minima di un telescopio?",
        options: [
            { value: 'computer', label: "La potenza del computer di analisi" },
            { value: 'mirror', label: "L'area dello specchio e l'efficienza dei sensori" },
            { value: 'wind', label: "La velocità del vento" },
            { value: 'moon', label: "La fase lunare" }
        ],
        correctAnswer: 'mirror',
        explanation: "Specchi più grandi raccolgono più luce, permettendo di vedere sciami deboli generati da raggi gamma di bassa energia."
    },
    {
        id: 'spectral_index',
        question: "Cosa indica un indice spettrale 'duro' (es. 2.0) rispetto a uno 'molle' (es. 3.0)?",
        options: [
            { value: 'hard', label: "Più fotoni ad alta energia rispetto a quelli a bassa energia" },
            { value: 'soft', label: "Meno fotoni ad alta energia" },
            { value: 'brightness', label: "La sorgente è più luminosa in assoluto" },
            { value: 'distance', label: "La sorgente è più vicina" }
        ],
        correctAnswer: 'hard',
        explanation: "Uno spettro 'duro' (indice basso) decresce più lentamente all'aumentare dell'energia, indicando una maggiore presenza di particelle molto energetiche."
    },
    {
        id: 'dead_time',
        question: "Cos'è il 'Tempo Morto' (Dead Time) di un sistema di acquisizione?",
        options: [
            { value: 'off', label: "Quando il telescopio è spento di giorno" },
            { value: 'processing', label: "Il tempo in cui il sistema è occupato a leggere un evento e non può registrarne altri" },
            { value: 'cloud', label: "Quando una nuvola copre la sorgente" },
            { value: 'broken', label: "Quando un sensore è rotto" }
        ],
        correctAnswer: 'processing',
        explanation: "È l'intervallo di tempo subito dopo un trigger durante il quale l'elettronica sta elaborando i dati e il telescopio è 'cieco' a nuovi eventi."
    },
    // === NUOVE DOMANDE SORGENTI ===
    {
        id: 'crab_nature',
        question: "Che tipo di oggetto celeste alimenta la Crab Nebula?",
        options: [
            { value: 'blackhole', label: "Un buco nero" },
            { value: 'pulsar', label: "Una pulsar (stella di neutroni in rotazione)" },
            { value: 'star', label: "Una stella gigante rossa" },
            { value: 'planet', label: "Un pianeta gassoso" }
        ],
        correctAnswer: 'pulsar',
        explanation: "La Crab Nebula è alimentata dal vento di una pulsar centrale, residuo dell'esplosione di supernova del 1054 d.C."
    },
    {
        id: 'crab_constellation',
        question: "In quale costellazione si trova la Crab Nebula?",
        options: [
            { value: 'orion', label: "Orione" },
            { value: 'taurus', label: "Toro" },
            { value: 'ursa', label: "Orsa Maggiore" },
            { value: 'cassiopeia', label: "Cassiopea" }
        ],
        correctAnswer: 'taurus',
        explanation: "La Crab Nebula si trova nella costellazione del Toro, vicino alla stella Zeta Tauri."
    },
    {
        id: 'crab_candle',
        question: "Perché la Crab Nebula è importante per l'astronomia gamma?",
        options: [
            { value: 'variable', label: "Perché cambia luminosità ogni giorno" },
            { value: 'standard', label: "È la 'candela standard' stabile per calibrare i telescopi" },
            { value: 'closest', label: "È la sorgente più vicina alla Terra" },
            { value: 'dark', label: "È l'unica sorgente oscura" }
        ],
        correctAnswer: 'standard',
        explanation: "Essendo molto luminosa e stabile nel tempo, viene usata come unità di misura (1 Crab) per il flusso di altre sorgenti."
    },
    {
        id: 'snr_acceleration',
        question: "Qual è il meccanismo principale di accelerazione nei resti di supernova (SNR)?",
        options: [
            { value: 'gravity', label: "Collasso gravitazionale" },
            { value: 'shock', label: "Accelerazione di Fermi nelle onde d'urto" },
            { value: 'thermal', label: "Emissione termica" },
            { value: 'chemical', label: "Reazioni chimiche" }
        ],
        correctAnswer: 'shock',
        explanation: "Le particelle vengono accelerate rimbalzando avanti e indietro attraverso il fronte dell'onda d'urto dell'esplosione (meccanismo di Fermi)."
    },
    {
        id: 'snr_energy',
        question: "Fino a quali energie si pensa possano accelerare i protoni nei SNR?",
        options: [
            { value: 'kev', label: "Pochi keV" },
            { value: 'gev', label: "Alcuni GeV" },
            { value: 'pev', label: "Fino ai PeV (10^15 eV)" },
            { value: 'tev', label: "Massimo 1 TeV" }
        ],
        correctAnswer: 'pev',
        explanation: "Si ritiene che i SNR siano i 'Pevatrons' galattici, capaci di accelerare i raggi cosmici fino al PeV (energia del ginocchio)."
    },
    {
        id: 'snr_remnant',
        question: "Cosa rimane tipicamente al centro di un resto di supernova?",
        options: [
            { value: 'nothing', label: "Nulla, tutto viene distrutto" },
            { value: 'compact', label: "Spesso una stella di neutroni o un buco nero" },
            { value: 'planet', label: "Un nuovo sistema planetario" },
            { value: 'dwarf', label: "Una nana bianca" }
        ],
        correctAnswer: 'compact',
        explanation: "Il nucleo della stella massiccia collassa formando un oggetto compatto (stella di neutroni o buco nero), mentre gli strati esterni vengono espulsi."
    },
    {
        id: 'blazar_jet',
        question: "Cosa distingue un Blazar da un normale nucleo galattico attivo (AGN)?",
        options: [
            { value: 'size', label: "È più piccolo" },
            { value: 'orientation', label: "Il suo getto relativistico punta verso la Terra" },
            { value: 'color', label: "È più rosso" },
            { value: 'silent', label: "Non emette onde radio" }
        ],
        correctAnswer: 'orientation',
        explanation: "Nei Blazar, il getto di plasma relativistico è allineato quasi perfettamente con la nostra linea di vista, amplificandone la luminosità."
    },
    {
        id: 'blazar_variability',
        question: "Qual è una caratteristica tipica dell'emissione dei Blazar?",
        options: [
            { value: 'constant', label: "Luminosità costante per secoli" },
            { value: 'periodic', label: "Pulsazioni regolari come un orologio" },
            { value: 'variable', label: "Variabilità rapida e imprevedibile (flare)" },
            { value: 'thermal', label: "Solo emissione termica" }
        ],
        correctAnswer: 'variable',
        explanation: "I Blazar mostrano una variabilità estrema su tempi scala che vanno da minuti a anni, spesso con improvvisi 'flare' di luminosità."
    },
    {
        id: 'blazar_host',
        question: "Che tipo di galassia ospita solitamente un Blazar?",
        options: [
            { value: 'spiral', label: "Una galassia a spirale come la Via Lattea" },
            { value: 'elliptical', label: "Una galassia ellittica gigante" },
            { value: 'dwarf', label: "Una galassia nana irregolare" },
            { value: 'cluster', label: "Un ammasso globulare" }
        ],
        correctAnswer: 'elliptical',
        explanation: "I Blazar sono tipicamente associati a buchi neri supermassicci al centro di grandi galassie ellittiche."
    },
    {
        id: 'grb_types',
        question: "Qual è la differenza principale tra GRB lunghi e corti?",
        options: [
            { value: 'color', label: "Il colore della luce" },
            { value: 'duration', label: "La durata (maggiore o minore di 2 secondi)" },
            { value: 'distance', label: "La distanza dalla Terra" },
            { value: 'time', label: "L'ora del giorno in cui avvengono" }
        ],
        correctAnswer: 'duration',
        explanation: "I GRB vengono classificati in 'Short' (< 2s) e 'Long' (> 2s), indicando probabilmente due diversi meccanismi di origine."
    },
    {
        id: 'grb_short_origin',
        question: "Cosa si pensa generi i GRB corti (Short GRB)?",
        options: [
            { value: 'collapse', label: "Collasso di una stella massiccia" },
            { value: 'merger', label: "Fusione (merger) di due stelle di neutroni" },
            { value: 'explosion', label: "Esplosione di un pianeta" },
            { value: 'comet', label: "Impatto di una cometa" }
        ],
        correctAnswer: 'merger',
        explanation: "I GRB corti sono associati alla fusione di sistemi binari compatti (stelle di neutroni), eventi che producono anche onde gravitazionali."
    },
    {
        id: 'grb_energy',
        question: "Perché i GRB sono considerati gli eventi più violenti dell'universo?",
        options: [
            { value: 'loud', label: "Fanno molto rumore" },
            { value: 'energy', label: "Emettono in pochi secondi l'energia che il Sole produce in una vita intera" },
            { value: 'hot', label: "Sono più caldi del Big Bang" },
            { value: 'large', label: "Sono più grandi di una galassia" }
        ],
        correctAnswer: 'energy',
        explanation: "L'energia isotropa equivalente rilasciata in un GRB può raggiungere 10^54 erg, rendendoli le esplosioni più luminose dopo il Big Bang."
    },
    {
        id: 'gc_object',
        question: "Cosa si trova al centro esatto della nostra Galassia (Sgr A*)?",
        options: [
            { value: 'star', label: "Una stella molto luminosa" },
            { value: 'void', label: "Un vuoto assoluto" },
            { value: 'blackhole', label: "Un buco nero supermassiccio" },
            { value: 'nebula', label: "Una nebulosa planetaria" }
        ],
        correctAnswer: 'blackhole',
        explanation: "Al centro della Via Lattea risiede Sagittarius A*, un buco nero supermassiccio di circa 4 milioni di masse solari."
    },
    {
        id: 'gc_pevatron',
        question: "Cosa indica la presenza di un 'Pevatron' al Centro Galattico?",
        options: [
            { value: 'robot', label: "Una macchina aliena" },
            { value: 'accelerator', label: "Un acceleratore naturale capace di raggiungere energie del PeV" },
            { value: 'star', label: "Una stella di tipo P" },
            { value: 'gas', label: "Una nube di gas freddo" }
        ],
        correctAnswer: 'accelerator',
        explanation: "Le osservazioni indicano che il Centro Galattico agisce come un acceleratore di particelle cosmiche fino a energie di peta-elettronvolt (PeV)."
    },
    {
        id: 'gc_visibility',
        question: "Perché è difficile osservare il Centro Galattico in luce visibile?",
        options: [
            { value: 'far', label: "È troppo lontano" },
            { value: 'dust', label: "C'è troppa polvere interstellare che assorbe la luce" },
            { value: 'dark', label: "È sempre buio lì" },
            { value: 'bright', label: "È troppo luminoso e acceca i telescopi" }
        ],
        correctAnswer: 'dust',
        explanation: "Le nubi di polvere sul piano galattico assorbono la luce visibile, rendendo necessarie osservazioni in infrarosso, radio o raggi gamma."
    },
    {
        id: 'hadron_noise',
        question: "Qual è la principale fonte di 'rumore' di fondo per i telescopi Cherenkov?",
        options: [
            { value: 'moon', label: "La luce della Luna" },
            { value: 'cr', label: "I raggi cosmici adronici (protoni, nuclei)" },
            { value: 'cities', label: "Le luci delle città" },
            { value: 'satellites', label: "I satelliti artificiali" }
        ],
        correctAnswer: 'cr',
        explanation: "I raggi cosmici carichi bombardano continuamente l'atmosfera, producendo sciami che simulano quelli gamma ma sono molto più frequenti."
    },
    {
        id: 'hadron_shape',
        question: "Come appare tipicamente un evento adronico rispetto a un gamma?",
        options: [
            { value: 'identical', label: "Identico, impossibile distinguerli" },
            { value: 'irregular', label: "Più largo, irregolare e frammentato" },
            { value: 'smaller', label: "Molto più piccolo e puntiforme" },
            { value: 'blue', label: "Sempre di colore blu" }
        ],
        correctAnswer: 'irregular',
        explanation: "A causa delle interazioni nucleari e del momento trasverso, gli sciami adronici sono più sparpagliati e irregolari di quelli elettromagnetici."
    },
    {
        id: 'hadron_ratio',
        question: "Qual è il rapporto tipico tra eventi di fondo adronico e veri eventi gamma?",
        options: [
            { value: 'equal', label: "1 a 1" },
            { value: 'gamma_more', label: "Ci sono più gamma che adroni" },
            { value: 'hadron_more', label: "Gli adroni sono 1000 volte più frequenti dei gamma" },
            { value: 'none', label: "Non ci sono adroni di notte" }
        ],
        correctAnswer: 'hadron_more',
        explanation: "Il flusso di raggi cosmici è enormemente superiore a quello gamma (rapporto ~1000:1), rendendo la reiezione del fondo cruciale."
    }
];

// Distribuzione tipi di domande per difficoltà crescente (15 domande)
const QUESTION_DISTRIBUTION = [
    // Fase 1: Intro & Basi (1-5)
    [QUESTION_TYPES.THEORETICAL],           // 1. Teoria: Cherenkov
    [QUESTION_TYPES.SOURCE_IDENTIFICATION], // 2. Pratica: Identificazione facile
    [QUESTION_TYPES.SOURCE_IDENTIFICATION], // 3. Pratica: Identificazione facile
    [QUESTION_TYPES.THEORETICAL],           // 4. Teoria: Hillas Alpha
    [QUESTION_TYPES.PARTICLE_TYPE],         // 5. Pratica: Gamma vs Adrone

    // Fase 2: Intermedia (6-10)
    [QUESTION_TYPES.SOURCE_IDENTIFICATION], // 6. Pratica: Identificazione media
    [QUESTION_TYPES.THEORETICAL],           // 7. Teoria: Gamma vs Hadron
    [QUESTION_TYPES.ENERGY_LEVEL],          // 8. Pratica: Energia
    [QUESTION_TYPES.MUON_DETECTION],        // 9. Pratica: Muone
    [QUESTION_TYPES.THEORETICAL],           // 10. Teoria: Stereoscopia

    // Fase 3: Avanzata (11-15)
    [QUESTION_TYPES.SHOWER_SHAPE],          // 11. Pratica: Forma
    [QUESTION_TYPES.PARTICLE_TYPE],         // 12. Pratica: Gamma vs Adrone difficile
    [QUESTION_TYPES.THEORETICAL],           // 13. Teoria: Size/Energy
    [QUESTION_TYPES.SOURCE_IDENTIFICATION], // 14. Pratica: Identificazione difficile
    [QUESTION_TYPES.SOURCE_IDENTIFICATION]  // 15. Pratica: Finale
];

// === CLASSE QUIZ ENGINE ===
class QuizEngine {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.hintsUsed = 0;
        this.currentHintLevel = 0;
        this.timeRemaining = QUIZ_CONFIG.timeLimit;
        this.questionStartTime = 0;
        this.timerId = null;
        
        // Storia risposte
        this.answerHistory = [];
        this.sourceStats = {
            'crab': { attempts: 0, correct: 0 },
            'pevatron': { attempts: 0, correct: 0 },
            'blazar': { attempts: 0, correct: 0 },
            'grb': { attempts: 0, correct: 0 },
            'galactic-center': { attempts: 0, correct: 0 },
            'hadron': { attempts: 0, correct: 0 }
        };
        
        // Componenti simulazione
        this.engine = null;
        this.hillasAnalyzer = null;
        this.colorPalette = null;
        this.renderers = [];
    // Modalità quiz: se true, il quiz userà SOLO sorgenti gamma e immagini pulite
    this.quizGammaOnly = true;
        
        // Domanda corrente
        this.currentEvent = null;
        this.currentProfile = null;
        this.currentHillasParams = [];
        this.currentQuestionType = null;
        this.currentCorrectAnswer = null;
        this.currentTheoreticalQuestion = null;
        this.selectedTheoreticalQuestions = [];
        
        // Tracciamento domande per evitare duplicati
        this.usedSourceTypes = new Set();
    }

    /**
     * Inizializza il quiz
     */
    initialize() {
        console.log('🎮 Inizializzazione Quiz Engine...');
        
        // Inizializza componenti simulazione
        this.engine = new SimulationEngine();
        this.hillasAnalyzer = new HillasAnalyzer();
        this.colorPalette = new EnergyColorPalette();
        this.engine.colorPalette = this.colorPalette;
        
        // Inizializza renderers
        this.renderers = [
            new CanvasRenderer('quizCam1', 'quizCam1-overlay')
        ];
        
        // Abilita rendering stile chiaro e source-specific per quiz
        this.renderers.forEach(renderer => {
            if (typeof renderer.setSignatureHintsEnabled === 'function') {
                renderer.setSignatureHintsEnabled(false);
            } else {
                renderer.signatureHintsEnabled = false;
            }
            renderer.colorPalette = this.colorPalette;
            renderer.lightStyle = true; // Nuovo stile chiaro
            // In quiz vogliamo che le ellissi siano geometricamente aderenti
            renderer.respectExactHillas = true;
            renderer.subpixelEnabled = false;
            // Modalità didattica: sopprimi rumore di background
            if (this.quizGammaOnly) renderer.suppressNoise = true;

            if (typeof renderer.enableHoverHillasMode === 'function') {
                renderer.enableHoverHillasMode();
            } else {
                renderer.showHillasOnHover = true;
                renderer.embedHillasOutline = false;
                renderer.showEllipseOnly = false;
            }

            if (typeof renderer.configureAlphaLabelPlacement === 'function') {
                renderer.configureAlphaLabelPlacement({
                    mode: 'perpendicular',
                    alongFraction: 0.55,
                    lateralOffset: 80,
                    textAlign: 'center'
                });
            }

            if (typeof renderer.configureAlphaReferenceMarkers === 'function') {
                renderer.configureAlphaReferenceMarkers({
                    cameraMarkerMode: 'offset',
                    cameraMarkerOffset: 110,
                    drawCameraCenterCross: true,
                    cameraCenterCrossSize: 14,
                    cameraMarkerRadius: 7,
                    showAlphaArc: true,
                    arcRadiusPx: 120,
                    arcLineWidth: 2.4
                });
            }

            if (typeof renderer.configureAlphaDirectionGuides === 'function') {
                renderer.configureAlphaDirectionGuides({
                    enabled: true,
                    majorAxisColor: 'rgba(255, 210, 120, 0.95)',
                    cameraRayColor: 'rgba(130, 220, 255, 0.95)',
                    lineWidth: 2.4,
                    arrowSize: 12,
                    majorAxisLengthPx: 160,
                    cameraRayExtensionPx: 35,
                    cameraRayLengthPx: 230,
                    cameraRayBacktrackPx: 60
                });
            }

            if (typeof renderer.configureHoverZoom === 'function') {
                renderer.configureHoverZoom({
                    enabled: true,
                    scale: 2.1,
                    radiusPx: 140,
                    offsetX: 0,
                    offsetY: -120,
                    borderColor: 'rgba(255, 255, 255, 0.95)',
                    borderWidth: 2.8,
                    overlayFill: 'rgba(4, 6, 14, 0.3)',
                    showAlphaArc: true,
                    arcColor: 'rgba(255, 210, 120, 0.9)'
                });
            }
        });
        
        // FORZA dimensioni quadrate per i canvas overlay
        this.renderers.forEach((renderer, i) => {
            const overlay = renderer.overlay;
            if (overlay) {
                // Forza dimensioni display uguali
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.objectFit = 'fill';
                console.log(`📐 Canvas overlay ${i+1} forzato a dimensioni quadrate`);
            }
        });
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        console.log('✅ Quiz Engine inizializzato');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Bottone start
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            this.startQuiz();
        });
        
        // Bottoni risposta
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = e.target.dataset.answer;
                this.submitAnswer(answer);
            });
        });
        
        // Bottoni hint
        document.getElementById('hint1Btn').addEventListener('click', () => this.showHint(1));
        document.getElementById('hint2Btn').addEventListener('click', () => this.showHint(2));
        document.getElementById('hint3Btn').addEventListener('click', () => this.showHint(3));
        
        // Bottone next question
        document.getElementById('nextQuestionBtn').addEventListener('click', () => {
            this.nextQuestion();
        });
        
        // Bottoni results
        document.getElementById('retryQuizBtn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('reviewBtn').addEventListener('click', () => {
            window.location.href = 'intro-cherenkov.html';
        });
    }

    /**
     * Inizia il quiz
     */
    startQuiz() {
        console.log('🚀 Start quiz!');
        
        // Nascondi start screen, mostra quiz screen
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('quizScreen').classList.remove('hidden');
        
        // Reset stato
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.hintsUsed = 0;
        this.answerHistory = [];
        
        // Reset stats
        Object.keys(this.sourceStats).forEach(key => {
            this.sourceStats[key] = { attempts: 0, correct: 0 };
        });
        
        // Reset tracciamento duplicati
        this.usedSourceTypes.clear();
        
        // Reset indice domande teoriche
        this.theoreticalQuestionIndex = 0;
        
        // Genera piano domande casuale (10 domande)
        this.sessionPlan = this._generateSessionPlan(QUIZ_CONFIG.totalQuestions);
        
        // Seleziona domande teoriche necessarie per questa sessione
        const theoreticalCount = this.sessionPlan.filter(t => t === QUESTION_TYPES.THEORETICAL).length;
        this.selectedTheoreticalQuestions = [...THEORETICAL_QUESTIONS]
            .sort(() => 0.5 - Math.random())
            .slice(0, theoreticalCount);
        
        // Genera prima domanda
        this.generateQuestion();
    }

    /**
     * Genera un piano di domande casuale per la sessione
     */
    _generateSessionPlan(count) {
        const plan = [];
        const types = Object.values(QUESTION_TYPES);
        
        // Assicura varietà: ~40% teoriche, ~60% pratiche
        for (let i = 0; i < count; i++) {
            if (Math.random() < 0.4) {
                plan.push(QUESTION_TYPES.THEORETICAL);
            } else {
                // Scegli un tipo pratico a caso (escludendo THEORETICAL)
                const practicalTypes = types.filter(t => t !== QUESTION_TYPES.THEORETICAL);
                const randomType = practicalTypes[Math.floor(Math.random() * practicalTypes.length)];
                plan.push(randomType);
            }
        }
        
        // Mischia il piano
        return plan.sort(() => 0.5 - Math.random());
    }

    /**
     * Genera nuova domanda
     */
    generateQuestion() {
        this.currentQuestion++;
        
        // Update UI
        document.getElementById('questionNumber').textContent = 
            `${this.currentQuestion}/${QUIZ_CONFIG.totalQuestions}`;
        
        // Reset hint state
        this.currentHintLevel = 0;
        document.getElementById('hint1Btn').disabled = false;
        document.getElementById('hint1Btn').style.display = 'inline-block';
        document.getElementById('hint2Btn').disabled = true;
        document.getElementById('hint2Btn').style.display = 'inline-block';
        document.getElementById('hint3Btn').disabled = true;
        document.getElementById('hint3Btn').style.display = 'inline-block';
        document.getElementById('hintPanel').classList.add('hidden');
        document.getElementById('feedbackPanel').classList.add('hidden');
        
        // Abilita bottoni risposta
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
        
        // Determina tipo di domanda basato su progressione
        this.currentQuestionType = this._selectQuestionType();
        
        // Genera evento basato sul tipo di domanda
        this._generateQuestionByType();
        
        // Start timer
        this.startTimer();
    }
    
    /**
     * Seleziona tipo di domanda basato su progressione
     */
    _selectQuestionType() {
        const questionIndex = this.currentQuestion - 1;
        
        // Usa il piano generato per questa sessione
        if (this.sessionPlan && this.sessionPlan[questionIndex]) {
            const selectedType = this.sessionPlan[questionIndex];
            console.log(`🎲 Domanda ${this.currentQuestion}: tipo = ${selectedType} (da piano sessione)`);
            return selectedType;
        }
        
        // Fallback (non dovrebbe accadere)
        return QUESTION_TYPES.SOURCE_IDENTIFICATION;
    }
    
    /**
     * Genera domanda specifica per tipo
     */
    _generateQuestionByType() {
        const quizCanvasSize = { width: 600, height: 600 };
        const simulatorSection = document.querySelector('.simulator-section');
        
        // Reset visibility (show simulator elements by default)
        if (simulatorSection) {
            simulatorSection.classList.remove('hidden');
            // Mostra il container del layout quiz (camera + info box)
            const layoutContainer = simulatorSection.querySelector('.quiz-layout-container');
            if (layoutContainer) layoutContainer.style.display = 'flex';
            
            // Nascondi vecchi elementi se presenti
            simulatorSection.querySelectorAll('.cameras-grid, .stereo-container, .hillas-panel').forEach(el => el.style.display = 'none');

            const instructionEl = document.getElementById('quizInstruction');
            if (instructionEl) {
                instructionEl.style.display = '';
                instructionEl.style.fontSize = '';
                instructionEl.style.fontWeight = '';
                instructionEl.style.color = '';
                instructionEl.style.textAlign = '';
                instructionEl.style.padding = '';
            }
        }

        // Reset question title visibility
        const questionTitle = document.getElementById('questionTitle');
        if (questionTitle) {
            if (this.currentQuestionType === QUESTION_TYPES.SOURCE_IDENTIFICATION) {
                questionTitle.style.display = 'block';
            } else {
                questionTitle.style.display = 'none';
            }
        }

        switch(this.currentQuestionType) {
            case QUESTION_TYPES.THEORETICAL:
                this._generateTheoreticalQuestion();
                break;
            case QUESTION_TYPES.PARTICLE_TYPE:
                this._generateParticleTypeQuestion(quizCanvasSize);
                break;
            case QUESTION_TYPES.ENERGY_LEVEL:
                this._generateEnergyLevelQuestion(quizCanvasSize);
                break;
            case QUESTION_TYPES.MUON_DETECTION:
                this._generateMuonDetectionQuestion(quizCanvasSize);
                break;
            case QUESTION_TYPES.SHOWER_SHAPE:
                this._generateShowerShapeQuestion(quizCanvasSize);
                break;
            case QUESTION_TYPES.SOURCE_IDENTIFICATION:
            default:
                this._generateSourceIdentificationQuestion(quizCanvasSize);
                break;
        }
        
        // Mostra parametri Hillas (solo se non è teorica)
        if (this.currentQuestionType !== QUESTION_TYPES.THEORETICAL) {
            this.displayQuizHillas();
        } else {
            document.getElementById('quizHillasDisplay').innerHTML = '';
        }
    }
    
    /**
     * Genera domanda teorica
     */
    _generateTheoreticalQuestion() {
        // Nascondi simulatore
        const simulatorSection = document.querySelector('.simulator-section');
        
        // Prendi la prossima domanda teorica disponibile dalla lista mescolata
        // Usiamo un indice che incrementa ogni volta che usiamo una domanda teorica
        if (typeof this.theoreticalQuestionIndex === 'undefined') {
            this.theoreticalQuestionIndex = 0;
        }
        
        // Se abbiamo esaurito le domande teoriche selezionate, ricominciamo (non dovrebbe succedere con la logica attuale)
        if (this.theoreticalQuestionIndex >= this.selectedTheoreticalQuestions.length) {
            this.theoreticalQuestionIndex = 0;
        }
        
        const questionData = this.selectedTheoreticalQuestions[this.theoreticalQuestionIndex];
        this.theoreticalQuestionIndex++; // Incrementa per la prossima volta
        
        this.currentTheoreticalQuestion = questionData;
        this.currentCorrectAnswer = questionData.correctAnswer;
        
        // Update UI
        const instructionEl = document.getElementById('quizInstruction');
        
        if (simulatorSection) {
            simulatorSection.classList.remove('hidden');
            // Nascondi il layout del quiz (camera + info box) per domande teoriche
            const layoutContainer = simulatorSection.querySelector('.quiz-layout-container');
            if (layoutContainer) layoutContainer.style.display = 'none';
            
            // Mostra istruzione
            instructionEl.style.display = 'block';
        }
        
        instructionEl.textContent = questionData.question;
        instructionEl.style.fontSize = '1.4em';
        instructionEl.style.fontWeight = 'bold';
        instructionEl.style.color = 'var(--accent-cyan)';
        instructionEl.style.textAlign = 'center';
        instructionEl.style.padding = '20px';
        
        // Set options
        this._setAnswerOptions(questionData.options);
        
        // Nascondi hints per domande teoriche
        document.getElementById('hint1Btn').style.display = 'none';
        document.getElementById('hint2Btn').style.display = 'none';
        document.getElementById('hint3Btn').style.display = 'none';
    }

    /**
     * Domanda classica: identifica la sorgente
     */
    _generateSourceIdentificationQuestion(canvasSize) {
        // Ripristina visibilità elementi simulatore
        const simulatorSection = document.querySelector('.simulator-section');
        if (simulatorSection) {
            const layoutContainer = simulatorSection.querySelector('.quiz-layout-container');
            if (layoutContainer) layoutContainer.style.display = 'flex';
            
            document.getElementById('quizInstruction').style.textAlign = '';
            document.getElementById('quizInstruction').style.padding = '';
            document.getElementById('quizInstruction').style.color = '';
        }

        // Seleziona sorgente random (escludi muon per questa domanda)
        // Evita ripetizioni se possibile
        let profile = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            profile = this.quizGammaOnly ? getRandomSourceProfile(false) : getRandomSourceProfile(true);
            attempts++;
        } while (this.usedSourceTypes.has(profile.type) && attempts < maxAttempts);
        
        this.usedSourceTypes.add(profile.type);
        this.currentProfile = profile;
        this.currentCorrectAnswer = this.currentProfile.type;
        
        // Genera eventi per 3 camere (forza eventi centrati per didattica)
        this._generateAndRenderEvents(this.currentProfile, canvasSize, { forceCenter: true, onlyGamma: this.quizGammaOnly });
        
        // Imposta opzioni risposta (tutte le sorgenti)
        this._setAnswerOptions([
            { value: 'crab', label: '🦀 Crab Nebula' },
            { value: 'pevatron', label: '💥 Resto di Supernova' },
            { value: 'blazar', label: '🌀 Blazar (AGN)' },
            { value: 'grb', label: '⚡ GRB' },
            { value: 'galactic-center', label: '⭐ Centro Galattico' },
            { value: 'hadron', label: '⚛️ Background Adronico' }
        ]);
        
        document.getElementById('quizInstruction').textContent = 
            `Analizza i parametri Hillas e identifica la sorgente. Hai ${QUIZ_CONFIG.timeLimit} secondi!`;
    }
    
    /**
     * Domanda: È un gamma o un adrone?
     */
    _generateParticleTypeQuestion(canvasSize) {
        // 50% gamma, 50% hadron
        const isGamma = Math.random() < 0.5;
        
            if (isGamma) {
            // Usa una sorgente gamma qualsiasi (escludi hadron)
            const gammaProfiles = [
                SOURCE_PROFILES.crab,
                SOURCE_PROFILES.pevatron,
                SOURCE_PROFILES.blazar,
                SOURCE_PROFILES.grb,
                SOURCE_PROFILES.galacticCenter
            ];
            this.currentProfile = gammaProfiles[Math.floor(Math.random() * gammaProfiles.length)];
            // If quizGammaOnly is enabled, ask for onlyGamma images (no hadron/muon, no noise)
            this._generateAndRenderEvents(this.currentProfile, canvasSize, { forceCenter: true, onlyGamma: this.quizGammaOnly });
            this.currentCorrectAnswer = 'gamma';
        } else {
            // Genera evento adronico
            this._generateAndRenderHadronicEvents(canvasSize);
            this.currentCorrectAnswer = 'hadron';
        }
        
        this._setAnswerOptions([
            { value: 'gamma', label: '🌟 Fotone Gamma' },
            { value: 'hadron', label: '⚛️ Adrone (Background)' }
        ]);
        
        document.getElementById('quizInstruction').textContent = 
            `È un fotone gamma da una sorgente astrofisica o un adrone di background? (Osserva la forma dell'ellisse)`;
    }
    
    /**
     * Domanda: Energia alta o bassa?
     */
    _generateEnergyLevelQuestion(canvasSize) {
        // 50% bassa energia (100-500 GeV), 50% alta energia (2-5 TeV)
        const isHighEnergy = Math.random() < 0.5;
        const energy = isHighEnergy ? 
            2000 + Math.random() * 3000 :  // 2-5 TeV
            100 + Math.random() * 400;      // 100-500 GeV
        
        this.currentProfile = getRandomSourceProfile(false); // Solo gamma
        this.currentCorrectAnswer = isHighEnergy ? 'high' : 'low';
        
        // Genera con energia specifica
    this._generateAndRenderEvents(this.currentProfile, canvasSize, { energy, forceCenter: true });
        
        this._setAnswerOptions([
            { value: 'low', label: '📉 Bassa Energia (< 1 TeV)' },
            { value: 'high', label: '📈 Alta Energia (> 1 TeV)' }
        ]);
        
        document.getElementById('quizInstruction').textContent = 
            `L'evento ha energia alta o bassa? (Osserva il numero di fotoni e la lunghezza della traccia)`;
    }
    
    /**
     * Domanda: È un muone?
     */
    _generateMuonDetectionQuestion(canvasSize) {
        const isMuon = Math.random() < 0.5;
        
            if (isMuon) {
            this._generateAndRenderMuonEvents(canvasSize);
            this.currentCorrectAnswer = 'yes';
        } else {
            // Gamma o hadron
            if (Math.random() < 0.7) {
                // 70% gamma
                this.currentProfile = getRandomSourceProfile(false);
                this._generateAndRenderEvents(this.currentProfile, canvasSize, { forceCenter: true });
            } else {
                // 30% hadron
                this._generateAndRenderHadronicEvents(canvasSize);
            }
            this.currentCorrectAnswer = 'no';
        }
        
        this._setAnswerOptions([
            { value: 'yes', label: '✅ Sì, è un Muone' },
            { value: 'no', label: '❌ No, non è un Muone' }
        ]);
        
        document.getElementById('quizInstruction').textContent = 
            `Questo evento è un muone? (I muoni producono tracce lineari e sottili)`;
    }
    
    /**
     * Domanda: Ellisse stretta o larga?
     */
    _generateShowerShapeQuestion(canvasSize) {
        const isNarrow = Math.random() < 0.5;
        
        if (isNarrow) {
            // Gamma (ellisse stretta)
            this.currentProfile = getRandomSourceProfile(false);
            this._generateAndRenderEvents(this.currentProfile, canvasSize, { forceCenter: true });
            this.currentCorrectAnswer = 'narrow';
        } else {
            // Hadron (ellisse larga)
            this._generateAndRenderHadronicEvents(canvasSize);
            this.currentCorrectAnswer = 'wide';
        }
        
        this._setAnswerOptions([
            { value: 'narrow', label: '↔️ Stretta (Gamma-like)' },
            { value: 'wide', label: '⬌ Larga (Hadron-like)' }
        ]);
        
        document.getElementById('quizInstruction').textContent = 
            `L'ellisse di Hillas è stretta o larga? (Rapporto lunghezza/larghezza)`;
    }
    
    /**
     * Genera e renderizza eventi per una sorgente
     */
    _generateAndRenderEvents(profile, canvasSize, customParams = null) {
        const sourceType = profile.type;
        this.renderers.forEach(renderer => {
            renderer.sourceType = sourceType;
            renderer.lightStyle = true; // Assicura stile chiaro per il quiz
            // Restore noise suppression for gamma events if quizGammaOnly is true
            if (this.quizGammaOnly) {
                renderer.suppressNoise = true;
            }
        });
        
        const events = [];
        this.currentHillasParams = [];
        
        // Use only 1 camera (index 0)
        let event = null;
        let hillas = null;
        const maxAttempts = 8;
        let attempt = 0;

        // If caller requested forceCenter, try resampling events until CoG is near camera center
        // BUT do not force centering for hadronic or muonic events (their CoG can legitimately be far)
        const wantCentered = customParams && customParams.forceCenter && profile.type !== 'hadron' && profile.type !== 'muon';
        const acceptRadiusPx = 12; // Accept if CoG within 12 px of center

        do {
            event = this.engine.generateEvent(profile, 1, canvasSize, customParams);
            hillas = this.hillasAnalyzer.analyze(event);
            attempt++;

            if (!wantCentered) break; // no need to resample

            if (hillas && hillas.valid) {
                const cx = hillas.cogX;
                const cy = hillas.cogY;
                const centerX = (canvasSize && canvasSize.width) ? canvasSize.width / 2 : 300;
                const centerY = (canvasSize && canvasSize.height) ? canvasSize.height / 2 : 300;
                const dx = cx - centerX;
                const dy = cy - centerY;
                const r = Math.sqrt(dx * dx + dy * dy);
                if (r <= acceptRadiusPx) break; // acceptable
                console.log(`🔁 Resampling event for camera 1 (attempt ${attempt}) - CoG dist ${r.toFixed(1)} px > ${acceptRadiusPx}px`);
            }

        } while (attempt < maxAttempts);

        events.push(event);

        if (hillas && hillas.valid) {
            this.currentHillasParams.push(hillas);
        }

        // Aggiungi animazione flash
        const canvas = document.getElementById('cam1');
        if (canvas) {
            canvas.classList.add('flash');
            setTimeout(() => canvas.classList.remove('flash'), 400);
        }

        this.renderers[0].renderEvent(event, true);

        if (hillas && hillas.valid) {
            this.renderers[0].renderHillasOverlay(hillas);
        }
        
        this.currentEvent = events;
        this._updateInfoBox(hillas, 'gamma', event);
    }
    
    /**
     * Genera e renderizza eventi adronici
     */
    _generateAndRenderHadronicEvents(canvasSize, customParams = null) {
        this.renderers.forEach(renderer => {
            renderer.sourceType = 'hadron';
            renderer.lightStyle = true; // Assicura stile chiaro per il quiz
            // Enable noise for hadronic events to make them look messy and distinguishable
            renderer.suppressNoise = false;
        });
        
        const events = [];
        this.currentHillasParams = [];
        
        // Usa parametri custom o default con energia limitata per coerenza con simulatore background
        const params = customParams || {};
        if (!params.energy) {
            // Energia limitata a 6 TeV per evitare che sembrino gamma ad alta energia
            params.energy = this.engine._randomInRange(100, 6000);
        }

        // Single camera
        const event = this.engine.generateHadronicEvent(1, canvasSize, params);
        events.push(event);
        
        const hillas = this.hillasAnalyzer.analyze(event);
        if (hillas && hillas.valid) {
            this.currentHillasParams.push(hillas);
        }
        
        // Aggiungi animazione flash
        const canvas = document.getElementById('cam1');
        if (canvas) {
            canvas.classList.add('flash');
            setTimeout(() => canvas.classList.remove('flash'), 400);
        }
        
        this.renderers[0].renderEvent(event, true);
        
        if (hillas && hillas.valid) {
            this.renderers[0].renderHillasOverlay(hillas);
        }
        
        this.currentEvent = events;
        this._updateInfoBox(hillas, 'hadron', event);
    }
    
    /**
     * Genera e renderizza eventi muonici
     */
    _generateAndRenderMuonEvents(canvasSize, customParams = null) {
        this.renderers.forEach(renderer => {
            renderer.sourceType = 'muon';
            renderer.lightStyle = true; // Assicura stile chiaro per il quiz
            // Enable noise for muon events too
            renderer.suppressNoise = false;
        });
        
        const events = [];
        this.currentHillasParams = [];
        
        // Single camera
        const event = this.engine.generateMuonEvent(1, canvasSize, customParams);
        events.push(event);
        
        const hillas = this.hillasAnalyzer.analyze(event);
        if (hillas && hillas.valid) {
            this.currentHillasParams.push(hillas);
        }
        
        this.renderers[0].renderEvent(event, true);
        
        if (hillas && hillas.valid) {
            this.renderers[0].renderHillasOverlay(hillas);
        }
        
        this.currentEvent = events;
        this._updateInfoBox(hillas, 'muon', event);
    }
    
    /**
     * Aggiorna il box informativo con le caratteristiche salienti
     */
    _updateInfoBox(hillas, type, event) {
        const infoBox = document.getElementById('quizInfoContent');
        if (!infoBox) return;

        let html = '';
        
        // Header generico
        html += `<h5 style="margin-bottom: 10px; color: var(--text-secondary);">Dati Osservati:</h5>`;

        if (type === 'muon') {
            html += `
                <ul style="padding-left: 20px;">
                    <li><strong>Forma:</strong> Anello / Arco circolare</li>
                    <li><strong>Distribuzione:</strong> Uniforme lungo l'arco</li>
                    <li><strong>Pixel:</strong> Pochi pixel sparsi esterni</li>
                </ul>
                <p style="font-size: 0.9em; margin-top: 10px; color: var(--text-secondary);"><em>Nota: Geometria circolare caratteristica.</em></p>
            `;
        } else if (type === 'hadron') {
            html += `
                <ul style="padding-left: 20px;">
                    <li><strong>Forma:</strong> Irregolare / Frammentata</li>
                    <li><strong>Width:</strong> Elevata (diffusa)</li>
                    <li><strong>Struttura:</strong> Possibili sottostrutture multiple</li>
                </ul>
                <p style="font-size: 0.9em; margin-top: 10px; color: var(--text-secondary);"><em>Nota: Sciame "disordinato" e largo.</em></p>
            `;
        } else {
            // Gamma
            if (hillas && hillas.valid) {
                const length = hillas.lengthPx.toFixed(1);
                const width = hillas.widthPx.toFixed(1);
                const size = Math.round(hillas.size);
                const alpha = hillas.alpha ? hillas.alpha.toFixed(1) + '°' : 'N/A';
                
                html += `
                    <ul style="list-style: none; padding-left: 0;">
                        <li style="margin-bottom: 4px;">📏 <strong>Length:</strong> <span style="color: var(--accent-cyan)">${length} px</span></li>
                        <li style="margin-bottom: 4px;">↔️ <strong>Width:</strong> <span style="color: var(--accent-cyan)">${width} px</span></li>
                        <li style="margin-bottom: 4px;">💡 <strong>Size:</strong> <span style="color: var(--energy-high)">${size} p.e.</span></li>
                        <li style="margin-bottom: 4px;">ang <strong>Alpha:</strong> <span style="color: var(--accent-purple)">${alpha}</span></li>
                    </ul>
                    <hr style="border-color: var(--border-color); margin: 10px 0;">
                    <p><strong>Morfologia:</strong></p>
                    <ul style="padding-left: 20px; font-size: 0.95em;">
                        <li>Forma ellittica definita</li>
                        <li>${width < 10 ? 'Molto compatta (stretta)' : 'Estesa lateralmente'}</li>
                        <li>${hillas.alpha < 15 ? 'Punta verso il centro' : 'Non punta al centro'}</li>
                    </ul>
                `;
            } else {
                html += `<p><em>Segnale troppo debole per parametrizzazione Hillas.</em></p>`;
            }
        }

        infoBox.innerHTML = html;
    }

    /**
     * Imposta opzioni di risposta dinamicamente
     */
    _setAnswerOptions(options) {
        const container = document.getElementById('answerOptions');
        container.innerHTML = '';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.setAttribute('data-answer', opt.value);
            btn.textContent = opt.label;
            btn.addEventListener('click', (e) => {
                const answer = e.target.dataset.answer;
                this.submitAnswer(answer);
            });
            container.appendChild(btn);
        });
    }

    /**
     * Start timer countdown
     */
    startTimer() {
        this.timeRemaining = QUIZ_CONFIG.timeLimit;
        this.questionStartTime = Date.now();
        
        this.updateTimerDisplay();
        
        // Clear existing timer
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        
        // Start countdown
        this.timerId = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            // Warning state
            if (this.timeRemaining <= 10) {
                document.getElementById('timer').classList.add('warning');
            }
            
            // Time's up!
            if (this.timeRemaining <= 0) {
                clearInterval(this.timerId);
                this.timeUp();
            }
        }, 1000);
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        timerEl.textContent = this.timeRemaining;
        
        if (this.timeRemaining > 10) {
            timerEl.classList.remove('warning');
        }
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * Tempo scaduto
     */
    timeUp() {
        console.log('⏰ Tempo scaduto!');
        
        // Disabilita bottoni risposta
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.disabled = true;
        });
        
        // Nascondi bottoni hint (tempo scaduto)
        document.getElementById('hint1Btn').style.display = 'none';
        document.getElementById('hint2Btn').style.display = 'none';
        document.getElementById('hint3Btn').style.display = 'none';
        
        // Mostra risposta corretta
        const correctBtn = document.querySelector(`.quiz-option[data-answer="${this.currentCorrectAnswer}"]`);
        if (correctBtn) {
            correctBtn.classList.add('correct');
        }
        
        // Reset streak
        this.streak = 0;
        
        // Record answer
        this.answerHistory.push({
            question: this.currentQuestion,
            questionType: this.currentQuestionType,
            correctAnswer: this.currentCorrectAnswer,
            userAnswer: null,
            correct: false,
            points: 0,
            timeSpent: QUIZ_CONFIG.timeLimit,
            hintsUsed: this.currentHintLevel
        });
        
        // Update stats
        this.sourceStats[this.currentProfile.type].attempts++;
        
        // Show feedback
        this.showFeedback(false, 'timeout');
    }

    /**
     * Submit answer
     */
    submitAnswer(answer) {
        console.log(`📤 Risposta: ${answer}`);
        
        // Stop timer
        this.stopTimer();
        const timeSpent = QUIZ_CONFIG.timeLimit - this.timeRemaining;
        
        // Disabilita bottoni risposta
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.disabled = true;
        });
        
        // Nascondi bottoni hint (non servono più dopo aver risposto)
        document.getElementById('hint1Btn').style.display = 'none';
        document.getElementById('hint2Btn').style.display = 'none';
        document.getElementById('hint3Btn').style.display = 'none';
        
        // Check correct (usa currentCorrectAnswer invece di currentProfile.type)
        const correct = (answer === this.currentCorrectAnswer);
        
        // Calculate points
        let points = 0;
        if (correct) {
            points = QUIZ_CONFIG.basePoints;
            
            // Sottrai penalità hints
            for (let i = 0; i < this.currentHintLevel; i++) {
                points -= QUIZ_CONFIG.hintPenalties[i];
            }
            
            // Aggiungi streak bonus
            const streakBonus = Math.min(
                this.streak * QUIZ_CONFIG.streakBonus,
                QUIZ_CONFIG.maxStreakBonus
            );
            points += streakBonus;
            
            // Update score
            this.score += Math.max(0, points);
            this.correctAnswers++;
            this.streak++;
            this.maxStreak = Math.max(this.maxStreak, this.streak);
            
            console.log(`  ✅ Corretto! +${points} punti (streak: ${this.streak})`);
        } else {
            this.streak = 0;
            console.log(`  ❌ Sbagliato`);
        }
        
        // Update stats (solo se è una domanda source identification)
        if (this.currentQuestionType === QUESTION_TYPES.SOURCE_IDENTIFICATION && this.currentProfile) {
            this.sourceStats[this.currentProfile.type].attempts++;
            if (correct) {
                this.sourceStats[this.currentProfile.type].correct++;
            }
        }
        
        // Record answer
        this.answerHistory.push({
            question: this.currentQuestion,
            questionType: this.currentQuestionType,
            correctAnswer: this.currentCorrectAnswer,
            userAnswer: answer,
            correct: correct,
            points: points,
            timeSpent: timeSpent,
            hintsUsed: this.currentHintLevel
        });
        
        // Highlight buttons - mostra solo il bottone cliccato (rosso se sbagliato, verde se giusto)
        const selectedBtn = document.querySelector(`.quiz-option[data-answer="${answer}"]`);
        
        if (!selectedBtn) {
            console.error('❌ Bottone selezionato non trovato:', answer);
        } else {
            if (correct) {
                selectedBtn.classList.add('correct');
            } else {
                selectedBtn.classList.add('incorrect');
                // NON evidenziamo il bottone corretto per non rivelare la risposta
            }
        }
        
        // Update UI
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('streakDisplay').textContent = this.streak;
        
        // Show feedback
        this.showFeedback(correct);
    }

    /**
     * Show hint
     */
    showHint(level) {
        console.log(`💡 Hint livello ${level}`);
        
        this.currentHintLevel = level;
        this.hintsUsed++;
        
        // Assicurati che i bottoni risposta siano abilitati (potresti aver bisogno di hint PRIMA di rispondere)
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.disabled = false;
        });
        
        // Disable current hint button
        document.getElementById(`hint${level}Btn`).disabled = true;
        
        // Enable next hint button
        if (level < 3) {
            document.getElementById(`hint${level + 1}Btn`).disabled = false;
        }
        
        // Generate hint text
        const hintText = this.generateHintText(level);
        
        // Show hint panel
        const hintPanel = document.getElementById('hintPanel');
        document.getElementById('hintText').innerHTML = hintText;
        hintPanel.classList.remove('hidden');
    }

    /**
     * Generate hint text based on level
     */
    generateHintText(level) {
        const profile = this.currentProfile;
        const avgHillas = this.getAverageHillas();
        
        if (!avgHillas) return '<p>Impossibile generare hint</p>';
        
        switch (level) {
            case 1:
                // Hint su Size
                return `
                    <h4>💡 Hint 1: Analisi Size (-30 punti)</h4>
                    <p>Il parametro <strong>Size</strong> osservato è circa <strong>${avgHillas.size.toFixed(0)} p.e.</strong></p>
                    <p style="font-size: 12px; color: var(--text-secondary); font-style: italic; margin-top: 8px;">
                        ℹ️ <strong>p.e.</strong> = photoelectrons (fotoelettroni) - carica totale misurata dai fotomoltiplicatori
                    </p>
                    <p>Ricorda:</p>
                    <ul style="margin-left: 20px; font-size: 13px;">
                        <li>🦀 <strong>Crab</strong>: 600-1000 p.e. (medio)</li>
                        <li>💥 <strong>PeVatron</strong>: >1500 p.e. (ALTO!)</li>
                        <li>🌀 <strong>Blazar</strong>: 700-1200 p.e. (medio-alto)</li>
                        <li>⚡ <strong>GRB</strong>: 800-1400 p.e. (medio-alto)</li>
                        <li>⭐ <strong>Centro Galattico</strong>: 1000-1600 p.e. (alto)</li>
                        <li>⚛️ <strong>Hadron</strong>: 400-2000 p.e. (molto variabile)</li>
                        <li>🔬 <strong>Muone</strong>: 200-500 p.e. (BASSO!)</li>
                    </ul>
                `;
            
            case 2:
                // Hint su Alpha
                return `
                    <h4>💡 Hint 2: Distribuzione Alpha (-30 punti)</h4>
                    <p>Il parametro <strong>Alpha</strong> medio è circa <strong>${avgHillas.alpha.toFixed(1)}°</strong></p>
                    <p>Chiavi di lettura:</p>
                    <ul style="margin-left: 20px; font-size: 13px;">
                        <li>🎯 <strong>Alpha ~0°</strong> → Sorgente puntiforme (Crab, Blazar, GRB iniziale)</li>
                        <li>📊 <strong>Alpha ~8-10°</strong> → Sorgente estesa/multi-componente (Centro Galattico, PeVatron)</li>
                        <li>🎲 <strong>Alpha uniforme (0-90°)</strong> → Background adronico (nessun picco!)</li>
                    </ul>
                    <p style="font-size: 13px; color: #ffaa00;">
                        ${avgHillas.alpha < 3 ? '⚠️ Alpha molto basso suggerisce sorgente puntiforme' :
                          avgHillas.alpha > 7 ? '⚠️ Alpha disperso suggerisce sorgente estesa' :
                          '⚠️ Alpha intermedio - analizza altri parametri'}
                    </p>
                `;
            
            case 3:
                // Hint su Length/Width
                return `
                    <h4>💡 Hint 3: Morfologia (Length/Width) (-20 punti)</h4>
                    <p><strong>Length:</strong> ${avgHillas.length.toFixed(3)}° (~${avgHillas.lengthPx.toFixed(0)} px)</p>
                    <p><strong>Width:</strong> ${avgHillas.width.toFixed(3)}° (~${avgHillas.widthPx.toFixed(0)} px)</p>
                    <p><strong>L/W Ratio:</strong> ${avgHillas.elongation.toFixed(2)}</p>
                    
                    <p>Firme morfologiche:</p>
                    <ul style="margin-left: 20px; font-size: 13px;">
                        <li>🦀 <strong>Crab</strong>: Length ~25px, Width ~8px, L/W ~3.1</li>
                        <li>💥 <strong>PeVatron</strong>: Length ~40px, Width ~15px, L/W ~2.7</li>
                        <li>🌀 <strong>Blazar</strong>: Length ~15px, Width ~5px (COMPATTO!), L/W ~3.0</li>
                        <li>⚡ <strong>GRB</strong>: L/W ~1.9 (PIÙ BASSO)</li>
                        <li>⭐ <strong>Centro Galattico</strong>: Length ~30px, Width ~15px, L/W ~2.0</li>
                        <li>⚛️ <strong>Hadron</strong>: Width ~22px (LARGO!), L/W ~1.6 (MINIMO)</li>
                    </ul>
                    
                    <p style="font-size: 13px; color: #ff4444;">
                        ${avgHillas.widthPx > 20 ? '🚨 Width molto largo → Probabile hadron!' :
                          avgHillas.lengthPx < 18 ? '🚨 Traccia molto compatta → Probabile blazar!' :
                          avgHillas.elongation < 2 ? '🚨 L/W basso → GRB o Centro Galattico!' :
                          '🔍 Usa tutti gli indizi per decidere'}
                    </p>
                `;
            
            default:
                return '<p>Hint non disponibile</p>';
        }
    }

    /**
     * Get average Hillas parameters
     */
    getAverageHillas() {
        if (this.currentHillasParams.length === 0) return null;
        
        const avg = {
            length: 0,
            width: 0,
            size: 0,
            alpha: 0,
            lengthPx: 0,
            widthPx: 0,
            elongation: 0
        };
        
        this.currentHillasParams.forEach(h => {
            avg.length += h.length;
            avg.width += h.width;
            avg.size += h.size;
            avg.alpha += h.alpha;
            avg.lengthPx += h.lengthPx;
            avg.widthPx += h.widthPx;
            avg.elongation += h.elongation;
        });
        
        const n = this.currentHillasParams.length;
        Object.keys(avg).forEach(key => {
            avg[key] /= n;
        });
        
        return avg;
    }

    /**
     * Show feedback after answer
     */
    showFeedback(correct, reason = null) {
        const feedbackPanel = document.getElementById('feedbackPanel');
        const feedbackTitle = document.getElementById('feedbackTitle');
        const feedbackText = document.getElementById('feedbackText');
        
        if (reason === 'timeout') {
            feedbackTitle.textContent = '⏰ Tempo Scaduto!';
            feedbackTitle.style.color = '#ff8800';
            feedbackText.innerHTML = this.generateTimeoutFeedback();
        } else if (correct) {
            feedbackTitle.textContent = '✅ Corretto!';
            feedbackTitle.style.color = '#00ff88';
            feedbackText.innerHTML = this.generateCorrectFeedback();
        } else {
            feedbackTitle.textContent = '❌ Sbagliato';
            feedbackTitle.style.color = '#ff4444';
            feedbackText.innerHTML = this.generateIncorrectFeedback();
        }
        
        feedbackPanel.classList.remove('hidden');
    }

    /**
     * Generate correct feedback
     */
    generateCorrectFeedback() {
        const profile = this.currentProfile;
        const lastAnswer = this.answerHistory[this.answerHistory.length - 1];
        
        let feedbackMsg = '';
        let educationalNote = '';
        
        switch(this.currentQuestionType) {
            case QUESTION_TYPES.THEORETICAL:
                feedbackMsg = `Risposta esatta!`;
                educationalNote = this.currentTheoreticalQuestion.explanation;
                break;
            case QUESTION_TYPES.PARTICLE_TYPE:
                feedbackMsg = `Hai identificato correttamente che si tratta di un <strong>${lastAnswer.userAnswer === 'gamma' ? 'Fotone Gamma' : 'Adrone'}</strong>!`;
                educationalNote = this.getEducationalNote(profile ? profile.type : 'gamma');
                break;
            case QUESTION_TYPES.ENERGY_LEVEL:
                feedbackMsg = `Hai stimato correttamente l'energia come <strong>${lastAnswer.userAnswer === 'high' ? 'Alta (> 1 TeV)' : 'Bassa (< 1 TeV)'}</strong>!`;
                educationalNote = this.getEducationalNote(profile.type);
                break;
            case QUESTION_TYPES.MUON_DETECTION:
                feedbackMsg = `Hai identificato correttamente ${lastAnswer.userAnswer === 'yes' ? 'la presenza' : 'l\'assenza'} di un muone!`;
                educationalNote = "I muoni appaiono come archi o anelli perfetti.";
                break;
            case QUESTION_TYPES.SHOWER_SHAPE:
                feedbackMsg = `Hai analizzato correttamente la forma dell'ellisse come <strong>${lastAnswer.userAnswer === 'narrow' ? 'Stretta' : 'Larga'}</strong>!`;
                educationalNote = this.getEducationalNote(profile ? profile.type : 'gamma');
                break;
            case QUESTION_TYPES.SOURCE_IDENTIFICATION:
            default:
                feedbackMsg = `Hai identificato correttamente: <strong>${profile.displayName}</strong>`;
                educationalNote = this.getEducationalNote(profile.type);
                break;
        }

        return `
            <p style="font-size: 16px; margin-bottom: 16px;">
                ${feedbackMsg}
            </p>
            <p style="font-size: 14px; color: #00ff88;">
                +${lastAnswer.points} punti (Base: ${QUIZ_CONFIG.basePoints}, 
                Hints: -${this.currentHintLevel * 30}, 
                Streak: +${Math.min(this.streak * QUIZ_CONFIG.streakBonus, QUIZ_CONFIG.maxStreakBonus)})
            </p>
            <p style="margin-top: 16px; font-size: 13px;">
                ${educationalNote}
            </p>
        `;
    }

    /**
     * Generate incorrect feedback
     */
    generateIncorrectFeedback() {
        const profile = this.currentProfile;
        const lastAnswer = this.answerHistory[this.answerHistory.length - 1];
        
        let userAnswerText = '';
        let correctAnswerText = '';

        // Helper per ottenere il testo leggibile della risposta
        const getAnswerLabel = (type, val) => {
            switch(type) {
                case QUESTION_TYPES.THEORETICAL:
                    const q = this.currentTheoreticalQuestion;
                    const opt = q.options.find(o => o.value === val);
                    return opt ? opt.label : val;
                case QUESTION_TYPES.PARTICLE_TYPE:
                    return val === 'gamma' ? 'Fotone Gamma' : 'Adrone';
                case QUESTION_TYPES.ENERGY_LEVEL:
                    return val === 'high' ? 'Alta Energia' : 'Bassa Energia';
                case QUESTION_TYPES.MUON_DETECTION:
                    return val === 'yes' ? 'Sì (Muone)' : 'No (Non Muone)';
                case QUESTION_TYPES.SHOWER_SHAPE:
                    return val === 'narrow' ? 'Stretta' : 'Larga';
                case QUESTION_TYPES.SOURCE_IDENTIFICATION:
                    return this.getSourceDisplayName(val);
                default:
                    return val;
            }
        };

        userAnswerText = getAnswerLabel(this.currentQuestionType, lastAnswer.userAnswer);
        correctAnswerText = getAnswerLabel(this.currentQuestionType, this.currentCorrectAnswer);

        let suggestionHtml = '';
        if (this.currentQuestionType === QUESTION_TYPES.THEORETICAL) {
            suggestionHtml = `<p style="margin-top: 12px; color: var(--accent-cyan);">${this.currentTheoreticalQuestion.explanation}</p>`;
        } else {
            suggestionHtml = `
            <ul style="margin-left: 20px; font-size: 13px; color: var(--text-secondary);">
                <li>Analizza attentamente i parametri di Hillas (Length, Width, Size, Alpha)</li>
                <li>Confronta le tracce tra le 3 camere per valutare la coerenza</li>
                <li>Usa gli <strong>Hint</strong> se hai bisogno di aiuto!</li>
                <li>Rivedi la pagina di <a href="intro-cherenkov.html" target="_blank" style="color: #0ea5e9;">introduzione</a></li>
            </ul>`;
        }

        return `
            <p style="font-size: 16px; margin-bottom: 16px; color: #ff4444;">
                <strong>Risposta errata!</strong>
            </p>
            <p style="font-size: 14px; color: var(--text-secondary);">
                Hai risposto: <strong>${userAnswerText}</strong><br>
                La risposta corretta era: <strong>${correctAnswerText}</strong>
            </p>
            <p style="margin-top: 16px; font-size: 13px; color: #ffaa00;">
                💡 <strong>Spiegazione:</strong>
            </p>
            ${suggestionHtml}
            <p style="margin-top: 12px; font-size: 12px; color: var(--text-secondary); font-style: italic;">
                La risposta corretta verrà rivelata alla fine del quiz.
            </p>
        `;
    }

    /**
     * Generate timeout feedback
     */
    generateTimeoutFeedback() {
        const profile = this.currentProfile;
        
        return `
            <p style="font-size: 16px; margin-bottom: 16px; color: #ff8800;">
                <strong>Tempo scaduto!</strong>
            </p>
            <p style="font-size: 14px; color: var(--text-secondary);">
                Non hai fornito una risposta entro 60 secondi.
            </p>
            <p style="margin-top: 16px; font-size: 13px; color: #ffaa00;">
                💡 <strong>Per la prossima domanda:</strong>
            </p>
            <ul style="margin-left: 20px; font-size: 13px; color: var(--text-secondary);">
                <li>Usa gli <strong>Hint</strong> se non sei sicuro</li>
                <li>Concentrati sui parametri chiave: Alpha, Size, Length/Width</li>
                <li>Guarda la coerenza tra le 3 camere</li>
            </ul>
            <p style="margin-top: 12px; font-size: 12px; color: var(--text-secondary); font-style: italic;">
                La risposta corretta verrà rivelata alla fine del quiz.
            </p>
        `;
    }

    /**
     * Get educational note for source type
     */
    getEducationalNote(sourceType) {
        const avgHillas = this.getAverageHillas();
        
        const notes = {
            'crab': `La <strong>Crab Nebula</strong> è riconoscibile per:<br>
                     • Size medio (~1000 p.e.)<br>
                     • Tracce compatte ma non estreme (Length ~25px, Width ~8px)<br>
                     • Alpha concentrato attorno a 0° (sorgente puntiforme)<br>
                     • L/W ratio ~3.1 (alto, ma non massimo)<br>
                     • Coerenza inter-camera eccellente (>95%)`,
            
            'pevatron': `I <strong>PeVatron</strong> (resti di supernova) hanno:<br>
                         • Size ESTREMO (>2000 p.e., spesso saturazione!)<br>
                         • Tracce molto estese (Length ~40px, Width ~15px)<br>
                         • Alpha disperso (5-20°) per estensione sorgente<br>
                         • Energia massima >100 TeV<br>
                         • Possibili acceleratori di raggi cosmici PeV`,
            
            'blazar': `I <strong>Blazar</strong> (AGN) mostrano:<br>
                       • Tracce COMPATTISSIME (Length ~15px, Width ~5px)<br>
                       • Alpha estremamente concentrato (~0°)<br>
                       • L/W ratio alto (~3.0)<br>
                       • Variabilità temporale estrema (ore-giorni)<br>
                       • Beaming relativistico (getto puntato verso di noi)`,
            
            'grb': `I <strong>GRB</strong> (Gamma-Ray Burst) hanno:<br>
                    • L/W ratio BASSO (~1.9) - firma chiave!<br>
                    • Size decrescente nel tempo (afterglow)<br>
                    • Alpha inizialmente ~0°, poi aumenta<br>
                    • Emissione cosmologica (z>0.1)<br>
                    • Eventi transitori (minuti-ore)`,
            
            'galactic-center': `Il <strong>Centro Galattico</strong> presenta:<br>
                                • Alpha DISPERSO (~8°) - firma distintiva!<br>
                                • Size alto ma non estremo (~1800 p.e.)<br>
                                • Multi-componente (Sgr A* + diffusa + PeVatron)<br>
                                • Varianza inter-camera alta (~15%)<br>
                                • Morfologia complessa`,
            
            'hadron': `Il <strong>Background Adronico</strong> si riconosce per:<br>
                       • Width MOLTO LARGO (~22px) - firma principale!<br>
                       • L/W ratio MINIMO (~1.6)<br>
                       • Alpha UNIFORME (0-90°, nessun picco!)<br>
                       • Asimmetria alta (sciami irregolari)<br>
                       • Coerenza inter-camera bassa (~70%)<br>
                       • Possibili anelli di muoni (30% eventi)`
        };
        
        let note = notes[sourceType] || 'Nota educativa non disponibile';
        
        // Aggiungi parametri osservati
        if (avgHillas) {
            note += `<br><br><strong>Parametri osservati:</strong><br>
                     Size: ${avgHillas.size.toFixed(0)} p.e., 
                     Length: ${avgHillas.lengthPx.toFixed(0)} px, 
                     Width: ${avgHillas.widthPx.toFixed(0)} px, 
                     Alpha: ${avgHillas.alpha.toFixed(1)}°, 
                     L/W: ${avgHillas.elongation.toFixed(2)}`;
        }
        
        return note;
    }

    /**
     * Get source display name
     */
    getSourceDisplayName(sourceType) {
        const profiles = {
            'crab': 'Crab Nebula',
            'pevatron': 'PeVatron (SNR)',
            'blazar': 'Blazar (AGN)',
            'grb': 'GRB',
            'galactic-center': 'Centro Galattico',
            'hadron': 'Background Adronico'
        };
        return profiles[sourceType] || sourceType;
    }

    /**
     * Display Hillas parameters in quiz
     */
    displayQuizHillas() {
        const container = document.getElementById('quizHillasDisplay');
        if (!container || this.currentHillasParams.length === 0) return;
        
        let html = '<h4 style="margin-bottom: 12px;">Parametri di Hillas</h4>';
        
        this.currentHillasParams.forEach((hillas, idx) => {
            html += `
                <div style="margin-bottom: 16px; padding: 10px; background: rgba(0, 40, 80, 0.2); border-radius: 6px; border-left: 3px solid #00d9ff;">
                    <h5 style="color: #00d9ff; margin-bottom: 8px; font-size: 14px;">Camera ${idx + 1}</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px; font-family: 'Courier New', monospace;">
                        <div><strong>Length:</strong> ${hillas.lengthPx.toFixed(0)}px</div>
                        <div><strong>Width:</strong> ${hillas.widthPx.toFixed(0)}px</div>
                        <div><strong>Size:</strong> ${hillas.size.toFixed(0)} p.e.</div>
                        <div><strong>Alpha:</strong> ${hillas.alpha.toFixed(1)}°</div>
                        <div><strong>L/W:</strong> ${hillas.elongation.toFixed(2)}</div>
                        <div><strong>Miss:</strong> ${hillas.miss.toFixed(2)}°</div>
                    </div>
                </div>
            `;
        });
        
        // Media
        const avg = this.getAverageHillas();
        if (avg) {
            html += `
                <div style="margin-top: 16px; padding: 12px; background: rgba(0, 80, 40, 0.3); border-radius: 6px; border: 2px solid #00ff88;">
                    <h5 style="color: #00ff88; margin-bottom: 8px; font-size: 14px;">📊 Media Stereoscopica</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; font-family: 'Courier New', monospace;">
                        <div><strong>Length:</strong> ${avg.lengthPx.toFixed(0)}px</div>
                        <div><strong>Width:</strong> ${avg.widthPx.toFixed(0)}px</div>
                        <div style="color: #ffc800;"><strong>Size:</strong> ${avg.size.toFixed(0)} p.e.</div>
                        <div><strong>Alpha:</strong> ${avg.alpha.toFixed(1)}°</div>
                        <div><strong>L/W:</strong> ${avg.elongation.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    /**
     * Next question
     */
    nextQuestion() {
        if (this.currentQuestion >= QUIZ_CONFIG.totalQuestions) {
            this.showResults();
        } else {
            this.generateQuestion();
        }
    }

    /**
     * Show final results
     */
    showResults() {
        console.log('🏁 Quiz completato!');
        
        // Hide quiz screen, show results screen
        document.getElementById('quizScreen').classList.add('hidden');
        document.getElementById('resultsScreen').classList.remove('hidden');
        
        // Calculate stats
        const accuracy = (this.correctAnswers / QUIZ_CONFIG.totalQuestions * 100).toFixed(1);
        const avgTime = this.answerHistory.reduce((sum, a) => sum + a.timeSpent, 0) / this.answerHistory.length;
        
        // Display final score
        document.getElementById('finalScore').textContent = this.score;
        
        // Performance rating
        const rating = this.getPerformanceRating(this.score, this.answerHistory);
        document.getElementById('performanceRating').innerHTML = `
            <h3 style="color: ${rating.color}; margin-bottom: 8px;">${rating.emoji} ${rating.title}</h3>
            <p style="font-size: 14px;">${rating.message}</p>
        `;
        
        // Statistics
        document.getElementById('correctAnswers').textContent = `${this.correctAnswers}/${QUIZ_CONFIG.totalQuestions}`;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('maxStreak').textContent = this.maxStreak;
        document.getElementById('hintsUsed').textContent = this.hintsUsed;
        document.getElementById('avgTime').textContent = `${avgTime.toFixed(1)}s`;
        
        // Source breakdown
        this.displaySourceBreakdown();
    }

    /**
     * Get performance rating
     */
    getPerformanceRating(score, history) {
        // Analisi dettagliata basata sulle risposte corrette
        const totalQuestions = history.length;
        const totalCorrect = history.filter(h => h.correct).length;
        const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        const theoryQuestions = history.filter(h => h.questionType === QUESTION_TYPES.THEORETICAL);
        const practiceQuestions = history.filter(h => h.questionType !== QUESTION_TYPES.THEORETICAL);
        const sourceQuestions = history.filter(h => h.questionType === QUESTION_TYPES.SOURCE_IDENTIFICATION);
        
        const theoryCorrect = theoryQuestions.filter(h => h.correct).length;
        const practiceCorrect = practiceQuestions.filter(h => h.correct).length;
        const sourceCorrect = sourceQuestions.filter(h => h.correct).length;
        
        const theoryAcc = theoryQuestions.length ? (theoryCorrect / theoryQuestions.length) : 0;
        const practiceAcc = practiceQuestions.length ? (practiceCorrect / practiceQuestions.length) : 0;
        // Usa practiceAcc come fallback se non ci sono domande specifiche sulle sorgenti
        const sourceAcc = sourceQuestions.length ? (sourceCorrect / sourceQuestions.length) : (practiceQuestions.length ? practiceAcc : 0);

        let baseRating = {};
        
        // Soglie basate su percentuale
        // Eccellente: >= 90% (9-10 su 10)
        // Ottimo: >= 80% (8 su 10)
        // Buono: >= 60% (6-7 su 10)
        // Sufficiente: >= 40% (4-5 su 10)
        // Riprova: < 40%
        
        if (percentage >= 90) {
            baseRating = { emoji: '🏆', title: 'Eccellente!', color: '#ffd700', message: 'Prestazione quasi perfetta!' };
        } else if (percentage >= 80) {
            baseRating = { emoji: '🌟', title: 'Ottimo!', color: '#00ff88', message: 'Ottima performance!' };
        } else if (percentage >= 60) {
            baseRating = { emoji: '👍', title: 'Buono', color: '#4488ff', message: 'Buon lavoro!' };
        } else if (percentage >= 40) {
            baseRating = { emoji: '📚', title: 'Sufficiente', color: '#ffaa00', message: 'Hai le basi, ma serve pratica.' };
        } else {
            baseRating = { emoji: '💪', title: 'Riprova!', color: '#ff4444', message: 'Non mollare.' };
        }

        // Feedback specifico qualitativo
        let feedback = "";
        
        if (percentage < 90) { // Se non è perfetto (o quasi), diamo consigli specifici
            if (practiceAcc < 0.5 && theoryAcc > 0.7) {
                feedback = "Hai ottime conoscenze teoriche, ma devi esercitarti di più nel riconoscimento visivo delle sorgenti.";
            } else if (practiceAcc > 0.7 && theoryAcc < 0.5) {
                feedback = "Hai un ottimo occhio per le tracce e l'analisi Hillas, ma dovresti ripassare i concetti teorici di base.";
            } else if (sourceQuestions.length > 0 && sourceAcc < 0.5) {
                feedback = "Sembra che tu abbia difficoltà a distinguere le diverse sorgenti. Consulta la tabella comparativa prima di riprovare.";
            } else if (theoryAcc < 0.5) {
                feedback = "La pratica va bene, ma non trascurare i concetti teorici fondamentali.";
            } else {
                // Feedback generico basato sul livello
                feedback = baseRating.message + " Continua a esercitarti per migliorare la tua precisione.";
            }
        } else {
            feedback = "Sei un vero esperto di astronomia gamma! Conosci perfettamente sia la teoria che le firme delle sorgenti.";
        }

        baseRating.message = feedback;
        return baseRating;
    }

    /**
     * Display source breakdown
     */
    displaySourceBreakdown() {
        const container = document.getElementById('sourceBreakdown');
        if (!container) return;
        
        let html = '<h4 style="margin-bottom: 16px;">Prestazioni per Sorgente</h4>';
        
        const sourceNames = {
            'crab': '🦀 Crab Nebula',
            'pevatron': '💥 PeVatron',
            'blazar': '🌀 Blazar',
            'grb': '⚡ GRB',
            'galactic-center': '⭐ Centro Galattico',
            'hadron': '⚛️ Hadron'
        };
        
        Object.keys(this.sourceStats).forEach(key => {
            const stat = this.sourceStats[key];
            if (stat.attempts === 0) return;
            
            const accuracy = (stat.correct / stat.attempts * 100).toFixed(0);
            const color = accuracy >= 80 ? '#00ff88' : accuracy >= 50 ? '#ffaa00' : '#ff4444';
            
            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px;">${sourceNames[key]}</span>
                        <span style="color: ${color}; font-weight: bold;">${stat.correct}/${stat.attempts}</span>
                    </div>
                    <div style="margin-top: 8px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${accuracy}%; height: 100%; background: ${color};"></div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
}

// === INIZIALIZZAZIONE GLOBALE ===
let quizEngine;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Caricamento Quiz Engine...');
    
    quizEngine = new QuizEngine();
    quizEngine.initialize();
    
    console.log('✅ Quiz Engine pronto!');
});
