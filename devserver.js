
const http = require('http');
const fs = require('fs');
const path = require('path');

const srcDir = process.argv[2] || '.';
const publicDir = 'public';

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.pdf': 'application/pdf',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
};

const textExtensions = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);

const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    const filePath = path.join(srcDir, urlPath === '/' ? 'index.html' : urlPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const isTextFile = textExtensions.has(ext);

    const publicFilePath = path.join(publicDir, urlPath === '/' ? 'index.html' : urlPath);

    fs.readFile(filePath, isTextFile ? 'utf8' : null, (err, content) => {
        if (err) {
            // Try public directory as fallback
            fs.readFile(publicFilePath, isTextFile ? 'utf8' : null, (pubErr, pubContent) => {
                if (pubErr) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1>');
                    return;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(pubContent);
            });
            return;
        }

        if (ext === '.html') {
            content = content.replace(/<!--\s*(.+\.html)\s*-->/g, (match, includePath) => {
                const includeFilePath = path.join(path.dirname(filePath), includePath);
                try {
                    return fs.readFileSync(includeFilePath, 'utf8');
                } catch (e) {
                    return `<!-- Failed to load ${includePath} -->`;
                }
            });

            content = content.replace(/<link\s+[^>]*href="(.+\.css)"[^>]*>/g, (match, cssPath) => {
                const cssFilePath = path.join(path.dirname(filePath), cssPath);
                try {
                    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
                    return `<style>${cssContent}</style>`;
                } catch (e) {
                    return match;
                }
            });
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
