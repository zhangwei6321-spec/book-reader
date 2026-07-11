/* ========== UI 交互 ========== */
const UI = (() => {
  let els = {};

  function init() {
    els = {
      urlInput: document.getElementById('urlInput'),
      parseBtn: document.getElementById('parseBtn'),
      pasteBtn: document.getElementById('pasteBtn'),
      clearBtn: document.getElementById('clearBtn'),
      batchBtn: document.getElementById('batchBtn'),
      batchArea: document.getElementById('batchArea'),
      batchInput: document.getElementById('batchInput'),
      batchParseBtn: document.getElementById('batchParseBtn'),
      statusBar: document.getElementById('statusBar'),
      resultsSection: document.getElementById('resultsSection'),
      resultsGrid: document.getElementById('resultsGrid'),
      resultCount: document.getElementById('resultCount'),
      emptyState: document.getElementById('emptyState'),
      toastContainer: document.getElementById('toastContainer'),
      platformBadges: document.getElementById('platformBadges'),
    };
  }

  function showStatus(message, type = 'loading') {
    if (!els.statusBar) return;
    els.statusBar.className = `status-bar ${type}`;
    els.statusBar.innerHTML = type === 'loading'
      ? `<span class="spinner"></span> ${message}`
      : message;
    els.statusBar.classList.remove('hidden');
  }

  function hideStatus() {
    if (!els.statusBar) return;
    els.statusBar.classList.add('hidden');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function clearResults() {
    els.resultsGrid.innerHTML = '';
    els.resultCount.textContent = '';
    els.resultsSection.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
  }

  function addResult(result) {
    els.emptyState.classList.add('hidden');
    els.resultsSection.classList.remove('hidden');

    const template = document.getElementById('cardTemplate');
    const card = template.content.cloneNode(true);

    // 平台标签
    const platformEl = card.querySelector('.card-platform');
    platformEl.textContent = `${result.platformIcon} ${result.platformName}`;
    platformEl.classList.add(result.platform);

    // 预览
    const previewEl = card.querySelector('.card-preview');
    renderPreview(previewEl, result);

    // 信息
    const titleEl = card.querySelector('.card-title');
    titleEl.textContent = result.title || '未命名';
    titleEl.title = result.title || '';

    const metaEl = card.querySelector('.card-meta');
    const metaParts = [];
    if (result.author) metaParts.push('作者: ' + result.author);
    if (result.type) metaParts.push(result.type === 'video' ? '🎥 视频' : '🖼️ 图片');
    metaEl.textContent = metaParts.join(' · ');

    // 下载按钮
    const downloadBtn = card.querySelector('.btn-download');
    downloadBtn.addEventListener('click', async () => {
      downloadBtn.disabled = true;
      downloadBtn.classList.add('downloading');
      downloadBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;"></span> 下载中...';

      try {
        await Downloader.download(result, (received, total) => {
          const pct = total ? Math.round((received / total) * 100) : 0;
          downloadBtn.innerHTML = `<span class="spinner" style="width:14px;height:14px;"></span> ${pct}%`;
        });
        downloadBtn.innerHTML = '<span>✅</span> 完成';
        downloadBtn.classList.remove('downloading');
        showToast('下载完成！', 'success');
        setTimeout(() => {
          downloadBtn.innerHTML = '<span>⬇️</span> 下载';
          downloadBtn.disabled = false;
        }, 2000);
      } catch (e) {
        downloadBtn.innerHTML = '<span>⬇️</span> 下载';
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('downloading');
        showToast('下载失败: ' + e.message, 'error');
      }
    });

    // 复制按钮
    const copyBtn = card.querySelector('.btn-copy');
    copyBtn.addEventListener('click', () => {
      const url = result.mediaUrl || result.originalUrl;
      navigator.clipboard.writeText(url).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<span>✅</span>';
        showToast('链接已复制', 'success');
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = '<span>📋</span>';
        }, 2000);
      }).catch(() => {
        showToast('复制失败', 'error');
      });
    });

    els.resultsGrid.appendChild(card);
    updateResultCount();

    // 滚动到新卡片
    const cardEl = els.resultsGrid.lastElementChild;
    cardEl?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }

  function renderPreview(container, result) {
    // 视频预览：优先用代理 URL，其次直链
    const videoSrc = result.previewUrl || result.mediaUrl;

    if (result.type === 'image' && result.mediaUrl) {
      const img = document.createElement('img');
      img.src = result.mediaUrl;
      img.alt = result.title || '图片';
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox('image', result.mediaUrl));
      img.style.cursor = 'pointer';
      img.onerror = () => {
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%231a1a2e" width="400" height="200"/><text fill="%23555" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="14">图片加载失败</text></svg>';
      };
      container.appendChild(img);
    } else if (result.type === 'video' && videoSrc) {
      const video = document.createElement('video');
      video.src = videoSrc;
      video.controls = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      if (result.coverUrl) video.poster = result.coverUrl;
      video.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox('video', videoSrc);
      });
      video.addEventListener('loadedmetadata', () => {
        // 视频可播放
      });
      video.onerror = () => {
        // 代理加载失败，尝试直链
        if (video.src !== result.mediaUrl && result.mediaUrl) {
          video.src = result.mediaUrl;
        }
      };
      container.appendChild(video);
    } else if (result.coverUrl) {
      const img = document.createElement('img');
      img.src = result.coverUrl;
      img.alt = '封面';
      img.loading = 'lazy';
      img.addEventListener('click', () => {
        if (result.type === 'video' && result.mediaUrl) {
          openLightbox('video', videoSrc || result.mediaUrl);
        }
      });
      img.style.cursor = 'pointer';
      container.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'preview-placeholder';
      placeholder.innerHTML = `<span class="icon">${result.platformIcon || '📦'}</span><span>${result.platformName || ''}内容</span>`;
      container.appendChild(placeholder);
    }
  }

  function updateResultCount() {
    const count = els.resultsGrid.children.length;
    els.resultCount.textContent = `共 ${count} 项`;
  }

  function openLightbox(type, url) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = url;
      overlay.appendChild(img);
    } else {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.autoplay = true;
      video.crossOrigin = 'anonymous';
      overlay.appendChild(video);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '✕';
    overlay.appendChild(closeBtn);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    closeBtn.addEventListener('click', () => overlay.remove());
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });

    document.body.appendChild(overlay);
  }

  function setLoading(loading) {
    els.parseBtn.disabled = loading;
    els.urlInput.disabled = loading;
    if (loading) {
      els.parseBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-top-color:#fff;"></span> 解析中';
    } else {
      els.parseBtn.innerHTML = '<span class="btn-icon">🔍</span><span>解析</span>';
    }
  }

  return {
    init,
    showStatus,
    hideStatus,
    showToast,
    clearResults,
    addResult,
    setLoading,
    get els() { return els; },
  };
})();
