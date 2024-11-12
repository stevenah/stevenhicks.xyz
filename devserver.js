
const http = require('http');
const fs = require('fs');
const path = require('path');

const srcDir = process.argv[2] || '.';
const publicDir = 'public';

const server = http.createServer((req, res) => {
    const filePath = path.join(srcDir, req.url === '/' ? 'index.html' : req.url);

    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }

        content = content.replace(/<!--\s*(.+\.html)\s*-->/g, (match, includePath) => {
            const includeFilePath = path.join(path.dirname(filePath), includePath);

            try {
                return fs.readFileSync(includeFilePath, 'utf8');
            } catch (e) {
                return `<h1>Failed to load ${includePath}</h1>`;
            }
        });

        content = content.replace(/<link\s+[^>]*href="(.+\.css)"[^>]*>/g, (match, cssPath) => {
            const cssFilePath = path.join(path.dirname(filePath), cssPath);
            try {
                const cssContent = fs.readFileSync(cssFilePath, 'utf8');
                return `<style>${cssContent}</style>`;
            } catch (e) {
                return `<h1>Failed to load CSS from ${cssPath}</h1>`;
            }
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
