// --- DEBUG BOOTSTRAP (prime righe) ---
(function(){
  try{
    window.lastHillas = window.lastHillas || null;
    window.lastImages = window.lastImages || null;
    window.lastSimResult = window.lastSimResult || null;
    window.__gammalab_debug_injected = window.__gammalab_debug_injected || false;
    console.log('DEBUG BOOTSTRAP: injected. lastHillas=', window.lastHillas, ' lastImages=', window.lastImages);
    if(!window.__gammalab_debug_injected){ window.__gammalab_debug_injected = true; console.log('DEBUG BOOTSTRAP: first injection OK'); }
  }catch(err){
    console.error('DEBUG BOOTSTRAP ERROR', err && err.stack ? err.stack : err);
  }
})();

// --- Helpers statistici e utilità
function median(arr){
  const a = Array.from(arr).filter(v=>isFinite(v)).sort((x,y)=>x-y);
  if(a.length===0) return 0;
  const m = Math.floor(a.length/2);
  return (a.length%2===1) ? a[m] : (a[m-1]+a[m])/2;
}
function mean(arr){ let s=0,c=0; for(const v of arr){ if(!isFinite(v)) continue; s+=v; c++; } return c? s/c:0; }
function stddev(arr, mu){ mu = (typeof mu==='number')? mu : mean(arr); let s=0,c=0; for(const v of arr){ if(!isFinite(v)) continue; s += (v-mu)*(v-mu); c++; } return c>1? Math.sqrt(s/(c-1)):0; }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// Gaussian blur separable
function gaussianKernel1D(sigma){
  if(!sigma || sigma<=0) return {k:[1], radius:0};
  const radius = Math.ceil(3*sigma); const size = radius*2+1; const k = new Array(size); let sum=0;
  for(let i=-radius;i<=radius;i++){ const v = Math.exp(-(i*i)/(2*sigma*sigma)); k[i+radius]=v; sum+=v; }
  for(let i=0;i<size;i++) k[i]/=sum;
  return {k, radius};
}
function separableBlur(src, W, H, sigma){
  if(!sigma || sigma<=0) return Float32Array.from(src);
  const {k, radius} = gaussianKernel1D(sigma);
  const tmp = new Float32Array(W*H);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      let s=0;
      for(let j=-radius;j<=radius;j++){
        const xx = clamp(x+j, 0, W-1); s += src[y*W + xx] * k[j+radius];
      }
      tmp[y*W + x] = s;
    }
  }
  const out = new Float32Array(W*H);
  for(let x=0;x<W;x++){
    for(let y=0;y<H;y++){
      let s=0;
      for(let j=-radius;j<=radius;j++){
        const yy = clamp(y+j, 0, H-1); s += tmp[yy*W + x] * k[j+radius];
      }
      out[y*W + x] = s;
    }
  }
  return out;
}

// Connected components (4-neighbour)
function connectedComponents(mask, W, H, minArea){
  const N = W*H; const labels = new Int32Array(N); const comps = []; let cur = 0;
  for(let i=0;i<N;i++){
    if(labels[i]!==0) continue; if(!mask[i]) continue;
    cur++; const stack=[i]; labels[i]=cur; const compIdxs=[i];
    while(stack.length){
      const idx = stack.pop(); const y = Math.floor(idx / W), x = idx % W;
      if(x>0){ const n = idx-1; if(labels[n]===0 && mask[n]){ labels[n]=cur; stack.push(n); compIdxs.push(n); } }
      if(x<W-1){ const n = idx+1; if(labels[n]===0 && mask[n]){ labels[n]=cur; stack.push(n); compIdxs.push(n); } }
      if(y>0){ const n = idx-W; if(labels[n]===0 && mask[n]){ labels[n]=cur; stack.push(n); compIdxs.push(n); } }
      if(y<H-1){ const n = idx+W; if(labels[n]===0 && mask[n]){ labels[n]=cur; stack.push(n); compIdxs.push(n); } }
    }
    if(compIdxs.length >= (minArea||1)) comps.push({label:cur, idxs:compIdxs});
  }
  return comps;
}

// Weighted moments from index list
function weightedMomentsFromIdxs(idxs, warr, W){
  let Wsum=0, Wx=0, Wy=0;
  for(const idx of idxs){ const w = warr[idx] || 0; Wsum += w; Wx += w * (idx % W); Wy += w * Math.floor(idx / W); }
  if(Wsum<=0) return null;
  const xc = Wx / Wsum, yc = Wy / Wsum;
  let Sxx=0,Syy=0,Sxy=0;
  for(const idx of idxs){ const w = warr[idx] || 0; const x = idx % W, y = Math.floor(idx / W); const dx = x - xc, dy = y - yc; Sxx += w * dx * dx; Syy += w * dy * dy; Sxy += w * dx * dy; }
  Sxx /= Wsum; Syy /= Wsum; Sxy /= Wsum;
  return {W:Wsum, xc, yc, Sxx, Syy, Sxy};
}

// Mahalanobis squared distance
function mahalanobis2(idx, moments, W){
  const x = idx % W, y = Math.floor(idx / W); const dx = x - moments.xc, dy = y - moments.yc;
  const cov00 = moments.Sxx, cov01 = moments.Sxy, cov11 = moments.Syy;
  const det = cov00*cov11 - cov01*cov01; if(Math.abs(det) < 1e-12) return dx*dx + dy*dy;
  const inv00 = cov11/det, inv01 = -cov01/det, inv11 = cov00/det;
  return inv00*dx*dx + 2*inv01*dx*dy + inv11*dy*dy;
}

// PCA -> ellipse params (sigma)
function ellipseFromCov(mom){
  const Sxx = mom.Sxx, Syy = mom.Syy, Sxy = mom.Sxy;
  const tr = Sxx + Syy;
  const disc = Math.max(0, (Sxx - Syy)*(Sxx - Syy)/4 + Sxy*Sxy);
  const l1 = tr/2 + Math.sqrt(disc);
  const l2 = tr/2 - Math.sqrt(disc);
  const a = Math.sqrt(Math.max(1e-9, l1));
  const b = Math.sqrt(Math.max(1e-9, l2));
  const angle = 0.5 * Math.atan2(2*Sxy, Sxx - Syy);
  return {a, b, angle};
}

// solve 3x3
function solve3x3(A, B){
  const a00 = A[0][0], a01 = A[0][1], a02 = A[0][2];
  const a10 = A[1][0], a11 = A[1][1], a12 = A[1][2];
  const a20 = A[2][0], a21 = A[2][1], a22 = A[2][2];
  const b0 = B[0], b1 = B[1], b2 = B[2];
  const det = a00*(a11*a22 - a12*a21) - a01*(a10*a22 - a12*a20) + a02*(a10*a21 - a11*a20);
  if(Math.abs(det) < 1e-12) return null;
  const invDet = 1/det;
  const i00 =  (a11*a22 - a12*a21) * invDet;
  const i01 = -(a01*a22 - a02*a21) * invDet;
  const i02 =  (a01*a12 - a02*a11) * invDet;
  const i10 = -(a10*a22 - a12*a20) * invDet;
  const i11 =  (a00*a22 - a02*a20) * invDet;
  const i12 = -(a00*a12 - a02*a10) * invDet;
  const i20 =  (a10*a21 - a11*a20) * invDet;
  const i21 = -(a00*a21 - a01*a20) * invDet;
  const i22 =  (a00*a11 - a01*a10) * invDet;
  const x0 = i00*b0 + i01*b1 + i02*b2;
  const x1 = i10*b0 + i11*b1 + i12*b2;
  const x2 = i20*b0 + i21*b1 + i22*b2;
  return [x0,x1,x2];
}

