/**
 * GAMMALAB - Navigation & Integration Module
 * Utilities condivise per navigazione e integrazione simulatori
 */

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
        showLegend = true
    } = options;

    let engine, renderers, hillasAnalyzer, colorPalette;

    document.addEventListener('DOMContentLoaded', () => {
        // Inizializza componenti
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
    });

    /**
     * Genera evento per la sorgente
     */
    function generateEvent() {
        console.log(`🔬 Generazione evento ${sourceType}...`);

        const profile = getSourceProfile(sourceType);
        const events = [];
        const hillasParams = [];

        // Genera per 3 camere
        for (let i = 0; i < 3; i++) {
            const cameraId = i + 1;
            
            const event = engine.generateEvent(profile, cameraId);
            events.push(event);

            renderers[i].renderEvent(event, i === 0 && showLegend);

            const hillas = hillasAnalyzer.analyze(event);
            if (hillas && hillas.valid) {
                hillasParams.push(hillas);
                renderers[i].renderHillasOverlay(hillas);
            }

            console.log(`  Camera ${cameraId}: ${event.tracks.length} fotoni, E=${(event.energy/1000).toFixed(1)} TeV`);
        }

        // Ricostruzione stereoscopica
        if (showStereo && events.length === 3) {
            const stereoResult = combineStereoscopicEvents(events);
            renderStereo(stereoResult);
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

// === EXPORT ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateActiveNavItem,
        setupSourceSimulator
    };
}
