import { useEffect, useRef, useState } from 'react';
import { IoMdAirplane } from "react-icons/io";
import ClosestPlanes from './components/closest-planes';
import './App.css';

function App() {
  const audioRef = useRef(null);
  const circleRef = useRef(null);
  const backingCircleRef = useRef(null);

  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const masterGainRef = useRef(null);
  const animationIdRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const circle = circleRef.current;
    const backingCircle = backingCircleRef.current;
    if (!audio || !circle || !backingCircle) return;

    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      audioContextRef.current = context;

      const masterGain = context.createGain();
      masterGain.gain.value = 1;  // always audible
      masterGainRef.current = masterGain;

      const source = context.createMediaElementSource(audio);
      sourceRef.current = source;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(masterGain);
      masterGain.connect(context.destination);
    }

    // Media Session API setup
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: 'FlightNoise',
        artist: 'By Caldog',
        album: 'FlightNoise',
        artwork: [
          { src: 'https://ubuntu.seefortune.co.uk/flightnoise/icon.png', sizes: '1024x1024', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    }

    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      animationIdRef.current = requestAnimationFrame(animate);

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const val = (dataArrayRef.current[i] - 128) / 128;
        sum += val * val;
      }

      const rms = Math.sqrt(sum / dataArrayRef.current.length);
      const scale = 1 + rms * 5;
      backingCircle.style.transform = `scale(${(scale ** 1.35).toFixed(3)})`;
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!animationIdRef.current) animate();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      backingCircle.style.transform = 'scale(1)';
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if (!audio.paused) {
      handlePlay();
    }

    const handleClick = async () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        audioContextRef.current = context;
        if (context.state === 'suspended') await context.resume();
      }

      if (audio.paused) {
        try {
          await audio.play();
        } catch (e) {
          console.warn('Failed to play audio:', e);
        }
      } else {
        audio.pause();
      }
    };

    circle.addEventListener('click', handleClick);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      circle.removeEventListener('click', handleClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
      <audio
        id="atcPlayer"
        ref={audioRef}
        preload="auto"
        className="hidden"
        crossOrigin="anonymous"
        src="http://ubuntu.seefortune.co.uk/flightnoise/api/stream"
      >
        Your browser does not support the audio element.
      </audio>

      <div className='relative w-24 h-24'>
        <div
          id="circle"
          ref={circleRef}
          className="absolute w-24 h-24 z-10 bg-purple-800 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
          title={isPlaying ? "Click to pause audio" : "Click to play audio"}
          aria-pressed={isPlaying}
          role="button"
        >
          <IoMdAirplane className='text-gray-100 text-[2.8em]' />
        </div>

        <div
          id="backing-circle"
          ref={backingCircleRef}
          className="absolute w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
          title={isPlaying ? "Click to pause audio" : "Click to play audio"}
        />
      </div>

      <ClosestPlanes />
    </div>
  );
}

export default App;
