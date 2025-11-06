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
        
        // Domanda corrente
        this.currentEvent = null;
        this.currentProfile = null;
        this.currentHillasParams = [];
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
        console.log(`📝 Domanda ${this.currentQuestion}/${QUIZ_CONFIG.totalQuestions}`);
        
        // Update UI
        document.getElementById('questionNumber').textContent = 
            `${this.currentQuestion}/${QUIZ_CONFIG.totalQuestions}`;
        
        // Reset hint state
        this.currentHintLevel = 0;
        document.getElementById('hint1Btn').disabled = false;
        document.getElementById('hint2Btn').disabled = true;
        document.getElementById('hint3Btn').disabled = true;
        document.getElementById('hintPanel').classList.add('hidden');
        document.getElementById('feedbackPanel').classList.add('hidden');
        
        // Abilita bottoni risposta
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
        
        // Seleziona sorgente random
        this.currentProfile = getRandomSourceProfile(true); // Include hadron
        console.log(`  Sorgente: ${this.currentProfile.displayName}`);
        
        // Genera eventi per 3 camere
        const events = [];
        this.currentHillasParams = [];
        
        for (let i = 0; i < 3; i++) {
            const event = this.engine.generateEvent(this.currentProfile, i + 1);
            events.push(event);
            
            // Renderizza
            this.renderers[i].renderEvent(event, i === 0);
            
            // Calcola Hillas
            const hillas = this.hillasAnalyzer.analyze(event);
            if (hillas && hillas.valid) {
                this.currentHillasParams.push(hillas);
                this.renderers[i].renderHillasOverlay(hillas);
            }
        }
        
        this.currentEvent = events;
        
        // Mostra parametri Hillas
        this.displayQuizHillas();
        
        // Start timer
        this.startTimer();
        
        // Update istruzioni
        document.getElementById('quizInstruction').textContent = 
            `Analizza i parametri Hillas e identifica la sorgente. Hai ${QUIZ_CONFIG.timeLimit} secondi!`;
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
        
        // Mostra risposta corretta
        const correctBtn = document.querySelector(`.quiz-option[data-answer="${this.currentProfile.type}"]`);
        if (correctBtn) {
            correctBtn.classList.add('correct');
        }
        
        // Reset streak
        this.streak = 0;
        
        // Record answer
        this.answerHistory.push({
            question: this.currentQuestion,
            correctAnswer: this.currentProfile.type,
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
        
        // Disabilita bottoni
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.disabled = true;
        });
        
        // Check correct
        const correct = (answer === this.currentProfile.type);
        
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
        
        // Update stats
        this.sourceStats[this.currentProfile.type].attempts++;
        if (correct) {
            this.sourceStats[this.currentProfile.type].correct++;
        }
        
        // Record answer
        this.answerHistory.push({
            question: this.currentQuestion,
            correctAnswer: this.currentProfile.type,
            userAnswer: answer,
            correct: correct,
            points: points,
            timeSpent: timeSpent,
            hintsUsed: this.currentHintLevel
        });
        
        // Highlight buttons
        const selectedBtn = document.querySelector(`.quiz-option[data-answer="${answer}"]`);
        const correctBtn = document.querySelector(`.quiz-option[data-answer="${this.currentProfile.type}"]`);
        
        if (correct) {
            selectedBtn.classList.add('correct');
        } else {
            selectedBtn.classList.add('incorrect');
            correctBtn.classList.add('correct');
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
                    <p>Ricorda:</p>
                    <ul style="margin-left: 20px; font-size: 13px;">
                        <li>🦀 <strong>Crab</strong>: 800-1200 p.e. (medio)</li>
                        <li>💥 <strong>PeVatron</strong>: >2000 p.e. (ESTREMO!)</li>
                        <li>🌀 <strong>Blazar</strong>: 1000-1500 p.e. (medio-alto)</li>
                        <li>⚡ <strong>GRB</strong>: 1200-2000 p.e. (alto)</li>
                        <li>⭐ <strong>Centro Galattico</strong>: 1500-2200 p.e. (alto)</li>
                        <li>⚛️ <strong>Hadron</strong>: 500-3000 p.e. (molto variabile)</li>
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
            <p style="font-size: 16px; margin-bottom: 16px;">
                La risposta corretta era: <strong>${profile.displayName}</strong>
            </p>
            <p style="font-size: 14px; color: #ff4444;">
                Hai risposto: ${this.getSourceDisplayName(lastAnswer.userAnswer)}
            </p>
            <p style="margin-top: 16px; font-size: 13px;">
                <strong>Perché ${profile.displayName}?</strong><br>
                ${this.getEducationalNote(profile.type)}
            </p>
            <p style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                💡 Suggerimento: Rivedi la pagina di confronto per capire meglio le differenze!
            </p>
        `;
    }

    /**
     * Generate timeout feedback
     */
    generateTimeoutFeedback() {
        const profile = this.currentProfile;
        
        return `
            <p style="font-size: 16px; margin-bottom: 16px;">
                La risposta corretta era: <strong>${profile.displayName}</strong>
            </p>
            <p style="font-size: 13px;">
                ${this.getEducationalNote(profile.type)}
            </p>
            <p style="margin-top: 12px; font-size: 12px; color: #ffaa00;">
                ⚡ Prossima volta cerca di analizzare più velocemente i parametri chiave!
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

// === EXPORT ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizEngine, QUIZ_CONFIG };
}
