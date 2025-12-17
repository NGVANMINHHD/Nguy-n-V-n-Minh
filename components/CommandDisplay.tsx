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
        // Single File Command
        const finalCmd = baseFFmpeg
            .replace('%INPUT%', videoName || 'input.mp4')
            .replace('%OUTPUT%', 'output.mp4');
        return finalCmd;
    } else {
        // Batch Script Generation
        if (scriptType === 'windows') {
            const batchInput = `"${inputPath}\\*.${fileExtension}"`;
            // Windows Batch Logic
            // %~nf expands to filename without extension
            // mkdir if not exists
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
            // Bash Logic
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

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {settings.isBatchMode ? "Generated Batch Script" : "Generated Command"}
        </h2>
        
        {/* OS Toggle for Batch */}
        {settings.isBatchMode && (
             <div className="flex bg-slate-900 rounded-md p-0.5 border border-slate-700">
                <button 
                    onClick={() => setScriptType('windows')}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${scriptType === 'windows' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Windows (.bat)
                </button>
                <button 
                    onClick={() => setScriptType('bash')}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${scriptType === 'bash' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Linux/Mac (.sh)
                </button>
             </div>
        )}
      </div>
      
      <div className="relative flex-grow">
        <textarea
          readOnly
          value={command}
          className={`w-full h-full min-h-[120px] bg-slate-950 font-mono text-xs md:text-sm text-green-400 p-4 rounded-lg border border-slate-700 focus:outline-none resize-none ${settings.isBatchMode ? 'whitespace-pre' : ''}`}
        />
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-md border border-slate-600 transition-colors flex items-center gap-2 shadow-sm"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {settings.isBatchMode 
            ? `Save this as a ${scriptType === 'windows' ? '.bat' : '.sh'} file in your video folder and run it.`
            : `Run this command in your terminal. Ensure ffmpeg is installed.`
        }
      </p>
    </div>
  );
};