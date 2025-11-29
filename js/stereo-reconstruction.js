/**
 * GAMMALAB - Stereo Reconstruction Module
 * Ricostruzione geometrica stereoscopica da 3 camere
 * Visualizzazione processo di triangolazione
 */

/**
 * Compute stereoscopic ellipse from Hillas parameters of 3 cameras
 */
function computeStereoEllipse(hillasMap, cameraOffsets = null) {
    if (!hillasMap || typeof hillasMap !== 'object') {
        console.warn('computeStereoEllipse: hillasMap non valido');
        return null;
    }

    // Default camera offsets (parallasse stereoscopica)
    const offsets = cameraOffsets || {
        cam1: { ox: -12, oy: -8 },
        cam2: { ox: 0, oy: 0 },
        cam3: { ox: 12, oy: 8 }
    };

    const items = [];
    const camIds = ['cam1', 'cam2', 'cam3'];

    // Collect Hillas from all cameras
    for (const camId of camIds) {
        const h = hillasMap[camId];
        if (!h || !h.valid) continue;

        const ox = offsets[camId]?.ox || 0;
        const oy = offsets[camId]?.oy || 0;

        items.push({
            cam: camId,
            xc: h.cogX - ox,
            yc: h.cogY - oy,
            length: h.lengthPx || 40,
            width: h.widthPx || 12,
            angle: (h.theta || 0) * Math.PI / 180,
            size: h.size || 0,
            numPhotons: h.numPhotons || 0
        });
    }

    if (items.length < 2) {
        console.warn('computeStereoEllipse: meno di 2 camere valide');
        return null;
    }

    // Weighted average (peso: numPhotons > size)
    const weights = items.map(it => (it.numPhotons || 0) + 0.001 * (it.size || 0));
    const wsum = weights.reduce((s, x) => s + x, 0) || items.length;

    const xc = items.reduce((s, it, i) => s + it.xc * weights[i], 0) / wsum;
    const yc = items.reduce((s, it, i) => s + it.yc * weights[i], 0) / wsum;
    const length = Math.max(1, items.reduce((s, it, i) => s + it.length * weights[i], 0) / wsum);
    const width = Math.max(1, items.reduce((s, it, i) => s + it.width * weights[i], 0) / wsum);

    // Mean angle (circular average)
    let sx = 0, sy = 0;
    for (let i = 0; i < items.length; i++) {
        const w = weights[i];
        sx += Math.cos(items[i].angle) * w;
        sy += Math.sin(items[i].angle) * w;
    }
    const angle = Math.atan2(sy / wsum, sx / wsum);

    return {
        xc,
        yc,
        length,
        width,
        angle,
        items,
        weights,
        numCameras: items.length
    };
}

/**
 * Render stereoscopic reconstruction canvas with geometric visualization
 */
