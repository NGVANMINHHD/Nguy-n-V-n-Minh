import React, { useRef, useEffect, useState } from 'react';
import { WatermarkSettings, VideoMeta } from '../types';

interface ControlsProps {
  settings: WatermarkSettings;
  videoMeta: VideoMeta | null;
  onChange: (newSettings: WatermarkSettings) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWatermarkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  settings,
  videoMeta,
  onChange,
  onVideoUpload,
  onWatermarkUpload
}) => {
  
  const handleChange = (key: keyof WatermarkSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  // Timeline Logic
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  const handleTimelineMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggingHandle(type);
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!draggingHandle || !timelineRef.current || !videoMeta) return;
          
          const rect = timelineRef.current.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          const percentage = x / rect.width;
          const time = percentage * videoMeta.duration;

          if (draggingHandle === 'start') {
              const newStart = Math.min(time, settings.endTime - 0.1);
              handleChange('startTime', Number(newStart.toFixed(2)));
          } else {
              const newEnd = Math.max(time, settings.startTime + 0.1);
              handleChange('endTime', Number(newEnd.toFixed(2)));
          }
      };

      const handleMouseUp = () => {
          setDraggingHandle(null);
      };

      if (draggingHandle) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [draggingHandle, videoMeta, settings]);

  const duration = videoMeta?.duration || 1;
  const leftPct = (settings.startTime / duration) * 100;
  const widthPct = ((settings.endTime - settings.startTime) / duration) * 100;

  return (
    <div className="bg-slate-800 p-6 rounded-xl space-y-8 h-full border border-slate-700 overflow-y-auto">
      
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
           <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
           Configuration
        </h2>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
             <button 
                onClick={() => handleChange('isBatchMode', false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!settings.isBatchMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
                 Single File
             </button>
             <button 
                onClick={() => handleChange('isBatchMode', true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${settings.isBatchMode ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
                 Batch Folder
             </button>
        </div>
      </div>

      <div className="space-y-6">
          {/* File Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Dynamic Video Input */}
             <div className="group relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {settings.isBatchMode ? "Sample Video (Preview)" : "Base Video"}
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={onVideoUpload}
                  className="block w-full text-sm text-slate-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-xs file:font-semibold
                    file:bg-slate-700 file:text-blue-400
                    hover:file:bg-slate-600
                    cursor-pointer"
                />
             </div>
             
             {/* Watermark Input */}
             <div className="group relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Watermark Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onWatermarkUpload}
                  className="block w-full text-sm text-slate-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-xs file:font-semibold
                    file:bg-slate-700 file:text-purple-400
                    hover:file:bg-slate-600
                    cursor-pointer"
                />
             </div>
          </div>

          {/* Batch Specific Settings */}
          {settings.isBatchMode && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 space-y-4">
                  <h3 className="text-xs font-bold text-purple-400 uppercase">Batch Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-xs text-slate-400 mb-1">Target Extension</label>
                           <input 
                               type="text" 
                               value={settings.fileExtension}
                               onChange={(e) => handleChange('fileExtension', e.target.value.replace('.',''))}
                               className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                               placeholder="mp4"
                           />
                       </div>
                       <div>
                           <label className="block text-xs text-slate-400 mb-1">Output Folder Name</label>
                           <input 
                               type="text" 
                               value={settings.outputPath}
                               onChange={(e) => handleChange('outputPath', e.target.value)}
                               className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                               placeholder="processed"
                           />
                       </div>
                  </div>
              </div>
          )}

          <hr className="border-slate-700/50" />

          {/* Speed Control */}
          <div>
            <div className="flex justify-between mb-2">
               <label className="text-sm font-medium text-slate-300">Video Speed</label>
               <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-green-400">{settings.videoSpeed}x</span>
            </div>
            <input
               type="range"
               min="0.25"
               max="4"
               step="0.25"
               value={settings.videoSpeed}
               onChange={(e) => handleChange('videoSpeed', parseFloat(e.target.value))}
               className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 mb-2"
            />
            <div className="flex items-center gap-2 mt-2">
               <input 
                  type="checkbox" 
                  id="audioSync"
                  checked={settings.audioMode === 'sync'}
                  onChange={(e) => handleChange('audioMode', e.target.checked ? 'sync' : 'original')}
                  className="rounded bg-slate-700 border-slate-600 text-green-500 focus:ring-green-500"
               />
               <label htmlFor="audioSync" className="text-xs text-slate-400 select-none cursor-pointer">
                  Sync audio speed (Default: Keep original audio)
               </label>
            </div>
          </div>

          <hr className="border-slate-700/50" />

          {/* Output Frame */}
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-3">Output Frame</label>
             <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <span className="block text-xs text-slate-500 mb-1">Aspect Ratio</span>
                    <select 
                       value={settings.aspectRatio}
                       onChange={(e) => handleChange('aspectRatio', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                       <option value="original">Original</option>
                       <option value="16:9">16:9 (Landscape)</option>
                       <option value="9:16">9:16 (Portrait)</option>
                       <option value="1:1">1:1 (Square)</option>
                       <option value="4:3">4:3 (Classic)</option>
                    </select>
                 </div>
                 <div>
                    <span className="block text-xs text-slate-500 mb-1">Resolution</span>
                    <select 
                       value={settings.outputResolution}
                       onChange={(e) => handleChange('outputResolution', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                       <option value="original">Original Size</option>
                       <option value="1080p">1080p (HD)</option>
                       <option value="720p">720p (HD)</option>
                       <option value="480p">480p (SD)</option>
                    </select>
                 </div>
             </div>
          </div>

          <hr className="border-slate-700/50" />

          {/* Watermark Controls */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium text-slate-300">Watermark Settings</h3>
             {/* Opacity */}
             <div>
                <div className="flex justify-between mb-1">
                   <label className="text-xs text-slate-400">Opacity</label>
                   <span className="text-xs text-blue-400">{Math.round(settings.opacity * 100)}%</span>
                </div>
                <input
                   type="range" min="0" max="1" step="0.05"
                   value={settings.opacity}
                   onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                   className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
             </div>
             {/* Scale */}
             <div>
                <div className="flex justify-between mb-1">
                   <label className="text-xs text-slate-400">Scale</label>
                   <span className="text-xs text-blue-400">{settings.scale.toFixed(1)}x</span>
                </div>
                <input
                   type="range" min="0.1" max="2" step="0.1"
                   value={settings.scale}
                   onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
                   className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
             </div>
             {/* Pos */}
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs text-slate-500">X (px)</label>
                  <input
                     type="number" value={settings.x}
                     onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
                     className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
               </div>
               <div>
                  <label className="text-xs text-slate-500">Y (px)</label>
                  <input
                     type="number" value={settings.y}
                     onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
                     className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
               </div>
             </div>
          </div>
          
          <hr className="border-slate-700/50" />
          
          {/* Timeline */}
          <div>
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Trim
                </h3>
                <span className="text-xs text-slate-500">
                    {formatTime(settings.endTime - settings.startTime)}
                </span>
             </div>

             <div className="relative h-10 bg-slate-900 rounded-lg border border-slate-700 mb-2 flex items-center px-2 select-none" ref={timelineRef}>
                 {!videoMeta ? (
                     <span className="text-xs text-slate-600 w-full text-center">Load video</span>
                 ) : (
                     <div className="relative w-full h-2 bg-slate-800 rounded-full">
                         <div 
                           className="absolute top-0 h-full bg-blue-500/50 rounded-full"
                           style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                         ></div>
                         <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-5 bg-slate-200 rounded cursor-ew-resize hover:bg-white z-10 shadow border border-slate-400 flex flex-col items-center justify-center gap-[1px]"
                            style={{ left: `${leftPct}%` }}
                            onMouseDown={handleTimelineMouseDown('start')}
                         >
                             <div className="w-[1px] h-2 bg-slate-400"></div>
                         </div>
                         <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-5 bg-slate-200 rounded cursor-ew-resize hover:bg-white z-10 shadow border border-slate-400 flex flex-col items-center justify-center gap-[1px]"
                            style={{ left: `${(settings.endTime / duration) * 100}%` }}
                            onMouseDown={handleTimelineMouseDown('end')}
                         >
                            <div className="w-[1px] h-2 bg-slate-400"></div>
                         </div>
                     </div>
                 )}
             </div>
             
             <div className="flex justify-between text-xs font-mono text-slate-400">
                 <span>{formatTime(settings.startTime)}</span>
                 <span>{formatTime(settings.endTime)}</span>
             </div>
          </div>
          
        </div>
    </div>
  );
};