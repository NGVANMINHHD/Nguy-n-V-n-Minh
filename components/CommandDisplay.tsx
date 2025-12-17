import React, { useState } from 'react';
import { WatermarkSettings, VideoMeta } from '../types';

interface CommandDisplayProps {
  videoName: string;
  imageName: string;
  settings: WatermarkSettings;
  videoMeta?: VideoMeta | null;
}

export const CommandDisplay: React.FC<CommandDisplayProps> = ({
  videoName,
  imageName,
  settings,
  videoMeta
}) => {
  const [copied, setCopied] = useState(false);
  const [scriptType, setScriptType] = useState<'windows' | 'bash'>('windows');

  const generateFilterComplex = () => {
      const { opacity, x, y, scale, videoSpeed, aspectRatio, outputResolution } = settings;
      let filterChain = [];
      
      const wmScale = scale !== 1 ? `,scale=iw*${scale}:-1` : '';
      const wmOpacity = `format=rgba,colorchannelmixer=aa=${opacity}`;
      filterChain.push(`[1]${wmOpacity}${wmScale}[wm]`);
      filterChain.push(`[0][wm]overlay=${x}:${y}[base]`);

      let currentStream = '[base]';

      if (videoSpeed !== 1) {
          filterChain.push(`${currentStream}setpts=PTS/${videoSpeed}[speeded]`);
          currentStream = '[speeded]';
      }

      if (aspectRatio !== 'original') {
          let arExpr = '';
          if (aspectRatio === '16:9') arExpr = '16/9';
          if (aspectRatio === '9:16') arExpr = '9/16';
          if (aspectRatio === '1:1') arExpr = '1';
          if (aspectRatio === '4:3') arExpr = '4/3';
          
          const cropFilter = `crop='min(iw,ih*${arExpr})':'min(ih,iw/${arExpr})':'(iw-ow)/2':'(ih-oh)/2'`;
          filterChain.push(`${currentStream}${cropFilter}[cropped]`);
          currentStream = '[cropped]';
      }

      if (outputResolution !== 'original') {
          let scaleFilter = '';
          if (outputResolution === '1080p') scaleFilter = 'scale=-1:1080';
          if (outputResolution === '720p') scaleFilter = 'scale=-1:720';
          if (outputResolution === '480p') scaleFilter = 'scale=-1:480';
          
          filterChain.push(`${currentStream}${scaleFilter}[finalv]`);
          currentStream = '[finalv]';
      }

      return {
          filterComplex: filterChain.join(';'),
          finalMap: `-map "${currentStream}"`
      };
  };

  const generateCommand = () => {
    const i = imageName || "watermark.png";
    const { startTime, endTime, videoSpeed, audioMode, isBatchMode, inputPath, outputPath, fileExtension } = settings;
    const { filterComplex, finalMap } = generateFilterComplex();

    const ss = startTime > 0 ? `-ss ${startTime}` : '';
    const duration = (endTime > 0 && endTime > startTime) ? (endTime - startTime) : 0;
    const t = duration > 0 ? `-t ${duration}` : '';
    
    let audioOpts = '';
    if (videoSpeed !== 1 && audioMode === 'sync') {
        audioOpts = `-filter:a "atempo=${videoSpeed}"`;
    } else if (videoSpeed !== 1 && audioMode === 'original') {
        audioOpts = '-c:a copy'; 
    } else {
        audioOpts = '-c:a copy';
    }
    const mapA = (audioMode === 'sync' && videoSpeed !== 1) ? '' : '-map 0:a';

    const baseFFmpeg = `ffmpeg ${ss} ${t} -i "%INPUT%" -i "${i}" -filter_complex "${filterComplex}" ${finalMap} ${mapA} ${audioOpts} "%OUTPUT%"`;

    if (!isBatchMode) {
        const finalCmd = baseFFmpeg
            .replace('%INPUT%', videoName || 'input.mp4')
            .replace('%OUTPUT%', 'output.mp4');
        return finalCmd;
    } else {
        if (scriptType === 'windows') {
            const batchInput = `"${inputPath}\\*.${fileExtension}"`;
            const outDir = `${inputPath}\\${outputPath}`;
            return `
@echo off
if not exist "${outDir}" mkdir "${outDir}"
echo Processing ${fileExtension} files...
for %%f in (${batchInput}) do (
    echo Processing: %%f
    ${baseFFmpeg.replace('%INPUT%', '%%f').replace('%OUTPUT%', `${outDir}\\%%~nf.${fileExtension}`)}
)
echo Done!
pause
            `.trim();
        } else {
            const outDir = `${inputPath}/${outputPath}`;
            return `
#!/bin/bash
mkdir -p "${outDir}"
echo "Processing ${fileExtension} files..."
for f in "${inputPath}"/*.${fileExtension}; do
    [ -e "$f" ] || continue
    filename=$(basename -- "$f")
    base="\${filename%.*}"
    echo "Processing: $f"
    ${baseFFmpeg.replace('%INPUT%', '$f').replace('%OUTPUT%', `${outDir}/$base.${fileExtension}`)}
done
echo "Done!"
            `.trim();
        }
    }
  };

  const command = generateCommand();

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
      const blob = new Blob([command], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = settings.isBatchMode 
        ? (scriptType === 'windows' ? 'process_batch.bat' : 'process_batch.sh')
        : (scriptType === 'windows' ? 'process_video.bat' : 'process_video.sh');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {settings.isBatchMode ? "Batch Script" : "FFmpeg Command"}
        </h2>
        
        <div className="flex gap-2">
            {/* OS Toggle for Batch */}
            <div className="flex bg-slate-950 rounded-md p-0.5 border border-slate-700">
                <button 
                    onClick={() => setScriptType('windows')}
                    className={`px-3 py-1 text-[10px] font-medium rounded transition-colors ${scriptType === 'windows' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Win (.bat)
                </button>
                <button 
                    onClick={() => setScriptType('bash')}
                    className={`px-3 py-1 text-[10px] font-medium rounded transition-colors ${scriptType === 'bash' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Linux (.sh)
                </button>
            </div>
        </div>
      </div>
      
      <div className="relative flex-grow group">
        <textarea
          readOnly
          value={command}
          className={`w-full h-full min-h-[140px] bg-black font-mono text-xs md:text-sm text-green-400 p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-600 resize-none ${settings.isBatchMode ? 'whitespace-pre' : ''} transition-colors`}
        />
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-md border border-slate-600 shadow-sm backdrop-blur"
            >
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
          <button 
            onClick={handleDownload}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2 rounded-lg font-medium text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             Download Executable
          </button>
      </div>
      
      <p className="mt-3 text-[10px] text-slate-500 text-center">
         Download the file, place it in your video folder, and double-click to run.
      </p>
    </div>
  );
};