// --- computeHillasForImage (corretta, moment method)
function computeHillasForImage(img, CAM_W, CAM_H){
  const data = (img && img.data) ? img.data : img;
  if(!data || data.length === 0) return null;
  const points = []; const wmin = 1e-6;
  for(let y=0; y<CAM_H; y++){
    for(let x=0; x<CAM_W; x++){
      const idx = y * CAM_W + x; const v = data[idx];
      if(!v || v <= 0) continue; points.push({ x, y, w: v });
    }
  }
  if(points.length === 0) return null;
  let W=0, Wx=0, Wy=0;
  for(const p of points){ W += p.w; Wx += p.w * p.x; Wy += p.w * p.y; }
  if(W <= 0) return null;
  const xc = Wx / W, yc = Wy / W;
  let Sxx=0,Syy=0,Sxy=0;
  for(const p of points){ const dx = p.x - xc, dy = p.y - yc; Sxx += p.w * dx * dx; Syy += p.w * dy * dy; Sxy += p.w * dx * dy; }
  Sxx /= W; Syy /= W; Sxy /= W;
  const tr = Sxx + Syy; const det = Sxx * Syy - Sxy * Sxy;
  const disc = Math.max(0, tr*tr/4 - det);
  const l1 = tr/2 + Math.sqrt(disc); const l2 = tr/2 - Math.sqrt(disc);
  const length = Math.sqrt(Math.max(0, l1)) * 2;
  const width  = Math.sqrt(Math.max(0, l2)) * 2;
  let angle = 0;
  if(Math.abs(Sxy) < 1e-12 && Math.abs(Sxx - Syy) < 1e-12) angle = 0;
  else angle = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);
  // optional quadratic fit for centerline
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const projected = [];
  for(const p of points){ const dx = p.x - xc, dy = p.y - yc; const lon =  dx * ux + dy * uy; const cross = -dx * uy + dy * ux; projected.push({ lon, cross, w: p.w }); }
  let hfit = null;
  if(projected.length >= 6){
    let Q0=0,Q1=0,Q2=0,Q3=0,Q4=0,Qy=0,Qxy=0,Qx2y=0;
    for(const p of projected){ const x = p.lon, yv = p.cross; const w = Math.sqrt(Math.max(wmin, p.w)); Q0 += w; Q1 += w*x; Q2 += w*x*x; Q3 += w*x*x*x; Q4 += w*x*x*x*x; Qy += w*yv; Qxy += w*x*yv; Qx2y += w*x*x*yv; }
    const A = [[Q0,Q1,Q2],[Q1,Q2,Q3],[Q2,Q3,Q4]]; const B = [Qy,Qxy,Qx2y];
    const coeffs = solve3x3(A,B);
    if(coeffs) hfit = { a0: coeffs[0], a1: coeffs[1], a2: coeffs[2] };
  }
  let centerline = null;
  if(hfit){
    centerline = []; const steps = 9; const Lsample = Math.max( Math.abs(length)*1.2, 30 );
    for(let i=0;i<steps;i++){ const t = -Lsample/2 + (i/(steps-1)) * Lsample; const cross = hfit.a0 + hfit.a1 * t + hfit.a2 * t * t; const ix = xc + t * ux - cross * uy; const iy = yc + t * uy + cross * ux; centerline.push({ x: ix, y: iy }); }
  }
  return { xc, yc, length, width, angle, W, Sxx, Syy, Sxy, isCurve: !!hfit, centerline };
}

// --- computeHillasRobust (preprocessing + robust moments + fit)
function computeHillasRobust(img, W, H, opts){
  opts = Object.assign({ blurSigma:0.8, threshK:1.2, minArea:6, mahalanobisT:9, iterMax:3, sigmaToAxis:2.0, returnMask:false }, opts||{});
  const data = (img && img.data) ? img.data : img;
  if(!data || data.length < W*H) return null;
  const arr = Array.from(data);
  const med = median(arr); const sd = stddev(arr, med) || 1;
  const norm = new Float32Array(W*H);
  for(let i=0;i<W*H;i++){ const v = arr[i] - med; norm[i] = v > 0 ? v : 0; }
  const blurred = separableBlur(norm, W, H, opts.blurSigma);
  const thresh = med + opts.threshK * sd;
  const mask = new Uint8Array(W*H); let cntMask = 0;
  for(let i=0;i<W*H;i++){ if(blurred[i] > thresh){ mask[i]=1; cntMask++; } }
  if(cntMask < opts.minArea) return null;
  const comps = connectedComponents(mask, W, H, opts.minArea);
  if(!comps || comps.length===0) return null;
  let bestComp = null, bestScore = -Infinity;
  for(const c of comps){ let score=0; for(const idx of c.idxs) score += blurred[idx]; if(score>bestScore){ bestScore=score; bestComp=c; } }
  if(!bestComp) return null;
  const warr = new Float32Array(W*H);
  for(const idx of bestComp.idxs) warr[idx] = blurred[idx];
  let idxs = bestComp.idxs.slice();
  let moments = weightedMomentsFromIdxs(idxs, warr, W);
  if(!moments) return null;
  for(let it=0; it<opts.iterMax; it++){
    const keep=[];
    for(const idx of idxs){ const m2 = mahalanobis2(idx, moments, W); if(m2 <= opts.mahalanobisT) keep.push(idx); }
    if(keep.length === idxs.length) break;
    if(keep.length < opts.minArea) break;
    idxs = keep;
    const newMom = weightedMomentsFromIdxs(idxs, warr, W);
    if(!newMom) break;
    moments = newMom;
  }
  const el = ellipseFromCov(moments);
  const semiMajor = el.a * opts.sigmaToAxis, semiMinor = el.b * opts.sigmaToAxis;
  const length = semiMajor * 2, width = semiMinor * 2;
  const ux = Math.cos(el.angle), uy = Math.sin(el.angle);
  const projected = [];
  for(const idx of idxs){ const x = idx % W, y = Math.floor(idx / W); const dx = x - moments.xc, dy = y - moments.yc; const lon = dx * ux + dy * uy; const cross = -dx * uy + dy * ux; const w = Math.sqrt(Math.max(1e-6, warr[idx])); projected.push({lon, cross, w}); }
  let centerline = null;
  if(projected.length >= 6){
    let Q0=0,Q1=0,Q2=0,Q3=0,Q4=0,Qy=0,Qxy=0,Qx2y=0;
    for(const p of projected){ const x = p.lon, yv = p.cross, w = p.w; Q0 += w; Q1 += w*x; Q2 += w*x*x; Q3 += w*x*x*x; Q4 += w*x*x*x*x; Qy += w*yv; Qxy += w*x*yv; Qx2y += w*x*x*yv; }
    const A = [[Q0,Q1,Q2],[Q1,Q2,Q3],[Q2,Q3,Q4]]; const B = [Qy,Qxy,Qx2y];
    const coeffs = solve3x3(A,B);
    if(coeffs){ centerline = []; const steps = 9; const Lsample = Math.max(length*1.2, 30); for(let i=0;i<steps;i++){ const t = -Lsample/2 + (i/(steps-1))*Lsample; const cross = coeffs[0] + coeffs[1]*t + coeffs[2]*t*t; const ix = moments.xc + t*ux - cross*uy; const iy = moments.yc + t*uy + cross*ux; centerline.push({x:ix, y:iy}); } }
  }
  const result = { xc: moments.xc, yc: moments.yc, length: length, width: width, angle: el.angle, W: moments.W, Sxx: moments.Sxx, Syy: moments.Syy, Sxy: moments.Sxy, isCurve: !!centerline, centerline, pixelsUsed: idxs.length, debug: { threshold: thresh, bgMedian: med, bgStd: sd, blurSigma: opts.blurSigma, componentArea: bestComp.idxs.length, keptPixels: idxs.length } };
  if(opts.returnMask){ const outMask = new Uint8Array(W*H); for(const id of idxs) outMask[id]=1; result.debug.mask = outMask; }
  return result;
}

// --- updateAllHillasAndDraw: calcola per tutte le camere e assegna window.lastHillas
function updateAllHillasAndDraw(opts){
  window.lastHillas = window.lastHillas || {};
  if(typeof CAMERAS === 'undefined') { console.warn('CAMERAS non definito'); return; }

  // use opts.downsampleFactor to speed up Hillas on high-res images
  opts = Object.assign({ downsampleFactor: 6, minW: 320, minH: 240 }, opts || {});
  const dsFactor = Math.max(1, Math.floor(opts.downsampleFactor));

  // helper: simple bilinear sampler for downsampling Float32Array images
  function downsampleFloatImage(src, srcW, srcH, dstW, dstH){
    const out = new Float32Array(dstW * dstH);
    const sx = srcW / dstW, sy = srcH / dstH;
    for(let j=0;j<dstH;j++){
      const fy = (j + 0.5) * sy - 0.5;
      const y0 = Math.floor(fy), y1 = Math.min(srcH-1, y0+1), dy = fy - y0;
      const y0c = Math.max(0, Math.min(srcH-1, y0));
      for(let i=0;i<dstW;i++){
        const fx = (i + 0.5) * sx - 0.5;
        const x0 = Math.floor(fx), x1 = Math.min(srcW-1, x0+1), dx = fx - x0;
        const x0c = Math.max(0, Math.min(srcW-1, x0));
        const v00 = src[y0c*srcW + x0c] || 0;
        const v10 = src[y0c*srcW + x1] || 0;
        const v01 = src[y1*srcW + x0c] || 0;
        const v11 = src[y1*srcW + x1] || 0;
        const v0 = v00*(1-dx) + v10*dx;
        const v1 = v01*(1-dx) + v11*dx;
        out[j*dstW + i] = v0*(1-dy) + v1*dy;
      }
    }
    return out;
  }

  for(const cam of CAMERAS){
    try{
      const img = window.lastImages && window.lastImages[cam.id];
      if(!img){ delete window.lastHillas[cam.id]; continue; }

      // choose downsample size
      let targetW = Math.max(opts.minW, Math.round(CAM_W / dsFactor));
      let targetH = Math.max(opts.minH, Math.round(CAM_H / dsFactor));
      // preserve aspect ratio
      const ar = CAM_W / CAM_H;
      if(Math.abs(targetW/targetH - ar) > 0.01){
        targetH = Math.round(targetW / ar);
      }

      // downsample the high-res float image for processing
      const dsImg = (dsFactor === 1) ? img : downsampleFloatImage(img, CAM_W, CAM_H, targetW, targetH);

      // compute Hillas on downsampled image
      const hds = computeHillasRobust(dsImg, targetW, targetH, opts);
      if(!hds){ delete window.lastHillas[cam.id]; continue; }

      // map coordinates back to original high-res space
      const scaleX = CAM_W / targetW;
      const scaleY = CAM_H / targetH;
      const mapped = Object.assign({}, hds);
      mapped.xc = (hds.xc || 0) * scaleX;
      mapped.yc = (hds.yc || 0) * scaleY;
      // approximate length/width scaling (use geometric mean)
      const sxMean = Math.sqrt(scaleX * scaleY);
      mapped.length = (hds.length || 0) * sxMean;
      mapped.width  = (hds.width  || 0) * sxMean;
      mapped.camId = cam.id;
      mapped._downsample = { targetW, targetH, scaleX, scaleY };
      window.lastHillas[cam.id] = mapped;

    }catch(e){
      console.error('updateAllHillas error', cam.id, e);
    }
  }
  if(typeof drawOverlay === 'function') try{ drawOverlay(window.lastHillas); }catch(e){ console.warn('drawOverlay error', e); }
}

