import React, { useState, useMemo } from 'react';
import { VideoPreview } from './components/VideoPreview';
import { Controls } from './components/Controls';
import { CommandDisplay } from './components/CommandDisplay';
import { GeminiAssistant } from './components/GeminiAssistant';
import { Sidebar } from './components/Sidebar';
import { WatermarkSettings, VideoMeta } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'settings' | 'help'>('editor');
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

  const currentCommand = useMemo(() => {
     const mode = settings.isBatchMode ? "Batch Mode" : "Single Mode";
     return `[${mode}] Processing ${settings.fileExtension} files. Speed: ${settings.videoSpeed}x. Resolution: ${settings.outputResolution}.`;
  }, [settings]);

  return (
    // Main Container acts as the "Window"
    <div className="h-screen w-screen bg-black text-slate-100 flex overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full bg-slate-900">
        
        {/* Title Bar / Header */}
        <header className="h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none drag-region">
           <div className="flex items-center gap-3">
             <h1 className="text-sm font-semibold text-slate-300 tracking-wide">FFmpeg Studio Pro</h1>
             {settings.isBatchMode && (
                <span className="text-[10px] bg-purple-900/50 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Batch Mode Active
                </span>
             )}
           </div>
           
           {/* Fake Window Controls */}
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-600/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-600/50"></div>
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-600/50"></div>
           </div>
        </header>

        {/* Content Grid */}
        <div className="flex-grow overflow-hidden relative">
            {activeTab === 'editor' && (
                <main className="h-full w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden">
                    
                    {/* Left Panel: Preview & Command (Flexible) */}
                    <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6 h-full border-r border-slate-800/50">
                        <div className="bg-black/40 rounded-xl overflow-hidden border border-slate-800 shadow-xl relative">
                            <div className="absolute top-3 left-4 z-10 pointer-events-none">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-black/80 px-2 py-1 rounded backdrop-blur-md">
                                    {settings.isBatchMode ? 'Sample Preview' : 'Viewport'}
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

                    {/* Right Panel: Controls (Fixed Width) */}
                    <div className="lg:col-span-5 bg-slate-900 flex flex-col h-full border-l border-slate-800 shadow-2xl">
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <Controls 
                                settings={settings}
                                videoMeta={videoMeta}
                                onChange={setSettings}
                                onVideoUpload={handleVideoUpload}
                                onWatermarkUpload={handleWatermarkUpload}
                            />
                        </div>
                        
                        {/* Assistant anchored at bottom of right panel */}
                        <div className="h-[300px] border-t border-slate-800 bg-slate-950 p-4">
                            <GeminiAssistant currentCommand={currentCommand} />
                        </div>
                    </div>
                </main>
            )}

            {activeTab === 'help' && (
                <div className="p-12 max-w-3xl mx-auto text-slate-300 space-y-6 overflow-y-auto h-full">
                    <h2 className="text-2xl font-bold text-white">How to run on your computer</h2>
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h3 className="font-semibold text-blue-400 mb-2">1. Install FFmpeg</h3>
                            <p>You must have FFmpeg installed on your system to run the scripts generated by this tool.</p>
                            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-slate-400">
                                <li><strong>Windows:</strong> Download from ffmpeg.org or run <code className="bg-black px-1">winget install ffmpeg</code></li>
                                <li><strong>Mac:</strong> Run <code className="bg-black px-1">brew install ffmpeg</code></li>
                            </ul>
                        </div>
                        
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h3 className="font-semibold text-green-400 mb-2">2. Design & Download</h3>
                            <p>Upload your files in this tool, adjust the settings (watermark, speed, trim), and check the preview.</p>
                            <p className="mt-2">Click the <strong>"Download Executable"</strong> button in the Command panel.</p>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h3 className="font-semibold text-purple-400 mb-2">3. Run the Script</h3>
                            <p>Move the downloaded <code className="bg-black px-1">.bat</code> or <code className="bg-black px-1">.sh</code> file into the folder where your videos are.</p>
                            <p className="mt-2">Double-click the file to start processing!</p>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'settings' && (
                 <div className="flex items-center justify-center h-full text-slate-500">
                     <p>Global Application Settings (Coming Soon)</p>
                 </div>
            )}
        </div>
        
        {/* Status Bar */}
        <footer className="h-6 bg-blue-900/20 border-t border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-400 select-none">
            <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${videoSrc ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                    Video Source: {videoName || 'None'}
                </span>
                <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${watermarkSrc ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                    Watermark: {imageName || 'None'}
                </span>
            </div>
            <div className="flex gap-4">
                <span>FFmpeg Build: Latest</span>
                <span>v1.2.0</span>
            </div>
        </footer>

      </div>
    </div>
  );
}

export default App;