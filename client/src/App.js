import { useEffect, useRef, useState } from 'react';
import { IoMdAirplane } from "react-icons/io";
import ClosestPlanes from './components/closest-planes';
import './App.css';

function App() {
  const audioRef = useRef(null);
  const circleRef = useRef(null);
  const backingCircleRef = useRef(null);

  // Persistent references
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const masterGainRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationIdRef = useRef(null);
  const elevatorSourceRef = useRef(null);
  const elevatorGainRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const circle = circleRef.current;
    const backingCircle = backingCircleRef.current;
    if (!audio || !circle || !backingCircle) return;

    // Setup audio nodes after AudioContext is created
    const setupAudioNodes = (audioContext) => {
      // Create master gain
      const masterGain = audioContext.createGain();
      masterGain.gain.value = isMuted ? 0 : 1;
      masterGainRef.current = masterGain;

      // Create MediaElementSource ONCE
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audio);
        sourceRef.current.connect(masterGain);
      }

      // Setup analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      masterGain.connect(analyser);
      analyser.connect(audioContext.destination);

      // Load elevator music buffer
      fetch('/flightnoise/elevator.mp3')
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(buffer => {
          const elevatorSource = audioContext.createBufferSource();
          elevatorSource.buffer = buffer;
          elevatorSource.loop = true;

          const elevatorGain = audioContext.createGain();
          elevatorGain.gain.value = 0.08;

          elevatorSource.connect(elevatorGain);
          elevatorGain.connect(masterGain);

          elevatorSource.start();

          elevatorSourceRef.current = elevatorSource;
          elevatorGainRef.current = elevatorGain;
        })
        .catch(console.error);

      // Animation for visualizer
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);
        analyser.getByteTimeDomainData(dataArrayRef.current);

        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          let val = (dataArrayRef.current[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);

        const scale = 1 + rms * 5;
        circle.style.transform = `scale(${scale.toFixed(3)})`;
        backingCircle.style.transform = `scale(${(scale ** 2.5).toFixed(3)})`;
      };
      animate();
    };

    // Handler for first user interaction
    const handleFirstInteraction = async () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        setupAudioNodes(audioContextRef.current);
      }
      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      try {
        await audio.play();
      } catch (e) {
        console.warn('Failed to play audio:', e);
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });

    // Mute toggle handler
    const handleClick = () => {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = newMuted ? 0 : 1;
      }
    };
    circle.addEventListener('click', handleClick);

    return () => {
      circle.removeEventListener('click', handleClick);
      window.removeEventListener('click', handleFirstInteraction);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      // DO NOT close audioContext here to avoid recreation issues in StrictMode
    };
  }, [isMuted]);

  // Sync gain when isMuted changes (in case changed outside of click handler)
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">

      <audio
        id="atcPlayer"
        ref={audioRef}
        preload="auto"
        className="hidden"
        crossOrigin="anonymous"
        src="https://ubuntu.seefortune.co.uk/flightnoise/api/stream"
      >
        Your browser does not support the audio element.
      </audio>

      <div className='relative w-24 h-24'>

        <div
          id="circle"
          ref={circleRef}
          className="absolute w-24 h-24 z-10 bg-purple-800 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
          title="Click to mute/unmute ATC"
        >
          <IoMdAirplane className='text-gray-100 text-[2.8em]' />
        </div>

        <div
          id="backing-circle"
          ref={backingCircleRef}
          className="absolute w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150"
          title="Click to mute/unmute ATC"
        >
        </div>

      </div>

      <ClosestPlanes />

    </div>
  );
}

export default App;
