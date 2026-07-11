const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 工具函数 ----------

/** 从文本中提取 URL */
function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : text.trim();
}

/** 获取重定向后的最终 URL */
async function getFinalUrl(url) {
  try {
    const resp = await axios.get(url, {
      maxRedirects: 0,
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const location = resp.headers.location || resp.request?.res?.responseUrl;
    if (location && location !== url) return location;
    return url;
  } catch (e) {
    if (e.response?.headers?.location) return e.response.headers.location;
    return url;
  }
}

// ---------- 抖音解析 ----------

async function parseDouyin(shareUrl) {
  // Step 1: 获取重定向后的真实 URL，提取 video_id
  const finalUrl = await getFinalUrl(shareUrl);

  let videoId = '';
  // 匹配多种链接格式
  const idMatch1 = finalUrl.match(/video\/(\d+)/);
  const idMatch2 = finalUrl.match(/note\/(\d+)/);
  const idMatch3 = finalUrl.match(/modal_id=(\d+)/);
  const idMatch4 = finalUrl.match(/aweme_id=(\d+)/);
  if (idMatch1) videoId = idMatch1[1];
  else if (idMatch2) videoId = idMatch2[1];
  else if (idMatch3) videoId = idMatch3[1];
  else if (idMatch4) videoId = idMatch4[1];

  if (!videoId) {
    // 尝试从短链接 HTML 页面提取
    try {
      const htmlResp = await axios.get(shareUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        },
      });
      const html = htmlResp.data;
      const allMatches = [
        html.match(/video\/(\d+)/),
        html.match(/aweme_id["']?\s*[:=]\s*["']?(\d+)/),
        html.match(/item_id["']?\s*[:=]\s*["']?(\d+)/),
      ];
      for (const m of allMatches) {
        if (m) { videoId = m[1]; break; }
      }
    } catch (_) {}
  }

  if (!videoId) throw new Error('无法提取视频ID，请确认链接有效');

  // Step 2: 调用抖音 API 获取视频信息
  const apiUrl = 'https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/';
  const apiResp = await axios.get(apiUrl, {
    params: { item_ids: videoId },
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      'Referer': 'https://www.douyin.com/',
    },
  });

  const itemList = apiResp.data?.item_list;
  if (!itemList || itemList.length === 0) throw new Error('获取视频信息失败');

  const item = itemList[0];
  const video = item.video;
  if (!video) throw new Error('该链接不包含视频');

  // 无水印视频地址：替换 playwm -> play 或使用 play_addr
  let noWatermarkUrl = '';
  const playAddr = video.play_addr?.url_list || [];
  const playAddrLow = video.play_addr_265?.url_list || video.play_addr_h264?.url_list || [];

  if (playAddr.length > 0) {
    noWatermarkUrl = playAddr[0].replace('playwm', 'play').replace('watermark=1', 'watermark=0');
  } else if (playAddrLow.length > 0) {
    noWatermarkUrl = playAddrLow[0];
  }

  // Fallback: 使用 download_addr
  if (!noWatermarkUrl) {
    const downloadAddr = video.download_addr?.url_list || [];
    if (downloadAddr.length > 0) noWatermarkUrl = downloadAddr[0];
  }

  if (!noWatermarkUrl) {
    // 最后降级用带水印的
    noWatermarkUrl = (playAddr[0] || video.play_addr?.uri || '');
  }

  const author = item.author || {};
  const music = item.music || {};

  return {
    platform: 'douyin',
    videoId,
    desc: item.desc || '',
    videoUrl: noWatermarkUrl,
    coverUrl: (video.cover?.url_list || [])[0] || (video.origin_cover?.url_list || [])[0] || '',
    author: {
      nickname: author.nickname || '',
      avatar: (author.avatar_thumb?.url_list || [])[0] || (author.avatar_medium?.url_list || [])[0] || '',
      uid: author.uid || author.unique_id || '',
    },
    music: {
      title: music.title || '',
      author: music.author || '',
    },
    stats: {
      diggCount: item.statistics?.digg_count || 0,
      commentCount: item.statistics?.comment_count || 0,
      shareCount: item.statistics?.share_count || 0,
      playCount: item.statistics?.play_count || 0,
    },
    createTime: item.create_time || 0,
  };
}

// ---------- 快手解析 ----------

async function parseKuaishou(shareUrl) {
  const finalUrl = await getFinalUrl(shareUrl);

  // 从重定向 URL 中提取 photoId
  let photoId = '';
  const ksMatch1 = finalUrl.match(/photoId=([^&]+)/);
  const ksMatch2 = finalUrl.match(/short-video\/([^?]+)/);

  if (ksMatch1) photoId = ksMatch1[1];
  else if (ksMatch2) photoId = ksMatch2[1];

  if (!photoId) {
    // 尝试从 HTML 页面提取
    try {
      const htmlResp = await axios.get(shareUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        },
      });
      const html = htmlResp.data;
      const m = html.match(/photoId["']?\s*[:=]\s*["']?([^"',&]+)/);
      if (m) photoId = m[1];
    } catch (_) {}
  }

  if (!photoId) throw new Error('无法提取视频ID');

  // 调用快手 API
  const apiUrl = 'https://www.kuaishou.com/graphql';
  const payload = {
    operationName: 'visionVideoDetail',
    variables: { photoId, page: 'detail' },
    query: `
      query visionVideoDetail($photoId: String!) {
        visionVideoDetail(photoId: $photoId) {
          photo { id caption duration photoUrl coverUrl
            videoResource { url }
          }
          author { id name headerUrl }
          music { musicName authorName }
          counts { viewCount likeCount commentCount shareCount }
          createTime
        }
      }
    `,
  };

  const apiResp = await axios.post(apiUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Referer': 'https://www.kuaishou.com/',
      'Origin': 'https://www.kuaishou.com',
    },
  });

  const detail = apiResp.data?.data?.visionVideoDetail;
  if (!detail) throw new Error('获取快手视频信息失败');

  const photo = detail.photo;
  let videoUrl = photo?.videoResource?.url || photo?.photoUrl || '';

  // 快手去水印：替换域名
  if (videoUrl) {
    videoUrl = videoUrl
      .replace(/txmov2\.a\.yximgs\.com/g, 'txmov2.a.yximgs.com')
      .replace(/jsmov2\.a\.yximgs\.com/g, 'jsmov2.a.yximgs.com');
  }

  return {
    platform: 'kuaishou',
    videoId: photoId,
    desc: photo?.caption || '',
    videoUrl,
    coverUrl: photo?.coverUrl || photo?.photoUrl || '',
    author: {
      nickname: detail.author?.name || '',
      avatar: detail.author?.headerUrl || '',
      uid: detail.author?.id || '',
    },
    music: {
      title: detail.music?.musicName || '',
      author: detail.music?.authorName || '',
    },
    stats: {
      diggCount: detail.counts?.likeCount || 0,
      commentCount: detail.counts?.commentCount || 0,
      shareCount: detail.counts?.shareCount || 0,
      playCount: detail.counts?.viewCount || 0,
    },
    createTime: detail.createTime || 0,
  };
}

