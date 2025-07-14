import { useEffect, useRef, useState } from 'react';
import { FaPaperPlane } from "react-icons/fa";
import './App.css';

function App() {
  const audioRef = useRef(null);
  const circleRef = useRef(null);
  const backingCircleRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const filterNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const whiteNoiseGainRef = useRef(null);
  const animationIdRef = useRef(null);
  const whiteNoiseSourceRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    const circle = circleRef.current;
    const backingCircle = backingCircleRef.current;
    if (!audio || !circle || !backingCircle) return;

    const handleClick = async () => {
      if (audio.paused) {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        audio.play();
        setIsPlaying(true);
        setWhiteNoiseVolume(0.02);
      } else {
        audio.pause();
        setIsPlaying(false);
        setWhiteNoiseVolume(0);
      }
    };

    circle.addEventListener('click', handleClick);

    const setupAudioContext = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      const audioContext = audioContextRef.current;

      // Your stream source
      sourceRef.current = audioContext.createMediaElementSource(audio);

      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      filterNodeRef.current = audioContext.createBiquadFilter();
      filterNodeRef.current.type = 'lowpass';

      gainNodeRef.current = audioContext.createGain();

      // Create white noise buffer
      const bufferSize = 2 * audioContext.sampleRate;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      whiteNoiseSourceRef.current = audioContext.createBufferSource();
      whiteNoiseSourceRef.current.buffer = noiseBuffer;
      whiteNoiseSourceRef.current.loop = true;

      whiteNoiseGainRef.current = audioContext.createGain();
      whiteNoiseGainRef.current.gain.value = whiteNoiseVolume;

      // Connect audio stream nodes: source -> filter -> gain -> analyser
      sourceRef.current.connect(filterNodeRef.current);
      filterNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(analyserRef.current);

      // Connect white noise source -> gain -> analyser
      whiteNoiseSourceRef.current.connect(whiteNoiseGainRef.current);
      whiteNoiseGainRef.current.connect(analyserRef.current);

      // Connect analyser to destination
      analyserRef.current.connect(audioContext.destination);

      // Start white noise playback
      whiteNoiseSourceRef.current.start();

      animate();
    };

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        let val = (dataArrayRef.current[i] - 128) / 128;
        sum += val * val;
      }
      let rms = Math.sqrt(sum / dataArrayRef.current.length);

      let scale = 1 + rms * 5;
      circle.style.transform = `scale(${scale.toFixed(3)})`;
      backingCircle.style.transform = `scale(${(scale**2.5).toFixed(3)})`;
    };

    const onPlay = () => {
      if (!audioContextRef.current) {
        setupAudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    const onPause = () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      circle.style.transform = 'scale(1)';
      backingCircle.style.transform = 'scale(1)';
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      circle.removeEventListener('click', handleClick);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (whiteNoiseSourceRef.current) whiteNoiseSourceRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Live updates for white noise volume
  useEffect(() => {
    if (whiteNoiseGainRef.current) {
      whiteNoiseGainRef.current.gain.value = whiteNoiseVolume;
    }
  }, [whiteNoiseVolume]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-8 p-4">

      <audio
        id="atcPlayer"
        ref={audioRef}
        preload="none"
        className="hidden"
        crossOrigin="anonymous"
      >
        <source src="http://localhost:3000/stream" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <div className='relative w-24 h-24'>

        <div
          id="circle"
          ref={circleRef}
          className="absolute w-24 h-24 z-10 bg-purple-800 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
          title="Click to play/pause"
        >
          <FaPaperPlane className='text-gray-100 text-[1.5em]' />
        </div>

        <div
          id="backing-circle"
          ref={backingCircleRef}
          className="absolute w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
          title="Click to play/pause"
        >
        </div>

      </div>

    </div>
  );
}

export default App;
