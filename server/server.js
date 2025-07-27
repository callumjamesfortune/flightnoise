const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const PORT = 7633;

const LIVEATC_STREAM = 'https://d.liveatc.net/klax6';
const ELEVATOR_MUSIC_PATH = path.join(__dirname, 'public', 'elevator.mp3');

app.get('/stream', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'audio/mpeg');

  const command = ffmpeg()
    .input(LIVEATC_STREAM)
    .input(ELEVATOR_MUSIC_PATH)
    .inputOptions(['-stream_loop -1']) // loop elevator music
    .complexFilter([
      '[0:a]volume=1[a0]',       // ATC
      '[1:a]volume=0.08[a1]',    // Elevator music (quieter)
      '[a0][a1]amix=inputs=2:duration=longest[aout]' // Mix both
    ])
    .outputOptions([
      '-map [aout]',
      '-f mp3',                  // Output format
      '-ac 2',                   // Stereo
      '-ar 44100',               // Sample rate
      '-b:a 192k'                // Bitrate
    ])
    .on('start', commandLine => {
      console.log('FFmpeg command:', commandLine);
    })
    .on('error', (err, stdout, stderr) => {
      console.error('FFmpeg error:', err.message);
      console.error('FFmpeg stderr:', stderr);
      if (!res.headersSent) {
        res.status(500).send('Audio processing error');
      }
    })
    .on('end', () => {
      console.log('FFmpeg stream ended');
    });

  const stream = command.pipe();
  stream.pipe(res);

  req.on('close', () => {
    command.kill('SIGINT'); // stop processing when client disconnects
  });
});

app.listen(PORT, () => {
  console.log(`Node server streaming mixed audio at http://localhost:${PORT}`);
});
