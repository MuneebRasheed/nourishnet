# NourishNet API Server

Small Node.js backend for the NourishNet app.

## Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env if needed (PORT defaults to 3001)
```

## Run

```bash
npm start
```

Development with auto-reload:

```bash
npm run dev
```

## Endpoints

- `GET /health` — Health check
- `GET /api` — API info

Server runs at `http://localhost:3001` by default. Point your app’s `EXPO_PUBLIC_API_URL` to this URL when using a device/emulator (e.g. `http://10.0.2.2:3001` for Android emulator, or your machine’s LAN IP).
