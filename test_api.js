const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 4000,
    path: '/api/users/3ofyi638',
    method: 'GET'
};

console.log('Sending request to', options.hostname, options.port, options.path);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
