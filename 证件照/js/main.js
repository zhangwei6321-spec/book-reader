(function() {
'use strict';

// ── DOM ──
let previewCanvas, previewCtx, overlayCanvas, overlayCtx;
let canvasWrapper, placeholder, controlsEl, toastEl;

function initDOM() {
  previewCanvas = document.getElementById('previewCanvas');
  overlayCanvas = document.getElementById('overlayCanvas');
  canvasWrapper = document.getElementById('canvasWrapper');
  placeholder = document.getElementById('placeholder');
  controlsEl = document.getElementById('controls');
  toastEl = document.getElementById('toast');
  if (previewCanvas) previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
  if (overlayCanvas) overlayCtx = overlayCanvas.getContext('2d');
  return !!canvasWrapper;
}

// ── State ──
const S = {
  image: null,
  bgColor: '#ffffff',
  photoSize: { label: '一寸 (25×35)', wMm: 25, hMm: 35, wPx: 295, hPx: 413 },
  brightness: 0, contrast: 0, saturation: 0,
  scale: 1, offsetX: 0, offsetY: 0,
  isDragging: false, dsX: 0, dsY: 0, dsOX: 0, dsOY: 0,
  _isTouch: false, _to: null,
  _crop: null, _lcw: 0, _lch: 0,
};

// ── Helpers ──
function hexToRgb(h) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [255,255,255];
}
const clamp = v => Math.max(0, Math.min(255, Math.round(v)));

// ── Toast ──
let toastTimer;
function showToast(msg) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function setStatus(t, c) {
  const el = document.getElementById('statusLabel');
  if (el) { el.textContent = t; el.style.color = c || '#10b981'; }
}
function showLoading(t) {
  const el = document.getElementById('loadingOverlay');
  const tl = document.getElementById('loadingText');
  if (el) el.style.display = 'flex';
  if (tl) tl.textContent = t || 'AI抠图中...';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

// ── Image Loading ──
async function handleFile(file) {
  if (!file) return;
  const isImg = file.type && file.type.startsWith('image/');
  if (!isImg) {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','webp','bmp','heic','heif'].indexOf(ext) === -1)
      return showToast('请选择图片文件');
  }

  S.image = null; S._crop = null;
  if (placeholder) placeholder.style.display = 'none';
  if (controlsEl) controlsEl.style.display = '';
  setStatus('加载中...', '#f59e0b');
  showLoading('下载AI模型中...');

  try {
    // Wait for AI to be ready (module script loads async)
    let retries = 0;
    while (!window._removeBg && retries < 100) {
      await new Promise(r => setTimeout(r, 100));
      retries++;
    }
    if (!window._removeBg) throw new Error('AI 未加载');

    showLoading('AI抠图中...');
    setStatus('AI抠图中...', '#f59e0b');

    const blob = await window._removeBg(file, {
      model: 'medium',
      output: { format: 'image/png' },
      progress: (key, cur, total) => {
        if (key === 'fetch:progress') {
          const pct = Math.round(cur / total * 100);
          showLoading('下载模型中 ' + pct + '%...');
          document.getElementById('loadingSub').textContent =
            '首次使用需下载约40MB，后续秒开';
        }
      }
    });

    const url = URL.createObjectURL(blob);
    await loadImage(url);
    hideLoading();
    showToast('✅ 抠图完成！选底色');
    setStatus('已完成', '#10b981');

  } catch (e) {
    console.warn('AI failed:', e.message);
    hideLoading();
    showToast('⚠ ' + (e.message || '处理失败，请重试'));
    setStatus('失败', '#ef4444');
    if (placeholder) placeholder.style.display = '';
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => { showToast('加载失败'); reject(new Error('load')); };
    img.onload = () => {
      S.image = img;
      S.scale = 1; S.offsetX = 0; S.offsetY = 0;
      fitToCanvas();
      computeCrop();
      autoCenter();
      render();
      resolve();
    };
    img.src = url;
  });
}

function fitToCanvas() {
  if (!S.image || !canvasWrapper) return;
  const cw = canvasWrapper.clientWidth, ch = canvasWrapper.clientHeight;
  if (!cw || !ch) return;
  const iw = S.image.naturalWidth, ih = S.image.naturalHeight;
  if (!iw || !ih) return;
  const s = Math.min(cw / iw, ch / ih);
  S.scale = s;
  S.offsetX = (cw - iw * s) / 2;
  S.offsetY = (ch - ih * s) / 2;
}

function computeCrop() {
  if (!canvasWrapper) return;
  const cw = canvasWrapper.clientWidth, ch = canvasWrapper.clientHeight;
  if (!cw || !ch) return;
  const ratio = S.photoSize.hPx / S.photoSize.wPx;
  let w, h;
  if (cw / ch > 1 / ratio) { h = ch * 0.92; w = h / ratio; }
  else { w = cw * 0.85; h = w * ratio; }
  S._crop = { x: Math.round((cw-w)/2), y: Math.round((ch-h)/2), w: Math.round(w), h: Math.round(h) };
  S._lcw = cw; S._lch = ch;
}

function autoCenter() {
  if (!S.image || !S._crop) return;
  const img = S.image, s = S.scale;
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  if (!dw || !dh) return;

  const sw = 120, sh = Math.round(120 * dh / dw);
  const tmp = document.createElement('canvas');
  tmp.width = sw; tmp.height = sh;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0, sw, sh);
  const d = tc.getImageData(0, 0, sw, sh).data;

  let minX=sw, minY=sh, maxX=0, maxY=0, found=false;
  for (let y=0; y<sh; y+=3) for (let x=0; x<sw; x+=3) {
    if (d[(y*sw+x)*4+3] > 40) {
      if (x<minX)minX=x; if (y<minY)minY=y;
      if (x>maxX)maxX=x; if (y>maxY)maxY=y;
      found = true;
    }
  }
  if (found && maxX-minX > 10) {
    const sx=dw/sw, sy=dh/sh;
    const pcx = (minX+maxX)/2*sx + S.offsetX;
    const pcy = (minY+maxY)/2*sy + S.offsetY;
    const cr = S._crop;
    S.offsetX += (cr.x+cr.w/2 - pcx);
    S.offsetY += (cr.y+cr.h/2 - pcy);
    const cw = canvasWrapper.clientWidth, ch = canvasWrapper.clientHeight;
    S.offsetX = Math.max(-dw*0.25, Math.min(cw-dw*0.75, S.offsetX));
    S.offsetY = Math.max(-dh*0.25, Math.min(ch-dh*0.75, S.offsetY));
  }
}

