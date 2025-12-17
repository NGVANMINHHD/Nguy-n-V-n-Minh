export interface WatermarkSettings {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  startTime: number;
  endTime: number;
  // Speed Settings
  videoSpeed: number;
  audioMode: 'original' | 'sync';
  // Output Frame Settings
  aspectRatio: 'original' | '16:9' | '9:16' | '1:1' | '4:3';
  outputResolution: 'original' | '1080p' | '720p' | '480p';
  // Batch Settings
  isBatchMode: boolean;
  inputPath: string;
  outputPath: string;
  fileExtension: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface VideoMeta {
  width: number;
  height: number;
  duration: number;
}