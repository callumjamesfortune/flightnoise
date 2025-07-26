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
  const elevatorSourceRef = useRef(null);
  const elevatorGainRef = useRef(null);
  const atcAnalyserRef = useRef(null);
  const atcDataArrayRef = useRef(null);
  const hasInitializedRef = useRef(false); // ✅ NEW: track first interaction

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const circle = circleRef.current;
    const backingCircle = backingCircleRef.current;
    if (!audio || !circle || !backingCircle) return;

    const setupAudioNodes = (audioContext) => {
      const masterGain = audioContext.createGain();
      masterGain.gain.value = isMuted ? 0 : 1;
      masterGainRef.current = masterGain;

      // Always create and connect source + ATC analyser
      const source = audioContext.createMediaElementSource(audio);
      sourceRef.current = source;

      const atcAnalyser = audioContext.createAnalyser();
      atcAnalyser.fftSize = 256;
      atcAnalyserRef.current = atcAnalyser;
      atcDataArrayRef.current = new Uint8Array(atcAnalyser.frequencyBinCount);

      source.connect(atcAnalyser);
      atcAnalyser.connect(masterGain);

      masterGain.connect(audioContext.destination);

      // Elevator music
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

      const animate = () => {
        if (!atcAnalyserRef.current || !atcDataArrayRef.current) return;
        animationIdRef.current = requestAnimationFrame(animate);

        atcAnalyserRef.current.getByteTimeDomainData(atcDataArrayRef.current);

        let sum = 0;
        for (let i = 0; i < atcDataArrayRef.current.length; i++) {
          const val = (atcDataArrayRef.current[i] - 128) / 128;
          sum += val * val;
        }

        const rms = Math.sqrt(sum / atcDataArrayRef.current.length);
        const scale = 1 + rms * 5;
        backingCircle.style.transform = `scale(${(scale ** 1.2).toFixed(3)})`;
      };
      animate();
    };

    const handleFirstInteraction = async () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        audioContextRef.current = context;
        setupAudioNodes(context);
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') await audioContext.resume();
      try {
        await audio.play();
      } catch (e) {
        console.warn('Failed to play audio:', e);
      }

      hasInitializedRef.current = true; // ✅ Mark initialization done
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });

    const handleClick = () => {
      if (!hasInitializedRef.current) return; // ✅ Prevent toggle on first setup click
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
    };
  }, [isMuted]);

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
