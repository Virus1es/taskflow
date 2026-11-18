import http from 'node:http';

const port = Number(process.env.PORT || 3000);

http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    res.end('TaskFlow diagnostic OK');
}).listen(port, '0.0.0.0', () => {
    console.log(`Diagnostic server listening on ${port}`);
});