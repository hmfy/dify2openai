# Dify2OpenAI

A bridge service that converts Dify API to OpenAI-compatible API format with a web management interface.

## Features

- 🔄 Convert Dify API to OpenAI API format
- 🎛️ Web-based management interface
- 📊 Request logging and monitoring
- 🔑 API key management
- 📱 Responsive design

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Development

```bash
# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend

# Start both (recommended)
npm run start:dev
```

### Production

```bash
# Build all
npm run build:all

# Start production server
npm run start:prod
```

## Usage

1. Open http://localhost:3012 in your browser
2. Create a new Dify application with your API credentials
3. Use the generated OpenAI-compatible API key in your applications

## API Endpoints

- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completions (OpenAI compatible)

## Configuration

The service uses SQLite database by default. Database file: `dify-manager.db`

## License

MIT