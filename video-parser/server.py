#!/usr/bin/env python3
"""短视频去水印解析服务 - 支持抖音/快手 - 视频+图片"""
import json
import re
import urllib.request
import urllib.parse
import urllib.error
import ssl
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

PORT = 3000

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'

# ===================== 工具函数 =====================

def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    if 'User-Agent' not in (headers or {}):
        req.add_header('User-Agent', UA)
    try:
        resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=15)
        body = resp.read().decode('utf-8', errors='replace')
        return resp.geturl(), body
    except urllib.error.HTTPError as e:
        return e.headers.get('Location', url), ''


def extract_url(text):
    match = re.search(r'https?://[^\s]+', text)
    return match.group(0) if match else text.strip()


def clean_url(u):
    """清理 URL 中的转义字符"""
    return u.replace('\\u002F', '/').replace('\\u0026', '&')


def watermark_free_url(u):
    """去掉图片水印参数"""
    u = re.sub(r'watermark=[^&\s]+', 'watermark=0', u)
    return u


# ===================== 抖音解析 =====================

def parse_douyin(share_url):
    final_url, html = http_get(share_url)

    # 提取 video_id
    video_id = ''
    for pat in [r'/video/(\d+)', r'/note/(\d+)', r'/photo/(\d+)', r'modal_id=(\d+)',
                 r'"aweme_id"\s*:\s*"(\d+)"', r'"aweme_id"\s*:\s*(\d+)']:
        m = re.search(pat, final_url + html)
        if m:
            video_id = m.group(1)
            break
    if not video_id:
        raise ValueError('无法提取视频ID，请确认链接有效')

    # 从 HTML 提取信息
    desc = nickname = avatar = cover_url = play_url = ''
    music_title = music_author = ''
    comment_count = digg_count = share_count = play_count = 0

    m = re.search(r'"desc"\s*:\s*"([^"]*)"', html)
    if m: desc = m.group(1).replace('\\u002F', '/')

    m = re.search(r'"nickname"\s*:\s*"([^"]*)"', html)
    if m: nickname = m.group(1)

    m = re.search(r'"avatar_thumb"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
    if m: avatar = clean_url(m.group(1))

    m = re.search(r'"cover"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
    if m: cover_url = clean_url(m.group(1))
    if not cover_url:
        m = re.search(r'"origin_cover"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
        if m: cover_url = clean_url(m.group(1))

    m = re.search(r'"play_addr"\s*:\{[^}]*"url_list"\s*:\s*\["([^"]*)"', html)
    if m: play_url = clean_url(m.group(1))

    no_watermark = play_url.replace('playwm', 'play').replace('watermark=1', 'watermark=0') if play_url else ''

    # ============ 提取无水印图片 ============
    images = []

    # 策略1: 从 images 数组中提取
    for img_block in re.findall(r'"images"\s*:\s*\[([^\]]+)', html):
        for u in re.findall(r'"url_list"\s*:\s*\[\s*"([^"]+)"', img_block):
            u = watermark_free_url(clean_url(u))
            if u not in images:
                images.append(u)

    # 策略2: 从 url_list 中提取所有图片
    for u in re.findall(r'"url_list"\s*:\s*\[\s*"([^"]+)"', html):
        u = watermark_free_url(clean_url(u))
        if u not in images and is_douyin_image(u):
            images.append(u)

    # 至少用封面兜底
    if not images and cover_url:
        images.append(watermark_free_url(clean_url(cover_url)))

    # ============ 音乐 ============
    m = re.search(r'"music"\s*:\{[^}]*"title"\s*:\s*"([^"]*)"', html)
    if m: music_title = m.group(1)
    m = re.search(r'"music"\s*:\{[^}]*"author"\s*:\s*"([^"]*)"', html)
    if m: music_author = m.group(1)

    # ============ 统计 ============
    m = re.search(r'"comment_count"\s*:\s*(\d+)', html)
    if m: comment_count = int(m.group(1))
    m = re.search(r'"digg_count"\s*:\s*(\d+)', html)
    if m: digg_count = int(m.group(1))
    m = re.search(r'"share_count"\s*:\s*(\d+)', html)
    if m: share_count = int(m.group(1))
    m = re.search(r'"play_count"\s*:\s*(\d+)', html)
    if m: play_count = int(m.group(1))

    return {
        'platform': 'douyin', 'videoId': video_id, 'desc': desc,
        'videoUrl': no_watermark, 'coverUrl': cover_url,
        'author': {'nickname': nickname, 'avatar': avatar, 'uid': ''},
        'music': {'title': music_title, 'author': music_author},
        'images': images,
        'stats': {'diggCount': digg_count, 'commentCount': comment_count,
                   'shareCount': share_count, 'playCount': play_count},
        'createTime': 0,
    }


def is_douyin_image(url):
    """判断 URL 是否属于抖音图片 CDN"""
    patterns = ['douyincdn.com', 'douyinpic.com', 'pstatp.com', 'p9-dy-ipv6.byted',
                'p3-dy-ipv6.byted', 'p1-dy-ipv6.byted', 'p6-dy-ipv6.byted']
    return any(p in url for p in patterns)


# ===================== 快手解析 =====================

def parse_kuaishou(share_url):
    final_url, html = http_get(share_url)

    photo_id = ''
    for pat in [r'photoId=([^&]+)', r'/photo/([^?&]+)', r'"photo_id"\s*:\s*(\d+)']:
        m = re.search(pat, final_url + html)
        if m:
            photo_id = m.group(1)
            break
    if not photo_id:
        raise ValueError('无法提取视频ID，请确认链接有效')

    desc = nickname = avatar = cover_url = video_url = ''
    m = re.search(r'"caption"\s*:\s*"([^"]*)"', html)
    if m: desc = m.group(1).replace('\\u002F', '/')
    m = re.search(r'"userName"\s*:\s*"([^"]*)"', html)
    if m: nickname = m.group(1)
    m = re.search(r'"headurl"\s*:\s*"([^"]*)"', html)
    if m: avatar = clean_url(m.group(1))
    m = re.search(r'"coverUrl"\s*:\s*"([^"]*)"', html)
    if m: cover_url = clean_url(m.group(1))
    m = re.search(r'"photoUrl"\s*:\s*"([^"]*)"', html)
    if m: video_url = clean_url(m.group(1))

    # ============ 提取无水印图片 ============
    images = []
    for u in re.findall(r'"photoUrl"\s*:\s*"([^"]+)"', html):
        u = clean_url(u)
        if u not in images:
            images.append(u)
    for u in re.findall(r'"url"\s*:\s*"([^"]+)"', html):
        u = clean_url(u)
        if u not in images and ('kwimgs' in u or 'kuaishouimg' in u or 'yximgs' in u):
            images.append(u)
    if not images and cover_url:
        images.append(cover_url)

    return {
        'platform': 'kuaishou', 'videoId': photo_id, 'desc': desc,
        'videoUrl': video_url, 'coverUrl': cover_url,
        'author': {'nickname': nickname, 'avatar': avatar, 'uid': ''},
        'music': {'title': '', 'author': ''},
        'images': images,
        'stats': {'diggCount': 0, 'commentCount': 0, 'shareCount': 0, 'playCount': 0},
        'createTime': 0,
    }


# ===================== HTTP 服务器 =====================

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')


class VideoHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/parse':
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len) if content_len else b'{}'
            try:
                data = json.loads(body)
                url = data.get('url', '').strip()
                if not url:
                    self._json_resp(400, {'error': '请输入视频链接'})
                    return
                clean = extract_url(url)
                if 'douyin.com' in clean or 'iesdouyin.com' in clean:
                    result = parse_douyin(clean)
                elif 'kuaishou.com' in clean or 'chenzhongtech.com' in clean:
                    result = parse_kuaishou(clean)
                else:
                    self._json_resp(400, {'error': '仅支持抖音和快手视频链接'})
                    return
                self._json_resp(200, {'success': True, 'data': result})
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._json_resp(500, {'error': str(e) or '解析失败，请稍后重试'})
        else:
            self._json_resp(404, {'error': 'Not Found'})

    def do_GET(self):
        if self.path.startswith('/api/preview/video'):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            url = params.get('url', [''])[0]
            if not url:
                self._json_resp(400, {'error': '缺少视频地址'})
                return
            try:
                req = urllib.request.Request(urllib.parse.unquote(url), headers={
                    'User-Agent': UA,
                    'Referer': 'https://www.douyin.com/',
                    'Accept': 'video/mp4, video/webm, */*',
                })
                resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=30)
                content_type = resp.headers.get('Content-Type', 'video/mp4')
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', content_type)
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Content-Length', resp.headers.get('Content-Length', '0'))
                self.end_headers()
                while True:
                    chunk = resp.read(65536)
                    if not chunk: break
                    self.wfile.write(chunk)
            except Exception as e:
                self._json_resp(500, {'error': f'视频预览失败: {e}'})
        if self.path.startswith('/api/download/image'):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            url = params.get('url', [''])[0]
            if not url:
                self._json_resp(400, {'error': '缺少图片地址'})
                return
            try:
                req = urllib.request.Request(urllib.parse.unquote(url), headers={
                    'User-Agent': UA,
                    'Referer': 'https://www.douyin.com/',
                })
                resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=30)
                content_type = resp.headers.get('Content-Type', 'image/jpeg')
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Disposition', 'attachment; filename="image.jpg"')
                self.send_header('Content-Length', resp.headers.get('Content-Length', '0'))
                self.end_headers()
                while True:
                    chunk = resp.read(65536)
                    if not chunk: break
                    self.wfile.write(chunk)
            except Exception as e:
                self._json_resp(500, {'error': f'图片下载失败: {e}'})
        elif self.path.startswith('/api/download'):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            url = params.get('url', [''])[0]
            if not url:
                self._json_resp(400, {'error': '缺少视频地址'})
                return
            try:
                req = urllib.request.Request(urllib.parse.unquote(url), headers={
                    'User-Agent': UA,
                    'Referer': 'https://www.douyin.com/',
                })
                resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=30)
                self.send_response(200)
                self._set_cors()
                self.send_header('Content-Type', 'video/mp4')
                self.send_header('Content-Disposition', 'attachment; filename="video.mp4"')
                self.end_headers()
                while True:
                    chunk = resp.read(65536)
                    if not chunk: break
                    self.wfile.write(chunk)
            except Exception as e:
                self._json_resp(500, {'error': f'下载失败: {e}'})
        else:
            super().do_GET()

    def _json_resp(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self._set_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f'[{self.log_date_time_string()}] {args[0]}')


class DualStackServer(HTTPServer):
    allow_reuse_address = True
    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return super().server_bind()

if __name__ == '__main__':
    server = DualStackServer(('', PORT), VideoHandler)
    print(f'✅ 视频解析服务已启动: http://localhost:{PORT}')
    print(f'📂 静态文件目录: {PUBLIC_DIR}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n⏹ 服务已停止')
        server.server_close()
