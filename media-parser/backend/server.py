#!/usr/bin/env python3
"""短视频去水印解析 API — Render 云部署版"""
import json, re, os, ssl, socket
import urllib.request, urllib.parse, urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get('PORT', 3000))

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'


def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    if 'User-Agent' not in (headers or {}):
        req.add_header('User-Agent', UA)
    try:
        resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=15)
        return resp.geturl(), resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        return e.headers.get('Location', url), ''


def clean_url(u):
    return u.replace('\\u002F', '/').replace('\\u0026', '&')


# ===================== 抖音解析 =====================

def parse_douyin(share_url):
    final_url, html = http_get(share_url)
    video_id = ''
    for pat in [r'/video/(\d+)', r'/note/(\d+)', r'/photo/(\d+)', r'modal_id=(\d+)',
                 r'"aweme_id"\s*:\s*"(\d+)"', r'"aweme_id"\s*:\s*(\d+)']:
        m = re.search(pat, final_url + html)
        if m: video_id = m.group(1); break
    if not video_id:
        raise ValueError('无法提取视频ID，请确认链接有效')

    desc = re.search(r'"desc"\s*:\s*"([^"]*)"', html)
    desc = desc.group(1).replace('\\u002F', '/') if desc else ''
    nickname = re.search(r'"nickname"\s*:\s*"([^"]*)"', html)
    nickname = nickname.group(1) if nickname else ''
    avatar = re.search(r'"avatar_thumb"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
    avatar = clean_url(avatar.group(1)) if avatar else ''
    cover = re.search(r'"cover"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
    cover = clean_url(cover.group(1)) if cover else ''
    music_title = re.search(r'"title"\s*:\s*"([^"]*)"', html)
    music_title = music_title.group(1) if music_title else ''
    music_author = re.search(r'"author"\s*:\s*"([^"]*)"', html)
    music_author = music_author.group(1) if music_author else ''

    # 从 HTML 提取视频地址（优先）
    pm = re.search(r'"play_addr"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
    play_url = clean_url(pm.group(1)) if pm else ''
    if play_url:
        play_url = re.sub(r'playwm', 'play', play_url)
        play_url = re.sub(r'/watermark[^/]*/', '/', play_url)

    # 备用：调用 API 获取无水印地址
    if not play_url:
        api_url = f'https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids={video_id}'
        _, api_html = http_get(api_url, headers={'Referer': 'https://www.douyin.com/'})
        if api_html:
            try:
                data = json.loads(api_html)
                item = data.get('item_list', [{}])[0] if 'item_list' in data else data
                if 'video' in item and item['video']:
                    play_addr = item['video'].get('play_addr', {})
                    url_list = play_addr.get('url_list', [])
                    play_url = url_list[0] if url_list else ''
                    if play_url:
                        play_url = re.sub(r'playwm', 'play', play_url)
                        play_url = re.sub(r'/watermark[^/]*/', '/', play_url)
            except Exception:
                pass

    # 提取图片
    images = []
    media_type = 'video'
    # 从 HTML 尝试提取 images
    for img_block in re.findall(r'"images"\s*:\s*\[([^\]]+)', html):
        for u in re.findall(r'"url_list"\s*:\s*\[\s*"([^"]+)"', img_block):
            if u not in images: images.append(clean_url(u))
    if not images and cover:
        images.append(cover)

    # 统计
    digg = int(re.search(r'"digg_count"\s*:\s*(\d+)', html).group(1)) if re.search(r'"digg_count"\s*:\s*(\d+)', html) else 0
    comment = int(re.search(r'"comment_count"\s*:\s*(\d+)', html).group(1)) if re.search(r'"comment_count"\s*:\s*(\d+)', html) else 0
    share = int(re.search(r'"share_count"\s*:\s*(\d+)', html).group(1)) if re.search(r'"share_count"\s*:\s*(\d+)', html) else 0

    return {
        'platform': 'douyin', 'videoId': video_id, 'desc': desc,
        'videoUrl': play_url, 'coverUrl': cover,
        'author': {'nickname': nickname, 'avatar': avatar, 'uid': ''},
        'music': {'title': music_title, 'author': music_author},
        'images': images if images else ([avatar] if avatar else []),
        'stats': {'diggCount': digg, 'commentCount': comment, 'shareCount': share},
        'type': media_type,
    }


# ===================== 快手解析 =====================

def parse_kuaishou(share_url):
    final_url, html = http_get(share_url)
    video_id = ''
    for pat in [r'/short-video/([\w]+)', r'/fw/photo/([\w]+)', r'photoId=([\w]+)',
                 r'"photoId"\s*:\s*"([\w]+)"', r'"videoId"\s*:\s*"([\w]+)"']:
        m = re.search(pat, final_url + html)
        if m: video_id = m.group(1); break
    if not video_id:
        raise ValueError('无法提取快手视频ID')

    desc = re.search(r'"caption"\s*:\s*"([^"]*)"', html)
    desc = desc.group(1).replace('\\u002F', '/') if desc else ''
    nickname = re.search(r'"userName"\s*:\s*"([^"]*)"', html)
    nickname = nickname.group(1) if nickname else ''
    avatar = re.search(r'"headUrl"\s*:\s*"([^"]*)"', html)
    avatar = clean_url(avatar.group(1)) if avatar else ''
    cover = re.search(r'"poster"\s*:\s*"([^"]*)"', html)
    cover = clean_url(cover.group(1)) if cover else ''
    play_url = re.search(r'"playUrl"\s*:\s*"([^"]*)"', html)
    play_url = clean_url(play_url.group(1)) if play_url else ''
    if not play_url:
        play_url = re.search(r'"srcNoMark"\s*:\s*"([^"]*)"', html)
        play_url = clean_url(play_url.group(1)) if play_url else ''

    return {
        'platform': 'kuaishou', 'videoId': video_id, 'desc': desc,
        'videoUrl': play_url, 'coverUrl': cover,
        'author': {'nickname': nickname, 'avatar': avatar, 'uid': ''},
        'type': 'video',
    }


# ===================== HTTP 处理器 =====================

class APIHandler(BaseHTTPRequestHandler):

    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json_resp(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self._set_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/parse':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length) if length else b'{}'
                data = json.loads(body)
                url = data.get('url', '').strip()
                if not url:
                    return self._json_resp(400, {'error': '请输入视频链接'})
                # 提取 URL
                m = re.search(r'https?://[^\s]+', url)
                clean = m.group(0) if m else url.strip()
                clean = clean.rstrip(',;，；。')
                if 'douyin.com' in clean or 'iesdouyin.com' in clean:
                    result = parse_douyin(clean)
                elif 'kuaishou.com' in clean or 'chenzhongtech.com' in clean:
                    result = parse_kuaishou(clean)
                else:
                    return self._json_resp(400, {'error': '仅支持抖音和快手视频链接'})
                self._json_resp(200, {'success': True, 'data': result})
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._json_resp(500, {'error': str(e) or '解析失败'})
        else:
            self._json_resp(404, {'error': 'Not Found'})

    def do_GET(self):
        if self.path.startswith('/api/preview/video'):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            url = params.get('url', [''])[0]
            if not url:
                return self._json_resp(400, {'error': '缺少视频地址'})
            try:
                req = urllib.request.Request(urllib.parse.unquote(url), headers={
                    'User-Agent': UA,
                    'Referer': 'https://www.douyin.com/',
                })
                resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=30)
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', resp.headers.get('Content-Type', 'video/mp4'))
                self.send_header('Accept-Ranges', 'bytes')
                cl = resp.headers.get('Content-Length', '')
                if cl: self.send_header('Content-Length', cl)
                self.end_headers()
                while True:
                    chunk = resp.read(65536)
                    if not chunk: break
                    self.wfile.write(chunk)
            except Exception as e:
                self._json_resp(500, {'error': f'视频预览失败: {e}'})

        elif self.path.startswith('/api/download'):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            url = params.get('url', [''])[0]
            filename = params.get('filename', ['video.mp4'])[0]
            if not url:
                return self._json_resp(400, {'error': '缺少下载地址'})
            try:
                req = urllib.request.Request(urllib.parse.unquote(url), headers={
                    'User-Agent': UA,
                    'Referer': 'https://www.douyin.com/',
                })
                resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=60)
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition',
                    f'attachment; filename="{urllib.parse.quote(filename)}"')
                cl = resp.headers.get('Content-Length', '')
                if cl: self.send_header('Content-Length', cl)
                self.end_headers()
                while True:
                    chunk = resp.read(65536)
                    if not chunk: break
                    self.wfile.write(chunk)
            except Exception as e:
                self._json_resp(500, {'error': f'下载失败: {e}'})

        elif self.path == '/' or self.path == '/health':
            self._json_resp(200, {'status': 'ok', 'service': 'media-parser-api'})
        else:
            self._json_resp(404, {'error': 'Not Found'})

    def log_message(self, fmt, *args):
        print(f'[{self.log_date_time_string()}] {args[0]}')


if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), APIHandler)
    server.allow_reuse_address = True
    print(f'✅ API 服务已启动: 0.0.0.0:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n⏹ 已停止')
        server.server_close()
