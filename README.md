<br />
<div align="center">

  <img src="./assets/icon.png" alt="Rael" width="200" height="200" />

  <h1>Rael</h1>

  <p><strong>CONVERSATION MEETS CAPABILITY</strong></p>

  <p>
    <a href="https://github.com/goldstac/rael/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/goldstac/rael?style=flat-square&color=blue" alt="License" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Bun-1.2-orange?style=flat-square&logo=bun&logoColor=white" alt="Bun" />
    <img src="https://img.shields.io/badge/Discord.js-14-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord.js" />
    <img src="https://img.shields.io/badge/AI%20SDK-6.0-black?style=flat-square" alt="AI SDK" />
    <img src="https://img.shields.io/badge/Groq-Fast%20Inference-7700FF?style=flat-square&logoColor=white" alt="Groq" />
    <img src="https://img.shields.io/badge/OpenRouter-Multi--Model-FF6B35?style=flat-square&logoColor=white" alt="OpenRouter" />
    <img src="https://img.shields.io/badge/Exa-Search-00FF88?style=flat-square&logoColor=white" alt="Exa" />
    <img src="https://img.shields.io/badge/Zod-Validation-3E68FF?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
    <img src="https://img.shields.io/badge/Version-2.0.1-0097e6?style=flat-square" alt="Version" />
  </p>

</div>

---

## About

Rael is an AI-powered Discord bot built for natural conversation, multi-model flexibility, and useful utilities like vision, web search, live stock data, and usage tracking.

## Features

- **Multi-Model AI** — Switch between Groq and OpenRouter providers for flexible model access
- **Natural Conversation** — Chat with the bot using a simple comma prefix or by pinging it directly
- **Web Search** — Get real-time information powered by Exa search
- **Vision Support** — Analyze images sent to the bot
- **Usage Tracking** — View your token usage with a clean visual breakdown
- **Stats Dashboard** — See server-wide bot statistics at a glance
- **Auto Model Fallback** — Automatically retries with another model if a provider is unavailable
- **Clean Command System** — Minimal, predictable prefix-based interface

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- A Discord bot token
- API keys for your preferred AI providers (Groq / OpenRouter)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/goldstac/rael.git
cd rael

# Install dependencies
bun install

# Start the bot
bun start
```

For development with hot reload:

```bash
bun run dev
```

## Usage

Rael uses a prefix-based interface with two modes of interaction.

### AI-first mode (`,`)

Start your message with a comma to send it directly to the AI without needing a command. You can also simply ping the bot instead of using the prefix.

```
,what is a JavaScript promise?
,explain async/await in simple terms
```

### Command-first mode (`$`)

Use this prefix for structured commands such as configuration, status checks, or utility actions.

```
$help
$ping
$usage
$stats
```

### Resetting Context

```
$resetctx
$resetai
$clearctx
```

Resetting clears conversation history and restores default behavior.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](./LICENSE) file for details.
