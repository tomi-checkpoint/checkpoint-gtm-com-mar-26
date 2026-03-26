const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  // Strip query string
  const urlPath = req.url.split('?')[0];

  let filePath;
  if (urlPath === '/') {
    filePath = path.join(ROOT, 'index.html');
  } else {
    filePath = path.join(ROOT, urlPath);
  }

  const ext = path.extname(filePath);

  // If no extension, try as directory (index.html) or .html file
  if (!ext) {
    // Try directory/index.html first, then .html
    const dirIndex = path.join(filePath, 'index.html');
    const htmlFile = filePath + '.html';

    if (fs.existsSync(dirIndex)) {
      filePath = dirIndex;
    } else if (fs.existsSync(htmlFile)) {
      filePath = htmlFile;
    }
  }

  const finalExt = path.extname(filePath);
  const contentType = MIME_TYPES[finalExt] || 'text/html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 — Not Found</h1><p><a href="/">Back to home</a></p>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
