const express = require('express');
const request = require('request');
const app = express();
const PORT = 3001;

const LIVEATC_STREAM = 'https://d.liveatc.net/klax6';

app.get('/stream', (req, res) => {
  // Set CORS header to allow your React app origin or *
  res.setHeader('Access-Control-Allow-Origin', '*'); // or 'http://localhost:3001'
  res.setHeader('Content-Type', 'audio/mpeg');

  const streamReq = request.get(LIVEATC_STREAM);

  // When the remote server sets Access-Control-Allow-Origin, remove it to avoid conflicts:
  streamReq.on('response', (streamRes) => {
    // Delete CORS headers from upstream response before piping
    delete streamRes.headers['access-control-allow-origin'];
    delete streamRes.headers['access-control-allow-credentials'];
  });

  streamReq.pipe(res);

  streamReq.on('error', (err) => {
    console.error('Stream error:', err);
    res.sendStatus(500);
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
