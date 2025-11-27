/**
 * GAMMALAB - Navigation & Integration Module
 * Utilities condivise per navigazione e integrazione simulatori
 */

// === ANIMAZIONI E MICRO-INTERAZIONI ===

/**
 * Inizializza animazioni di scorrimento e micro-interazioni
 */
function initAnimations() {
    // Intersection Observer per animazioni di scorrimento
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);

    // Osserva tutti gli elementi con classe scroll-fade-in
    document.querySelectorAll('.scroll-fade-in').forEach(el => {
        observer.observe(el);
    });

    // Animazioni per i canvas dei simulatori
    document.querySelectorAll('.camera-canvas, .viewer-canvas, .stereo-canvas').forEach(canvas => {
        canvas.addEventListener('mouseenter', () => {
            canvas.classList.add('gpu-accelerated');
        });

        canvas.addEventListener('mouseleave', () => {
            canvas.classList.remove('gpu-accelerated');
        });
    });

    // Effetto ripple per i bottoni
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Animazioni per le opzioni del quiz
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', function() {
            // Rimuovi animazioni precedenti
            document.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('success-animation', 'error-animation');
            });

            // Aggiungi animazione di selezione
            this.classList.add('success-animation');
        });
    });

    // Effetto typing per titoli importanti
    document.querySelectorAll('.typing-effect').forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.width = '0';

        setTimeout(() => {
            element.style.width = '100%';
        }, 500);
    });

    // Animazioni per i parametri Hillas
    document.querySelectorAll('.param-value').forEach(value => {
        const originalText = value.textContent;
        value.textContent = '0';

        setTimeout(() => {
            animateNumber(value, 0, parseFloat(originalText.replace(/[^\d.-]/g, '')), 1000);
        }, 500);
    });

    // Loading states per i canvas
    document.querySelectorAll('.camera-canvas').forEach(canvas => {
        canvas.classList.add('canvas-loading');

        // Simula caricamento completato dopo 1 secondo
        setTimeout(() => {
            canvas.classList.remove('canvas-loading');
        }, 1000);
    });
}

/**
 * Anima un numero da start a end
 */
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const isFloat = end % 1 !== 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        const current = start + (end - start) * eased;

        if (isFloat) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.round(current);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Aggiunge effetto shimmer durante il caricamento
 */
function addLoadingShimmer(element) {
    element.classList.add('loading-shimmer');

    return {
        remove: () => element.classList.remove('loading-shimmer')
    };
}

/**
 * Effetto di scroll fluido per anchor links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Gestisce le preferenze di riduzione del movimento
 */
function handleReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Disabilita animazioni pesanti
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }
}

// Inizializza tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initSmoothScrolling();
    handleReducedMotion();
});

// === GESTIONE NAVIGAZIONE ===

/**
 * Aggiorna highlight menu attivo
 */