// ---------- API 路由 ----------

app.post('/api/parse', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: '请输入视频链接' });

    const cleanUrl = extractUrl(url);

    // 判断平台
    const isDouyin = /douyin\.com|iesdouyin\.com/i.test(cleanUrl);
    const isKuaishou = /kuaishou\.com|chenzhongtech\.com/i.test(cleanUrl);

    if (!isDouyin && !isKuaishou) {
      return res.status(400).json({ error: '仅支持抖音和快手视频链接' });
    }

    let result;
    if (isDouyin) {
      result = await parseDouyin(cleanUrl);
    } else {
      result = await parseKuaishou(cleanUrl);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('解析失败:', err.message);
    res.status(500).json({ error: err.message || '解析失败，请稍后重试' });
  }
});

// 视频代理下载（解决跨域问题）
app.get('/api/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: '缺少视频地址' });

    const resp = await axios.get(decodeURIComponent(url), {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        'Referer': 'https://www.douyin.com/',
      },
      timeout: 30000,
    });

    const disposition = resp.headers['content-disposition'] || '';
    const contentType = resp.headers['content-type'] || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    if (disposition) res.setHeader('Content-Disposition', disposition);
    else res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    resp.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: '下载失败' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 视频解析服务已启动: http://localhost:${PORT}`);
});
