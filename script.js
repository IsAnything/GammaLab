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
  for(const cam of CAMERAS){
    try{
      const img = window.lastImages && window.lastImages[cam.id];
      if(!img){ delete window.lastHillas[cam.id]; continue; }
      const h = computeHillasRobust(img, CAM_W, CAM_H, opts);
      if(!h){ delete window.lastHillas[cam.id]; continue; }
      if(typeof toGlobal === 'function'){ const g = toGlobal({xc:h.xc, yc:h.yc, angle:h.angle}, cam); h.xc_global = g.x; h.yc_global = g.y; h.angle_global = g.angle || h.angle; } else { h.xc_global = h.xc; h.yc_global = h.yc; h.angle_global = h.angle; }
      h.camId = cam.id; window.lastHillas[cam.id] = h;
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

  const CAM_W = 320, CAM_H = 240;
  window.CAM_W = window.CAM_W || CAM_W;
  window.CAM_H = window.CAM_H || CAM_H;

  const CAMERAS = window.CAMERAS || [
    { id: 'C1', canvasId: 'cameraC1' },
    { id: 'C2', canvasId: 'cameraC2' },
    { id: 'C3', canvasId: 'cameraC3' }
  ];
  window.CAMERAS = CAMERAS;

  function heatColor(t){
    const v = Math.max(0, Math.min(1, t));
    return [Math.round(255*Math.pow(v,0.6)), Math.round(200*Math.pow(v,0.9)), Math.round(255*(1-v))];
  }
  // expose palette for other modules (hex renderer)
  window.heatColor = heatColor;

  // Create an image filled with multiple random elliptical "tracks" plus diffuse noise.
  function simulateIactImageMultiTracks(energy, primary='gamma', trackDefs=[]){
    const scaleBase = Math.log10(Math.max(energy,50));
    const img = new Float32Array(CAM_W*CAM_H);
    // background noise
    for(let i=0;i<img.length;i++) img[i] = 0.02 + Math.random()*0.02;
    // add several tracks (user-specified or randomly generated)
    const nTracks = trackDefs.length || (1 + Math.floor(Math.random()*3));
    for(let t=0;t<nTracks;t++){
      const td = trackDefs[t] || {};
      const cx = (typeof td.cx === 'number') ? td.cx : (CAM_W*0.2 + Math.random()*CAM_W*0.6);
      const cy = (typeof td.cy === 'number') ? td.cy : (CAM_H*0.2 + Math.random()*CAM_H*0.6);
      const len = (typeof td.len === 'number') ? td.len : (20 + scaleBase*5 + Math.random()*20);
      const wid = (typeof td.wid === 'number') ? td.wid : Math.max(2, 3 + (primary==='proton'? 3:0) + Math.random()*2);
      const theta = (typeof td.theta === 'number') ? td.theta : (Math.random()*Math.PI);
      const amp = (typeof td.amp === 'number') ? td.amp : (0.6 + Math.random()*1.2) * Math.log10(Math.max(energy,50))/2;
      for(let y=0;y<CAM_H;y++){
        for(let x=0;x<CAM_W;x++){
          const dx = x-cx, dy = y-cy;
          const xr = dx*Math.cos(theta) + dy*Math.sin(theta);
          const yr = -dx*Math.sin(theta) + dy*Math.cos(theta);
          const val = amp * Math.exp(-0.5*((xr*xr)/(len*len) + (yr*yr)/(wid*wid)));
          img[y*CAM_W + x] += val;
        }
      }
      // small bright clumps for protons
      if(primary==='proton' && Math.random()<0.4){
        const clx = cx + (randNormal()*len*0.4), cly = cy + (randNormal()*wid*0.4);
        for(let y=Math.max(0|0,cly-10); y<Math.min(CAM_H, cly+10); y++){
          for(let x=Math.max(0|0,clx-10); x<Math.min(CAM_W, clx+10); x++){
            const d2 = (x-clx)*(x-clx)+(y-cly)*(y-cly);
            img[y*CAM_W + x] += 0.8 * Math.exp(-d2/(2*9));
          }
        }
      }
    }
    // final noise & floor
    for(let i=0;i<img.length;i++) img[i] = Math.max(0, img[i] + (Math.random()-0.5)*0.02);
    return img;
  }

  // simulate stereo event: return images and metadata (track centers approximations)
  function simulateStereoImages(energy, primary){
    // create common set of track defs (so tracks are present in all cameras with small parallax)
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
    // parallax offsets per camera
    const cams = { C1:{ox:-10,oy:-6}, C2:{ox:0,oy:0}, C3:{ox:10,oy:6} };
    const images = {};
    const meta = {};
    for(const camId of ['C1','C2','C3']){
      const defs = baseTracks.map(t=>({
        cx: clamp(t.cx + (cams[camId].ox + randNormal()*2), 5, CAM_W-5),
        cy: clamp(t.cy + (cams[camId].oy + randNormal()*2), 5, CAM_H-5),
        len: t.len*(1 + (Math.random()-0.5)*0.15),
        wid: t.wid*(1 + (Math.random()-0.5)*0.15),
        theta: t.theta + (Math.random()-0.5)*0.08,
        amp: t.amp*(1 + (Math.random()-0.5)*0.2)
      }));
      images[camId] = simulateIactImageMultiTracks(energy, primary, defs);
      meta[camId] = defs.map(d=>({xc:d.cx, yc:d.cy, amp:d.amp}));
    }
    return { images, meta };
  }
  // ensure enhanced simulator is active
  window.simulateStereoImages = simulateStereoImages;

  // render full or cropped region of Float32Array image to canvas
  function renderToCanvas(img, canvas, srcRect){
    if(!canvas || !img) return;
    const targetW = Math.max(160, Math.floor(canvas.clientWidth || 320));
    const targetH = Math.max(120, Math.floor(canvas.clientHeight || 240));
    const off = document.createElement('canvas');
    off.width = CAM_W; off.height = CAM_H;
    const octx = off.getContext('2d');
    const im = octx.createImageData(CAM_W, CAM_H);
    let maxv = 1e-9; for(let i=0;i<img.length;i++) if(img[i]>maxv) maxv=img[i];
    for(let y=0;y<CAM_H;y++){
      for(let x=0;x<CAM_W;x++){
        const v = Math.max(0, Math.min(1, img[y*CAM_W + x]/maxv));
        const idx = (y*CAM_W + x)*4;
        const c = heatColor(v);
        im.data[idx] = c[0]; im.data[idx+1] = c[1]; im.data[idx+2] = c[2]; im.data[idx+3] = 255;
      }
    }
    octx.putImageData(im, 0, 0);
    canvas.width = targetW; canvas.height = targetH;
    canvas.style.width = canvas.clientWidth + 'px';
    canvas.style.height = canvas.clientHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!srcRect){
      ctx.drawImage(off, 0,0, CAM_W, CAM_H, 0,0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(off, srcRect.x, srcRect.y, srcRect.w, srcRect.h, 0,0, canvas.width, canvas.height);
    }
  }

  // draw hillas ellipses mapped to a viewer crop
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
    for(const h of hillasList){
      if(!h) continue;
      ctx.lineWidth = Math.max(1/ s, 1);
      ctx.strokeStyle = (h.isPrimary ? '#0f0' : '#ff0');
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      const a = h.length || (h.major || 20), b = h.width || (h.minor || 6);
      const ang = (h.angle||0);
      ctx.ellipse(h.xc, h.yc, Math.max(1,a), Math.max(1,b), ang, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(h.xc-0.8, h.yc-0.8, 1.6, 1.6);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      const L = Math.max(4, a*1.2);
      const x1 = h.xc - Math.cos(ang)*L, y1 = h.yc - Math.sin(ang)*L;
      const x2 = h.xc + Math.cos(ang)*L, y2 = h.yc + Math.sin(ang)*L;
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }
    ctx.restore();
  }
  // expose drawHillasOnViewer so global callers can use it
  window.drawHillasOnViewer = drawHillasOnViewer;

  // run sim, render thumbnails and viewer crops; then compute hillas & overlay precisely
  function runSimulationAndRender(energy, primary){
    const sim = simulateStereoImages(energy, primary);
    window.lastSimResult = sim;
    window.lastImages = sim.images;
    window.lastSimMeta = sim.meta || {};
    // draw camera thumbnails (full field) — skip if wrapper requested hex thumbnails
    if(window.__renderThumbnails !== false){
      for(const cam of CAMERAS){
        const cv = document.getElementById(cam.canvasId);
        if(cv && sim.images[cam.id]) renderToCanvas(sim.images[cam.id], cv, null);
      }
    }
    // run hillas pipeline to compute lastHillas (use existing function if present)
    try{
      if(typeof runHillasPipelineAndDraw === 'function'){
        runHillasPipelineAndDraw({ blurSigma:0.8, threshK:1.2, minArea:6, trackMaxDist:40, skipDraw:true });
      } else if(typeof updateAllHillasAndDraw === 'function'){
        updateAllHillasAndDraw({ blurSigma:0.8, threshK:1.2, minArea:6, trackMaxDist:40, skipDraw:true });
      } else {
        window.lastHillas = {};
        if(typeof computeHillasRobust === 'function'){
          for(const cam of CAMERAS){
            const img = sim.images[cam.id];
            const h = computeHillasRobust(img, CAM_W, CAM_H, {blurSigma:0.8, threshK:1.2, minArea:6});
            window.lastHillas[cam.id] = h;
          }
        }
      }
    }catch(e){ console.warn('pipeline run error', e); }

    // reset saved srcRects
    window.__lastViewerSrcRects = [];

    // For each viewer, choose a crop center: prefer first (brightest) meta track or hillas centroid
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
      // save rect for overlay mapping
      window.__lastViewerSrcRects.push(srcRect);
      if(viewerBase) renderToCanvas(img, viewerBase, srcRect);
      const allHillas = [];
      if(window.lastHillas){
        if(window.lastHillas[camId]) allHillas.push(window.lastHillas[camId]);
        else if(Array.isArray(window.lastHillas[camId])) allHillas.push(...window.lastHillas[camId]);
        else {
          for(const k in window.lastHillas){ if(window.lastHillas[k] && window.lastHillas[k].camId===camId) allHillas.push(window.lastHillas[k]); }
        }
      }
      drawHillasOnViewer(allHillas, viewerOverlay, srcRect);
    }

    const hbox = document.getElementById('hillasText');
    const camActive = CAMERAS[0].id;
    const hv = (window.lastHillas && window.lastHillas[camActive]) ? window.lastHillas[camActive] : null;
    if(hbox) hbox.textContent = hv ? `len=${(hv.length||hv.major||0).toFixed(1)} width=${(hv.width||hv.minor||0).toFixed(1)} ratio=${((hv.length||hv.major||1)/(hv.width||hv.minor||1)).toFixed(2)}` : 'Nessuna Hillas';
  }

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

  // initial auto-run once DOM loaded
  window.addEventListener('load', ()=>{ setTimeout(()=>{ runSimulationAndRender(Number(document.getElementById('iactEnergy')?.value)||500, document.getElementById('iactPrim')?.value||'gamma'); }, 120); }, {once:true});

  // expose helper for manual testing
  window.runSimulationAndRender = runSimulationAndRender;
  window.generateMission = generateMission;
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

  // render image as hexagonal sensor thumbnail
  function renderHexCamera(img, canvas, opts){
    // Improved hex-renderer producing a high-resolution vector-like honeycomb
    // with a diagonal gradient band, subtle vignette and ambient shading.
    // - If opts.highRes is true (default), create an offscreen 3000x2000 image
    //   and then downscale for the thumbnail to ensure a smooth gradient.
    opts = opts || {};
    const Wcam = window.CAM_W || 320;
    const Hcam = window.CAM_H || 240;

    // target offscreen high-res size (use provided or default 3000x2000)
    const highW = Number(opts.width) || 3000;
    const highH = Number(opts.height) || 2000;
    const useHigh = (opts.highRes !== false);

    // choose downsample target (canvas client size)
    const targetW = Math.max(160, Math.floor(canvas.clientWidth || 320));
    const targetH = Math.max(120, Math.floor(canvas.clientHeight || 240));

    // offscreen reference canvas
    const off = document.createElement('canvas');
    off.width = useHigh ? highW : Math.max(targetW, highW/4);
    off.height = useHigh ? highH : Math.max(targetH, highH/4);
    const ctx = off.getContext('2d');
    ctx.clearRect(0,0,off.width, off.height);

    // helpers
    function lerp(a,b,t){ return a + (b-a)*t; }
    function clamp01(v){ return Math.max(0, Math.min(1, v)); }
    function mixColor(c1, c2, t){ return [ Math.round(lerp(c1[0],c2[0],t)), Math.round(lerp(c1[1],c2[1],t)), Math.round(lerp(c1[2],c2[2],t)) ]; }
    // palette: deep purple -> deep blue -> teal -> green -> bright yellow
    const palette = [
      [48,  12,  48],   // deep purple (background)
      [24,  30, 120],   // deep blue
      [20, 160, 150],   // teal
      [60, 180, 80],    // green
      [255, 230, 60]    // yellow (peak)
    ];
    function paletteMap(t){
      t = clamp01(t);
      const n = palette.length-1;
      const idx = Math.min(n-1, Math.floor(t*n));
      const localT = (t * n) - idx;
      return mixColor(palette[idx], palette[idx+1], localT);
    }

    // band geometry: choose orientation/position per canvas to vary three cameras
    // try to vary depending on canvas id if available
    let orientationChoice = 0; // 0..4 -> angles
    if(canvas && canvas.id){
      if(canvas.id.toLowerCase().includes('c1')) orientationChoice = 1;
      else if(canvas.id.toLowerCase().includes('c2')) orientationChoice = 2;
      else if(canvas.id.toLowerCase().includes('c3')) orientationChoice = 3;
    } else {
      orientationChoice = Math.floor(Math.random()*4);
    }
    const angleOptions = [-0.7, -0.35, 0.0, 0.35, 0.7]; // radians (-40deg..+40deg)
    const ang = angleOptions[orientationChoice % angleOptions.length];
    const cx = off.width * (0.55 + (orientationChoice-2)*0.05); // band center shift
    const cy = off.height * 0.5;

    // band parameters
    const bandWidth = Math.max(70, Math.round(Math.min(off.width, off.height) * 0.035)); // effective sigma perpendicular
    const bandLength = Math.max(off.width*0.6, off.height*0.6);
    const peak = 1.0;
    const backgroundLevel = 0.06; // deep purple baseline

    // small ambient noise to avoid band pixelization
    const noiseAmp = 0.01;

    // hex grid parameters (in offscreen px)
    const cellR = Math.max(3, Math.round((opts.cellRadius || 6) * (off.width / 1200))); // scale radius with off width
    const hexH = Math.sqrt(3) * cellR;
    const stepX = 1.5 * cellR;
    const stepY = hexH;

    // Precompute cosine/sine for band axis
    const ca = Math.cos(ang), sa = Math.sin(ang);

    // helper: distance of point (x,y) to infinite line passing through (cx,cy) with angle ang
    function perpDistToLine(x,y){
      // vector from center to point
      const dx = x - cx, dy = y - cy;
      // perpendicular distance = |(-sin)*dx + cos*dy| for line direction (ca, sa)
      return Math.abs(-sa*dx + ca*dy);
    }
    // helper: coordinate along line (signed)
    function alongCoord(x,y){
      const dx = x - cx, dy = y - cy;
      return dx * ca + dy * sa;
    }

    // compute normalization factor for color mapping
    // We'll compute each hex cell value as: background + peak * gauss(perpDist/bandWidth) * envelope(along)
    // where envelope(along) is a smooth window to limit band length.
    function envelopeAlong(s){
      const t = (s/(bandLength*0.5));
      // smooth falloff using raised-cosine
      const at = clamp01(0.5 + 0.5*(1 - Math.abs(t)));
      return Math.pow(at, 1.4);
    }

    // background fill (deep purple)
    ctx.fillStyle = `rgb(${palette[0].join(',')})`;
    ctx.fillRect(0,0,off.width, off.height);

    // iterate hex centers and draw cells
    // limit rows/cols to canvas extents for performance
    for(let row=0, y = cellR; y < off.height + cellR; row++, y += stepY){
      const offsetX = (row % 2) ? (stepX/2) : 0;
      for(let x = cellR + offsetX; x < off.width + cellR; x += stepX){
        // compute band-based intensity
        const pd = perpDistToLine(x,y);
        const along = alongCoord(x,y);
        const gauss = Math.exp(-0.5 * (pd*pd) / (bandWidth*bandWidth));
        const env = envelopeAlong(along);
        // small taper to make band asymmetric sometimes (adds realism)
        const taper = 0.9 + 0.2 * Math.sin(along * 0.001 + (x+y)*0.0003);
        let v = backgroundLevel + peak * gauss * env * taper;
        // add small noise
        v += (Math.random()-0.5) * noiseAmp;
        v = clamp01(v);

        // map v to palette but compress dynamic range so center peaks map to bright yellow
        // remap: low [0..0.2] -> background purples, mid -> blues/teal, high -> yellow
        const mapped = paletteMap((v - backgroundLevel) / (peak - backgroundLevel + 1e-6));

        ctx.fillStyle = `rgb(${mapped[0]},${mapped[1]},${mapped[2]})`;
        // slight subtle shading: darken cells near edges (ambient)
        const light = 0.94 + 0.06 * Math.cos((x*13 + y*7) * 0.0007);
        // convert fill color by multiplying
        // parse rgb
        // draw hex at canvas pos
        const px = Math.round(x);
        const py = Math.round(y);

        // draw filled hexagon
        ctx.beginPath();
        for(let i=0;i<6;i++){
          const a = Math.PI/6 + i*Math.PI/3;
          const hx = px + (cellR * Math.cos(a));
          const hy = py + (cellR * Math.sin(a));
          if(i===0) ctx.moveTo(hx,hy); else ctx.lineTo(hx,hy);
        }
        ctx.closePath();
        // apply lightening by globalComposite / alpha trick: use globalAlpha to simulate subtle shading
        ctx.save();
        ctx.globalAlpha = 1.0;
        // fill
        ctx.fill();
        ctx.restore();

        // thin border slightly darker than fill
        const strokeAlpha = 0.6;
        ctx.strokeStyle = `rgba(20,8,20,${strokeAlpha})`;
        ctx.lineWidth = Math.max(1, Math.round(cellR * 0.12));
        ctx.stroke();
      }
    }

    // soft vignette overlay to lift center band
    const vg = ctx.createRadialGradient(off.width*0.5, off.height*0.5, Math.min(off.width,off.height)*0.2, off.width*0.5, off.height*0.5, Math.max(off.width,off.height)*0.8);
    vg.addColorStop(0.0, 'rgba(0,0,0,0.0)');
    vg.addColorStop(0.7, 'rgba(0,0,0,0.06)');
    vg.addColorStop(1.0, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,off.width, off.height);

    // subtle ambient top-light (soft gradient)
    const lg = ctx.createLinearGradient(0, 0, 0, off.height);
    lg.addColorStop(0.0, 'rgba(255,255,255,0.02)');
    lg.addColorStop(1.0, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = lg;
    ctx.fillRect(0,0,off.width, off.height);

    // finally scale down to the visible canvas
    canvas.width = targetW; canvas.height = targetH;
    canvas.style.width = canvas.clientWidth + 'px';
    canvas.style.height = canvas.clientHeight + 'px';
    const outCtx = canvas.getContext('2d');
    outCtx.clearRect(0,0,canvas.width, canvas.height);
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(off, 0,0, off.width, off.height, 0,0, canvas.width, canvas.height);
  }

  // wrap runSimulationAndRender to render hex thumbnails first (if runner exists)
  const originalRun = window.runSimulationAndRender;
  if (typeof originalRun === 'function') {
    window.runSimulationAndRender = function (energy, primary) {
      // generate simulation and render hex thumbnails first
      const sim = (typeof simulateStereoImages === 'function') ? simulateStereoImages(energy, primary) : (window.lastImages ? { images: window.lastImages } : { images: {} });
      const cams = window.CAMERAS || [{ id: 'C1', canvasId: 'cameraC1' }, { id: 'C2', canvasId: 'cameraC2' }, { id: 'C3', canvasId: 'cameraC3' }];
      for (const cam of cams) {
        const cv = document.getElementById(cam.canvasId);
        const img = sim.images && sim.images[cam.id];
        if (cv && img) {
          try { renderHexCamera(img, cv, { cellRadius: 6 + Math.floor(Math.random() * 2), highRes: true }); } catch (e) { console.warn('renderHexCamera initial error', e); }
        }
      }
      // prevent original run from re-drawing thumbnails
      const prevFlag = window.__renderThumbnails;
      window.__renderThumbnails = false;
      try {
        originalRun.call(this, energy, primary);
      } catch (e) {
        console.error('runSimulationAndRender (wrapped) error', e);
      } finally {
        // restore flag and re-apply hex thumbnails to ensure they are visible
        window.__renderThumbnails = prevFlag;
        // redraw hex thumbnails after original run to guarantee they are not overwritten
        try {
          const simAfter = window.lastImages ? { images: window.lastImages } : sim;
          for (const cam of cams) {
            const cv = document.getElementById(cam.canvasId);
            const img = simAfter.images && simAfter.images[cam.id];
            if (cv && img) {
              try { renderHexCamera(img, cv, { cellRadius: 6 + Math.floor(Math.random() * 2), highRes: true }); } catch (err) { console.warn('renderHexCamera final error', err); }
            }
          }
        } catch (err) { console.warn('reapply hex thumbnails failed', err); }
      }
    };
  } else {
    window.renderHexCamera = renderHexCamera;
  }

})();