// ── Render ──
function render() {
  if (!S.image || !canvasWrapper || !previewCtx || !overlayCtx) return;
  const cw = canvasWrapper.clientWidth, ch = canvasWrapper.clientHeight;
  if (!cw || !ch) return;
  const dpr = window.devicePixelRatio || 1;

  previewCanvas.width = cw*dpr;  previewCanvas.height = ch*dpr;
  previewCanvas.style.width = cw+'px'; previewCanvas.style.height = ch+'px';
  overlayCanvas.width = cw*dpr;  overlayCanvas.height = ch*dpr;
  overlayCanvas.style.width = cw+'px'; overlayCanvas.style.height = ch+'px';

  previewCtx.setTransform(dpr,0,0,dpr,0,0);
  overlayCtx.setTransform(dpr,0,0,dpr,0,0);

  // Fill bg
  previewCtx.fillStyle = S.bgColor;
  previewCtx.fillRect(0,0,cw,ch);

  // Draw image (AI-processed = transparent bg)
  const img = S.image, s = S.scale;
  previewCtx.drawImage(img, S.offsetX, S.offsetY, img.naturalWidth*s, img.naturalHeight*s);

  // Adjustments
  if (S.brightness || S.contrast || S.saturation) {
    const id = previewCtx.getImageData(0,0,cw*dpr,ch*dpr);
    applyAdj(id);
    previewCtx.putImageData(id,0,0);
  }

  drawOverlay(cw, ch);
  updateInfo();
}

function applyAdj(id) {
  const d = id.data;
  const cf = (259*(S.contrast+255))/(255*(259-S.contrast));
  const sf = 1 + S.saturation/100;
  for (let i=0; i<d.length; i+=4) {
    if (d[i+3]===0) continue;
    let r=d[i], g=d[i+1], b=d[i+2];
    r+=S.brightness*2.55; g+=S.brightness*2.55; b+=S.brightness*2.55;
    r=cf*(r-128)+128; g=cf*(g-128)+128; b=cf*(b-128)+128;
    const avg=(r+g+b)/3;
    r=avg+sf*(r-avg); g=avg+sf*(g-avg); b=avg+sf*(b-avg);
    d[i]=clamp(r); d[i+1]=clamp(g); d[i+2]=clamp(b);
  }
}

