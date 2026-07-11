const $ = (sel) => document.querySelector(sel);

const state = { videoData: null };

// 事件绑定
$('#parseBtn').addEventListener('click', handleParse);
$('#urlInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleParse();
});
$('#downloadBtn').addEventListener('click', handleDownload);
$('#downloadImageBtn').addEventListener('click', handleImageDownload);
$('#copyBtn').addEventListener('click', handleCopy);

async function handleParse() {
  const url = $('#urlInput').value.trim();
  if (!url) return showError('请粘贴视频分享链接');

  showLoading(true);
  hideError();
  hideResult();

  try {
    const resp = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const json = await resp.json();

    if (!json.success) throw new Error(json.error || '解析失败');

    state.videoData = json.data;
    renderResult(json.data);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

function renderResult(data) {
  $('#result').classList.remove('hidden');

  // 平台标签
  const platTag = $('#platformTag');
  platTag.textContent = data.platform === 'douyin' ? '抖音' : '快手';
  platTag.className = 'platform-tag ' + data.platform;

  // 视频预览
  const player = $('#videoPlayer');
  const coverFallback = $('#coverFallback');
  const coverImg = $('#coverImg');

  if (data.videoUrl) {
    player.src = '/api/preview/video?url=' + encodeURIComponent(data.videoUrl);
    player.classList.remove('hidden');
    coverFallback.classList.add('hidden');
    player.load();
  } else if (data.coverUrl) {
    player.classList.add('hidden');
    coverFallback.classList.remove('hidden');
    coverImg.src = data.coverUrl;
  }

  // ============ 图片预览 ============
  const gallery = $('#imageGallery');
  const imageList = $('#imageList');
  const imageCount = $('#imageCount');
  const downloadImageBtn = $('#downloadImageBtn');

  if (data.images && data.images.length > 0) {
    gallery.classList.remove('hidden');
    imageCount.textContent = `(${data.images.length}张)`;
    imageList.innerHTML = '';
    data.images.forEach((imgUrl, index) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = `
        <img src="${imgUrl}" alt="图片${index + 1}" loading="lazy"
             onerror="this.parentElement.classList.add('broken')" />
        <button class="img-dl-btn" data-url="${imgUrl}" title="下载这张图片">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      `;
      // 单张图片下载
      card.querySelector('.img-dl-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadSingleImage(imgUrl, index);
      });
      imageList.appendChild(card);
    });

    // 显示批量下载按钮
    downloadImageBtn.classList.remove('hidden');
    if (data.images.length > 1) {
      downloadImageBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        下载无水印图片 (${data.images.length}张)
      `;
    } else {
      downloadImageBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        下载无水印图片
      `;
    }
  } else {
    gallery.classList.add('hidden');
    downloadImageBtn.classList.add('hidden');
  }

  // 作者信息
  $('#authorAvatar').src = data.author?.avatar || '';
  $('#authorName').textContent = data.author?.nickname || '未知用户';
  $('#videoDesc').textContent = data.desc || '暂无描述';

  // 统计数据
  const stats = data.stats || {};
  $('#statLikes').textContent = formatCount(stats.diggCount);
  $('#statComments').textContent = formatCount(stats.commentCount);
  $('#statShares').textContent = formatCount(stats.shareCount);
  $('#statPlays').textContent = formatCount(stats.playCount);

  // 音频信息
  if (data.music?.title) {
    const desc = $('#videoDesc').textContent;
    $('#videoDesc').textContent = desc + '\n🎵 ' + data.music.title;
  }

  // 重置下载按钮
  resetBtn($('#downloadBtn'), '下载无水印视频');

  // 滚动到结果
  $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function downloadSingleImage(imgUrl, index) {
  const data = state.videoData;
  const a = document.createElement('a');
  a.href = '/api/download/image?url=' + encodeURIComponent(imgUrl);
  a.download = `${data.platform}_${data.videoId}_${index + 1}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handleImageDownload() {
  const data = state.videoData;
  if (!data?.images?.length) return showError('无可下载的图片');

  const btn = $('#downloadImageBtn');

  // 如果只有一张图，直接下载
  if (data.images.length === 1) {
    downloadSingleImage(data.images[0], 0);
    flashBtn(btn, '✅ 开始下载');
    return;
  }

  // 多张图：逐个下载（间隔下载避免浏览器拦截）
  btn.textContent = '⬇️ 下载中...';
  btn.disabled = true;
  data.images.forEach((imgUrl, i) => {
    setTimeout(() => {
      downloadSingleImage(imgUrl, i);
    }, i * 800);
  });
  setTimeout(() => {
    flashBtn(btn, '✅ 下载完成');
    btn.disabled = false;
  }, data.images.length * 800 + 500);
}

function handleDownload() {
  const data = state.videoData;
  if (!data?.videoUrl) return showError('无可下载的视频地址');

  const downloadUrl = '/api/download?url=' + encodeURIComponent(data.videoUrl);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${data.platform}_${data.videoId}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  flashBtn($('#downloadBtn'), '✅ 开始下载');
}

function flashBtn(btn, text) {
  const orig = btn.innerHTML;
  btn.innerHTML = text;
  btn.classList.add('done');
  setTimeout(() => {
    resetBtn(btn, orig);
  }, 2000);
}

function resetBtn(btn, label) {
  if (btn === $('#downloadBtn')) {
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      下载无水印视频
    `;
  }
  btn.classList.remove('done');
}

async function handleCopy() {
  const data = state.videoData;
  if (!data?.videoUrl) return;

  try {
    await navigator.clipboard.writeText(data.videoUrl);
    const btn = $('#copyBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ 已复制';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  } catch {
    showError('复制失败，请手动复制');
  }
}

function formatCount(n) {
  if (n == null) return '0';
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function showLoading(show) {
  $('#loading').classList.toggle('hidden', !show);
  $('#parseBtn').disabled = show;
}

function showError(msg) {
  const el = $('#error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  $('#error').classList.add('hidden');
}

function hideResult() {
  $('#result').classList.add('hidden');
}
