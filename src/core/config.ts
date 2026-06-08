import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port:                   Number(process.env.PORT) || 8000,
    nodeEnv:                process.env.NODE_ENV || 'development',
    serverDomain:           process.env.SERVER_DOMAIN || '',
    telerKey:               process.env.TELER_API_KEY || '',
    telerSampleRate:        process.env.TELER_SAMPLE_RATE || '8k',
} as const;