function drawOverlay(cw, ch) {
  overlayCtx.clearRect(0,0,cw,ch);
  if (!S._crop || S._lcw!==cw || S._lch!==ch) computeCrop();
  const cr = S._crop; if (!cr) return;

  overlayCtx.fillStyle='rgba(0,0,0,0.45)';
  overlayCtx.fillRect(0,0,cw,cr.y);
  overlayCtx.fillRect(0,cr.y,cr.x,cr.h);
  overlayCtx.fillRect(cr.x+cr.w,cr.y,cw-cr.x-cr.w,cr.h);
  overlayCtx.fillRect(0,cr.y+cr.h,cw,ch-cr.y-cr.h);

  overlayCtx.strokeStyle='#fff'; overlayCtx.lineWidth=2;
  overlayCtx.setLineDash([6,3]); overlayCtx.strokeRect(cr.x,cr.y,cr.w,cr.h);
  overlayCtx.setLineDash([]);

  overlayCtx.strokeStyle='#fff'; overlayCtx.lineWidth=3;
  const cl=18;
  [[cr.x,cr.y,1,1],[cr.x+cr.w,cr.y,-1,1],[cr.x,cr.y+cr.h,1,-1],[cr.x+cr.w,cr.y+cr.h,-1,-1]]
    .forEach(a=>{overlayCtx.beginPath();overlayCtx.moveTo(a[0],a[1]+a[3]*cl);overlayCtx.lineTo(a[0],a[1]);overlayCtx.lineTo(a[0]+a[2]*cl,a[1]);overlayCtx.stroke()});

  overlayCtx.strokeStyle='rgba(255,255,255,0.2)'; overlayCtx.lineWidth=1;
  for(let i=1;i<3;i++){overlayCtx.beginPath();overlayCtx.moveTo(cr.x,cr.y+cr.h*i/3);overlayCtx.lineTo(cr.x+cr.w,cr.y+cr.h*i/3);overlayCtx.stroke();overlayCtx.beginPath();overlayCtx.moveTo(cr.x+cr.w*i/3,cr.y);overlayCtx.lineTo(cr.x+cr.w*i/3,cr.y+cr.h);overlayCtx.stroke()}

  overlayCtx.strokeStyle='rgba(255,255,255,0.2)'; overlayCtx.lineWidth=1.5;
  overlayCtx.beginPath(); overlayCtx.ellipse(cr.x+cr.w/2,cr.y+cr.h*0.42,cr.w*0.28,cr.h*0.22,0,0,Math.PI*2); overlayCtx.stroke();
  overlayCtx.fillStyle='rgba(255,255,255,0.7)'; overlayCtx.font='11px -apple-system,sans-serif'; overlayCtx.textAlign='center';
  overlayCtx.fillText(S.photoSize.label, cw/2, cr.y-8);
}

function updateInfo() {
  const sl=document.getElementById('sizeLabel'), pl=document.getElementById('pixelLabel');
  if (sl) sl.textContent = S.photoSize.wMm+'×'+S.photoSize.hMm+'mm';
  if (pl && S.image) pl.textContent = S.photoSize.wPx+'×'+S.photoSize.hPx+'px';
}

// ── Pointer Events ──
function pointerDown(e) {
  if (!S.image) return;
  e.preventDefault();
  S.isDragging = true;
  const pt = e.touches ? e.touches[0] : e;
  S.dsX=pt.clientX; S.dsY=pt.clientY;
  S.dsOX=S.offsetX; S.dsOY=S.offsetY;
  S._isTouch = !!e.touches;
  canvasWrapper.classList.add('dragging');
}
function pointerMove(e) {
  if (!S.isDragging) return;
  e.preventDefault();
  const pt = e.touches ? e.touches[0] : e;
  S.offsetX = S.dsOX + (pt.clientX - S.dsX);
  S.offsetY = S.dsOY + (pt.clientY - S.dsY);
  render();
}
function pointerUp() {
  S.isDragging = false;
  if (canvasWrapper) canvasWrapper.classList.remove('dragging');
  S._isTouch = false;
}
function onWheel(e) {
  if (!S.image || !canvasWrapper) return;
  e.preventDefault();
  const delta = e.deltaY>0?-0.05:0.05;
  const ns = Math.max(0.15, Math.min(3, S.scale+delta));
  const ratio = ns/S.scale;
  const rect = canvasWrapper.getBoundingClientRect();
  S.scale = ns;
  S.offsetX = (e.clientX-rect.left) - ratio*((e.clientX-rect.left)-S.offsetX);
  S.offsetY = (e.clientY-rect.top) - ratio*((e.clientY-rect.top)-S.offsetY);
  render();
}

