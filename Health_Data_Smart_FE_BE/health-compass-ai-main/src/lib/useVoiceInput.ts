// Browser-native Web Speech API voice input — supports Telugu (te-IN) and English (en-IN)
import { useEffect, useRef, useState, useCallback } from "react";

type SpeechRecognitionEvent = any;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type VoiceLang = "te-IN" | "en-IN";

export function useVoiceInput(lang: VoiceLang = "en-IN") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setTranscript("");
    setListening(true);
    try { recognitionRef.current.start(); } catch { setListening(false); }
  }, [listening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && listening) recognitionRef.current.stop();
  }, [listening]);

  return { listening, transcript, supported, start, stop };
}
