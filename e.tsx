/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
  } from "react";
  import {
	Camera,
	Image,
	Download,
	Upload,
	Play,
	Pause,
  } from "lucide-react";
	
	const ZESTY_COLORS = {
	  background: "#FFFDE7",
	  primary: "#F9F871",
	  secondary: "#C7EA46",
	  accent: "#FCFF6C",
	  lemon: "#E9FF70",
	  shape: "#B5E61D",
	  shape2: "#9FD356",
	  shape3: "#DFEF3E",
	  text: "#53571A",
	  shadow: "rgba(201, 244, 81, 0.15)",
	};
	
	const ASPECT_RATIO = 16 / 9;
	 
	
	function getRandomInt(min: number, max: number) {
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	// Floating shapes: circle, triangle, square
	type ShapeType = "circle" | "triangle" | "square";
	type Shape = {
	  id: number;
	  type: ShapeType;
	  x: number;
	  y: number;
	  size: number;
	  angle: number;
	  freqBand: number; // Which freq bin this shape reacts to
	  color: string;
	  velocity: number;
	  floatPhase: number;
	  floatOffset: number;
	};
	
	const SHAPE_TYPES: ShapeType[] = ["circle", "triangle", "square"];
	const SHAPE_COLORS = [
	  ZESTY_COLORS.shape,
	  ZESTY_COLORS.shape2,
	  ZESTY_COLORS.shape3,
	];
	
	const INITIAL_SHAPE_COUNT = 30;
	
	function generateShapes(
	  count: number,
	  width: number,
	  height: number,
	  freqBins: number
	): Shape[] {
	  return Array.from({ length: count }).map((_, i) => ({
		id: i,
		type: SHAPE_TYPES[i % 3],
		x: getRandomInt(40, width - 40),
		y: getRandomInt(40, height - 40),
		size: getRandomInt(38, 66),
		angle: Math.random() * Math.PI * 2,
		freqBand: getRandomInt(0, freqBins - 1),
		color: SHAPE_COLORS[i % SHAPE_COLORS.length],
		velocity: Math.random() * 0.6 + 0.2,
		floatPhase: Math.random() * Math.PI * 2,
		floatOffset: Math.random() * 20,
	  }));
	}
	
	function lerp(a: number, b: number, t: number) {
	  return a + (b - a) * t;
	}
	
	function toDataURL(canvas: HTMLCanvasElement) {
	  return canvas.toDataURL("image/png");
	}
	
	function downloadURI(uri: string, name: string) {
	  const link = document.createElement("a");
	  link.download = name;
	  link.href = uri;
	  document.body.appendChild(link);
	  link.click();
	  document.body.removeChild(link);
	}
	
	type ExportSettings = {
	  shapes: Shape[];
	  palette: typeof ZESTY_COLORS;
	};
	
	const PulseBar = () => {
	  return (
		<span className="flex space-x-0.5 h-3 w-8 items-end">
		  {Array.from(Array(4).keys()).map((index) => (
			<span
			  key={index}
			  className="w-1 bg-[#06080a] animate-[pulse-bar_0.6s_ease-in-out_infinite]"
			  style={{ animationDelay: `${index * 0.15}s` }}
			></span>
		  ))}
		</span>
	  );
	};
	
	const AudioWallpaperApp: React.FC = () => {
	  // Canvas sizing
	  const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const audioElementRef = useRef<HTMLAudioElement>(null);
	const mediaElementSourceRef =
	  useRef<MediaElementAudioSourceNode | null>(null);
	const [canvasSize, setCanvasSize] = useState({ width: 960, height: 540 });
	
	  // Audio
	  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
	  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
	  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
	  const [stream, setStream] = useState<MediaStream | null>(null);
	
	  // Data
	  const [shapes, setShapes] = useState<Shape[]>([]);
	  const [freqData, setFreqData] = useState<Uint8Array>(new Uint8Array(64));
	  const [volume, setVolume] = useState(0);
	
	  // Controls & UI
	  const [isAudioActive, setIsAudioActive] = useState(false);
	  const [pipSupported, setPipSupported] = useState(false);
	  const [pipMode, setPipMode] = useState(false);
	  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
	  const [isFilePlaying, setIsFilePlaying] = useState(false);
	
	  // Responsive canvas
	  const updateCanvasSize = useCallback(() => {
		  const container = containerRef.current;
		  if (!container) return;
		  const width = container.offsetWidth;
		  const height = Math.round(width / ASPECT_RATIO);
		  setCanvasSize({ width, height });
		}, []);
	
	  useLayoutEffect(() => {
		updateCanvasSize();
		window.addEventListener("resize", updateCanvasSize);
		return () => window.removeEventListener("resize", updateCanvasSize);
	  }, [updateCanvasSize]);
	
	  // Initialize shapes
	  useEffect(() => {
		setShapes(
		  generateShapes(
			INITIAL_SHAPE_COUNT,
			canvasSize.width,
			canvasSize.height,
			64
		  )
		);
	  }, [canvasSize]);
	
	// Audio Analysis Loop
	useEffect(() => {
	  let animationFrame: number;
	  if (analyser && (isAudioActive || isFilePlaying)) {
		const freqArray = new Uint8Array(analyser.frequencyBinCount);
	
		  const analyze = () => {
			analyser.getByteFrequencyData(freqArray);
			setFreqData(new Uint8Array(freqArray)); // Triggers re-render of shapes
	
			// Calculate average volume (rms)
			const avg = freqArray.reduce((acc, v) => acc + v, 0) / freqArray.length;
			setVolume(avg);
			animationFrame = requestAnimationFrame(analyze);
		  };
		  analyze();
		}
		return () => cancelAnimationFrame(animationFrame);
	  }, [analyser, isAudioActive, isFilePlaying]);
	
	  // Audio setup
	  const handleAudio = useCallback(async () => {
		if (!navigator.mediaDevices?.getUserMedia) return;
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const ctx = new (window.AudioContext ||
		  (window as any).webkitAudioContext)();
		const src = ctx.createMediaStreamSource(stream);
		const an = ctx.createAnalyser();
		an.fftSize = 128;
		src.connect(an);
	
		// Route the audio to the speakers (audio context's destination)
		an.connect(ctx.destination);
	
		setAudioContext(ctx);
		setSource(src);
		setAnalyser(an);
		setIsAudioActive(true);
		setStream(stream);
	  }, []);
	
	  const handleStopAudio = useCallback(() => {
		if (audioContext) {
		  audioContext.close();
		  setAudioContext(null);
		}
  
		if (mediaElementSourceRef.current) {
		  mediaElementSourceRef.current.disconnect();
		  mediaElementSourceRef.current = null;
		}
	
		if (source) {
		  source.disconnect();
		  setSource(null);
		}
	
		if (analyser) {
		  analyser.disconnect();
		  setAnalyser(null);
		}
	
		if (stream) {
		  stream.getTracks().forEach((track) => track.stop());
		  setStream(null);
		}
	
		setIsAudioActive(false);
		if (audioElementRef.current) {
		  audioElementRef.current.pause();
		}
		if (audioFileUrl) {
		  URL.revokeObjectURL(audioFileUrl);
		  setAudioFileUrl(null);
		}
		setIsFilePlaying(false);
	  }, [audioContext, source, analyser, stream, audioFileUrl]);
  
	  const handleAudioFile = useCallback(
		async (file: File) => {
		  const audioEl = audioElementRef.current;
		  if (!audioEl) return;
  
		  if (isAudioActive) {
			handleStopAudio();
		  }
  
		  let ctx = audioContext;
		  let an = analyser;
  
		  if (!ctx || !mediaElementSourceRef.current) {
			ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const src = ctx.createMediaElementSource(audioEl);
			an = ctx.createAnalyser();
			an.fftSize = 128;
			src.connect(an);
			an.connect(ctx.destination);
  
			setAudioContext(ctx);
			setAnalyser(an);
			setSource(null);
			mediaElementSourceRef.current = src;
		  } else {
			audioEl.pause();
		  }
  
		  if (audioFileUrl) {
			URL.revokeObjectURL(audioFileUrl);
		  }
  
		  const url = URL.createObjectURL(file);
		  audioEl.src = url;
		  setAudioFileUrl(url);
		  setIsFilePlaying(false);
		},
		[audioContext, analyser, audioFileUrl, isAudioActive, handleStopAudio]
	  );
	
	  // Canvas Drawing Logic
	  useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
	
		// Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	
		// Dynamic background pattern: grid lines shift with volume peaks
		const gridSpacing = 48 + lerp(0, 36, Math.min(volume / 128, 1));
		const gridAlpha = 0.1 + lerp(0, 0.18, Math.min(volume / 128, 1));
		ctx.save();
		ctx.globalAlpha = gridAlpha;
		ctx.strokeStyle = ZESTY_COLORS.accent;
		for (let x = 0; x < canvas.width; x += gridSpacing) {
		  ctx.beginPath();
		  ctx.moveTo(x, 0);
		  ctx.lineTo(x, canvas.height);
		  ctx.stroke();
		}
		for (let y = 0; y < canvas.height; y += gridSpacing) {
		  ctx.beginPath();
		  ctx.moveTo(0, y);
		  ctx.lineTo(canvas.width, y);
		  ctx.stroke();
		}
		ctx.restore();
	
		// Draw floating shapes that react to frequencies
		shapes.forEach((shape, idx) => {
		  const t = Date.now() / 1000;
		  const bandValue = freqData[shape.freqBand];
		  const pulse = 1 + Math.sin(t * 2 + shape.floatPhase) * (bandValue / 255) * 0.4;
		  const newSize = shape.size * pulse;
	
		  
		  const floatStrength = 8 + shape.floatOffset;
		  const dx = Math.sin(t * shape.velocity + shape.floatPhase) * floatStrength;
		  const dy = Math.cos(t * shape.velocity + shape.floatPhase) * floatStrength;
		  const x = shape.x + dx;
		  const y = shape.y + dy;
  
	
		  ctx.save();
		  ctx.translate(x, y);
		  ctx.rotate(shape.angle + (bandValue / 255) * Math.PI * 0.5);
		  ctx.shadowColor = ZESTY_COLORS.shadow;
		  ctx.shadowBlur = 12;
	
		  ctx.fillStyle = shape.color;
		  const grad = ctx.createLinearGradient(
			-newSize / 2,
			-newSize / 2,
			newSize / 2,
			newSize / 2
		  );
		  grad.addColorStop(0, shape.color);
		  grad.addColorStop(
			1,
			`rgba(255,255,255,${0.16 + 0.18 * (bandValue / 255)})`
		  );
		  ctx.fillStyle = grad;
	
		  switch (shape.type) {
			case "circle":
			  ctx.beginPath();
			  ctx.arc(0, 0, newSize / 2, 0, Math.PI * 2);
			  ctx.fill();
			  break;
			case "triangle":
			  ctx.beginPath();
			  ctx.moveTo(0, -newSize / 2);
			  ctx.lineTo(-newSize / 2, newSize / 2);
			  ctx.lineTo(newSize / 2, newSize / 2);
			  ctx.closePath();
			  ctx.fill();
			  break;
			case "square":
			  ctx.beginPath();
			  ctx.rect(-newSize / 2, -newSize / 2, newSize, newSize);
			  ctx.fill();
			  break;
		  }
		  ctx.restore();
		});
	
		if (volume > 48) {
		  ctx.save();
		  const alpha = Math.min((volume - 48) / 90, 1) * 0.44;
		  ctx.globalAlpha = alpha;
		  ctx.beginPath();
		  ctx.arc(
			canvas.width / 2,
			canvas.height / 2,
			lerp(80, canvas.height / 2 - 40, alpha),
			0,
			Math.PI * 2
		  );
		  ctx.strokeStyle = ZESTY_COLORS.lemon;
		  ctx.shadowColor = ZESTY_COLORS.lemon;
		  ctx.shadowBlur = 40;
		  ctx.lineWidth = 16 + 18 * alpha;
		  ctx.stroke();
		  ctx.restore();
		}
	  }, [canvasSize, shapes, freqData, volume]);
	
	  // PiP Mode
	  useEffect(() => {
		setPipSupported(!!(document as any).pictureInPictureEnabled);
	
		if (!canvasRef.current || !videoRef.current) {
		  return;
		}
		const stream = canvasRef.current.captureStream();
		const video = videoRef.current;
		video.srcObject = stream;
		video.muted = true;
		video.play();
	  }, []);
	
	  // PiP Logic
	  const handleEnterPip = useCallback(async () => {
		const video = videoRef.current;
		if (!video) {
		  return;
		}
	
		if (document.pictureInPictureElement) {
		  await document.exitPictureInPicture();
		  setPipMode(false);
		} else {
		  await video.requestPictureInPicture();
		  setPipMode(true);
		}
	  }, []);
	
	  useEffect(() => {
		function onLeavePip() {
		  setPipMode(false);
		}
		if (pipMode) {
		  document.addEventListener("leavepictureinpicture", onLeavePip);
		  return () =>
			document.removeEventListener("leavepictureinpicture", onLeavePip);
		}
	  }, [pipMode]);
	
	  // Screenshot / Export
	  const handleScreenshot = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const dataUrl = toDataURL(canvas);
		downloadURI(dataUrl, "audio-wallpaper.png");
	  }, []);
	
	  const handleExportSettings = useCallback(() => {
		const data: ExportSettings = {
		  shapes,
		  palette: ZESTY_COLORS,
		};
	
		const jsonStr = JSON.stringify(data, null, 2);
		const blob = new Blob([jsonStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
	
		const link = document.createElement("a");
		link.href = url;
		link.download = "settings.json";
		link.click();
	
		URL.revokeObjectURL(url);
	  }, [shapes]);
  
	  const handlePlayPause = useCallback(() => {
		const audioEl = audioElementRef.current;
		if (!audioEl) return;
		if (audioEl.paused) {
		  audioEl.play();
		  setIsFilePlaying(true);
		} else {
		  audioEl.pause();
		  setIsFilePlaying(false);
		}
	  }, []);
	
	  useEffect(() => {
		// Fonts preconnect
		const preconnect1 = document.createElement("link");
		preconnect1.rel = "preconnect";
		preconnect1.href = "https://fonts.googleapis.com";
		document.head.appendChild(preconnect1);
	
		const preconnect2 = document.createElement("link");
		preconnect2.rel = "preconnect";
		preconnect2.href = "https://fonts.gstatic.com";
		preconnect2.crossOrigin = "";
		document.head.appendChild(preconnect2);
	
		// Google Fonts stylesheet
		const fontLink = document.createElement("link");
		fontLink.rel = "stylesheet";
		fontLink.href =
		  "https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&display=swap";
		document.head.appendChild(fontLink);
	
		// Style block
		const style = document.createElement("style");
		style.textContent = `
			@keyframes pulse-bar {
			  0%, 100% {
				height: 20%;
			  }
			  50% {
				height: 100%;
			  }
			}
			body {
			  font-family: "Unbounded", sans-serif;
			  font-weight: 200;
			}
		  `;
		document.head.appendChild(style);
	  }, []);
  
	  useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const handleDragOver = (e: DragEvent) => {
		  e.preventDefault();
		};
		const handleDrop = (e: DragEvent) => {
		  e.preventDefault();
		  const file = e.dataTransfer?.files[0];
		  if (file && file.type.startsWith("audio/")) {
			handleAudioFile(file);
		  }
		};
		container.addEventListener("dragover", handleDragOver);
		container.addEventListener("drop", handleDrop);
		return () => {
		  container.removeEventListener("dragover", handleDragOver);
		  container.removeEventListener("drop", handleDrop);
		};
	  }, [handleAudioFile]);
	
	  return (
		<main className="h-screen bg-[linear-gradient(to_top,_black,_#c7e959_100%,_#c7e959)] w-full flex items-center justify-center p-6">
		  <div className="bg-[#06080a] w-full max-w-[1200px] h-[90%] rounded-2xl flex overflow-hidden flex-col lg:flex-row">
		  <div className="lg:w-[27%] p-4 text-white flex flex-col justify-center lg:max-w-[27%] mx-auto overflow-auto">
			  <div className="my-4 space-y-3 w-full">
			   <h1 className="text-[1.74rem] font-semibold leading-[1.74rem]">
				  Generate <br /> geometric,{" "}
				  <span className="text-[#c7e959]">lemon-zest</span>{" "}
				  <span className="text-white/70">visualizations </span>
				</h1>
				<p className="text-xs text-white/70">
				  Plug in your sound, watch shapes float and backgrounds dance
				</p>
			  </div>
	
			  <div className="mt-4">
				<button
				  onClick={() =>
					isAudioActive ? handleStopAudio() : handleAudio()
				  }
				  className="cursor-pointer hover:opacity-70 active:opacity-70 transition bg-[#c7e959] p-3 px-6 rounded text-[#06080a] font-normal flex items-center"
				>
				  {isAudioActive && <PulseBar />}
				  <span>{isAudioActive ? "Stop Audio" : "Start Audio"}</span>
				</button>
				<button
				  onClick={() => fileInputRef.current?.click()}
				  className="cursor-pointer hover:opacity-70 active:opacity-70 transition bg-[#c7e959] p-3 px-6 rounded text-[#06080a] font-normal flex items-center mt-3"
				>
				  <Upload className="mr-2" /> Import Audio
				</button>
				{audioFileUrl && (
				  <button
					onClick={handlePlayPause}
					className="cursor-pointer hover:opacity-70 active:opacity-70 transition bg-[#c7e959] p-3 px-6 rounded text-[#06080a] font-normal flex items-center mt-3"
				  >
					{isFilePlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
					{isFilePlaying ? "Pause" : "Play"}
				  </button>
				)}
				<input
				  type="file"
				  accept="audio/*"
				  ref={fileInputRef}
				  onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) {
					  handleAudioFile(file);
					}
				  }}
				  className="hidden"
				/>
			  </div>
			</div>
	
			<div
				ref={containerRef}
				className="w-full lg:w-[73%] bg-[#c7e959]/40 relative min-h-[200px]"
			  >
				  <canvas
								  ref={canvasRef}
								  width={canvasSize.width}
								  height={canvasSize.height}
								  style={{
									width: canvasSize.width,
									height: canvasSize.height,
									display: "block",
									transition: "box-shadow 0.18s",
									transform: "scale(0.7)",
									transformOrigin: "top left",
								  }}
							/>
			  <div className="absolute bottom-0 left-0 w-full flex p-6 font-normal justify-evenly gap-4 bg-[linear-gradient(to_top,_#c7e959_0%,_#c7e959_0%,_transparent_120%)]">
				<button
				  onClick={handleScreenshot}
				  className="cursor-pointer hover:opacity-70 active:opacity-70 flex text-sm items-center gap-2"
				>
				  <Camera />
				  Screenshot
				</button>
	
				<button
				  disabled={!pipSupported}
				  onClick={handleEnterPip}
				  className={`hover:opacity-70 active:opacity-70 flex text-sm items-center gap-2 ${
					pipMode ? "text-[#F9F871]" : ""
				  } ${pipSupported ? "cursor-pointer" : "cursor-not-allowed opacity-10"}`}
				>
				  <Image />
				  Picture In Picture
				</button>
	
				<button
				  onClick={handleExportSettings}
				  className="cursor-pointer hover:opacity-70 active:opacity-70 flex text-sm items-center gap-2"
				>
				  <Download />
				  Export Settings
				</button>
			  </div>
			</div>
	
			<video ref={videoRef} className="hidden" />
			<audio ref={audioElementRef} className="hidden" />
		  </div>
		</main>
	  );
	};
	export default AudioWallpaperApp;
  
  