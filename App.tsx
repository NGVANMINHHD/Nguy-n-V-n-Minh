import React, { useState, useMemo } from 'react';
import { VideoPreview } from './components/VideoPreview';
import { Controls } from './components/Controls';
import { CommandDisplay } from './components/CommandDisplay';
import { GeminiAssistant } from './components/GeminiAssistant';
import { WatermarkSettings, VideoMeta } from './types';

function App() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [watermarkSrc, setWatermarkSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);

  const [settings, setSettings] = useState<WatermarkSettings>({
    opacity: 0.8,
    x: 50,
    y: 50,
    scale: 0.5,
    startTime: 0,
    endTime: 0,
    videoSpeed: 1,
    audioMode: 'original',
    aspectRatio: 'original',
    outputResolution: 'original',
    isBatchMode: false,
    inputPath: '.',
    outputPath: 'processed',
    fileExtension: 'mp4'
  });

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoName(file.name);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSettings(prev => ({ 
        ...prev, 
        startTime: 0, 
        endTime: 0,
        videoSpeed: 1 
      }));
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      const url = URL.createObjectURL(file);
      setWatermarkSrc(url);
    }
  };

  const handleMetaLoaded = (meta: VideoMeta) => {
    setVideoMeta(meta);
    setSettings(prev => ({
      ...prev,
      endTime: meta.duration
    }));
  };

  // Compute current command context for AI
  const currentCommand = useMemo(() => {
     // Simplified context generation for AI
     const mode = settings.isBatchMode ? "Batch Mode" : "Single Mode";
     return `[${mode}] Processing ${settings.fileExtension} files. Speed: ${settings.videoSpeed}x. Resolution: ${settings.outputResolution}.`;
  }, [settings]);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="bg-blue-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.414.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </span>
            FFmpeg Studio
          </h1>
          <p className="text-slate-400 mt-1 ml-1 text-sm">
            Professional Watermark, Speed & Batch Processing Tool
          </p>
        </div>
        <div className="text-right hidden md:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                System Ready
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Left Column: Preview and Visual Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 rounded-xl shadow-2xl overflow-hidden border border-slate-800 relative group">
             {/* Header for preview */}
             <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
                 <span className="text-xs font-mono text-white/50 border border-white/20 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
                     {settings.isBatchMode ? 'BATCH PREVIEW (SAMPLE)' : 'PREVIEW MODE'}
                 </span>
             </div>
             
             <VideoPreview 
               videoSrc={videoSrc}
               watermarkSrc={watermarkSrc}
               settings={settings}
               onMetaLoaded={handleMetaLoaded}
               onChange={setSettings}
             />
          </div>
          
          <CommandDisplay 
            videoName={videoName} 
            imageName={imageName} 
            settings={settings} 
            videoMeta={videoMeta}
          />
        </div>

        {/* Right Column: Controls and Assistant */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
          <Controls 
            settings={settings}
            videoMeta={videoMeta}
            onChange={setSettings}
            onVideoUpload={handleVideoUpload}
            onWatermarkUpload={handleWatermarkUpload}
          />
          
          <div className="flex-grow min-h-[300px]">
            <GeminiAssistant currentCommand={currentCommand} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;