// ── Controls ──
function setBgColor(color, el) {
  S.bgColor = color;
  document.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('active'));
  if (el) el.classList.add('active');
  const cc = document.getElementById('customColor'); if (cc) cc.value = color;
  render();
}
function setSize(sk, el) {
  const sz = {
    '25x35':{label:'一寸 (25×35)',wMm:25,hMm:35,wPx:295,hPx:413},
    '35x49':{label:'二寸 (35×49)',wMm:35,hMm:49,wPx:413,hPx:579},
    '35x45':{label:'小二寸 (35×45)',wMm:35,hMm:45,wPx:413,hPx:531},
    '33x48':{label:'大一寸 (33×48)',wMm:33,hMm:48,wPx:390,hPx:567},
  };
  S.photoSize = sz[sk]; S._crop = null;
  document.querySelectorAll('.size-chip').forEach(c=>c.classList.remove('active'));
  if (el) el.classList.add('active');
  computeCrop(); render();
}
function debounceRender() {
  S.brightness = parseInt(document.getElementById('brightness').value)||0;
  S.contrast = parseInt(document.getElementById('contrast').value)||0;
  S.saturation = parseInt(document.getElementById('saturation').value)||0;
  clearTimeout(S._to);
  S._to = setTimeout(render, 40);
}

// ── Exam Apply ──
function applyExamSpec(name, wMm, hMm, wPx, hPx, bgColor) {
  S.photoSize = { label:name, wMm, hMm, wPx, hPx };
  S.bgColor = bgColor; S._crop = null;
  document.querySelectorAll('.size-chip,.color-dot').forEach(c=>c.classList.remove('active'));
  const cc = document.getElementById('customColor'); if (cc) cc.value = bgColor;
  document.querySelectorAll('.color-dot[data-color]').forEach(d=>{
    if (d.dataset.color.toLowerCase()===bgColor.toLowerCase()) d.classList.add('active');
  });
  if (S.image) { computeCrop(); render(); }
  updateInfo(); showToast('已应用: '+name);
}

// ── Output ──
function createOutput(cols, rows) {
  if (!S.image || !canvasWrapper) return document.createElement('canvas');
  const dpr = window.devicePixelRatio||1;
  const cw = canvasWrapper.clientWidth, ch = canvasWrapper.clientHeight;
  if (!cw||!ch) return document.createElement('canvas');

  const outW=S.photoSize.wPx, outH=S.photoSize.hPx;
  const gap=Math.round(outW*0.03), margin=Math.round(outW*0.06);
  const tw=cols*outW+(cols-1)*gap+2*margin, th=rows*outH+(rows-1)*gap+2*margin;

  const out = document.createElement('canvas');
  out.width=tw; out.height=th;
  const oc = out.getContext('2d');
  oc.fillStyle=S.bgColor; oc.fillRect(0,0,tw,th);

  const tmp = document.createElement('canvas');
  tmp.width=cw*dpr; tmp.height=ch*dpr;
  const tc = tmp.getContext('2d');
  tc.setTransform(dpr,0,0,dpr,0,0);
  tc.fillStyle=S.bgColor; tc.fillRect(0,0,cw,ch);

  const img=S.image, s=S.scale;
  tc.drawImage(img,S.offsetX,S.offsetY,img.naturalWidth*s,img.naturalHeight*s);

  if (S.brightness||S.contrast||S.saturation) {
    const id = tc.getImageData(0,0,cw*dpr,ch*dpr);
    applyAdj(id); tc.putImageData(id,0,0);
  }

  if (!S._crop) computeCrop();
  const cr = S._crop; if (!cr) return out;

  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++)
    oc.drawImage(tmp,cr.x*dpr,cr.y*dpr,cr.w*dpr,cr.h*dpr,
      margin+c*(outW+gap),margin+r*(outH+gap),outW,outH);
  return out;
}

