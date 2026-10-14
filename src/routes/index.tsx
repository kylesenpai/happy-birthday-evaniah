import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playBirthdaySong, stopBirthdaySong } from "@/lib/birthday-song";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Happy Birthday EvaniaH!" },
    { name: "description", content: "A little birthday wish for EvaniaH. Light the candles, make a wish, and celebrate." },
    { property: "og:title", content: "Happy Birthday EvaniaH!" },
    { property: "og:description", content: "A birthday cake, a wish, and a little magic for EvaniaH." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const [candles, setCandles] = useState<{x: number; y: number}[]>([]);
  const [celebrated, setCelebrated] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef(0);
  const stopListening = () => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    void audioRef.current?.close();
    audioRef.current = null;
    streamRef.current = null;
    setListening(false);
  };
  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    void audioRef.current?.close();
    stopBirthdaySong();
  }, []);
  const celebrate = async () => {
    if (!candles.length || celebrated) return;
    stopListening();
    setCelebrated(true);
    setNotice("");
    void playBirthdaySong();
    const { default: confetti } = await import("canvas-confetti");
    const end = Date.now() + 3000;
    const colors = getComputedStyle(document.documentElement).getPropertyValue("--confetti-colors").trim().split(",").map(c => c.trim());
    const rect = svgRef.current?.getBoundingClientRect();
    const origin = rect
      ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height * .5) / window.innerHeight }
      : { x: .5, y: .5 };
    const options = { colors, zIndex: 1000, disableForReducedMotion: false };
    confetti({ ...options, particleCount: 150, spread: 110, startVelocity: 45, origin });
    const burst = () => {
      confetti({ ...options, particleCount: 4, angle: 60, spread: 65, origin: { x: Math.max(.05, origin.x - .2), y: origin.y } });
      confetti({ ...options, particleCount: 4, angle: 120, spread: 65, origin: { x: Math.min(.95, origin.x + .2), y: origin.y } });
      if (Date.now() < end) requestAnimationFrame(burst);
    };
    burst();
  };
  const microphone = async () => {
    if (listening) { stopListening(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audio = new AudioContext();
      audioRef.current = audio;
      const analyser = audio.createAnalyser();
      analyser.fftSize = 512;
      audio.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      setListening(true);
      setNotice("");
      const started = Date.now();
      let loudFrames = 0;
      const sample = () => {
        analyser.getByteTimeDomainData(data);
        const volume = Math.sqrt(data.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / data.length);
        loudFrames = volume > .12 && Date.now() - started > 700 ? loudFrames + 1 : 0;
        if (loudFrames > 8) { void celebrate(); return; }
        frameRef.current = requestAnimationFrame(sample);
      };
      sample();
    } catch {
      stopListening();
      setNotice("Microphone unavailable. You can still make a wish.");
    }
  };
  const addCandle = (event: React.MouseEvent) => {
    if (celebrated || candles.length >= 24 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 400;
    const y = (event.clientY - rect.top) / rect.height * 340;
    if (((x - 200) / 137) ** 2 + ((y - 137) / 49) ** 2 > 1) return;
    setCandles(previous => [...previous, { x, y }]);
  };
  return (
    <div className="birthday-page">
      <main className="birthday-main">
        <h1 className="birthday-title">HAPPY BIRTHDAY EVANIAH!</h1>
        <div className="cake-stage">
          <Button variant="cake" aria-label="Add a candle to the birthday cake" onClick={addCandle}>
            <svg ref={svgRef} className="cake-art" viewBox="0 0 400 340" role="img" aria-label={`Pink birthday cake with ${candles.length} ${celebrated ? "unlit" : "lit"} candles`}>
              <defs><filter id="cake-shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="10" /></filter></defs>
              <ellipse className="cake-shadow" cx="202" cy="273" rx="146" ry="23" filter="url(#cake-shadow)" />
              <ellipse className="plate-bottom" cx="200" cy="256" rx="153" ry="54" />
              <ellipse className="plate-top" cx="200" cy="248" rx="153" ry="54" />
              <path className="cake-body" d="M55 137 A145 51 0 0 1 345 137 V237 A145 51 0 0 1 55 237 Z" />
              <path className="cake-layer" d="M55 176 A145 51 0 0 0 345 176 M55 211 A145 51 0 0 0 345 211" />
              <ellipse className="icing-edge" cx="200" cy="137" rx="146" ry="52" />
              <path className="icing" d="M55 137 C55 164 65 185 83 187 C104 190 110 174 110 168 C129 177 139 180 155 181 C171 203 197 208 218 194 C226 189 232 182 234 180 L265 173 L265 199 C265 225 307 225 318 202 L322 164 C338 157 345 147 345 137 A145 49 0 0 0 55 137Z" />
              {candles.map((candle, index) => <g key={index} transform={`translate(${candle.x} ${candle.y})`}>
                <ellipse className="candle-shadow" cy="2" rx="6" ry="2" />
                <rect className="candle" x="-4" y="-36" width="8" height="37" rx="2" />
                <path className="wick" d="M0 -36 v-5" />
                {!celebrated && <g className="flame"><path className="flame-outer" d="M0 -62 C-9 -50 -7 -41 0 -40 C7 -41 9 -50 0 -62Z" /><path className="flame-inner" d="M0 -53 C-4 -47 -3 -42 0 -42 C4 -43 4 -47 0 -53Z" /></g>}
              </g>)}
            </svg>
          </Button>
        </div>
        <div className="birthday-controls">
          <div className="candle-count" aria-live="polite">{celebrated ? "May all your wishes come true ♡" : `${candles.length} ${candles.length === 1 ? "candle" : "candles"}`}</div>
          <div className="control-row">
            <Button variant="birthday" size="icon" title="Start again" aria-label="Start again" onClick={() => { stopListening(); stopBirthdaySong(); setCandles([]); setCelebrated(false); setNotice(""); }}><RotateCcw /></Button>
            <Button variant="birthday" disabled={!candles.length || celebrated} onClick={() => void celebrate()}><Wind /> Make a wish</Button>
            <Button variant="birthday" size="icon" disabled={!candles.length || celebrated} title={listening ? "Stop microphone" : "Blow out with microphone"} aria-label={listening ? "Stop microphone" : "Blow out with microphone"} aria-pressed={listening} onClick={() => void microphone()}><Mic /></Button>
          </div>
          <p className="birthday-notice" role="status">{listening ? "Listening…" : notice}</p>
        </div>
      </main>
    </div>
  );
}
