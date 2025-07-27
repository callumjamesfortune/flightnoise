import { useEffect, useRef, useState } from 'react';
import { IoMdAirplane } from "react-icons/io";
import ClosestPlanes from './components/closest-planes';
import './App.css';

function App() {
  const audioRef = useRef(null);
  const circleRef = useRef(null);

  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const masterGainRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      audioContextRef.current = context;

      if (context.state === 'suspended') await context.resume();

      const masterGain = context.createGain();
      masterGain.gain.value = 1;
      masterGainRef.current = masterGain;

      const source = context.createMediaElementSource(audio);
      sourceRef.current = source;

      source.connect(masterGain);
      masterGain.connect(context.destination);
    }

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.warn('Failed to toggle audio:', e);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const circle = circleRef.current;
    if (!audio || !circle) return;

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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    circle.addEventListener('click', handleClick);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      circle.removeEventListener('click', handleClick);
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
      </div>

      <ClosestPlanes />
    </div>
  );
}

export default App;
