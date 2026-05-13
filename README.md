# linkedin-mcp

> A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude Code full control over your LinkedIn profile — update your headline, add skills, drop certifications, and publish posts, all from a single conversation.

Built with [Playwright](https://playwright.dev) for browser automation and the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `linkedin_login` | Open browser for manual login and save session | — |
| `linkedin_get_profile` | Read your current profile (name, headline, skills) | — |
| `linkedin_update_headline` | Update your profile headline | `headline` |
| `linkedin_update_summary` | Rewrite your About / Summary section | `summary` |
| `linkedin_add_skill` | Add a skill to your profile | `skill` |
| `linkedin_add_certification` | Add a certification entry | `name`, `issuer`, `issueDate?` (MM/YYYY), `credentialId?`, `credentialUrl?` |
| `linkedin_create_text_post` | Publish a plain text post | `text` |
| `linkedin_create_image_post` | Publish a post with a local image | `text`, `imagePath` (absolute path) |

---

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [npm](https://www.npmjs.com) v9 or later
- [Claude Code](https://claude.ai/code) (CLI or desktop app)

---

## Installation

```bash
git clone https://github.com/khalidstark/linkedin-mcp.git
cd linkedin-mcp
npm install
npx playwright install chromium
npm run build
```

---

## Connect to Claude Code

Add the server to your Claude Code MCP config at `~/.claude/mcp.json`:

```json
{
  "linkedin": {
    "command": "node",
    "args": ["/absolute/path/to/linkedin-mcp/dist/index.js"],
    "env": {
      "PATH": "/usr/local/bin:/usr/bin:/bin"
    }
  }
}
```

Replace `/absolute/path/to/linkedin-mcp` with the actual path where you cloned the repo, then **restart Claude Code**.

---

## Usage

### 1. Log in (first time only)

Tell Claude:

> "Call linkedin_login"

A Chromium window will open. Log in to LinkedIn as you normally would. Once you land on the feed, the session is saved to `~/.linkedin-mcp-session/` and reused on future calls — you won't need to log in again unless the session expires.

### 2. Update your profile from a CV

Paste your CV into the conversation and ask Claude to extract and apply the relevant data:

> "Here is my CV: [paste]. Read it, update my LinkedIn headline and summary, add all my skills, and add all certifications."

Claude will call the appropriate tools automatically.

### 3. Publish a post

> "Write a short post about my new certification and publish it on LinkedIn."

> "Post this image to LinkedIn with the caption 'Excited to share this milestone!': /Users/you/photo.jpg"

---

## Session Management

Login sessions are stored in `~/.linkedin-mcp-session/state.json` (cookies + local storage). This file is **not** committed to the repo. If your session expires, just call `linkedin_login` again.

---

## Project Structure

```
linkedin-mcp/
├── src/
│   ├── index.ts      # MCP server + tool registration
│   ├── linkedin.ts   # LinkedIn automation functions
│   └── browser.ts    # Playwright browser/session lifecycle
├── dist/             # Compiled output (generated, not committed)
├── package.json
└── tsconfig.json
```

---

## Development

```bash
npm run build   # Compile TypeScript → dist/
npm run dev     # Run with ts-node (no build step)
```

---

## ⚠️ Disclaimer

This project uses browser automation to interact with LinkedIn. Automating LinkedIn actions may violate their [User Agreement](https://www.linkedin.com/legal/user-agreement). Use it on your own account, at your own discretion.

---

## License

MIT
