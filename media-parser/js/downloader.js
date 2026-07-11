/* ========== 下载管理 ========== */
var Downloader = (function () {
  'use strict';

  function getBaseUrl(result) {
    if (result.isLocal) return 'http://localhost:3000';
    // Render 云端后端
    return 'https://media-parser-bfmx.onrender.com';
  }

  function download(result, onProgress) {
    var url = result.mediaUrl;
    if (!url) return Promise.reject(new Error('无可下载媒体链接'));

    var filename = generateFilename(result);

    // 非直链媒体（抖音/快手）走后端代理下载
    var baseUrl = getBaseUrl(result);
    if (!result.direct && (result.platform === 'douyin' || result.platform === 'kuaishou') && baseUrl) {
      var proxyUrl = baseUrl + '/api/download?url=' + encodeURIComponent(url) + '&filename=' + encodeURIComponent(filename);
      triggerDirectDownload(proxyUrl, filename);
      if (onProgress) onProgress(1, 1);
      return Promise.resolve(filename);
    }

    // 直链媒体：用 fetch 下载
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var contentLength = response.headers.get('content-length');
      var total = contentLength ? parseInt(contentLength, 10) : 0;

      if (total && onProgress) {
        var reader = response.body.getReader();
        var chunks = [];
        var received = 0;
        function pump() {
          return reader.read().then(function (result) {
            if (result.done) {
              var blob = new Blob(chunks);
              triggerDownload(blob, filename, url);
              return filename;
            }
            chunks.push(result.value);
            received += result.value.length;
            onProgress(received, total);
            return pump();
          });
        }
        return pump();
      } else {
        return response.blob().then(function (blob) {
          if (onProgress) onProgress(blob.size, blob.size);
          triggerDownload(blob, filename, url);
          return filename;
        });
      }
    }).catch(function () {
      triggerDirectDownload(url, filename);
      return filename;
    });
  }

  function triggerDownload(blob, filename) {
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 5000);
  }

  function triggerDirectDownload(url, filename) {
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function generateFilename(result) {
    var base = result.title || 'media';
    var clean = base.replace(/[<>:"\/\\|?*]/g, '_').substring(0, 80);
    if (result.type === 'image') {
      return clean + guessImageExt(result.mediaUrl);
    }
    return clean + guessVideoExt(result.mediaUrl);
  }

  function guessImageExt(url) {
    var m = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)/i);
    return m ? '.' + m[1].toLowerCase() : '.jpg';
  }

  function guessVideoExt(url) {
    var m = url.match(/\.(mp4|webm|mov|avi|mkv|flv)/i);
    return m ? '.' + m[1].toLowerCase() : '.mp4';
  }

  return {
    download: download,
    generateFilename: generateFilename,
  };
})();
