# Teler WAV Bridge

A reference implementation demonstrating how to stream a pre-recorded WAV file to a live phone call using Teler's Media Streaming Bridge over WebSockets, while recording and collecting the caller's responses.

## What is Teler?

Teler is a programmable voice API by FreJun. It handles telephony infrastructure, phone numbers, call routing, and real-time audio streaming, allowing developers to build custom voice workflows directly on phone calls.

Learn more at https://frejun.ai

---

## Overview

This project demonstrates a simple but powerful voice workflow:

1. Initiate an outbound phone call.
2. Stream a pre-recorded WAV file to the callee over WebSockets.
3. Capture the callee's responses in real time.
4. Store the call recording for later review and analysis.

Unlike AI voice agents, there is no real-time speech generation or conversational AI involved. The caller hears a pre-recorded audio message, and their responses are recorded and made available after the call.

This makes the integration lightweight, predictable, and ideal for one-way announcements, surveys, campaigns, and response collection workflows.

---

## Who is this for?

This integration is ideal for teams that want to automate voice outreach without deploying AI agents.

### Common Use Cases

#### Appointment Reminders

Play a pre-recorded reminder and collect customer confirmations or responses.

#### Recruitment & Candidate Screening

Play screening questions and collect recorded candidate answers.

#### Customer Feedback Campaigns

Gather voice feedback without requiring a live agent or AI assistant.


## Features

* Stream pre-recorded WAV files directly into live phone calls over WebSockets.
* Capture and record caller responses.
* Dockerized deployment.
* Access recordings through the FreJun Dashboard or Recording API.

---

## Accessing Recordings

All caller responses are recorded and can be accessed through:

### FreJun Teler Dashboard

View, listen to, and manage call recordings directly from the dashboard.

### Recording API

Retrieve recordings programmatically using the Recording API.

Recording API Documentation:

https://api.frejun.ai/redoc#tag/Recordings/operation/generate_signed_url_api_v1_recordings__get

---

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- A Teler API Key (get one at https://platform.frejun.ai)
- An ngrok account and auth token

---
## Setup

### Clone and Configure

```bash
git clone https://github.com/frejun-tech/teler-wav-bridge.git
cd teler-wav-bridge

cp .env.example .env
```

Update the `.env` file with your credentials.

### Run with Docker

```bash
docker compose up -d --build
```

---

## Environment Variables

| Variable          | Description                          | Default  |
| ----------------- | ------------------------------------ | -------- |
| TELER_SAMPLE_RATE | Audio sample rate used for streaming | 8k       |
| TELER_API_KEY     | Your Teler API Key                   | Required |
| NGROK_AUTHTOKEN   | Your ngrok Auth Token                | Required |

---
## Audio Requirements

For best results, audio files should be:

* WAV format
* PCM S16LE
* Mono
* 8000 Hz sample rate

This format aligns with standard telephony audio and ensures optimal playback quality during calls.


## API Endpoints

### Health & Status

* `GET /` - Health check and server information
* `GET /health` - Service status
* `GET /ngrok-status` - Current ngrok status and public URL

### Calls

* `POST /api/v1/calls/initiate-call` - Initiate an outbound call
* `POST /api/v1/calls/flow` - Retrieve call flow configuration

### Media Streaming

* `WebSocket /api/v1/calls/media-stream`

Streams pre-recorded WAV audio to the call and receives caller audio events.

### Webhooks

* `POST /api/v1/webhooks/receiver`

Receives call status and media events from Teler.

---

## Call Initiation Example

```bash
curl -X POST "https://your_ngrok_domain/api/v1/calls/initiate-call" \
  -H "Content-Type: application/json" \
  -d '{
    "fromNumber": "+918064xxx",
    "toNumber": "+919967xxx"
  }'
```

---