function renderStereoReconstruction(canvas, hillasMap, options = {}) {
    console.log('🔺 renderStereoReconstruction chiamata:', { 
        canvasId: canvas?.id,
        hillasKeys: Object.keys(hillasMap || {}),
        options 
    });
    
    const ctx = canvas.getContext('2d');
    const opts = {
        showGeometry: true,
        showCameraPositions: true,
        showArrows: true,
        showArrivalDirection: true,
        showReconstruction: true, // Default: mostra ellisse ricostruita
        ...options
    };

    // Clear canvas
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Compute reconstruction
    const rec = computeStereoEllipse(hillasMap);
    if (!rec) {
        ctx.fillStyle = '#9fb8d6';
        ctx.font = '14px sans-serif';
        ctx.fillText('Ricostruzione non disponibile - Genera un evento prima', 10, canvas.height / 2);
        return null;
    }

    // Define coordinate mapping
    const padding = 40;
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

    // Compute bounding box
    for (const it of rec.items) {
        minx = Math.min(minx, it.xc - it.length * 0.6);
        maxx = Math.max(maxx, it.xc + it.length * 0.6);
        miny = Math.min(miny, it.yc - it.length * 0.6);
        maxy = Math.max(maxy, it.yc + it.length * 0.6);
    }

    // Include reconstructed ellipse
    minx = Math.min(minx, rec.xc - rec.length * 0.6);
    maxx = Math.max(maxx, rec.xc + rec.length * 0.6);
    miny = Math.min(miny, rec.yc - rec.length * 0.6);
    maxy = Math.max(maxy, rec.yc + rec.length * 0.6);

    if (!isFinite(minx) || !isFinite(miny)) {
        minx = rec.xc - 100;
        miny = rec.yc - 50;
        maxx = rec.xc + 100;
        maxy = rec.yc + 50;
    }

    const availW = Math.max(32, canvas.width - padding * 2);
    const availH = Math.max(32, canvas.height - padding * 2 - 60); // Space for title
    const spanW = Math.max(1, maxx - minx);
    const spanH = Math.max(1, maxy - miny);
    const scale = Math.min(availW / spanW, availH / spanH);
    const offsetX = padding - minx * scale + (availW - spanW * scale) / 2;
    const offsetY = padding + 40 - miny * scale + (availH - spanH * scale) / 2; // Offset for title

    // Helper: draw ellipse in common coords
    function drawEllipse(obj, style) {
        ctx.save();
        ctx.translate(obj.xc * scale + offsetX, obj.yc * scale + offsetY);
        ctx.rotate(obj.angle || 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(2, (obj.length || 10) * 0.5 * scale), Math.max(2, (obj.width || 6) * 0.5 * scale), 0, 0, Math.PI * 2);
        if (style.fill) {
            ctx.fillStyle = style.fill;
            ctx.fill();
        }
        if (style.stroke) {
            ctx.lineWidth = style.lineWidth || 2;
            ctx.strokeStyle = style.stroke;
            ctx.stroke();
        }
        ctx.restore();
    }

    // === CAMERA POSITION DIAGRAM ===
    if (opts.showCameraPositions) {
        const camPosY = 30;
        const camSpacing = 80;
        const camStartX = canvas.width / 2 - camSpacing;
        const camLabels = ['C1', 'C2', 'C3'];
        const camColors = ['rgba(255,100,100,1.0)', 'rgba(100,255,120,1.0)', 'rgba(100,160,255,1.0)'];

        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        for (let i = 0; i < 3; i++) {
            const x = camStartX + i * camSpacing;
            // Camera icon (triangle)
            ctx.fillStyle = camColors[i];
            ctx.beginPath();
            ctx.moveTo(x, camPosY - 8);
            ctx.lineTo(x - 6, camPosY + 4);
            ctx.lineTo(x + 6, camPosY + 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillText(camLabels[i], x - 8, camPosY + 18);
        }
        // Title
        ctx.fillStyle = '#cfe8ff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Geometria Telescopi', 10, 20);
        ctx.restore();
    }

    // === CONNECTING LINES ===
    const centerX = rec.xc * scale + offsetX;
    const centerY = rec.yc * scale + offsetY;

    if (opts.showGeometry) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(180,200,220,0.3)';
        for (const it of rec.items) {
            const cx = it.xc * scale + offsetX;
            const cy = it.yc * scale + offsetY;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(centerX, centerY);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
    }

    // === INDIVIDUAL CAMERA PROJECTIONS ===
    const camColors = {
        cam1: { fill: 'rgba(255,100,100,0.25)', stroke: 'rgba(255,100,100,0.85)', label: 'rgba(255,120,120,1.0)' },
        cam2: { fill: 'rgba(100,255,120,0.25)', stroke: 'rgba(100,255,120,0.85)', label: 'rgba(120,255,140,1.0)' },
        cam3: { fill: 'rgba(100,160,255,0.25)', stroke: 'rgba(100,160,255,0.85)', label: 'rgba(120,180,255,1.0)' }
    };

    for (let i = 0; i < rec.items.length; i++) {
        const it = rec.items[i];
        const colors = camColors[it.cam] || { fill: 'rgba(200,200,200,0.18)', stroke: '#888', label: '#fff' };

        drawEllipse(it, { fill: colors.fill, stroke: colors.stroke, lineWidth: 1.5 });

        // Camera center marker
        const cx = it.xc * scale + offsetX;
        const cy = it.yc * scale + offsetY;
        ctx.fillStyle = colors.label;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Camera label with weight
        const weight = rec.weights[i];
        const weightPct = Math.round(weight * 100 / rec.weights.reduce((a, b) => a + b, 0));
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(cx + 8, cy - 10, 52, 16);
        ctx.fillStyle = colors.label;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${it.cam.toUpperCase()} ${weightPct}%`, cx + 10, cy + 2);
    }

    // === ARROWS SHOWING CONTRIBUTION ===
    if (opts.showArrows) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < rec.items.length; i++) {
            const it = rec.items[i];
            const cx = it.xc * scale + offsetX;
            const cy = it.yc * scale + offsetY;

            const dx = centerX - cx;
            const dy = centerY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                const arrowLen = Math.min(dist * 0.7, dist - 8);
                const endX = cx + (dx / dist) * arrowLen;
                const endY = cy + (dy / dist) * arrowLen;

                // Arrow line
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Arrow head
                const angle = Math.atan2(dy, dx);
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - 8 * Math.cos(angle - 0.3), endY - 8 * Math.sin(angle - 0.3));
                ctx.lineTo(endX - 8 * Math.cos(angle + 0.3), endY - 8 * Math.sin(angle + 0.3));
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // === RECONSTRUCTED ELLIPSE (PROMINENT) ===
    const a_px = Math.max(4, (rec.length * 0.5) * scale);
    const b_px = Math.max(3, (rec.width * 0.5) * scale);

    if (opts.showReconstruction) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rec.angle || 0);

        // Radial fill
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(a_px, b_px));
        rg.addColorStop(0, 'rgba(255,250,180,0.35)');
        rg.addColorStop(0.6, 'rgba(140,220,120,0.10)');
        rg.addColorStop(1, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.ellipse(0, 0, a_px, b_px, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gradient stroke
        const grad = ctx.createLinearGradient(-a_px, 0, a_px, 0);
        grad.addColorStop(0, '#7fe67f');
        grad.addColorStop(0.6, '#e6f36b');
        grad.addColorStop(1, '#ffd54f');
        ctx.lineWidth = Math.max(2, 3);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, a_px, b_px, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Center marker
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
        ctx.restore();
    }

    if (opts.showArrivalDirection) {
        const dirLength = Math.max(80, a_px * 1.6);
        const dirAngle = rec.angle || 0;
        const farX = centerX + Math.cos(dirAngle) * dirLength;
        const farY = centerY + Math.sin(dirAngle) * dirLength;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 180, 0.85)';
        ctx.fillStyle = 'rgba(255, 255, 180, 0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(farX, farY);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();

        const angle = Math.atan2(centerY - farY, centerX - farX);
        const headSize = 12;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - headSize * Math.cos(angle - 0.4), centerY - headSize * Math.sin(angle - 0.4));
        ctx.lineTo(centerX - headSize * Math.cos(angle + 0.4), centerY - headSize * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();

        const labelX = (centerX + farX) / 2 + 10;
        const labelY = (centerY + farY) / 2 - 10;
        ctx.font = '600 13px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255, 255, 210, 0.95)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 3;
        ctx.strokeText('Direzione arrivo γ', labelX, labelY);
        ctx.fillText('Direzione arrivo γ', labelX, labelY);
        ctx.restore();
    }

    // === LEGEND ===
    ctx.fillStyle = '#9fb8d6';
    ctx.font = '12px sans-serif';
    ctx.fillText('Processo geometrico: proiezioni telecamere → ricostruzione stereoscopica', 10, canvas.height - 10);

    return rec;
}

/**
 * Create stereo canvas element and insert into page
 */
function createStereoCanvas(containerId = 'stereo-container') {
    let container = document.getElementById(containerId);
    
    if (!container) {
        // Create container after simulator controls
        const anchor = document.querySelector('.simulator-controls') || document.querySelector('main');
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'stereo-panel';
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(container, anchor.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }

    // Check if canvas already exists
    let canvas = document.getElementById('stereo-canvas');
    if (!canvas) {
        const title = document.createElement('h3');
        title.textContent = 'Ricostruzione Stereoscopica';
        title.style.color = '#cfe8ff';
        title.style.marginBottom = '10px';
        title.style.textAlign = 'center';
        container.appendChild(title);

        canvas = document.createElement('canvas');
        canvas.id = 'stereo-canvas';
        canvas.width = 960;
        canvas.height = 480;
        canvas.style.border = '1px solid rgba(255,255,255,0.1)';
        canvas.style.background = '#03060a';
        canvas.style.borderRadius = '6px';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        container.appendChild(canvas);
    }

    return canvas;
}

// === EXPORT TO GLOBAL SCOPE ===
if (typeof window !== 'undefined') {
    window.computeStereoEllipse = computeStereoEllipse;
    window.renderStereoReconstruction = renderStereoReconstruction;
    window.createStereoCanvas = createStereoCanvas;
}
