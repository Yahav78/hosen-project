import { useState, useEffect, useRef } from 'react';

export const useAudioDetection = (onTrigger: () => void = () => { }) => {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState<string>('idle');
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyzerRef.current = audioContextRef.current.createAnalyser();
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

            microphoneRef.current.connect(analyzerRef.current);
            analyzerRef.current.fftSize = 256;

            const bufferLength = analyzerRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            setIsListening(true);
            setStatus('listening');

            const detectSound = () => {
                if (!analyzerRef.current) return;

                analyzerRef.current.getByteFrequencyData(dataArray);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                // Threshold logic (Tweak this for "alarms/explosions")
                // A very high sudden amplitude
                if (average > 180) { // arbitrary threshold for demo
                    handleTrigger();
                    return;
                }

                animationFrameRef.current = requestAnimationFrame(detectSound);
            };

            detectSound();

        } catch (err) {
            console.error("Microphone access denied or not available", err);
            setStatus('error');
        }
    };

    const stopListening = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (microphoneRef.current && microphoneRef.current.mediaStream) {
            microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        setIsListening(false);
        setStatus('idle');
    };

    const handleTrigger = () => {
        setStatus('triggered');
        stopListening();
        onTrigger();
    };

    useEffect(() => {
        return () => stopListening(); // Cleanup
    }, []);

    return { isListening, startListening, stopListening, status };
};
