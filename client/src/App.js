import { useEffect, useRef, useState } from 'react';
import { IoMdAirplane } from "react-icons/io";
import ClosestPlanes from './components/closest-planes';
import './App.css';

function App() {
  const audioRef = useRef(null);
  const circleRef = useRef(null);
  const backingCircleRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const atcGainRef = useRef(null);
  const animationIdRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const circle = circleRef.current;
    const backingCircle = backingCircleRef.current;
    if (!audio || !circle || !backingCircle) return;

    const handleClick = () => {
      if (!atcGainRef.current) return;
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      atcGainRef.current.gain.value = newMuted ? 0 : 1;
    };

    circle.addEventListener('click', handleClick);

    const setupAudioContext = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create ATC stream source
      sourceRef.current = audioContext.createMediaElementSource(audio);

      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      atcGainRef.current = audioContext.createGain();
      atcGainRef.current.gain.value = 1; // Initially unmuted

      sourceRef.current.connect(atcGainRef.current);
      atcGainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);

      // Elevator music (looping)
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
          elevatorGain.connect(audioContext.destination);
          elevatorSource.start();
        })
        .catch(err => {
          console.error('Failed to load elevator music:', err);
        });

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
      backingCircle.style.transform = `scale(${(scale ** 2.5).toFixed(3)})`;
    };

    const handleFirstInteraction = async () => {
      if (!audioContextRef.current) {
        setupAudioContext();
        await audioRef.current.play();
      }
    };

    // Start audio context on first user interaction
    window.addEventListener('click', handleFirstInteraction, { once: true });

    return () => {
      circle.removeEventListener('click', handleClick);
      window.removeEventListener('click', handleFirstInteraction);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isMuted]);

  return (
    <>
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
    </>
  );
}

export default App;