function updateActiveNavItem(currentPage) {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        if (link.getAttribute('href').includes(currentPage)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Configura una serie di CanvasRenderer affinché mostrino le ellissi solo su hover
 * con centro e dimensioni allineati alla traccia dei fotoni (stesso comportamento del quiz).
 */
window.configureRendererHoverEllipses = function(renderers) {
    if (!Array.isArray(renderers)) return;

    renderers.forEach(renderer => {
        if (!renderer) return;
        if (typeof renderer.enableHoverHillasMode === 'function') {
            renderer.enableHoverHillasMode();
        } else {
            renderer.showHillasOnHover = true;
            renderer.embedHillasOutline = false;
            renderer.showEllipseOnly = false;
            renderer.respectExactHillas = true;
            renderer.subpixelEnabled = false;
            if (renderer.overlay && renderer.overlay.style) {
                renderer.overlay.style.pointerEvents = 'none';
            }
            if (typeof renderer.setSignatureHintsEnabled === 'function') {
                renderer.setSignatureHintsEnabled(false);
            } else {
                renderer.signatureHintsEnabled = false;
            }
            renderer.signatureHint = '';
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
    });
};

// (Exposure/Sub-pixel controls rimossi)

// === SIMULATORE UNIVERSALE ===

    /**
     * Setup simulatore universale per pagine sorgenti
     * @param {String} sourceType - Tipo sorgente ('crab', 'pevatron', ecc.)
     * @param {Object} options - Opzioni aggiuntive
     */
    function setupSourceSimulator(sourceType, options = {}) {
        const {
            generateBtnId = 'generateBtn',
            clearBtnId = 'clearBtn',
            hillasDisplayId = 'hillasDisplay',
            showStereo = true,
            showLegend = true,
            stereoscopic = false  // NUOVA OPZIONE: eventi coerenti per stereoscopia
        } = options;    let engine, renderers, hillasAnalyzer, colorPalette;

    // Inizializza componenti immediatamente
    engine = new SimulationEngine();
    hillasAnalyzer = new HillasAnalyzer();
    colorPalette = new EnergyColorPalette();
    engine.colorPalette = colorPalette;

    // Inizializza renderers per 3 camere
    renderers = [
        new CanvasRenderer('cam1', 'cam1-overlay'),
        new CanvasRenderer('cam2', 'cam2-overlay'),
        new CanvasRenderer('cam3', 'cam3-overlay')
    ];

    // Assegna nuova palette a tutti i renderers
    renderers.forEach(renderer => {
        renderer.colorPalette = colorPalette;
        renderer.respectExactHillas = true;
        renderer.subpixelEnabled = false;

        if (renderer.canvas && typeof renderer.hideHoverZoomUntilExit === 'function') {
            renderer.canvas.addEventListener('click', () => renderer.hideHoverZoomUntilExit());
        }
    });

    if (typeof window.configureRendererHoverEllipses === 'function') {
        window.configureRendererHoverEllipses(renderers);
    }

    console.log('🎨 Nuova palette 5 colori assegnata ai renderers');

    // Event listeners
    const generateBtn = document.getElementById(generateBtnId);
    const clearBtn = document.getElementById(clearBtnId);

    if (generateBtn) {
        generateBtn.addEventListener('click', () => generateEvent());
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => clearAll());
    }
    console.log(`✅ Simulatore ${sourceType} inizializzato`);
    
    // Auto-genera primo evento dopo caricamento pagina
    if (options.autoGenerate !== false) {  // default true
        setTimeout(() => {
            console.log('🎬 Auto-generating initial event...');
            generateEvent();
        }, 200);
    }

    /**
     * Genera evento per la sorgente
     */
    function generateEvent() {
        console.log(`🔬 Generazione evento ${sourceType}...`);

        const profile = getSourceProfile(sourceType);
        const events = [];
        const hillasParams = [];
        const hillasMap = {};
        
        // Dimensioni canvas per le pagine sorgenti (ridotte per migliore visualizzazione)
        // Usa dimensioni dal primo canvas se disponibile, altrimenti default
        const firstCanvas = document.getElementById('cam1');
        const defaultWidth = firstCanvas ? firstCanvas.width : 900;
        const defaultHeight = firstCanvas ? firstCanvas.height : 600;
        
        const canvasSize = options.canvasSize || { width: defaultWidth, height: defaultHeight };

        if (stereoscopic) {
            // MODALITÀ STEREOSCOPICA: genera un singolo evento coerente visto da 3 camere
            console.log('📷 Modalità stereoscopica: evento coerente su 3 camere');
            
            // Genera evento base con parametri fissi (senza varianza inter-camera)
            const baseParams = engine._sampleFromProfile(profile);
            baseParams.sourceType = profile.type;
            
            // Energia fissa per coerenza
            const energy = engine._sampleEnergy(profile.energyRange);
            
            // Angolo zenitale fisso
            const zenithAngle = engine._randomInRange(0, 30);
            if (zenithAngle > 0) {
                engine._applyZenithEffects(baseParams, zenithAngle, energy);
            }
            
            // Genera per 3 camere con variazioni minime per simulare visione da posizioni diverse
            for (let i = 0; i < 3; i++) {
                const cameraId = i + 1;
                const camKey = `cam${cameraId}`;
                
                // Parametri leggermente variati per simulare visione da angolazioni diverse
                const cameraParams = { ...baseParams };
                
                // Variazione minima posizione (±5% per simulare parallasse)
                const parallaxVariation = 0.05;
                cameraParams.length *= (1 + (Math.random() - 0.5) * parallaxVariation);
                cameraParams.width *= (1 + (Math.random() - 0.5) * parallaxVariation);
                cameraParams.alpha += (Math.random() - 0.5) * 5; // ±2.5° variazione
                
                // Genera tracce con parametri leggermente variati
                const tracks = engine._generateTracks(cameraParams, energy, canvasSize.width, canvasSize.height, { sourceType });
                
                const event = {
                    sourceType: profile.type,
                    cameraId: cameraId,
                    energy: energy,
                    zenithAngle: zenithAngle,
                    params: cameraParams,
                    tracks: tracks,
                    canvasWidth: canvasSize.width,
                    canvasHeight: canvasSize.height,
                    timestamp: Date.now(),
                    signatureHint: cameraParams.signatureHint || ''
                };
                
                events.push(event);
                
                // Analisi Hillas per questa camera
                const canvas = document.getElementById(`cam${cameraId}`);
                const hillas = hillasAnalyzer.analyze(event);
                if (hillas && hillas.valid) {
                    renderers[i].adjustHillasToContainTracks(hillas, event.tracks);
                    hillasParams.push(hillas);
                    hillasMap[camKey] = hillas;
                    
                    renderers[i].fillEllipseBackground(hillas, event.tracks);
                }
                
                // Rendering
                if (canvas && renderers[i]) {
                    renderers[i].renderEvent(event, i === 0 && showLegend);
                    console.log(`🎨 Camera ${cameraId}: ${event.tracks.length} fotoni renderizzati`);
                }
                
                // Overlay Hillas
                if (hillas && hillas.valid) {
                    renderers[i].renderHillasOverlay(hillas);
                }
                
                console.log(`  Camera ${cameraId}: ${event.tracks.length} fotoni, E=${(event.energy/1000).toFixed(1)} TeV`);
            }
        } else {
            // MODALITÀ ORIGINALE: eventi indipendenti per camera
            // Genera per 3 camere
            for (let i = 0; i < 3; i++) {
                const cameraId = i + 1;
                const camKey = `cam${cameraId}`;
                
                const event = engine.generateEvent(profile, cameraId, canvasSize);
                events.push(event);

                const canvas = document.getElementById(`cam${cameraId}`);

                // Calcola Hillas PRIMA del rendering in modo da poter disegnare il
                // riempimento dell'ellisse sotto i fotoni e poi i fotoni sopra.
                const hillas = hillasAnalyzer.analyze(event);
                if (hillas && hillas.valid) {
                    // Espandi l'ellisse per includere tutti i fotoni renderizzati
                    try {
                        renderers[i].adjustHillasToContainTracks(hillas, event.tracks);
                    } catch (e) {
                        console.warn('Errore durante l\'adjustHillasToContainTracks', e);
                    }

                    hillasParams.push(hillas);
                    hillasMap[camKey] = hillas;

                    // Disegna il riempimento diffuso DENTRO l'ellisse sul canvas principale
                    try {
                        renderers[i].fillEllipseBackground(hillas, event.tracks);
                    } catch (e) {
                        console.warn('Errore durante fillEllipseBackground', e);
                    }
                }

                // Rendering con palette già configurata (fotoni sopra il riempimento)
                if (canvas && renderers[i]) {
                    renderers[i].renderEvent(event, i === 0 && showLegend);
                    console.log(`🎨 Camera ${cameraId}: ${event.tracks.length} fotoni renderizzati`);
                }

                // Ora disegniamo l'overlay Hillas sopra i fotoni
                if (hillas && hillas.valid) {
                    try {
                        renderers[i].renderHillasOverlay(hillas);
                    } catch (e) {
                        console.warn('Errore durante renderHillasOverlay', e);
                    }
                }

                console.log(`  Camera ${cameraId}: ${event.tracks.length} fotoni, E=${(event.energy/1000).toFixed(1)} TeV`);
            }
        }

        // Ricostruzione stereoscopica avanzata
        if (showStereo && hillasParams.length >= 2) {
            // Cerca canvas stereo esistente
            let stereoCanvas = document.getElementById('stereo');
            
            // Se non esiste, prova a crearlo dinamicamente
            if (!stereoCanvas && typeof createStereoCanvas === 'function') {
                stereoCanvas = createStereoCanvas('stereo-container');
            }
            
            if (stereoCanvas && typeof renderStereoReconstruction === 'function') {
                console.log('🔺 Rendering ricostruzione stereoscopica');
                renderStereoReconstruction(stereoCanvas, hillasMap, {
                    showGeometry: true,
                    showCameraPositions: true,
                    showArrows: true,
                    showArrivalDirection: true
                });
            } else if (stereoCanvas) {
                // Fallback a vecchia stereo
                console.log('🔺 Fallback a stereo semplice');
                const stereoResult = combineStereoscopicEvents(events);
                renderStereo(stereoResult);
            } else {
                console.warn('⚠️ Canvas stereo non trovato');
            }
        }

        // Mostra parametri
        displayHillas(hillasParams);

        if (hillasParams.length >= 2) {
            const comparison = compareHillasAcrossCameras(hillasParams);
            displayComparison(comparison);
        }
    }

    /**
     * Renderizza stereo
     */
    function renderStereo(stereoResult) {
        const canvas = document.getElementById('stereo');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const colors = ['#ff4444', '#44ff44', '#4444ff'];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        stereoResult.events.forEach((event, idx) => {
            const hillas = hillasAnalyzer.analyze(event);
            if (!hillas) return;

            const theta = hillas.theta * Math.PI / 180;
            const length = 200;

            ctx.strokeStyle = colors[idx];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + length * Math.cos(theta),
                centerY + length * Math.sin(theta)
            );
            ctx.stroke();

            ctx.fillStyle = colors[idx];
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillText(`Cam${idx+1}`, centerX + length * Math.cos(theta) + 10, centerY + length * Math.sin(theta));
        });

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Courier New"';
        ctx.fillText('Ricostruzione Stereoscopica', 20, 30);
        ctx.font = '14px "Courier New"';
        ctx.fillText(`Coerenza: ${(stereoResult.coherence * 100).toFixed(1)}%`, 20, 55);
        ctx.fillText(`Camere: ${stereoResult.numCameras}`, 20, 75);
    }

    /**
     * Mostra parametri Hillas
     */
    function displayHillas(hillasArray) {
        const container = document.getElementById(hillasDisplayId);
        if (!container || hillasArray.length === 0) return;

        let html = '<h4>Parametri di Hillas per Camera</h4>';
        
        hillasArray.forEach((hillas, idx) => {
            html += `
                <div style="margin-bottom: 20px; padding: 12px; background: rgba(0, 40, 80, 0.3); border-radius: 8px;">
                    <h5 style="color: #00d9ff; margin-bottom: 10px;">📷 Camera ${idx + 1}</h5>
                    <table style="width: 100%; font-family: 'Courier New', monospace; font-size: 13px;">
                        <tr>
                            <td style="padding: 4px 8px;"><strong>Length:</strong></td>
                            <td>${hillas.length.toFixed(3)}° (${hillas.lengthPx.toFixed(1)} px)</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 8px;"><strong>Width:</strong></td>
                            <td>${hillas.width.toFixed(3)}° (${hillas.widthPx.toFixed(1)} px)</td>
                        </tr>
                        <tr style="background: rgba(255, 200, 0, 0.1);">
                            <td style="padding: 4px 8px;"><strong>Size:</strong></td>
                            <td><span style="color: #ffc800;">${hillas.size.toFixed(0)} p.e.</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 8px;"><strong>Alpha:</strong></td>
                            <td>${hillas.alpha.toFixed(1)}°</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 8px;"><strong>L/W Ratio:</strong></td>
                            <td>${hillas.elongation.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 8px;"><strong>Miss:</strong></td>
                            <td>${hillas.miss.toFixed(2)}°</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 8px;"><strong>Fotoni:</strong></td>
                            <td>${hillas.numPhotons}</td>
                        </tr>
                    </table>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Mostra comparazione
     */
    function displayComparison(comparison) {
        const container = document.getElementById(hillasDisplayId);
        if (!container) return;

        const coherenceColor = comparison.coherence > 90 ? '#00ff88' : 
                                comparison.coherence > 80 ? '#ffaa00' : '#ff4444';

        container.innerHTML += `
            <div style="margin-top: 24px; padding: 16px; background: rgba(0, 80, 40, 0.3); border-radius: 8px; border: 2px solid ${coherenceColor};">
                <h4 style="color: ${coherenceColor};">📊 Analisi Stereoscopica</h4>
                <p><strong>Coerenza Inter-Camera:</strong> <span style="color: ${coherenceColor}; font-size: 20px;">${comparison.coherence.toFixed(1)}%</span></p>
                <p style="font-size: 13px; color: var(--text-secondary);">
                    ${comparison.coherence > 90 ? '✅ Eccellente - Evento gamma altamente probabile' :
                      comparison.coherence > 80 ? '⚠️ Buona - Probabile evento gamma' :
                      '❌ Bassa - Possibile contaminazione adronica'}
                </p>
                <table style="width: 100%; margin-top: 12px; font-family: 'Courier New', monospace; font-size: 13px;">
                    <tr style="background: rgba(255,255,255,0.05);">
                        <th style="padding: 6px; text-align: left;">Parametro</th>
                        <th style="padding: 6px;">Media</th>
                        <th style="padding: 6px;">Varianza</th>
                    </tr>
                    <tr>
                        <td style="padding: 6px;">Length</td>
                        <td style="padding: 6px; text-align: center;">${comparison.average.length.toFixed(3)}°</td>
                        <td style="padding: 6px; text-align: center;">±${comparison.variance.length.toFixed(3)}°</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px;">Width</td>
                        <td style="padding: 6px; text-align: center;">${comparison.average.width.toFixed(3)}°</td>
                        <td style="padding: 6px; text-align: center;">±${comparison.variance.width.toFixed(3)}°</td>
                    </tr>
                    <tr style="background: rgba(255,200,0,0.1);">
                        <td style="padding: 6px;">Size</td>
                        <td style="padding: 6px; text-align: center;"><strong>${comparison.average.size.toFixed(0)} p.e.</strong></td>
                        <td style="padding: 6px; text-align: center;">±${comparison.variance.size.toFixed(0)} p.e.</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px;">Alpha</td>
                        <td style="padding: 6px; text-align: center;">${comparison.average.alpha.toFixed(1)}°</td>
                        <td style="padding: 6px; text-align: center;">±${comparison.variance.alpha.toFixed(1)}°</td>
                    </tr>
                </table>
            </div>
        `;
    }

    /**
     * Pulisce tutto
     */
    function clearAll() {
        renderers.forEach(r => r.clear());
        
        const stereoCanvas = document.getElementById('stereo');
        if (stereoCanvas) {
            const ctx = stereoCanvas.getContext('2d');
            ctx.fillStyle = '#000814';
            ctx.fillRect(0, 0, stereoCanvas.width, stereoCanvas.height);
        }

        document.getElementById(hillasDisplayId).innerHTML = 
            '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Genera un evento per visualizzare i parametri di Hillas</p>';
        
        console.log('🧹 Canvas puliti');
    }
}
