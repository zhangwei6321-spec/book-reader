/* ========== 平台识别与 URL 解析 ========== */
var Parser = (function () {
  'use strict';

  var isLocal = (function () {
    var host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '' || host.indexOf('192.168.') === 0;
  })();

  var LOCAL_API = isLocal ? 'http://localhost:3000/api/parse' : null;
  // ★ 部署 Render 后，把下面这行改成你的 Render 地址（末尾不要加 /）
  var REMOTE_API_BASE = isLocal ? 'http://localhost:3000' : 'https://media-parser-bfmx.onrender.com';
  // 示例：var REMOTE_API_BASE = 'https://media-parser-api.onrender.com';

  /** 带超时的 fetch，同时回调状态 */
  function fetchWithTimeout(url, options, timeoutMs, onStatus) {
    timeoutMs = timeoutMs || 8000;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    var fetchOptions = Object.assign({}, options || {}, { signal: controller.signal });
    return fetch(url, fetchOptions).then(function (resp) {
      clearTimeout(timer);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp;
    }).catch(function (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') {
        if (onStatus) onStatus('超时');
        throw new Error('timeout');
      }
      if (onStatus) onStatus('请求失败');
      throw e;
    });
  }

  var PLATFORMS = {
    douyin: {
      name: '抖音', icon: '🎵',
      patterns: [/v\.douyin\.com/i, /douyin\.com/i, /iesdouyin\.com/i],
    },
    kuaishou: {
      name: '快手', icon: '📱',
      patterns: [/kuaishou\.com/i, /chenzhongtech\.com/i, /kuaishou\.app/i, /v\.kuaishou\.com/i],
    },
    tiktok: {
      name: 'TikTok', icon: '🎵',
      patterns: [/tiktok\.com/i],
    },
    image: {
      name: '图片', icon: '🖼️',
      patterns: [/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)(\?|$)/i],
      directMedia: true,
    },
    video: {
      name: '视频直链', icon: '🎥',
      patterns: [/\.(mp4|webm|mov|avi|mkv|flv|wmv|m3u8)(\?|$)/i],
      directMedia: true,
    },
  };

  function detectPlatform(url) {
    var keys = Object.keys(PLATFORMS);
    for (var i = 0; i < keys.length; i++) {
      var pts = PLATFORMS[keys[i]].patterns;
      for (var j = 0; j < pts.length; j++) {
        if (pts[j].test(url)) return keys[i];
      }
    }
    return 'unknown';
  }

  function isValidUrl(str) {
    try { var u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch (_e) { return false; }
  }

  /** 主入口 — 返回 Promise */
  function parseUrl(url, onStatus) {
    var trimmed = url.trim();
    if (!trimmed) return Promise.reject(new Error('请输入有效链接'));
    if (!isValidUrl(trimmed)) return Promise.reject(new Error('链接格式不正确'));

    var platform = detectPlatform(trimmed);
    var pInfo = PLATFORMS[platform];

    // 直接媒体链接 — 立即返回
    if (pInfo && pInfo.directMedia) {
      var title = '';
      try { title = decodeURIComponent(trimmed.split('/').pop().split('?')[0]); } catch (_e) {}
      return Promise.resolve({
        originalUrl: trimmed, platform: platform,
        platformName: pInfo.name, platformIcon: pInfo.icon,
        mediaUrl: trimmed, previewUrl: trimmed, coverUrl: null,
        title: title || '未命名媒体', author: '',
        type: platform === 'image' ? 'image' : 'video', direct: true, isLocal: isLocal,
      });
    }

    // 抖音 / 快手
    if (platform === 'douyin' || platform === 'kuaishou' || platform === 'tiktok') {
      if (LOCAL_API) {
        if (onStatus) onStatus('连接本地后端...');
        return parseViaLocalApi(trimmed, platform, onStatus)
          .catch(function () { return parseViaRemoteApi(trimmed, platform, onStatus, REMOTE_API_BASE); });
      }
      if (onStatus) onStatus('连接云端后端...');
      return parseViaRemoteApi(trimmed, platform, onStatus, REMOTE_API_BASE);
    }

    if (onStatus) onStatus('通用网页解析...');
    return parseGenericPage(trimmed, onStatus);
  }

  function parseViaLocalApi(url, platform, onStatus) {
    return fetchWithTimeout(LOCAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url }),
    }, 6000).then(function (resp) { return resp.json(); })
    .then(function (json) {
      if (!json.success || !json.data) throw new Error('后端返回异常');
      var d = json.data;
      var mediaUrl = d.videoUrl || d.play_url || d.video_url || d.url || d.video;
      return {
        originalUrl: url, platform: platform,
        platformName: PLATFORMS[platform].name, platformIcon: PLATFORMS[platform].icon,
        mediaUrl: mediaUrl,
        previewUrl: mediaUrl ? 'http://localhost:3000/api/preview/video?url=' + encodeURIComponent(mediaUrl) : null,
        coverUrl: d.coverUrl || d.cover_url || d.cover || null,
        title: d.desc || d.title || '',
        author: (d.author && d.author.nickname) || d.nickname || d.author || '',
        type: d.type === 'image' ? 'image' : 'video', direct: false, isLocal: true,
      };
    });
  }

  function parseViaRemoteApi(url, platform, onStatus, baseUrl) {
    if (baseUrl) {
      if (onStatus) onStatus('连接云端后端...');
      return fetchWithTimeout(baseUrl + '/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      }, 30000).then(function (resp) { return resp.json(); })
      .then(function (json) {
        if (json.success && json.data) {
          var d = json.data;
          var mediaUrl = d.videoUrl || d.play_url || d.video_url || d.url || d.video;
          return {
            originalUrl: url, platform: platform,
            platformName: PLATFORMS[platform].name, platformIcon: PLATFORMS[platform].icon,
            mediaUrl: mediaUrl,
            previewUrl: mediaUrl ? baseUrl + '/api/preview/video?url=' + encodeURIComponent(mediaUrl) : null,
            coverUrl: d.coverUrl || d.cover_url || d.cover || null,
            title: d.desc || d.title || '',
            author: (d.author && d.author.nickname) || d.nickname || d.author || '',
            type: d.type === 'image' ? 'image' : 'video', direct: false, isLocal: false,
          };
        }
        var errMsg = json.error || json.message || '云端后端返回异常';
        throw new Error(errMsg);
      }).catch(function (e) {
        // 云端后端失败直接报错，不降级到免费 API
        var msg = '云端解析失败';
        if (e.message === 'timeout' || e.name === 'AbortError') {
          msg = '云端后端响应超时，请刷新页面重试';
        } else if (e.message && e.message.indexOf('fetch') >= 0) {
          msg = '无法连接云端后端，请检查网络';
        } else {
          msg = e.message || '云端后端异常';
        }
        throw new Error(msg);
      });
    }
    return tryFreeApis(url, platform, onStatus);
  }

  function tryFreeApis(url, platform, onStatus) {
    var apis = [
      {
        name: 'API-1',
        url: 'https://api.uomg.com/api/douyin.parse?url=' + encodeURIComponent(url),
        extract: function (data) {
          try {
            var d = JSON.parse(data);
            if (d.code === 1 && d.data) {
              return { mediaUrl: d.data.video_url || d.data.url, coverUrl: d.data.cover, title: d.data.title || '', author: d.data.author || '' };
            }
          } catch (_e) {}
          return null;
        },
      },
      {
        name: 'API-2',
        url: 'https://api.iyk0.com/dyjx/?url=' + encodeURIComponent(url),
        extract: function (data) {
          if (typeof data === 'string' && data.indexOf('http') === 0) return { mediaUrl: data.trim() };
          try {
            var d = JSON.parse(data);
            var mu = d.url || d.video || d.video_url || (d.data && (d.data.url || d.data.video_url));
            if (mu) return { mediaUrl: mu };
          } catch (_e) {}
          return null;
        },
      },
    ];

    function tryNext(index) {
      if (index >= apis.length) {
        return Promise.reject(new Error(
          '在线解析失败 — 免费 API 暂不可用\n\n' +
          '💡 视频/图片直链功能正常\n' +
          '💡 抖音/快手请用本地版：python3 server.py'
        ));
      }
      var api = apis[index];
      if (onStatus) onStatus('尝试 ' + api.name + '...');
      return fetchWithTimeout(api.url, {}, 10000).then(function (resp) {
        return resp.text();
      }).then(function (text) {
        var extracted = api.extract(text);
        if (extracted && extracted.mediaUrl) {
          return {
            originalUrl: url, platform: platform,
            platformName: PLATFORMS[platform].name, platformIcon: PLATFORMS[platform].icon,
            mediaUrl: extracted.mediaUrl, previewUrl: extracted.mediaUrl,
            coverUrl: extracted.coverUrl || null,
            title: extracted.title || PLATFORMS[platform].name + '视频',
            author: extracted.author || '',
            type: 'video', direct: false, isLocal: false,
          };
        }
        if (onStatus) onStatus(api.name + ' 无结果，换下一个...');
        return tryNext(index + 1);
      }).catch(function (e) {
        if (onStatus) onStatus(api.name + ' ' + (e.message === 'timeout' ? '超时' : '失败') + '，换下一个...');
        return tryNext(index + 1);
      });
    }

    return tryNext(0);
  }

  function parseGenericPage(url, onStatus) {
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    return fetchWithTimeout(proxyUrl, {}, 10000).then(function (resp) {
      return resp.text();
    }).then(function (html) {
      function getMeta(prop) {
        var re1 = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)', 'i');
        var re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + prop + '["\']', 'i');
        var m = html.match(re1) || html.match(re2);
        return m ? m[1] : null;
      }
      var ogVideo = getMeta('og:video') || getMeta('og:video:url');
      var ogImage = getMeta('og:image') || getMeta('og:image:url');
      if (ogVideo) {
        return {
          originalUrl: url, platform: 'video', platformName: '视频', platformIcon: '🎥',
          mediaUrl: ogVideo, previewUrl: ogVideo, coverUrl: ogImage,
          title: getMeta('og:title') || '网页视频', author: '', type: 'video', direct: true, isLocal: false,
        };
      }
      if (ogImage) {
        return {
          originalUrl: url, platform: 'image', platformName: '图片', platformIcon: '🖼️',
          mediaUrl: ogImage, previewUrl: ogImage, coverUrl: null,
          title: getMeta('og:title') || '网页图片', author: '', type: 'image', direct: true, isLocal: false,
        };
      }
      throw new Error('未检测到媒体');
    }).catch(function (e) {
      if (e.message.indexOf('未检测到') >= 0) throw e;
      throw new Error('解析失败：' + e.message);
    });
  }

  function extractUrls(text) {
    var re = /https?:\/\/[^\s，。；！？、""'']+/g;
    var matches = text.match(re) || [];
    return matches.map(function (u) { return u.replace(/[,;，；。.!！?？'"]*$/, ''); });
  }

  function parseBatch(text, onProgress) {
    var urls = extractUrls(text);
    if (!urls.length) {
      var lines = text.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line) urls = urls.concat(extractUrls(line));
      }
    }
    if (!urls.length) return Promise.reject(new Error('未检测到有效链接'));

    var results = [], errors = [];
    function next(i) {
      if (i >= urls.length) return Promise.resolve({ results: results, errors: errors });
      if (onProgress) onProgress(i, urls.length, urls[i]);
      return parseUrl(urls[i]).then(function (r) {
        results.push(r);
        return next(i + 1);
      }).catch(function (e) {
        errors.push({ url: urls[i], error: e.message });
        return next(i + 1);
      });
    }
    return next(0);
  }

  return {
    detectPlatform: detectPlatform,
    parseUrl: parseUrl,
    parseBatch: parseBatch,
    extractUrls: extractUrls,
    isValidUrl: isValidUrl,
    isLocal: isLocal,
  };
})();
