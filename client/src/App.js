import { useEffect, useRef, useState } from 'react';
import { FaPaperPlane } from "react-icons/fa";
import './App.css';

function App() {
  const audioRef = useRef(null);
  const circleRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
  
    const audio = audioRef.current;
    const circle = circleRef.current;
  
    const audioContextRef = { current: null };
    const analyserRef = { current: null };
    const dataArrayRef = { current: null };
    let animationId;
  
    const handleClick = async () => {
      if (audio.paused) {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    };
  
    circle.addEventListener('click', handleClick);
  
    const setupAudioContext = () => {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const audioContext = audioContextRef.current;
  
      const source = audioContext.createMediaElementSource(audio);
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
  
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
  
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
  
      animate();
    };
  
    const animate = () => {
      animationId = requestAnimationFrame(animate);
  
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
  
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        let val = (dataArrayRef.current[i] - 128) / 128;
        sum += val * val;
      }
      let rms = Math.sqrt(sum / dataArrayRef.current.length);
  
      let scale = 1 + rms * 5;
      circle.style.transform = `scale(${scale.toFixed(3)})`;
    };
  
    const onPlay = () => {
      if (!audioContextRef.current) {
        setupAudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
  
    const onPause = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      circle.style.transform = 'scale(1)';
    };
  
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
  
    return () => {
      circle.removeEventListener('click', handleClick);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);
  

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
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

      <div
        id="circle"
        ref={circleRef}
        className="w-24 h-24 bg-purple-800 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
        title="Click to play/pause"
      >
        <FaPaperPlane className='text-gray-100 text-[1.5em]' />
      </div>
    </div>
  );
}

export default App;
