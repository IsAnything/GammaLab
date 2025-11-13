/**
 * GAMMALAB - Quiz Engine
 * Sistema completo di quiz interattivo per identificazione sorgenti gamma
 * Features: timer 60s, hints progressivi, scoring con streak, feedback educativo
 */

// === CONFIGURAZIONE QUIZ ===
const QUIZ_CONFIG = {
    totalQuestions: 10,
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
    SHOWER_SHAPE: 'shape'                 // "Ellisse stretta o larga?"
};

// Distribuzione tipi di domande per difficoltà crescente
const QUESTION_DISTRIBUTION = [
    // Domande 1-3: facili (solo source identification)
    [QUESTION_TYPES.SOURCE_IDENTIFICATION, QUESTION_TYPES.SOURCE_IDENTIFICATION, QUESTION_TYPES.SOURCE_IDENTIFICATION],
    // Domande 4-6: medie (mix)
    [QUESTION_TYPES.PARTICLE_TYPE, QUESTION_TYPES.SOURCE_IDENTIFICATION, QUESTION_TYPES.ENERGY_LEVEL],
    // Domande 7-9: difficili (classificazione avanzata)
    [QUESTION_TYPES.MUON_DETECTION, QUESTION_TYPES.SHOWER_SHAPE, QUESTION_TYPES.PARTICLE_TYPE],
    // Domanda 10: finale (identificazione source complessa)
    [QUESTION_TYPES.SOURCE_IDENTIFICATION]
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
            new CanvasRenderer('quizCam1', 'quizCam1-overlay'),
            new CanvasRenderer('quizCam2', 'quizCam2-overlay'),
            new CanvasRenderer('quizCam3', 'quizCam3-overlay')
        ];
        
        // Abilita rendering stile chiaro e source-specific per quiz
        this.renderers.forEach(renderer => {
            renderer.colorPalette = this.colorPalette;
            renderer.lightStyle = true; // Nuovo stile chiaro
            // In quiz vogliamo che le ellissi siano geometricamente aderenti
            renderer.respectExactHillas = true;
            renderer.subpixelEnabled = false;
            // Modalità didattica: sopprimi rumore di background
            if (this.quizGammaOnly) renderer.suppressNoise = true;
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
            window.location.href = 'comparison.html';
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
        
        // Genera prima domanda
        this.generateQuestion();
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
        const types = QUESTION_DISTRIBUTION.flat();
        const selectedType = types[questionIndex] || QUESTION_TYPES.SOURCE_IDENTIFICATION;
        console.log(`🎲 Domanda ${this.currentQuestion}: tipo = ${selectedType} (index: ${questionIndex}, totale tipi: ${types.length})`);
        return selectedType;
    }
    
    /**
     * Genera domanda specifica per tipo
     */
    _generateQuestionByType() {
        const quizCanvasSize = { width: 600, height: 600 };
        
        switch(this.currentQuestionType) {
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
        
        // Mostra parametri Hillas
        this.displayQuizHillas();
    }
    
    /**
     * Domanda classica: identifica la sorgente
     */
    _generateSourceIdentificationQuestion(canvasSize) {
        // Seleziona sorgente random (escludi muon per questa domanda)
        // If quizGammaOnly is enabled, force a gamma-only profile for clearer Hillas examples
        this.currentProfile = this.quizGammaOnly ? getRandomSourceProfile(false) : getRandomSourceProfile(true);
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
        });
        
        const events = [];
        this.currentHillasParams = [];
        
        for (let i = 0; i < 3; i++) {
            let event = null;
            let hillas = null;
            const maxAttempts = 8;
            let attempt = 0;

            // If caller requested forceCenter, try resampling events until CoG is near camera center
            // BUT do not force centering for hadronic or muonic events (their CoG can legitimately be far)
            const wantCentered = customParams && customParams.forceCenter && profile.type !== 'hadron' && profile.type !== 'muon';
            const acceptRadiusPx = 12; // Accept if CoG within 12 px of center

            do {
                event = this.engine.generateEvent(profile, i + 1, canvasSize, customParams);
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
                    console.log(`🔁 Resampling event for camera ${i+1} (attempt ${attempt}) - CoG dist ${r.toFixed(1)} px > ${acceptRadiusPx}px`);
                }

            } while (attempt < maxAttempts);

            events.push(event);

            if (hillas && hillas.valid) {
                this.currentHillasParams.push(hillas);
            }

            this.renderers[i].renderEvent(event, i === 0);

            if (hillas && hillas.valid) {
                this.renderers[i].renderHillasOverlay(hillas);
            }
        }
        
        this.currentEvent = events;
    }
    
    /**
     * Genera e renderizza eventi adronici
     */
    _generateAndRenderHadronicEvents(canvasSize, customParams = null) {
        this.renderers.forEach(renderer => {
            renderer.sourceType = 'hadron';
        });
        
        const events = [];
        this.currentHillasParams = [];
        
        for (let i = 0; i < 3; i++) {
            const event = this.engine.generateHadronicEvent(i + 1, canvasSize, customParams);
            events.push(event);
            
            const hillas = this.hillasAnalyzer.analyze(event);
            if (hillas && hillas.valid) {
                this.currentHillasParams.push(hillas);
            }
            
            this.renderers[i].renderEvent(event, i === 0);
            
            if (hillas && hillas.valid) {
                this.renderers[i].renderHillasOverlay(hillas);
            }
        }
        
        this.currentEvent = events;
    }
    
    /**
     * Genera e renderizza eventi muonici
     */
    _generateAndRenderMuonEvents(canvasSize, customParams = null) {
        this.renderers.forEach(renderer => {
            renderer.sourceType = 'muon';
        });
        
        const events = [];
        this.currentHillasParams = [];
        
        for (let i = 0; i < 3; i++) {
            const event = this.engine.generateMuonEvent(i + 1, canvasSize, customParams);
            events.push(event);
            
            const hillas = this.hillasAnalyzer.analyze(event);
            if (hillas && hillas.valid) {
                this.currentHillasParams.push(hillas);
            }
            
            this.renderers[i].renderEvent(event, i === 0);
            
            if (hillas && hillas.valid) {
                this.renderers[i].renderHillasOverlay(hillas);
            }
        }
        
        this.currentEvent = events;
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
        
        return `
            <p style="font-size: 16px; margin-bottom: 16px;">
                <strong>Hai identificato correttamente: ${profile.displayName}</strong>
            </p>
            <p style="font-size: 14px; color: #00ff88;">
                +${lastAnswer.points} punti (Base: ${QUIZ_CONFIG.basePoints}, 
                Hints: -${this.currentHintLevel * 30}, 
                Streak: +${Math.min(this.streak * QUIZ_CONFIG.streakBonus, QUIZ_CONFIG.maxStreakBonus)})
            </p>
            <p style="margin-top: 16px; font-size: 13px;">
                ${this.getEducationalNote(profile.type)}
            </p>
        `;
    }

    /**
     * Generate incorrect feedback
     */
    generateIncorrectFeedback() {
        const profile = this.currentProfile;
        const lastAnswer = this.answerHistory[this.answerHistory.length - 1];
        
        return `
            <p style="font-size: 16px; margin-bottom: 16px; color: #ff4444;">
                <strong>Risposta errata!</strong>
            </p>
            <p style="font-size: 14px; color: var(--text-secondary);">
                Hai risposto: <strong>${this.getSourceDisplayName(lastAnswer.userAnswer)}</strong>
            </p>
            <p style="margin-top: 16px; font-size: 13px; color: #ffaa00;">
                💡 <strong>Suggerimenti:</strong>
            </p>
            <ul style="margin-left: 20px; font-size: 13px; color: var(--text-secondary);">
                <li>Analizza attentamente i parametri di Hillas (Length, Width, Size, Alpha)</li>
                <li>Confronta le tracce tra le 3 camere per valutare la coerenza</li>
                <li>Usa gli <strong>Hint</strong> se hai bisogno di aiuto!</li>
                <li>Rivedi la pagina di <a href="comparison.html" target="_blank" style="color: #0ea5e9;">confronto sorgenti</a></li>
            </ul>
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
        const rating = this.getPerformanceRating(this.score);
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
    getPerformanceRating(score) {
        if (score >= 900) {
            return {
                emoji: '🏆',
                title: 'Eccellente!',
                color: '#ffd700',
                message: 'Sei un esperto di astronomia gamma! Conosci perfettamente le firme di ogni sorgente.'
            };
        } else if (score >= 700) {
            return {
                emoji: '🌟',
                title: 'Ottimo!',
                color: '#00ff88',
                message: 'Ottima performance! Hai una solida comprensione dei parametri Hillas.'
            };
        } else if (score >= 500) {
            return {
                emoji: '👍',
                title: 'Buono',
                color: '#4488ff',
                message: 'Buon lavoro! Con un po\' più di pratica diventerai un esperto.'
            };
        } else if (score >= 300) {
            return {
                emoji: '📚',
                title: 'Sufficiente',
                color: '#ffaa00',
                message: 'Hai capito le basi, ma c\'è ancora da imparare. Riprova!'
            };
        } else {
            return {
                emoji: '💪',
                title: 'Riprova!',
                color: '#ff4444',
                message: 'Non scoraggiarti! Studia le pagine delle sorgenti e riprova il quiz.'
            };
        }
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
