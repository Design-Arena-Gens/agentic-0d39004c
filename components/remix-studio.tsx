"use client";

import { motion } from "framer-motion";
import { Download, Music, RefreshCw, Rocket, Share2, UploadCloud } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { analyzeAudioBuffer, decodeAudioData, renderRemix, type AudioAnalysis, type RemixOptions, type RemixStyle } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Visualizer } from "@/components/visualizer";

type WaveSurferType = typeof import("wavesurfer.js");

const remixStyles: { value: RemixStyle; label: string; description: string }[] = [
  {
    value: "electronic",
    label: "Neon Pulse",
    description: "Rollicking peaks, crisp percussion, lush club atmosphere."
  },
  {
    value: "chill",
    label: "Midnight Drift",
    description: "Smooth downtempo textures perfect for lo-fi lounges."
  },
  {
    value: "upbeat",
    label: "Festival Lift",
    description: "Feel-good energy, bright synth swells, crowd-ready drops."
  }
];

export function RemixStudio() {
  const [analysis, setAnalysis] = React.useState<AudioAnalysis | null>(null);
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null);
  const [originalUrl, setOriginalUrl] = React.useState<string | null>(null);
  const [remixUrl, setRemixUrl] = React.useState<string | null>(null);
  const [remixBlob, setRemixBlob] = React.useState<Blob | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isRendering, setIsRendering] = React.useState(false);
  const [options, setOptions] = React.useState<RemixOptions>({
    style: "electronic",
    tempoMultiplier: 1,
    intensity: 0.6,
    effectLevel: 0.7
  });

  const waveformRef = React.useRef<HTMLDivElement | null>(null);
  const waveSurferInstance = React.useRef<InstanceType<WaveSurferType["default"]> | null>(null);
  const waveSurferLib = React.useRef<WaveSurferType | null>(null);

  const originalAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const remixAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const mediaNodesRef = React.useRef<{ original?: MediaElementAudioSourceNode; remix?: MediaElementAudioSourceNode }>({});
  const [activeAnalyser, setActiveAnalyser] = React.useState<AnalyserNode | null>(null);
  const [isVisualizing, setIsVisualizing] = React.useState(false);

  React.useEffect(() => {
    return () => {
      waveSurferInstance.current?.destroy();
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (remixUrl) URL.revokeObjectURL(remixUrl);
    };
  }, [originalUrl, remixUrl]);

  const setupWaveSurfer = React.useCallback(
    async (url: string) => {
      if (!waveformRef.current) return;
      const WaveSurfer = waveSurferLib.current ?? (await import("wavesurfer.js"));
      waveSurferLib.current = WaveSurfer;

      waveSurferInstance.current?.destroy();
      waveSurferInstance.current = WaveSurfer.default.create({
        container: waveformRef.current,
        waveColor: "rgba(255,255,255,0.35)",
        progressColor: "rgba(111,79,242,0.9)",
        cursorColor: "rgba(127,255,212,0.8)",
        barWidth: 2,
        barGap: 2,
        height: 96,
        normalize: true
      });

      waveSurferInstance.current.load(url);
    },
    []
  );

  const ensureAudioContext = React.useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.75;
    }
    return analyserRef.current;
  }, []);

  const wireVisualization = React.useCallback(
    async (type: "original" | "remix") => {
      const analyser = await ensureAudioContext();
      const audioEl = type === "original" ? originalAudioRef.current : remixAudioRef.current;
      if (!audioEl || !audioContextRef.current || mediaNodesRef.current[type]) return;

      const source = audioContextRef.current.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      mediaNodesRef.current[type] = source;

      const handlePlay = () => {
        setActiveAnalyser(analyser);
        setIsVisualizing(true);
      };
      const handlePause = () => {
        setIsVisualizing(false);
      };

      audioEl.addEventListener("play", handlePlay);
      audioEl.addEventListener("pause", handlePause);
      audioEl.addEventListener("ended", handlePause);
    },
    [ensureAudioContext]
  );

  const handleFile = React.useCallback(
    async (file: File) => {
      try {
        setIsAnalyzing(true);
        setAnalysis(null);
        setAudioBuffer(null);
        setRemixUrl(null);
        setRemixBlob(null);
        setFileName(file.name);

        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);

        const analysisResult = await analyzeAudioBuffer(decodedBuffer);
        setAnalysis(analysisResult);

        const fileBlobUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: file.type }));
        setOriginalUrl(fileBlobUrl);
        await setupWaveSurfer(fileBlobUrl);
        await wireVisualization("original");
        toast.success("Track analyzed", {
          description: `Tempo detected at ${analysisResult.tempo} BPM • Key ${analysisResult.key}`
        });
      } catch (error) {
        console.error(error);
        toast.error("Could not analyze the track", {
          description: "Please try a different MP3 or WAV file."
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [setupWaveSurfer, wireVisualization]
  );

  const onFileInput = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const onDrop = React.useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) await handleFile(file);
    },
    [handleFile]
  );

  const regenerate = React.useCallback(async () => {
    if (!audioBuffer || !analysis) return;
    try {
      setIsRendering(true);
      const { blob } = await renderRemix(audioBuffer, analysis, options);
      if (remixUrl) URL.revokeObjectURL(remixUrl);
      const url = URL.createObjectURL(blob);
      setRemixUrl(url);
      setRemixBlob(blob);
      await wireVisualization("remix");
      toast.success("Remix ready", { description: "Feel the reimagined groove." });
    } catch (error) {
      console.error(error);
      toast.error("Remix rendering failed", {
        description: "Adjust the controls or try reloading the page."
      });
    } finally {
      setIsRendering(false);
    }
  }, [analysis, audioBuffer, options, remixUrl, wireVisualization]);

  const shareRemix = React.useCallback(async () => {
    if (!remixBlob) return;
    const file = new File([remixBlob], fileName.replace(/\.[^/.]+$/, "") + "-remix.wav", {
      type: "audio/wav"
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "Agentic Remix Studio",
          text: "Check out my freshly generated remix!",
          files: [file]
        });
      } catch (error) {
        console.error(error);
      }
      return;
    }

    await navigator.clipboard.writeText("Remix ready to share! Download and drop it in your next DJ set.");
    toast.info("Copied note to clipboard", {
      description: "Use it anywhere you'd like to hype the remix."
    });
  }, [remixBlob, fileName]);

  const gridVariants = React.useMemo(
    () => ({
      hidden: { opacity: 0, y: 12 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    }),
    []
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass grad-border rounded-3xl p-10"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm uppercase tracking-[0.25em] text-white/60">
                <Music className="h-4 w-4" /> Agentic Remix Studio
              </span>
              <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">
                Upload. Analyze. Drop a DJ-Ready Remix in Seconds.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/70">
                Harness AI-powered beat intelligence to reimagine your tracks. Detect keys, tempo, transitions, then orchestrate a club-ready remix with dynamic effects and synced visuals.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/60 shadow-lg shadow-accent/10">
              <p className="font-semibold text-white">Session Insights</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Intelligent beat segmentation</li>
                <li>• DJ-style re-arrangements</li>
                <li>• Live waveform and spectrogram</li>
                <li>• Shareable high-quality mixes</li>
              </ul>
            </div>
          </div>

          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="glass grad-border flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/10 p-8 text-center transition-colors hover:border-white/30"
          >
            <UploadCloud className="h-12 w-12 text-accent" />
            <div>
              <p className="text-lg font-medium">Drop a track to begin</p>
              <p className="text-sm text-white/60">
                MP3, WAV supported • Max 10 minutes recommended
              </p>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav"
                onChange={onFileInput}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <Button variant="secondary">Browse Files</Button>
            </div>
            {fileName && (
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Loaded: {fileName}
              </p>
            )}
          </label>
        </div>
      </motion.section>

      <motion.section
        className="grid gap-8 lg:grid-cols-[2fr_1fr]"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Waveform &amp; Remix Console</h2>
            {analysis && (
              <span className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-white/60">
                <Rocket className="h-4 w-4 text-accent" /> Ready
              </span>
            )}
          </div>
          <div
            ref={waveformRef}
            className="mt-6 h-32 w-full rounded-xl border border-white/10 bg-black/60"
          />

          {analysis && (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
                  Track DNA
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-white/40">Tempo</dt>
                    <dd className="text-lg font-semibold text-white">
                      {analysis.tempo} BPM
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Key Signature</dt>
                    <dd className="text-lg font-semibold text-white">
                      {analysis.key}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Loudness</dt>
                    <dd className="text-lg font-semibold text-white">
                      {analysis.loudness.toFixed(1)} dB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Energy</dt>
                    <dd className="text-lg font-semibold text-white">
                      {analysis.sections
                        .map((section) => section.energy)
                        .reduce((acc, energy) => acc + energy, 0)
                        .toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
                  Section Map
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.sections.map((segment, index) => (
                    <span
                      key={`${segment.label}-${index}`}
                      className="rounded-full border border-white/10 bg-background/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60"
                    >
                      {segment.label} · {((segment.end - segment.start) / analysis.duration * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Select
              label="Remix Style"
              value={options.style}
              onValueChange={(value) =>
                setOptions((prev) => ({ ...prev, style: value }))
              }
              options={remixStyles}
            />
            <Slider
              label="Tempo Multiplier"
              min={0.75}
              max={1.35}
              step={0.05}
              value={options.tempoMultiplier}
              onChange={(event) =>
                setOptions((prev) => ({ ...prev, tempoMultiplier: Number(event.target.value) }))
              }
              minLabel="Slow"
              maxLabel="Hype"
            />
            <Slider
              label="Effect Surges"
              min={0}
              max={1}
              step={0.05}
              value={options.effectLevel}
              onChange={(event) =>
                setOptions((prev) => ({ ...prev, effectLevel: Number(event.target.value) }))
              }
              minLabel="Subtle"
              maxLabel="Cosmic"
            />
            <Slider
              label="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={options.intensity}
              onChange={(event) =>
                setOptions((prev) => ({ ...prev, intensity: Number(event.target.value) }))
              }
              minLabel="Smooth"
              maxLabel="Peak"
              className="md:col-span-3"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              onClick={regenerate}
              disabled={!analysis || !audioBuffer || isRendering || isAnalyzing}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {isRendering ? "Crafting Remix..." : "Generate Remix"}
            </Button>
            {remixUrl && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = remixUrl;
                    link.download = fileName.replace(/\.[^/.]+$/, "") + "-remix.wav";
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download WAV
                </Button>
                <Button variant="ghost" className="gap-2" onClick={shareRemix}>
                  <Share2 className="h-4 w-4" />
                  Share Remix
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass rounded-3xl p-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
              Playback Lab
            </h3>
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Original Track</p>
                <audio
                  ref={originalAudioRef}
                  controls
                  src={originalUrl ?? undefined}
                  className="mt-3 w-full"
                  onPlay={() => wireVisualization("original")}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Generated Remix</p>
                <audio
                  ref={remixAudioRef}
                  controls
                  src={remixUrl ?? undefined}
                  className="mt-3 w-full"
                  onPlay={() => wireVisualization("remix")}
                />
                {!remixUrl && (
                  <p className="mt-3 text-xs text-white/50">
                    Generate a remix to preview it here.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
              Live Spectrum Visualizer
            </h3>
            <p className="mt-2 text-sm text-white/50">
              Watch the frequency sculpting in real-time as your track breathes through filters, delays, and motion.
            </p>
            <div className="mt-6">
              <Visualizer analyser={activeAnalyser} isActive={isVisualizing} />
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
