import fs from 'fs';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { preprocessAudio } from './audio_preprocess';

export const wss = new WebSocketServer({ noServer: true });

const SAMPLE_RATE = 8000;
const BYTES_PER_SAMPLE = 2;
const CHUNK_DURATION_MS = 1600;
const CHUNK_SAMPLES = (SAMPLE_RATE * CHUNK_DURATION_MS) / 1000;
const CHUNK_SIZE = CHUNK_SAMPLES * BYTES_PER_SAMPLE;

wss.on('connection', async (callWs: WebSocket) => {
    console.log('Teler WS connected');

  
    // 1. Read raw WAV from disk
    let rawWav: Buffer;
    try {
        rawWav = fs.readFileSync('./assets/input1.wav');
    } catch (err) {
        console.error('Failed to read WAV file:', err);
        callWs.close();
        return;
    }
    
    // 2. Preprocess: normalize loudness, resample to 8kHz mono PCM16, strip header
    let pcmBuffer: Buffer;
    try {
        pcmBuffer = await preprocessAudio(rawWav, {
        sampleRate: 8000,
        channels: 1,
        targetLufs: -16,
    });
        console.log(`PCM ready: ${pcmBuffer.length} bytes / ${pcmBuffer.length / CHUNK_SIZE} chunks`);
    } catch (err) {
        console.error('Audio preprocessing failed:', err);
        callWs.close();
        return;
    }

    // 3. Stream PCM chunks with drift-corrected pacing
    let chunkId = 1;
    const streamStartTime = Date.now();
    let chunksEmitted = 0;
    let cancelled = false;

    callWs.on('close', () => {
        console.log('Teler WS disconnected');
        cancelled = true;
    });

    callWs.on('error', (err) => {
        console.error('WebSocket error:', err);
        cancelled = true;
    });

    const streamChunks = () => {
        const offset = chunksEmitted * CHUNK_SIZE;

        if (cancelled || offset >= pcmBuffer.length) {
            if (!cancelled && callWs.readyState === WebSocket.OPEN) {
                callWs.send(JSON.stringify({ type: 'audio_end', total_chunks: chunkId - 1 }));
                console.log('Audio stream finished');
            }
            return;
        }

        if (callWs.readyState !== WebSocket.OPEN) return;

        const chunk = pcmBuffer.subarray(offset, offset + CHUNK_SIZE);
        const payload = JSON.stringify({
            type: 'audio',
            audio_b64: chunk.toString('base64'),
            chunk_id: chunkId++,
        });

        callWs.send(payload);
        chunksEmitted++;

        // Drift-corrected: schedule next chunk at exact wall-clock time
        const expectedNextTime = streamStartTime + chunksEmitted * CHUNK_DURATION_MS;
        const delay = Math.max(0, expectedNextTime - Date.now());
        setTimeout(streamChunks, delay);
    };

    streamChunks();
});

export const handleUpgrade = (
    request: IncomingMessage,
    socket: Socket,
    head: Buffer
) => {
    if (request.url === '/api/v1/media-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws);
    });
    } else {
        socket.destroy();
    }
};