// --- tracker minimal e funzione per associare ID persistenti
window._hillasTracker = window._hillasTracker || { nextId:1, objects: {} };
function trackHillas(currMap, maxDist){
  const tracker = window._hillasTracker; const prev = tracker.objects || {}; const usedPrev = new Set(); const newObjects = {};
  const currArr = [];
  for(const camId in currMap){ const h = currMap[camId]; if(!h) continue; currArr.push(h); }
  for(const h of currArr){
    const x = h.xc_global, y = h.yc_global;
    let bestId = null, bestD = Infinity;
    for(const id in prev){ if(usedPrev.has(id)) continue; const p = prev[id]; const dx = p.x - x, dy = p.y - y; const d2 = dx*dx + dy*dy; if(d2 < bestD){ bestD = d2; bestId = id; } }
    if(bestId !== null && Math.sqrt(bestD) <= (maxDist||40)){ newObjects[bestId] = Object.assign({}, h, { id: bestId, x: x, y: y }); usedPrev.add(bestId); } else { const nid = String(tracker.nextId++); newObjects[nid] = Object.assign({}, h, { id: nid, x: x, y: y }); }
  }
  tracker.objects = newObjects; return newObjects;
}

// --- drawTrackedEllipses: disegna ellissi e centerline sugli overlay viewers
function drawTrackedEllipses(trackedMap){
  // use drawHillasOnViewer with saved srcRects so overlays align exactly with viewer crops
  const viewers = ['viewer1Overlay','viewer2Overlay','viewer3Overlay'];
  window.__lastViewerSrcRects = window.__lastViewerSrcRects || [];
  for(let i=0;i<viewers.length;i++){
    const id = viewers[i];
    const overlay = document.getElementById(id);
    if(!overlay) continue;
    const srcRect = window.__lastViewerSrcRects[i] || { x:0, y:0, w: CAM_W || 320, h: CAM_H || 240 };
    const cam = (window.CAMERAS && window.CAMERAS[i]) ? window.CAMERAS[i] : { id: null };
    const list=[];
    // collect tracked hillas for this camera (fall back to lastHillas)
    if(trackedMap){
      for(const k in trackedMap){ const h = trackedMap[k]; if(h && h.camId === cam.id) list.push(h); }
    }
    if(list.length===0 && window.lastHillas && cam.id && window.lastHillas[cam.id]) list.push(window.lastHillas[cam.id]);
    // call globally exposed function if available (safe)
    if(typeof window.drawHillasOnViewer === 'function'){
      try{ window.drawHillasOnViewer(list, overlay, srcRect); }catch(e){ console.warn('drawHillasOnViewer error', e); }
    } else if(typeof drawHillasOnViewer === 'function'){
      try{ drawHillasOnViewer(list, overlay, srcRect); }catch(e){ console.warn('drawHillasOnViewer error', e); }
    } else {
      // nothing to draw
    }
  }
}

// --- Utility: run full pipeline and draw (one-shot)
function runHillasPipelineAndDraw(opts){
  updateAllHillasAndDraw(opts);
  const tracked = trackHillas(window.lastHillas || {}, opts && opts.trackMaxDist ? opts.trackMaxDist : 40);
  drawTrackedEllipses(tracked);
  return { lastHillas: window.lastHillas, tracked };
}

// expose publicly
window.computeHillasForImage = window.computeHillasForImage || computeHillasForImage;
window.computeHillasRobust = window.computeHillasRobust || computeHillasRobust;
window.updateAllHillasAndDraw = window.updateAllHillasAndDraw || updateAllHillasAndDraw;
window.trackHillas = window.trackHillas || trackHillas;
window.runHillasPipelineAndDraw = window.runHillasPipelineAndDraw || runHillasPipelineAndDraw;
window.drawTrackedEllipses = window.drawTrackedEllipses || drawTrackedEllipses;

console.log('Hillas module injected: computeHillasForImage, computeHillasRobust, updateAllHillasAndDraw, runHillasPipelineAndDraw available.');