function showPreview() {
  if (!S.image) return showToast('请先上传照片');
  const oc = createOutput(1,1);
  document.getElementById('previewImg').src = oc.toDataURL('image/png');
  document.getElementById('previewTitle').innerHTML =
    '证件照预览 - '+S.photoSize.label+
    '<br><span style="font-size:11px;color:#999">底色: '+
    '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:'+
    S.bgColor+';vertical-align:middle"></span> '+S.bgColor+' | AI抠图</span>';
  document.getElementById('previewModal').classList.add('show');
}
function closePreview() { document.getElementById('previewModal').classList.remove('show'); }

function downloadPhoto() {
  if (!S.image) return showToast('请先上传照片');
  dl(createOutput(1,1), '证件照_'+S.photoSize.wMm+'x'+S.photoSize.hMm+'mm.png');
}
function downloadPrintLayout() {
  if (!S.image) return showToast('请先上传照片');
  dl(createOutput(4,6), '证件照_排版_4x6.png');
}
function dl(canvas, fn) {
  canvas.toBlob(b=>{
    const u=URL.createObjectURL(b), a=document.createElement('a');
    a.href=u; a.download=fn;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(u); showToast('✅ 下载完成!');
  },'image/png',1.0);
}
function forceRefresh() { if (!S.image) return showToast('请先'); render(); showToast('✅'); }
function resetAll() {
  S.image=null; S._crop=null; S.scale=1; S.offsetX=0; S.offsetY=0;
  if(previewCtx)previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
  if(overlayCtx)overlayCtx.clearRect(0,0,overlayCanvas.width,overlayCanvas.height);
  if(placeholder)placeholder.style.display='';
  if(controlsEl)controlsEl.style.display='none';
  ['brightness','contrast','saturation'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=0});
  S.brightness=S.contrast=S.saturation=0;
  document.getElementById('fileInput').value=''; document.getElementById('cameraInput').value='';
  document.getElementById('sizeLabel').textContent='25×35mm';
  document.getElementById('pixelLabel').textContent='—';
  setStatus('就绪','#10b981');
}

// ── Events ──
function bindEvents() {
  if (!canvasWrapper) return;
  canvasWrapper.addEventListener('mousedown', pointerDown);
  canvasWrapper.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerUp);
  canvasWrapper.addEventListener('touchstart', pointerDown, {passive:false});
  canvasWrapper.addEventListener('touchmove', pointerMove, {passive:false});
  window.addEventListener('touchend', pointerUp);
  canvasWrapper.addEventListener('wheel', onWheel, {passive:false});

  // Drag & Drop
  let dc = 0;
  canvasWrapper.addEventListener('dragover', e=>{e.preventDefault();e.stopPropagation()});
  canvasWrapper.addEventListener('dragenter', e=>{e.preventDefault();e.stopPropagation();dc++;canvasWrapper.style.border='3px dashed #4f6ef7';canvasWrapper.style.background='rgba(79,110,247,0.05)'});
  canvasWrapper.addEventListener('dragleave', e=>{e.stopPropagation();dc--;if(dc<=0){dc=0;canvasWrapper.style.border='';canvasWrapper.style.background=''}});
  canvasWrapper.addEventListener('drop', e=>{e.preventDefault();e.stopPropagation();dc=0;canvasWrapper.style.border='';canvasWrapper.style.background='';const f=e.dataTransfer.files[0];if(f)handleFile(f)});
}

let resizeTO;
window.addEventListener('resize', ()=>{
  clearTimeout(resizeTO);
  resizeTO = setTimeout(()=>{if(S.image){fitToCanvas();computeCrop();render()}},200);
});

// ── Bootstrap ──
if (initDOM()) bindEvents();

window.handleFile = handleFile;
window.setBgColor = setBgColor;
window.setSize = setSize;
window.showPreview = showPreview;
window.closePreview = closePreview;
window.downloadPhoto = downloadPhoto;
window.downloadPrintLayout = downloadPrintLayout;
window.forceRefresh = forceRefresh;
window.resetAll = resetAll;
window.debounceRender = debounceRender;
window.filterByCategory = filterByCategory;
window.filterExams = filterExams;
window.applyExamSpec = applyExamSpec;

setTimeout(()=>{if(typeof renderExamList==='function')renderExamList();updateInfo()},100);
})();
