import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { Readable } from 'stream';

export interface PreprocessOptions {
  sampleRate?: number; 
  channels?: number;
  targetLufs?: number;
}

/**
 * Preprocesses a WAV buffer to Teler-ready raw PCM16:
 * - Converts to mono
 * - Resamples to 8kHz
 * - Normalizes loudness via EBU R128 (loudnorm)
 * - Strips WAV header — returns raw PCM bytes
 */
export function preprocessAudio(
  inputBuffer: Buffer,
  opts: PreprocessOptions = {}
): Promise<Buffer> {
  const {
    sampleRate = 8000,
    channels = 1,
    targetLufs = -16,
  } = opts;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const ffmpeg = spawn(ffmpegPath!, [
      '-f', 'wav',
      '-i', 'pipe:0',

      '-af', `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11`,

      '-ar', String(sampleRate),               // resample
      '-ac', String(channels),                 // mono
      '-f', 's16le',                           // raw PCM16 LE, no WAV header
      '-acodec', 'pcm_s16le',
      'pipe:1',                                // write to stdout
    ]);

    Readable.from(inputBuffer).pipe(ffmpeg.stdin);

    ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stderr.on('data', () => {});

    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(new Error(`FFmpeg exited with code ${code}`));
      resolve(Buffer.concat(chunks));
    });

    ffmpeg.on('error', reject);
  });
}