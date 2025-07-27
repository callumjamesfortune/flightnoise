const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 7633;

const LIVEATC_STREAM = 'https://d.liveatc.net/klax6';
const ELEVATOR_MUSIC_PATH = path.join(__dirname, 'public', 'elevator.mp3');

app.get('/stream', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'audio/mpeg');

  const ffmpegArgs = [
    '-user_agent', 'Mozilla/5.0',   // <-- Add this line to spoof user agent
    '-i', LIVEATC_STREAM,
    '-stream_loop', '-1',            // loop elevator music
    '-i', ELEVATOR_MUSIC_PATH,
    '-filter_complex',
    '[0:a]volume=1[a0];[1:a]volume=0.08[a1];[a0][a1]amix=inputs=2:duration=longest[aout]',
    '-map', '[aout]',
    '-f', 'mp3',
    '-ac', '2',
    '-ar', '44100',
    '-b:a', '192k',
    'pipe:1'                         // output to stdout
  ];

  const ffmpeg = spawn('ffmpeg', ffmpegArgs);

  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on('data', (data) => {
    console.error('FFmpeg stderr:', data.toString());
  });

  ffmpeg.on('error', (err) => {
    console.error('Failed to start FFmpeg:', err);
    if (!res.headersSent) res.status(500).send('Failed to start stream');
  });

  ffmpeg.on('close', (code, signal) => {
    console.log(`FFmpeg exited with code ${code} and signal ${signal}`);
    res.end();
  });

  req.on('close', () => {
    ffmpeg.kill('SIGINT');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
