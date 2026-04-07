# Remarq

> I was too lazy to comment on my professor's videos. So I built an AI Chrome extension to do it for me.

## The story

Built for a Prompt Engineering for GenAI course at Northeastern University where daily comments on the professor's posts counted toward the final grade. Instead of commenting manually, built a Chrome extension that reads page context and generates contextually relevant comments using Claude AI.

## What it does

- YouTube: automatically reads the video title and channel, generates a relevant comment
- LinkedIn: highlight any post text, generate a comment in your chosen tone
- Substack: highlight any article text, generate a comment instantly

Tone options: Thoughtful, Enthusiastic, Professional, Concise, Curious

No API key required — just install and use. Limited to 10 comments per day.

## Tech stack

- Chrome Extension (Manifest V3)
- Content scripts for platform-specific scraping
- Background service worker for API communication
- Node.js + Express backend (private repo) deployed on Railway
- Anthropic Claude API for comment generation
- In-memory rate limiting per extension ID

## Architecture

Chrome Extension → Railway Backend (private) → Anthropic Claude API

The backend is intentionally kept in a private repository. The extension communicates with a hosted backend endpoint — no API keys are needed on the client side.

## Prompt engineering decisions

- Platform-specific system prompts: YouTube gets conversational tone, LinkedIn gets professional, Substack gets thoughtful
- Page content is explicitly passed as data only with instructions to never follow directives found within it — prevents prompt injection through post text
- Hard cap of 150 tokens enforced at the API level, not just the UI
- BLOCKED and NO_CONTENT sentinels for safety filtering

## What I learned

- Chrome Extension architecture: content scripts, service workers, message passing
- Prompt injection defense in production AI systems
- Building and deploying a proxy backend to protect API keys
- Platform-specific DOM scraping (YouTube, LinkedIn, Substack all have different structures)
- Rate limiting strategies for AI-powered tools

## Installation

This extension is available on the Chrome Web Store: [link coming soon]

To run locally you will need access to the backend — the hosted endpoint is rate limited and intended for personal use.

## License

MIT
