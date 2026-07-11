const http = require('http');
const fs = require('fs');
const path = require('path');
const BASE = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(BASE, filePath);
  
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found: ' + filePath);
  }
});

server.listen(8765, '0.0.0.0', () => {
  console.log('Server running at http://localhost:8765');
  fs.writeFileSync('/tmp/codex-server-ready', 'ok');
});
