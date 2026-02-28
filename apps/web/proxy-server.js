const http = require('http');

const server = http.createServer((req, res) => {
    console.log('\n--- INCOMING REQUEST ---');
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        if (body) {
            console.log('Body:', body);
        }
        console.log('------------------------\n');

        const options = {
            hostname: '127.0.0.1',
            port: 8000,
            path: req.url,
            method: req.method,
            headers: req.headers
        };

        const proxyReq = http.request(options, proxyRes => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });

        proxyReq.on('error', e => {
            console.error('Proxy Error:', e.message);
            res.writeHead(500);
            res.end();
        });

        if (body) proxyReq.write(body);
        proxyReq.end();
    });
});

server.listen(8001, () => {
    console.log('Proxy listening on 8001, forwarding to 8000');
});
