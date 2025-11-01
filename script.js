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
  const viewers = ['viewer1Overlay','viewer2Overlay','viewer3Overlay'];
  viewers.forEach((id, i)=>{
    const cv = document.getElementById(id); if(!cv) return;
    cv.width = cv.clientWidth; cv.height = cv.clientHeight;
    const ctx = cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
    const st = (window.viewerState && window.viewerState[i]) ? window.viewerState[i] : {scale:1, ox:0, oy:0};
    function imgToView(ix,iy){ return { x: st.ox + ix*st.scale, y: st.oy + iy*st.scale }; }
    const cam = (window.CAMERAS && window.CAMERAS[i]) ? window.CAMERAS[i] : null; if(!cam) return;
    const trackedList = Object.values(trackedMap || {});
    const match = trackedList.find(o => o && o.camId === cam.id) || trackedList.find(o => o && o.camId==cam.id);
    const h = match || (window.lastHillas && window.lastHillas[cam.id]); if(!h) return;
    const vp = imgToView(h.xc, h.yc);
    ctx.save(); ctx.translate(vp.x, vp.y); ctx.rotate(h.angle || 0);
    ctx.strokeStyle = 'rgba(0,200,255,0.95)'; ctx.lineWidth = 2;
    const rx = (h.length || 20) * 0.5 * (st.scale||1); const ry = (h.width || 8) * 0.5 * (st.scale||1);
    ctx.beginPath(); ctx.ellipse(0,0, rx, ry, 0, 0, 2*Math.PI); ctx.stroke(); ctx.restore();
    ctx.fillStyle='rgba(255,0,0,0.9)'; ctx.beginPath(); ctx.arc(vp.x, vp.y, 4,0,2*Math.PI); ctx.fill();
    if(h.id){ ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='12px sans-serif'; ctx.fillText(h.id, vp.x + 6, vp.y - 6); }
    if(Array.isArray(h.centerline)){ ctx.strokeStyle='rgba(255,200,80,0.95)'; ctx.lineWidth=2; ctx.beginPath(); for(let k=0;k<h.centerline.length;k++){ const p = h.centerline[k]; const v = imgToView(p.x, p.y); if(k===0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y); } ctx.stroke(); }
  });
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

// --- (opzionale) auto-test dopo load: decommenta se vuoi eseguire una prova automatica
// window.addEventListener('load', ()=>{ setTimeout(()=>{ try{ if(typeof simulateStereoImages==='function'){ const sim = simulateStereoImages(500,'gamma'); window.lastSimResult = sim; window.lastImages = sim.images; console.log('simulateStereoImages -> lastImages keys', Object.keys(window.lastImages||{})); } else { console.log('simulateStereoImages not available'); } runHillasPipelineAndDraw({blurSigma:0.8, threshK:1.2, minArea:6, trackMaxDist:40}); }catch(e){ console.error('auto-test failed', e); } }, 200); }, {once:true});