import React, { useRef, useEffect, useState } from 'react';
import { WatermarkSettings, VideoMeta } from '../types';

interface VideoPreviewProps {
  videoSrc: string | null;
  watermarkSrc: string | null;
  settings: WatermarkSettings;
  onMetaLoaded: (meta: VideoMeta) => void;
  onChange: (settings: WatermarkSettings) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoSrc,
  watermarkSrc,
  settings,
  onMetaLoaded,
  onChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkImgRef = useRef<HTMLImageElement>(null);
  
  const [scaleFactor, setScaleFactor] = useState(1);
  const [watermarkMeta, setWatermarkMeta] = useState({ width: 0, height: 0 });
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const settingsStartRef = useRef({ x: 0, y: 0 });

  const updateScale = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const factor = videoRef.current.clientWidth / videoRef.current.videoWidth;
      setScaleFactor(factor);
      setVideoDimensions({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Sync playback speed
  useEffect(() => {
      if (videoRef.current) {
          videoRef.current.playbackRate = settings.videoSpeed;
      }
  }, [settings.videoSpeed]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime < settings.startTime) {
      video.currentTime = settings.startTime;
    }

    if (settings.endTime > settings.startTime && video.currentTime > settings.endTime) {
      video.currentTime = settings.startTime;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onMetaLoaded({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        duration: videoRef.current.duration
      });
      updateScale();
    }
  };
  
  const handleWatermarkLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setWatermarkMeta({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      settingsStartRef.current = { x: settings.x, y: settings.y };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const dxPixels = e.clientX - dragStartRef.current.x;
          const dyPixels = e.clientY - dragStartRef.current.y;
          const dxVideo = dxPixels / scaleFactor;
          const dyVideo = dyPixels / scaleFactor;
          onChange({
              ...settings,
              x: Math.round(settingsStartRef.current.x + dxVideo),
              y: Math.round(settingsStartRef.current.y + dyVideo)
          });
      };
      const handleMouseUp = () => setIsDragging(false);
      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, scaleFactor, settings, onChange]);


  if (!videoSrc) {
    return (
      <div className="w-full aspect-video bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600 text-slate-400">
        <p>Select a video file to begin</p>
      </div>
    );
  }

  const renderLeft = settings.x * scaleFactor;
  const renderTop = settings.y * scaleFactor;
  const renderWidth = watermarkMeta.width > 0 
      ? watermarkMeta.width * settings.scale * scaleFactor
      : undefined;

  // Calculate Crop Overlays
  // We want to show semi-transparent black boxes over the areas that will be cropped.
  let cropOverlay = null;
  if (settings.aspectRatio !== 'original' && videoDimensions.width > 0) {
      let targetRatio = 16/9;
      if (settings.aspectRatio === '9:16') targetRatio = 9/16;
      if (settings.aspectRatio === '1:1') targetRatio = 1;
      if (settings.aspectRatio === '4:3') targetRatio = 4/3;

      const videoRatio = videoDimensions.width / videoDimensions.height;
      
      // If video is wider than target, we crop width (pillars on sides)
      if (videoRatio > targetRatio) {
          const visibleWidth = videoDimensions.height * targetRatio;
          const cropAmount = (videoDimensions.width - visibleWidth) / 2;
          const cropPct = (cropAmount / videoDimensions.width) * 100;
          
          cropOverlay = (
              <>
                <div className="absolute top-0 left-0 h-full bg-black/70 pointer-events-none border-r border-yellow-500/50" style={{ width: `${cropPct}%` }}></div>
                <div className="absolute top-0 right-0 h-full bg-black/70 pointer-events-none border-l border-yellow-500/50" style={{ width: `${cropPct}%` }}></div>
              </>
          );
      } 
      // If video is taller than target, we crop height (bars on top/bottom)
      else if (videoRatio < targetRatio) {
          const visibleHeight = videoDimensions.width / targetRatio;
          const cropAmount = (videoDimensions.height - visibleHeight) / 2;
          const cropPct = (cropAmount / videoDimensions.height) * 100;
          
          cropOverlay = (
              <>
                 <div className="absolute top-0 left-0 w-full bg-black/70 pointer-events-none border-b border-yellow-500/50" style={{ height: `${cropPct}%` }}></div>
                 <div className="absolute bottom-0 left-0 w-full bg-black/70 pointer-events-none border-t border-yellow-500/50" style={{ height: `${cropPct}%` }}></div>
              </>
          );
      }
  }


  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black shadow-xl select-none" ref={containerRef}>
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-auto block" 
        controls
      />
      
      {/* Crop Visualization */}
      {cropOverlay}

      {/* Watermark Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden" // Ensure watermark doesn't spill out visually
      >
        {watermarkSrc && (
            <div 
                onMouseDown={handleMouseDown}
                className={`absolute cursor-move pointer-events-auto group ${isDragging ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-400'}`}
                style={{
                    left: `${renderLeft}px`,
                    top: `${renderTop}px`,
                    width: renderWidth ? `${renderWidth}px` : 'auto',
                    opacity: settings.opacity,
                    transformOrigin: 'top left',
                }}
            >
            <img 
                ref={watermarkImgRef}
                src={watermarkSrc} 
                alt="Watermark" 
                className="w-full h-auto block"
                onLoad={handleWatermarkLoad}
                draggable={false}
            />
            <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                x:{settings.x} y:{settings.y}
            </div>
            </div>
        )}
      </div>
       
       {settings.videoSpeed !== 1 && (
           <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur font-mono pointer-events-none">
               Preview Speed: {settings.videoSpeed}x
           </div>
       )}
    </div>
  );
};