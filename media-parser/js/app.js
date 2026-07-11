/* ========== 应用入口 ========== */
(function () {
  'use strict';

  // 防重复初始化
  if (window.__appInited) return;
  window.__appInited = true;

  var results = [];

  function init() {
    try {
      UI.init();
    } catch (e) {
      showFatal('UI.init 失败: ' + e.message);
      return;
    }
    bindEvents();
  }

  function bindEvents() {
    var els = UI.els;

    if (!els.parseBtn) return showFatal('找不到 parseBtn');
    if (!els.pasteBtn) return showFatal('找不到 pasteBtn');
    if (!els.clearBtn) return showFatal('找不到 clearBtn');
    if (!els.batchBtn) return showFatal('找不到 batchBtn');
    if (!els.batchParseBtn) return showFatal('找不到 batchParseBtn');

    els.parseBtn.addEventListener('click', handleParse);
    els.urlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleParse();
      }
    });

    els.pasteBtn.addEventListener('click', function () {
      try {
        navigator.clipboard.readText().then(function (text) {
          if (text) {
            els.urlInput.value = text;
            UI.showToast('已粘贴剪贴板内容', 'info');
          }
        }).catch(function () {
          UI.showToast('无法读取剪贴板，请手动粘贴', 'error');
        });
      } catch (_e) {
        UI.showToast('剪贴板不可用，请手动粘贴', 'error');
      }
    });

    els.clearBtn.addEventListener('click', function () {
      els.urlInput.value = '';
      els.batchInput.value = '';
      results = [];
      UI.clearResults();
      UI.hideStatus();
    });

    els.batchBtn.addEventListener('click', function () {
      els.batchArea.classList.toggle('hidden');
    });

    els.batchParseBtn.addEventListener('click', handleBatchParse);

    els.platformBadges.addEventListener('click', function (e) {
      var badge = e.target.closest('.badge');
      if (!badge) return;
      var wasActive = badge.classList.contains('active');
      els.platformBadges.querySelectorAll('.badge').forEach(function (b) { b.classList.remove('active'); });
      if (!wasActive) {
        badge.classList.add('active');
        els.urlInput.focus();
      }
    });

    var demos = document.querySelectorAll('.demo-link');
    demos.forEach(function (link) {
      link.addEventListener('click', function () {
        els.urlInput.value = link.dataset.url;
        UI.showToast('已填入示例链接', 'info');
      });
    });

    // 环境提示
    updateFooterHint();
  }

  function updateFooterHint() {
    try {
      var hint = document.getElementById('footerHint');
      if (!hint) return;
      var host = window.location.hostname;
      var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
      if (!isLocal) {
        hint.innerHTML = '🌐 在线版 — 抖音/快手需<a href="https://github.com/zhangwei6321-spec/media-parser" target="_blank">本地部署</a>后端 | 视频/图片直链正常';
      }
    } catch (_e) {}
  }

  function handleParse() {
    var raw = UI.els.urlInput.value.trim();
    if (!raw) {
      UI.showToast('请先输入链接', 'error');
      return;
    }

    var urls = Parser.extractUrls(raw);
    if (urls.length === 0) {
      UI.showStatus('未检测到有效链接，请粘贴包含 http/https 的链接或分享文案', 'error');
      UI.showToast('未检测到链接', 'error');
      return;
    }

    var url = urls[0];
    if (urls.length > 1) {
      UI.showToast('检测到 ' + urls.length + ' 个链接，解析第 1 个...', 'info');
    }

    UI.setLoading(true);
    UI.showStatus('正在解析链接...', 'loading');

    Parser.parseUrl(url, function (status) {
      UI.showStatus(status, 'loading');
    }).then(function (result) {
      results.push(result);
      UI.addResult(result);
      UI.hideStatus();
      UI.showToast('解析成功！', 'success');
      UI.els.urlInput.value = '';
    }).catch(function (e) {
      UI.showStatus(e.message, 'error');
      UI.showToast(e.message, 'error');
    }).finally(function () {
      UI.setLoading(false);
    });
  }

  function handleBatchParse() {
    var text = UI.els.batchInput.value.trim();
    if (!text) {
      UI.showToast('请粘贴批量链接', 'error');
      return;
    }

    UI.setLoading(true);
    UI.showStatus('正在批量解析...', 'loading');

    Parser.parseBatch(text, function (i, total, url) {
      UI.showStatus('正在解析 (' + (i + 1) + '/' + total + '): ' + url.substring(0, 50) + '...', 'loading');
    }).then(function (batch) {
      batch.results.forEach(function (r) {
        results.push(r);
        UI.addResult(r);
      });
      UI.hideStatus();
      if (batch.results.length > 0) {
        UI.showToast('成功解析 ' + batch.results.length + ' 项', 'success');
      }
      if (batch.errors.length > 0) {
        batch.errors.forEach(function (e) { console.warn('解析失败:', e.url, e.error); });
        UI.showToast(batch.errors.length + ' 项解析失败', 'error');
      }
      UI.els.batchInput.value = '';
      UI.els.batchArea.classList.add('hidden');
    }).catch(function (e) {
      UI.showStatus(e.message, 'error');
      UI.showToast(e.message, 'error');
    }).finally(function () {
      UI.setLoading(false);
    });
  }

  function showFatal(msg) {
    var bar = document.getElementById('statusBar');
    if (bar) {
      bar.className = 'status-bar error';
      bar.innerHTML = '⚠️ 初始化失败: ' + msg;
      bar.classList.remove('hidden');
    }
    console.error('[media-parser] FATAL:', msg);
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