/* ======= Enhanced bootstrap: multi-track simulation, precise overlay mapping, UI hooks ======= */
(function(){
  // small Gaussian RNG
  function randNormal(){ let u=0,v=0; while(u===0) u=Math.random(); while(v===0) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

  // Use balanced default resolution for performance
  const CAM_W = window.CAM_W_OVERRIDE || 1500;
  const CAM_H = window.CAM_H_OVERRIDE || 1000;
  window.CAM_W = window.CAM_W || CAM_W;
  window.CAM_H = window.CAM_H || CAM_H;

  const CAMERAS = window.CAMERAS || [
    { id: 'C1', canvasId: 'cameraC1' },
    { id: 'C2', canvasId: 'cameraC2' },
    { id: 'C3', canvasId: 'cameraC3' }
  ];
  window.CAMERAS = CAMERAS;

  // Palette mapping (dark -> blue -> green -> yellow)
  const _palette = [
    [10,6,18],
    [24,30,120],
    [28,150,90],
    [230,220,70]
  ];
  function paletteMapNorm(t){
    t = Math.max(0, Math.min(1, t));
    const n = _palette.length - 1;
    const idx = Math.min(n-1, Math.floor(t * n));
    const local = (t * n) - idx;
    const a = _palette[idx], b = _palette[idx+1];
    return [
      Math.round(a[0] + (b[0]-a[0]) * local),
      Math.round(a[1] + (b[1]-a[1]) * local),
      Math.round(a[2] + (b[2]-a[2]) * local)
    ];
  }
  window.paletteMapNorm = paletteMapNorm;

  // Faster track generator using bounded updates (less CPU)
  function simulateIactImageMultiTracks(energy, primary='gamma', trackDefs = []){
     const scaleBase = Math.log10(Math.max(energy,50));
     const img = new Float32Array(CAM_W*CAM_H);
     const floor = 0.004;
     for(let i=0;i<img.length;i++) img[i] = floor + (Math.random()-0.5)*0.008;
 
    const nTracks = trackDefs.length || (1 + Math.floor(Math.random()*3));
    let maxWidSeen = 0;
    for(let t=0;t<nTracks;t++){
      const td = trackDefs[t] || {};
      const cx = (typeof td.cx === 'number') ? td.cx : (CAM_W*0.2 + Math.random()*CAM_W*0.6);
      const cy = (typeof td.cy === 'number') ? td.cy : (CAM_H*0.2 + Math.random()*CAM_H*0.6);
      // slightly shorter average length, larger width to favor ellipses over thin sticks
      const len = (typeof td.len === 'number') ? td.len : (30 + scaleBase*6 + Math.random()*30);
      const wid = (typeof td.wid === 'number') ? td.wid : Math.max(4, 8 + (primary==='proton'? 6:0) + Math.random()*6);
      const theta = (typeof td.theta === 'number') ? td.theta : (Math.random()*Math.PI);
      const amp = (typeof td.amp === 'number') ? td.amp : (0.9 + Math.random()*1.6) * Math.log10(Math.max(energy,50))/2;
 
      maxWidSeen = Math.max(maxWidSeen, wid);
 
      const bboxR = Math.ceil(Math.max(len*1.2, wid*4));
      const x0 = Math.max(0, Math.floor(cx - bboxR));
      const x1 = Math.min(CAM_W-1, Math.ceil(cx + bboxR));
      const y0 = Math.max(0, Math.floor(cy - bboxR));
      const y1 = Math.min(CAM_H-1, Math.ceil(cy + bboxR));
 
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      const len2 = len * len, wid2 = wid * wid;
      for(let y=y0;y<=y1;y++){
        for(let x=x0;x<=x1;x++){
          const dx = x - cx, dy = y - cy;
          const xr = dx * cosT + dy * sinT;
          const yr = -dx * sinT + dy * cosT;
          const exponent = -0.5 * ((xr*xr)/len2 + (yr*yr)/wid2);
          if(exponent < -14) continue;
          img[y*CAM_W + x] += amp * Math.exp(exponent);
        }
      }
 
      if(primary === 'proton' && Math.random() < 0.4){
        const clx = cx + (randNormal()*len*0.35), cly = cy + (randNormal()*wid*0.35);
        const rcl = 12;
        const xx0 = Math.max(0, Math.floor(clx - rcl)), xx1 = Math.min(CAM_W-1, Math.ceil(clx + rcl));
        const yy0 = Math.max(0, Math.floor(cly - rcl)), yy1 = Math.min(CAM_H-1, Math.ceil(cly + rcl));
        for(let yy=yy0;yy<=yy1;yy++){
          for(let xx=xx0;xx<=xx1;xx++){
            const d2 = (xx-clx)*(xx-clx) + (yy-cly)*(yy-cly);
            img[yy*CAM_W + xx] += 0.85 * Math.exp(-d2/(2*9));
          }
        }
      }
    }
 
    // mild global blur to smooth profiles and emphasize ellipse shape (sigma depends on typical width)
    const blurSigma = Math.max(0.9, Math.min(3.0, (maxWidSeen || 6) * 0.25));
    const blurred = separableBlur(img, CAM_W, CAM_H, blurSigma);
    for(let i=0;i<img.length;i++) img[i] = blurred[i];
     for(let i=0;i<img.length;i++) img[i] = Math.max(0, img[i] + (Math.random()-0.5)*0.004);
     return img;
   }
 
  // simulate stereo event with stronger per-camera differences
  function simulateStereoImages(energy, primary){
     const baseTracks = [];
     const n = 1 + Math.floor(Math.random()*3);
     for(let i=0;i<n;i++){
       baseTracks.push({
         cx: CAM_W*(0.25 + Math.random()*0.5),
         cy: CAM_H*(0.25 + Math.random()*0.5),
         len: 30 + Math.random()*40,
         wid: 2 + Math.random()*3,
         theta: Math.random()*Math.PI,
         amp: 0.7 + Math.random()
       });
     }
 
     const cams = {
       C1:{ox:-12,oy:-8, gain: 1.0 + (Math.random()-0.5)*0.2},
       C2:{ox:0,   oy:0,  gain: 1.0 + (Math.random()-0.5)*0.25},
       C3:{ox:12,  oy:8,  gain: 1.0 + (Math.random()-0.5)*0.2}
     };
     const images = {}, meta = {};
    for(const camId of ['C1','C2','C3']){
      const camDef = cams[camId];
      // start from shared baseTracks with camera parallax/gain
      let defs = baseTracks.map(t=>({
        cx: clamp(t.cx + (camDef.ox + randNormal()*3), 5, CAM_W-5),
        cy: clamp(t.cy + (camDef.oy + randNormal()*3), 5, CAM_H-5),
        len: t.len*(1 + (Math.random()-0.5)*0.25),
        wid: t.wid*(1 + (Math.random()-0.5)*0.25),
        theta: t.theta + (Math.random()-0.5)*0.12,
        amp: t.amp * camDef.gain * (1 + (Math.random()-0.5)*0.25)
      }));
      // add 1-2 extra camera-unique tracks to maximize inter-camera differences
      const extraCount = 1 + Math.floor(Math.random()*2); // 1 or 2
      for(let e=0;e<extraCount;e++){
        defs.push({
          cx: clamp(CAM_W*(0.15 + Math.random()*0.7) + camDef.ox*0.5, 5, CAM_W-5),
          cy: clamp(CAM_H*(0.15 + Math.random()*0.7) + camDef.oy*0.5, 5, CAM_H-5),
          len: 20 + Math.random()*80,
          wid: 3 + Math.random()*6,
          theta: Math.random()*Math.PI,
          amp: 0.4 + Math.random()*1.4
        });
      }
      images[camId] = simulateIactImageMultiTracks(energy, primary, defs);
      meta[camId] = defs.map(d=>({xc:d.cx, yc:d.cy, amp:d.amp}));
    }
    return { images, meta };
   }
   window.simulateStereoImages = simulateStereoImages;

  // renderToCanvas: downsample into smaller offscreen buffer and darker background
  function renderToCanvas(img, canvas, srcRect){
    if(!canvas || !img) return;
    const targetW = Math.max(160, Math.floor(canvas.clientWidth || 320));
    const targetH = Math.max(120, Math.floor(canvas.clientHeight || 240));
    const off = document.createElement('canvas');
    const offW = Math.min(CAM_W, 1000);
    const offH = Math.round(offW * (CAM_H / CAM_W));
    off.width = offW; off.height = offH;
    const octx = off.getContext('2d');
    const imgData = octx.createImageData(offW, offH);

    let maxv = 1e-9;
    for(let i=0;i<img.length;i++) if(img[i] > maxv) maxv = img[i];

    const sx = CAM_W / offW, sy = CAM_H / offH;
    for(let y=0;y<offH;y++){
      for(let x=0;x<offW;x++){
        const srcX = x * sx, srcY = y * sy;
        const x0 = Math.floor(srcX), y0 = Math.floor(srcY);
        const x1 = Math.min(CAM_W-1, x0+1), y1 = Math.min(CAM_H-1, y0+1);
        const dx = srcX - x0, dy = srcY - y0;
        const v00 = img[y0*CAM_W + x0] || 0;
        const v10 = img[y0*CAM_W + x1] || 0;
        const v01 = img[y1*CAM_W + x0] || 0;
        const v11 = img[y1*CAM_W + x1] || 0;
        const v0 = v00*(1-dx) + v10*dx;
        const v1 = v01*(1-dx) + v11*dx;
        let v = v0*(1-dy) + v1*dy;
        v = Math.sqrt(Math.max(0, v)) * 1.1;
        v = Math.min(1, v / Math.max(1e-6, maxv*0.9));
        const col = paletteMapNorm(v);
        const idx = (y*offW + x) * 4;
        imgData.data[idx] = col[0]; imgData.data[idx+1] = col[1]; imgData.data[idx+2] = col[2]; imgData.data[idx+3] = 255;
      }
    }
    octx.putImageData(imgData, 0, 0);

    canvas.width = targetW; canvas.height = targetH;
    canvas.style.width = canvas.clientWidth + 'px';
    canvas.style.height = canvas.clientHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(!srcRect){
      ctx.drawImage(off, 0,0, off.width, off.height, 0,0, canvas.width, canvas.height);
    } else {
      const ox = Math.round(srcRect.x / sx), oy = Math.round(srcRect.y / sy);
      const ow = Math.max(1, Math.round(srcRect.w / sx)), oh = Math.max(1, Math.round(srcRect.h / sy));
      ctx.drawImage(off, ox, oy, ow, oh, 0,0, canvas.width, canvas.height);
    }
  }

  // draw hillas ellipses with larger sizes and green->yellow gradient center
  function drawHillasOnViewer(hillasList, overlayCanvas, srcRect){
    if(!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d');
    const txW = Math.max(160, Math.floor(overlayCanvas.clientWidth || 320));
    const txH = Math.max(120, Math.floor(overlayCanvas.clientHeight || 240));
    overlayCanvas.width = txW; overlayCanvas.height = txH;
    overlayCanvas.style.width = overlayCanvas.clientWidth + 'px';
    overlayCanvas.style.height = overlayCanvas.clientHeight + 'px';
    ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
    if(!hillasList || hillasList.length===0) return;
    const sx = overlayCanvas.width / srcRect.w;
    const sy = overlayCanvas.height / srcRect.h;
    const s = Math.min(sx, sy);
    const dx = (overlayCanvas.width - s*srcRect.w)/2;
    const dy = (overlayCanvas.height - s*srcRect.h)/2;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(s, s);
    ctx.translate(-srcRect.x, -srcRect.y);

    // choose the single most significant hillas to draw:
    // score = pixelsUsed (preferred) else W; tie-breaker uses W.
    const best = hillasList.reduce((bestSoFar, h)=>{
      if(!h) return bestSoFar;
      const score = (h.pixelsUsed || 0) + 0.001 * (h.W || 0);
      if(!bestSoFar || score > bestSoFar.score) return { h, score };
      return bestSoFar;
    }, null);
    if(best && best.h){
      const h = best.h;
      const sizeScale = Number(window.HILLAS_SIZE_SCALE) || 1.6;
      const a = Math.max(8, (h.length || 40) * 0.6 * sizeScale);
      const b = Math.max(5, (h.width  || 10) * 0.9 * Math.sqrt(sizeScale));
      const ang = h.angle || 0;
      const strength = Math.min(1, (h.W || 1) / Math.max(1, (h.pixelsUsed || 50)));
      const col = paletteMapNorm(0.6 + 0.4 * Math.min(1, strength));
      const gx = h.xc - Math.cos(ang)*a, gy = h.yc - Math.sin(ang)*a;
      const hx = h.xc + Math.cos(ang)*a, hy = h.yc + Math.sin(ang)*a;
      const grad = ctx.createLinearGradient(gx,gy,hx,hy);
      grad.addColorStop(0, `rgba(${Math.max(0, col[0]-40)},${Math.max(0,col[1]-40)},${Math.max(0,col[2]-40)},0.95)`);
      grad.addColorStop(0.6, `rgba(${col[0]},${col[1]},${col[2]},0.98)`);
      grad.addColorStop(1, `rgba(${Math.min(255,col[0]+40)},${Math.min(255,col[1]+40)},${Math.min(255,col[2]+40)},1.0)`);
      ctx.lineWidth = Math.max(1, 3.0 / s);
      ctx.strokeStyle = grad;
      const rg = ctx.createRadialGradient(h.xc, h.yc, 0, h.xc, h.yc, Math.max(a,b));
      rg.addColorStop(0, 'rgba(240,250,140,0.35)');
      rg.addColorStop(0.6, 'rgba(100,200,100,0.12)');
      rg.addColorStop(1, 'rgba(0,0,0,0.0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(h.xc, h.yc, a, b, ang, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(h.xc-1.0, h.yc-1.0, 2.0, 2.0);
    }
    ctx.restore();
  }
  window.drawHillasOnViewer = drawHillasOnViewer;

  // run sim, render thumbnails and viewer crops; then compute hillas & overlay precisely
  function runSimulationAndRender(energy, primary){
    const sim = simulateStereoImages(energy, primary);
    window.lastSimResult = sim;
    window.lastImages = sim.images;
    window.lastSimMeta = sim.meta || {};

    // render thumbnails using efficient renderer
    for(const cam of CAMERAS){
      const cv = document.getElementById(cam.canvasId);
      if(cv && sim.images[cam.id]) renderToCanvas(sim.images[cam.id], cv, null);
    }

    // compute Hillas (downsampling inside updateAllHillasAndDraw)
    try{
      if(typeof runHillasPipelineAndDraw === 'function'){
        runHillasPipelineAndDraw({ downsampleFactor: 6 });
      } else {
        updateAllHillasAndDraw({ downsampleFactor: 6 });
      }
    }catch(e){ console.warn('pipeline run error', e); }

    // viewer crops & overlays (reuse existing logic)
    window.__lastViewerSrcRects = [];
    for(let i=1;i<=3;i++){
      const viewerBase = document.getElementById('viewer'+i+'Base');
      const viewerOverlay = document.getElementById('viewer'+i+'Overlay');
      const camId = CAMERAS[i-1].id;
      const img = sim.images[camId];
      let cx = CAM_W/2, cy = CAM_H/2;
      const h = (window.lastHillas && window.lastHillas[camId]) || null;
      if(h && h.xc && isFinite(h.xc)) { cx = h.xc; cy = h.yc; }
      else if(sim.meta && sim.meta[camId] && sim.meta[camId].length){
        const top = sim.meta[camId].reduce((a,b)=> a.amp>b.amp?a:b, sim.meta[camId][0]);
        cx = top.xc; cy = top.yc;
      } else {
        let maxv=0, mi=0;
        for(let p=0;p<img.length;p++){ if(img[p]>maxv){ maxv=img[p]; mi=p; } }
        cx = (mi % CAM_W); cy = Math.floor(mi/CAM_W);
      }
      const zoom = 2.2;
      const cw = Math.max(60, Math.round(CAM_W / zoom));
      const ch = Math.max(45, Math.round(CAM_H / zoom));
      const sx = Math.max(0, Math.min(CAM_W - cw, Math.round(cx - cw/2)));
      const sy = Math.max(0, Math.min(CAM_H - ch, Math.round(cy - ch/2)));
      const srcRect = { x: sx, y: sy, w: cw, h: ch };
      window.__lastViewerSrcRects.push(srcRect);
      if(viewerBase) renderToCanvas(img, viewerBase, srcRect);
      const allHillas = [];
      if(window.lastHillas){
        if(window.lastHillas[camId]) allHillas.push(window.lastHillas[camId]);
        else { for(const k in window.lastHillas) if(window.lastHillas[k] && window.lastHillas[k].camId===camId) allHillas.push(window.lastHillas[k]); }
      }
      drawHillasOnViewer(allHillas, viewerOverlay, srcRect);
    }

    const hbox = document.getElementById('hillasText');
    const camActive = CAMERAS[0].id;
    const hv = (window.lastHillas && window.lastHillas[camActive]) ? window.lastHillas[camActive] : null;
    if(hbox) hbox.textContent = hv ? `len=${(hv.length||0).toFixed(1)} width=${(hv.width||0).toFixed(1)}` : 'Nessuna Hillas';
    return sim;
  }

  // ensure global exposure
  window.runSimulationAndRender = window.runSimulationAndRender || runSimulationAndRender;

  // wire UI buttons (ensure id's present)
  document.getElementById('iactSimBtn')?.addEventListener('click', ()=>{
    const en = Number(document.getElementById('iactEnergy')?.value) || 500;
    const prim = document.getElementById('iactPrim')?.value || 'gamma';
    runSimulationAndRender(en, prim);
  });

  // instructions button: open instructions.html
  document.getElementById('btnInstructions')?.addEventListener('click', ()=>{
    window.open('instructions.html', '_blank');
  });

  // Generate Mission: create a simple mission and fill options
  function generateMission(){
    const energy = Math.round(50 + Math.random()*2000);
    const target = Math.random()<0.5 ? 'gamma' : 'proton';
    window.currentMission = { energy, target };
    document.getElementById('missionText').textContent = `Missione: trova il tipo primario per un evento a ~${energy} GeV.`;
    const opts = document.getElementById('options');
    if(opts){
      opts.innerHTML = '';
      const choices = ['gamma','proton'];
      for(const c of choices){
        const id = 'opt_'+c;
        const r = document.createElement('div');
        r.innerHTML = `<label><input type="radio" name="source" value="${c}" id="${id}"> ${c}</label>`;
        opts.appendChild(r);
      }
    }
    document.getElementById('progressiveHint').textContent = 'Usa "Simula Flash" per generare l\'evento e osserva i dettagli.';
    const enEl = document.getElementById('iactEnergy');
    if(enEl) enEl.value = energy;
  }
  document.getElementById('generateBtn')?.addEventListener('click', generateMission);

  // hint button: show a small clue
  document.getElementById('hintBtn')?.addEventListener('click', ()=>{
    const m = window.currentMission;
    const hintEl = document.getElementById('progressiveHint');
    if(!m){ hintEl.textContent = 'Genera una missione prima.'; return; }
    hintEl.textContent = `Suggerimento: evento ~${m.energy} GeV; osserva forma/width delle ellissi.`;
  });

  // submit answer
  document.getElementById('submitAnswer')?.addEventListener('click', ()=>{
    const sel = document.querySelector('input[name="source"]:checked');
    const fb = document.getElementById('feedback');
    if(!window.currentMission){ if(fb) fb.textContent = 'Genera prima una missione.'; return; }
    if(!sel){ if(fb) fb.textContent = 'Seleziona un\'opzione.'; return; }
    const ok = sel.value === window.currentMission.target;
    if(fb) fb.textContent = ok ? 'Corretto!' : `Sbagliato — risposta corretta: ${window.currentMission.target}`;
  });

  // export hillas (reuse existing behavior)
  document.getElementById('exportHillas')?.addEventListener('click', ()=>{
    if(!window.lastHillas) return alert('Nessun Hillas calcolato');
    const rows = [ ['camId','id','xc','yc','length','width','angle','W','pixelsUsed'] ];
    for(const k in window.lastHillas){
      const h = window.lastHillas[k];
      rows.push([h.camId || k, h.id || '', h.xc || '', h.yc || '', h.length || '', h.width || '', h.angle || '', h.W || '', h.pixelsUsed || '']);
    }
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download = 'hillas_export.csv'; document.body.appendChild(a); a.click(); a.remove();
  });

  // helpers: export thumbnail PNG and open high-res hex render in a new window
  function exportCameraPNG(camId){
    const cam = (window.CAMERAS||[]).find(c=>c.id===camId);
    if(!cam) return alert('Camera not found: '+camId);
    const cv = document.getElementById(cam.canvasId);
    if(!cv) return alert('Canvas not found: '+cam.canvasId);
    const data = cv.toDataURL('image/png');
    const a = document.createElement('a'); a.href = data; a.download = camId + '_thumb.png';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function openHighResHex(camId){
    const sim = window.lastSimResult || {};
    const img = sim.images && sim.images[camId];
    if(!img) return alert('No simulation image for '+camId);

    const modal = document.getElementById('highResModal');
    const container = document.getElementById('highResContainer');
    const closeBtn = document.getElementById('highResClose');
    if(!modal || !container || !closeBtn) return alert('High-res modal not present in DOM');

    // clear previous content
    container.innerHTML = '';

    // create high-res canvas and render into it
    const off = document.createElement('canvas');
    off.width = 3000;
    off.height = 2000;
    try{
      if(typeof renderHexCamera === 'function'){
        renderHexCamera(img, off, { highRes: true, width: off.width, height: off.height, cellRadius: 8 });
      } else {
        const ctx = off.getContext('2d');
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,off.width,off.height);
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
        ctx.fillText('High-res render not available', 20, 40);
      }
    }catch(e){
      console.warn('High-res render failed', e);
      const ctx = off.getContext('2d');
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,off.width,off.height);
      ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
      ctx.fillText('Render failed', 20, 40);
    }

    // make canvas scale responsively inside the modal
    off.style.width = '100%';
    off.style.height = '100%';
    off.style.objectFit = 'contain';
    off.setAttribute('aria-label', camId + ' high-res view');

    container.appendChild(off);

    // show modal (use flex to center)
    modal.style.display = 'flex';

    // attach close handlers
    function closeModal(){
      modal.style.display = 'none';
      container.innerHTML = '';
      // remove handlers to avoid leaks
      closeBtn.removeEventListener('click', closeModal);
      modal.removeEventListener('click', modalClickHandler);
    }
    function modalClickHandler(e){
      if(e.target === modal) closeModal();
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', modalClickHandler);
  }

  // wire UI buttons once DOM is ready
  window.addEventListener('load', ()=>{
    document.querySelectorAll('.exportCam').forEach(btn=>{
      btn.addEventListener('click', ()=> exportCameraPNG(btn.dataset.cam));
    });
    document.querySelectorAll('.viewHighRes').forEach(btn=>{
      btn.addEventListener('click', ()=> openHighResHex(btn.dataset.cam));
    });
  });
})();

/* ===== Hex-camera thumbnail renderer (hex-packed sensors) ===== */
(function(){
  // bilinear sample from Float32Array image (CAM coords)
  function sampleBilinear(img, x, y, W, H){
    if(x<0 || y<0 || x>W-1 || y>H-1) return 0;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(W-1, x0+1), y1 = Math.min(H-1, y0+1);
    const dx = x - x0, dy = y - y0;
    const v00 = img[y0*W + x0] || 0;
    const v10 = img[y0*W + x1] || 0;
    const v01 = img[y1*W + x0] || 0;
    const v11 = img[y1*W + x1] || 0;
    const v0 = v00*(1-dx) + v10*dx;
    const v1 = v01*(1-dx) + v11*dx;
    return v0*(1-dy) + v1*dy;
  }

  // draw a filled regular hexagon at (cx,cy) with radius r (pixel units)
  function drawHex(ctx, cx, cy, r){
    const ang30 = Math.PI/6;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a = ang30 + i*Math.PI/3;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // render image as hexagonal sensor thumbnail (uses actual image values)
  function renderHexCamera(img, canvas, opts){
    opts = opts || {};
    const srcW = opts.srcW || (window.CAM_W || 320);
    const srcH = opts.srcH || (window.CAM_H || 240);
    // when img is a Float32Array of srcW*srcH values (0..1) we sample from it
    const useImage = (opts.useImage !== false) && img && img.length >= srcW*srcH;

    // choose offscreen resolution for nicer results without full-res cost
    const maxOffW = Number(opts.width) || 1200; // tune for quality/perf
    const targetW = Math.max(200, Math.floor(canvas.clientWidth || 320));
    const targetH = Math.max(150, Math.floor(canvas.clientHeight || 240));
    const offW = Math.min(maxOffW, srcW);
    const offH = Math.round(offW * (srcH / srcW));

    const off = document.createElement('canvas');
    off.width = offW; off.height = offH;
    const ctx = off.getContext('2d');
    ctx.clearRect(0,0,off.width,off.height);

    // palette (deep purple -> blue -> teal -> green -> yellow)
    const palette = [
      [40,10,40],
      [24,30,120],
      [20,160,150],
      [60,180,80],
      [255,230,60]
    ];
    function clamp01(v){ return Math.max(0, Math.min(1, v)); }
    function lerp(a,b,t){ return a + (b-a)*t; }
    function mixColor(c1,c2,t){ return [ Math.round(lerp(c1[0],c2[0],t)), Math.round(lerp(c1[1],c2[1],t)), Math.round(lerp(c1[2],c2[2],t)) ]; }
    function paletteMap(t){
      t = clamp01(t);
      const n = palette.length - 1;
      const idx = Math.min(n-1, Math.floor(t * n));
      const local = (t * n) - idx;
      return mixColor(palette[idx], palette[idx+1], local);
    }

    // helper: bilinear sample from Float32Array image
    function sampleBilinearLocal(imgArr, x, y, W, H){
      if(x < 0 || y < 0 || x > W-1 || y > H-1) return 0;
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const x1 = Math.min(W-1, x0+1), y1 = Math.min(H-1, y0+1);
      const dx = x - x0, dy = y - y0;
      const v00 = imgArr[y0*W + x0] || 0;
      const v10 = imgArr[y0*W + x1] || 0;
      const v01 = imgArr[y1*W + x0] || 0;
      const v11 = imgArr[y1*W + x1] || 0;
      const v0 = v00*(1-dx) + v10*dx;
      const v1 = v01*(1-dx) + v11*dx;
      return v0*(1-dy) + v1*dy;
    }

    // hex grid params scaled to off canvas
    const cellR = Math.max(3, Math.round((opts.cellRadius || 6) * (off.width / 1200)));
    const hexH = Math.sqrt(3) * cellR;
    const stepX = 1.5 * cellR;
    const stepY = hexH;

    // precompute mapping from off coords -> source coords
    const sx = srcW / offW, sy = srcH / offH;

    // background fill deep purple
    ctx.fillStyle = `rgb(${palette[0].join(',')})`;
    ctx.fillRect(0,0,off.width, off.height);

    // draw hexes sampling image if requested; otherwise fallback to synthetic band (original behavior)
    if(useImage){
      for(let row=0, y = cellR; y < off.height + cellR; row++, y += stepY){
        const offsetX = (row % 2) ? (stepX/2) : 0;
        for(let x = cellR + offsetX; x < off.width + cellR; x += stepX){
          const srcX = x * sx;
          const srcY = y * sy;
          let v = sampleBilinearLocal(img, srcX, srcY, srcW, srcH);
          // raw image values may be tiny — apply simple contrast/tonemap
          // use a sqrt to increase mid/high visibility and a small offset to keep dark baseline
          v = Math.sqrt(Math.max(0, v));
          // normalize by a heuristic max (allow override)
          const normMax = (opts.normMax || 1.0);
          const mappedColor = paletteMap(v / normMax);
          ctx.fillStyle = `rgb(${mappedColor[0]},${mappedColor[1]},${mappedColor[2]})`;
          const px = Math.round(x), py = Math.round(y);
          ctx.beginPath();
          for(let i=0;i<6;i++){
            const a = Math.PI/6 + i*Math.PI/3;
            const hx = px + (cellR * Math.cos(a));
            const hy = py + (cellR * Math.sin(a));
            if(i===0) ctx.moveTo(hx,hy); else ctx.lineTo(hx,hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `rgba(10,5,10,0.6)`;
          ctx.lineWidth = Math.max(1, Math.round(cellR * 0.12));
          ctx.stroke();
        }
      }
    } else {
      // synthetic band fallback (preserve previous visual style)
      const angleOptions = [-0.7, -0.35, 0.0, 0.35, 0.7];
      const ang = angleOptions[(canvas.id || '').toLowerCase().includes('c2')?2:0] || 0.0;
      const cx = off.width * 0.55, cy = off.height * 0.5;
      const bandWidth = Math.max(70, Math.round(Math.min(off.width, off.height) * 0.035));
      const bandLength = Math.max(off.width*0.6, off.height*0.6);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      function perpDistToLine(x,y){ const dx = x - cx, dy = y - cy; return Math.abs(-sa*dx + ca*dy); }
      function alongCoord(x,y){ const dx = x - cx, dy = y - cy; return dx * ca + dy * sa; }
      function envelopeAlong(s){ const t = (s/(bandLength*0.5)); const at = clamp01(0.5 + 0.5*(1 - Math.abs(t))); return Math.pow(at, 1.4); }
      for(let row=0, y = cellR; y < off.height + cellR; row++, y += stepY){
        const offsetX = (row % 2) ? (stepX/2) : 0;
        for(let x = cellR + offsetX; x < off.width + cellR; x += stepX){
          const pd = perpDistToLine(x,y);
          const along = alongCoord(x,y);
          const gauss = Math.exp(-0.5 * (pd*pd) / (bandWidth*bandWidth));
          const env = envelopeAlong(along);
          const taper = 0.9 + 0.2 * Math.sin(along * 0.001 + (x+y)*0.0003);
          let v = 0.06 + 1.0 * gauss * env * taper;
          v = clamp01(v);
          const mapped = paletteMap((v - 0.06) / (1.0 - 0.06 + 1e-6));
          ctx.fillStyle = `rgb(${mapped[0]},${mapped[1]},${mapped[2]})`;
          const px = Math.round(x), py = Math.round(y);
          ctx.beginPath();
          for(let i=0;i<6;i++){ const a = Math.PI/6 + i*Math.PI/3; const hx = px + (cellR * Math.cos(a)); const hy = py + (cellR * Math.sin(a)); if(i===0) ctx.moveTo(hx,hy); else ctx.lineTo(hx,hy); }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `rgba(20,8,20,0.6)`; ctx.lineWidth = Math.max(1, Math.round(cellR * 0.12)); ctx.stroke();
        }
      }
    }

    // ambient overlays (vignette + top light)
    const vg = ctx.createRadialGradient(off.width*0.5, off.height*0.5, Math.min(off.width,off.height)*0.2, off.width*0.5, off.height*0.5, Math.max(off.width,off.height)*0.8);
    vg.addColorStop(0.0, 'rgba(0,0,0,0.0)'); vg.addColorStop(0.7, 'rgba(0,0,0,0.06)'); vg.addColorStop(1.0, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vg; ctx.fillRect(0,0,off.width, off.height);
    const lg = ctx.createLinearGradient(0, 0, 0, off.height);
    lg.addColorStop(0.0, 'rgba(255,255,255,0.02)'); lg.addColorStop(1.0, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = lg; ctx.fillRect(0,0,off.width, off.height);

    // draw to visible canvas with smoothing
    canvas.width = targetW; canvas.height = targetH;
    canvas.style.width = canvas.clientWidth + 'px';
    canvas.style.height = canvas.clientHeight + 'px';
    const outCtx = canvas.getContext('2d');
    outCtx.clearRect(0,0,canvas.width,canvas.height);
    outCtx.imageSmoothingEnabled = true; outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(off, 0,0, off.width, off.height, 0,0, canvas.width, canvas.height);
  }

})();

(function restoreInMemorySimulator(){
  try{
    // if an override referencing './assets/' is present, delete it
    if(typeof window.simulateStereoImages === 'function'){
      try{
        const s = window.simulateStereoImages.toString();
        if(s.includes('./assets/') || s.includes('assets/')){
          delete window.simulateStereoImages;
          console.log('Removed attached-image loader override. Reload page to restore built-in simulator.');
        }
      }catch(e){
        // ignore
      }
    }
    // ensure the simulator will be created on normal load (no-op here)
    console.log('Using in-memory simulator when page loads (no external assets).');
  }catch(err){
    console.warn('restoreInMemorySimulator error', err);
  }
})();

(function ensureGlobalRunner(){
  if(typeof window.runSimulationAndRender === 'function') return;
  window.runSimulationAndRender = function(energy, primary){
    energy = Number(energy) || 500;
    primary = primary || 'gamma';
    const sim = (typeof simulateStereoImages === 'function') ? simulateStereoImages(energy, primary) : (window.lastImages ? { images: window.lastImages, meta: window.lastSimMeta || {} } : null);
    if(!sim){ console.warn('runSimulationAndRender: no simulator available'); return null; }

    window.lastSimResult = sim;
    window.lastImages = sim.images;
    window.lastSimMeta = sim.meta || {};

    // render thumbnails (prefer hex renderer, fallback to raster)
    const cams = window.CAMERAS || [{id:'C1',canvasId:'cameraC1'},{id:'C2',canvasId:'cameraC2'},{id:'C3',canvasId:'cameraC3'}];
    for(const cam of cams){
      const cv = document.getElementById(cam.canvasId);
      const img = sim.images && sim.images[cam.id];
      if(!cv || !img) continue;
      if(typeof renderHexCamera === 'function'){
        try{ renderHexCamera(img, cv, { srcW: window.CAM_W, srcH: window.CAM_H, normMax: 1.0, cellRadius: 6 }); }
        catch(e){ console.warn('renderHexCamera error', e); if(typeof renderToCanvas === 'function') renderToCanvas(img, cv, null); }
      } else if(typeof renderToCanvas === 'function'){
        renderToCanvas(img, cv, null);
      }
    }

    // run Hillas pipeline and draw overlays
    try{
      if(typeof runHillasPipelineAndDraw === 'function'){
        runHillasPipelineAndDraw({ downsampleFactor: 6, trackMaxDist: 40 });
      } else if(typeof runHillasPipelineAndDraw === 'undefined' && typeof runHillasPipelineAndDraw === 'function'){
        // noop
      } else {
        // fallback: run updateAllHillasAndDraw then drawTrackedEllipses
        if(typeof updateAllHillasAndDraw === 'function') updateAllHillasAndDraw({ downsampleFactor: 6 });
        if(typeof trackHillas === 'function' && typeof drawTrackedEllipses === 'function'){
          const tracked = trackHillas(window.lastHillas || {}, 40);
          drawTrackedEllipses(tracked);
        }
      }
    }catch(e){
      console.warn('Hillas pipeline error', e);
    }

    // update viewer base canvases (quick full-image fallback)
    for(let i=1;i<=3;i++){
      const viewerBase = document.getElementById('viewer'+i+'Base');
      const cam = cams[i-1];
      if(viewerBase && sim.images && sim.images[cam.id]){
        if(typeof renderToCanvas === 'function') renderToCanvas(sim.images[cam.id], viewerBase, null);
        else {
          try{ const ctx = viewerBase.getContext('2d'); ctx.clearRect(0,0,viewerBase.width, viewerBase.height); }catch(e){}
        }
      }
    }

    // update textual summary
    const hbox = document.getElementById('hillasText');
    const camActive = cams[0] && cams[0].id;
    const hv = (window.lastHillas && window.lastHillas[camActive]) ? window.lastHillas[camActive] : null;
    if(hbox) hbox.textContent = hv ? `len=${(hv.length||0).toFixed(1)} width=${(hv.width||0).toFixed(1)}` : 'Nessuna Hillas';

    return sim;
  };
})();

(function(){
  // create stereo canvas if not present
  function ensureStereoCanvas(){
    let panel = document.getElementById('stereoPanel');
    if(!panel){
      // try insert after main camera panel if present
      const anchor = document.getElementById('iact-panel') || document.querySelector('main') || document.body;
      panel = document.createElement('div');
      panel.id = 'stereoPanel';
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      panel.style.alignItems = 'center';
      panel.style.margin = '12px 0';
      const label = document.createElement('div');
      label.textContent = 'Ricostruzione stereoscopica (ellisse ricostruita)';
      label.style.color = '#cfe8ff';
      label.style.marginBottom = '6px';
      panel.appendChild(label);
      const cv = document.createElement('canvas');
      cv.id = 'stereoReconstruction';
      cv.width = 640;
      cv.height = 240;
      cv.style.border = '1px solid rgba(255,255,255,0.06)';
      cv.style.background = '#03060a';
      panel.appendChild(cv);
      if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling);
      else document.body.appendChild(panel);
    }
    return document.getElementById('stereoReconstruction');
  }

  // simple helper to average angles
  function meanAngle(angles, weights){
    let sx=0, sy=0, wsum=0;
    for(let i=0;i<angles.length;i++){ const w = weights ? weights[i] : 1; sx += Math.cos(angles[i]) * w; sy += Math.sin(angles[i]) * w; wsum += w; }
    if(wsum === 0) return 0;
    return Math.atan2(sy/wsum, sx/wsum);
  }

  // build reconstructed ellipse from lastHillas (maps per-camera into a common plane using camera offsets)
  function computeStereoEllipse(){
    const L = window.lastHillas || {};
    const simMeta = (window.lastSimResult && window.lastSimResult.meta) || window.lastSimMeta || {};
    const simImgs = (window.lastSimResult && window.lastSimResult.images) || window.lastImages || {};
    const cams = ['C1','C2','C3'];
    const camOffsets = { C1:{ox:-12,oy:-8}, C2:{ox:0,oy:0}, C3:{ox:12,oy:8} };
    const items = [];

    for(const c of cams){
      let h = L[c];
      // accept alternative keys or objects
      if(!h){
        for(const k in L){ if(L[k] && (L[k].camId === c || k === c)){ h = L[k]; break; } }
      }
      // fallback to simulation meta if available
      if(!h && simMeta && simMeta[c] && simMeta[c].length){
        const top = simMeta[c][0];
        h = { xc: top.xc || (CAM_W/2), yc: top.yc || (CAM_H/2), length: 60, width: 18, angle: 0, W: top.amp || 0, pixelsUsed: 10 };
      }

      // aggressive fallback: use brightest pixel + local moment estimate
      if(!h){
        const img = simImgs[c];
        if(img && img.length === CAM_W * CAM_H){
          let maxv = -Infinity, mi = 0;
          for(let i=0;i<img.length;i++){ const v = img[i] || 0; if(v > maxv){ maxv = v; mi = i; } }
          if(maxv > 0){
            const xc = mi % CAM_W, yc = Math.floor(mi / CAM_W);
            // local box for moment estimation
            const R = 10;
            let Wsum = 0, Wx = 0, Wy = 0, Sxx = 0, Syy = 0, Sxy = 0;
            const x0 = Math.max(0, xc - R), x1 = Math.min(CAM_W-1, xc + R);
            const y0 = Math.max(0, yc - R), y1 = Math.min(CAM_H-1, yc + R);
            for(let yy=y0; yy<=y1; yy++){
              for(let xx=x0; xx<=x1; xx++){
                const v = Math.max(0, img[yy*CAM_W + xx] - 0.001); // subtract tiny floor
                if(v <= 0) continue;
                Wsum += v; Wx += v * xx; Wy += v * yy;
              }
            }
            if(Wsum > 0){
              const mcx = Wx / Wsum, mcy = Wy / Wsum;
              for(let yy=y0; yy<=y1; yy++){
                for(let xx=x0; xx<=x1; xx++){
                  const v = Math.max(0, img[yy*CAM_W + xx] - 0.001);
                  if(v <= 0) continue;
                  const dx = xx - mcx, dy = yy - mcy;
                  Sxx += v * dx * dx; Syy += v * dy * dy; Sxy += v * dx * dy;
                }
              }
              Sxx /= Wsum; Syy /= Wsum; Sxy /= Wsum;
              // derive ellipse params from covariance
              const tr = Sxx + Syy;
              const disc = Math.max(0, (Sxx - Syy)*(Sxx - Syy)/4 + Sxy*Sxy);
              const l1 = tr/2 + Math.sqrt(disc), l2 = tr/2 - Math.sqrt(disc);
              const a = Math.sqrt(Math.max(1e-9, l1)), b = Math.sqrt(Math.max(1e-9, l2));
              const angle = 0.5 * Math.atan2(2*Sxy, Sxx - Syy);
              const length = Math.max(6, a * 2 * 1.6); // scale to be visible
              const width  = Math.max(4, b * 2 * 1.6);
              h = { xc: mcx, yc: mcy, length, width, angle, W: Wsum, pixelsUsed: Math.round(Wsum) };
            } else {
              // fallback simple point if local moments fail
              h = { xc: xc, yc: yc, length: 40, width: 14, angle: 0, W: maxv, pixelsUsed: 1 };
            }
          }
        }
      }

      if(!h) continue;

      const ox = (camOffsets[c] && camOffsets[c].ox) || 0;
      const oy = (camOffsets[c] && camOffsets[c].oy) || 0;
      items.push({
        cam: c,
        xc: (h.xc || 0) - ox,
        yc: (h.yc || 0) - oy,
        length: (h.length || 40),
        width: (h.width || 12),
        angle: (h.angle || 0),
        W: (h.W || 0),
        pixels: (h.pixelsUsed || (h.pixels || 0))
      });
    }

    if(items.length === 0) return null;

    // weights prefer pixelsUsed then amplitude W
    const weights = items.map(it => (it.pixels || 0) + 0.001*(it.W||0) );
    const wsum = weights.reduce((s,x)=>s+x,0) || items.length;
    const xc = items.reduce((s,it,i)=> s + it.xc * weights[i], 0) / wsum;
    const yc = items.reduce((s,it,i)=> s + it.yc * weights[i], 0) / wsum;
    const length = Math.max(1, items.reduce((s,it,i)=> s + (it.length||1)*weights[i],0)/wsum);
    const width  = Math.max(1, items.reduce((s,it,i)=> s + (it.width||1)*weights[i],0)/wsum);
    const angle = meanAngle(items.map(it=>it.angle || 0), weights);
    return { xc, yc, length, width, angle, items, weights };
  }

  // render stereo reconstruction canvas
  function renderStereoReconstruction(){
    const cv = ensureStereoCanvas();
    const ctx = cv.getContext('2d');
    ctx.clearRect(0,0,cv.width, cv.height);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0,0,cv.width, cv.height);
    const sim = window.lastSimResult || {};
    if(!sim || !window.lastHillas) {
      ctx.fillStyle = '#9fb8d6';
      ctx.font = '14px sans-serif';
      ctx.fillText('Nessuna ricostruzione disponibile — esegui runSimulationAndRender(...)', 10, 20);
      return;
    }
    const rec = computeStereoEllipse();
    if(!rec){
      ctx.fillStyle = '#9fb8d6';
      ctx.font = '14px sans-serif';
      ctx.fillText('Hillas non disponibili per tutte le camere.', 10, 20);
      return;
    }

    // define a mapping from common high-res coords to canvas pixel space
    const padding = 24;
    // compute bounding box from items centers and ellipse sizes to scale appropriately
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for(const it of rec.items){
      minx = Math.min(minx, it.xc - it.length*0.6, it.xc - it.width*0.6);
      maxx = Math.max(maxx, it.xc + it.length*0.6, it.xc + it.width*0.6);
      miny = Math.min(miny, it.yc - it.length*0.6, it.yc - it.width*0.6);
      maxy = Math.max(maxy, it.yc + it.length*0.6, it.yc + it.width*0.6);
    }
    // include reconstructed ellipse extents
    minx = Math.min(minx, rec.xc - rec.length*0.6);
    maxx = Math.max(maxx, rec.xc + rec.length*0.6);
    miny = Math.min(miny, rec.yc - rec.length*0.6);
    maxy = Math.max(maxy, rec.yc + rec.length*0.6);
    if(!isFinite(minx) || !isFinite(miny) || !isFinite(maxx) || !isFinite(maxy)){
      minx = rec.xc - 100; miny = rec.yc - 50; maxx = rec.xc + 100; maxy = rec.yc + 50;
    }
    const availW = Math.max(32, cv.width - padding*2), availH = Math.max(32, cv.height - padding*2);
    const spanW = Math.max(1, maxx - minx), spanH = Math.max(1, maxy - miny);
    const scale = Math.min(availW / spanW, availH / spanH);
    const offsetX = padding - minx * scale + (availW - spanW * scale)/2;
    const offsetY = padding - miny * scale + (availH - spanH * scale)/2;

    // helper draw ellipse in common coords
    function drawEllipse(ctx, obj, style){
      ctx.save();
      ctx.translate(obj.xc * scale + offsetX, obj.yc * scale + offsetY);
      ctx.rotate(obj.angle || 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(2, (obj.length||10)*0.5 * scale), Math.max(2, (obj.width||6)*0.5 * scale), 0, 0, Math.PI*2);
      if(style.fill){ ctx.fillStyle = style.fill; ctx.fill(); }
      if(style.stroke){ ctx.lineWidth = style.lineWidth || 2; ctx.strokeStyle = style.stroke; ctx.stroke(); }
      ctx.restore();
    }

    // draw individual camera projections (semi-transparent)
    const camColors = { C1: 'rgba(255,100,100,0.25)', C2: 'rgba(100,255,120,0.25)', C3: 'rgba(100,160,255,0.25)' };
    for(const it of rec.items){
      // safe stroke color (fix syntax error from inline replace)
      const fillCol = camColors[it.cam] || 'rgba(200,200,200,0.18)';
      const strokeCol = (camColors[it.cam] || '#888').replace(/,0\.25\)/,',0.9)');
      drawEllipse(ctx, it, { fill: fillCol, stroke: strokeCol, lineWidth: 1.2 });
      // small center dot
      ctx.fillStyle = (camColors[it.cam] || '#fff').replace(/,0\.25\)/,',1.0)');
      const cx = it.xc*scale + offsetX, cy = it.yc*scale + offsetY;
      ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#9fb8d6';
      ctx.font = '11px sans-serif';
      ctx.fillText(it.cam, cx + 6, cy + 4);
    }

    // draw reconstructed ellipse (prominent)
    // gradient stroke
    const centerX = rec.xc*scale + offsetX, centerY = rec.yc*scale + offsetY;
    const a_px = Math.max(4, (rec.length*0.5) * scale), b_px = Math.max(3, (rec.width*0.5) * scale);
    const ang = rec.angle || 0;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(ang);
    // fill radial
    const rg = ctx.createRadialGradient(0,0,0,0,0, Math.max(a_px,b_px));
    rg.addColorStop(0, 'rgba(255,250,180,0.35)');
    rg.addColorStop(0.6, 'rgba(140,220,120,0.10)');
    rg.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.ellipse(0,0,a_px,b_px,0,0,Math.PI*2); ctx.fill();
    // stroke
    const grad = ctx.createLinearGradient(-a_px,0,a_px,0);
    grad.addColorStop(0, '#7fe67f'); grad.addColorStop(0.6, '#e6f36b'); grad.addColorStop(1, '#ffd54f');
    ctx.lineWidth = Math.max(2, 3);
    ctx.strokeStyle = grad;
    ctx.beginPath(); ctx.ellipse(0,0,a_px,b_px,0,0,Math.PI*2); ctx.stroke();
    // center marker
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
    ctx.restore();

    // legend
    ctx.fillStyle = '#9fb8d6'; ctx.font = '12px sans-serif';
    ctx.fillText('Proiezioni C1/C2/C3 (trasparente) — ricostruzione (verde→giallo)', 10, cv.height - 10);
  }

  // attempt to wrap existing runner so reconstruction is drawn automatically
  function wrapRunner(){
    if(typeof window.runSimulationAndRender !== 'function') return;
    if(window.__stereo_wrapped) return;
    const orig = window.runSimulationAndRender;
    window.runSimulationAndRender = function(energy, primary){
      const res = orig(energy, primary);
      try{ renderStereoReconstruction(); }catch(e){ console.warn('stereo render error', e); }
      return res;
    };
    window.__stereo_wrapped = true;
  }

  // ensure canvas and wrapper on load
  window.addEventListener('load', ()=>{
    ensureStereoCanvas();
    wrapRunner();
    // also draw if there's already a simulation
    setTimeout(()=>{ try{ renderStereoReconstruction(); }catch(e){} }, 300);
  });

  // expose functions for manual use
  window.renderStereoReconstruction = renderStereoReconstruction;
  window.computeStereoEllipse = computeStereoEllipse;
})();
