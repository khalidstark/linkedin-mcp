# linkedin-mcp

> A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude full control over your LinkedIn profile — update your headline, add skills, drop certifications, and publish posts, all from a single conversation.

Built with [Playwright](https://playwright.dev) for browser automation and the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Table of Contents

- [Features](#features)
- [Tools](#tools)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Connect to Claude Code](#connect-to-claude-code)
- [Usage](#usage)
- [Session Management](#session-management)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Features

- **No LinkedIn API access required** — works through real browser automation, so you don't need an approved LinkedIn developer app.
- **Persistent session** — log in once, reuse the session for weeks.
- **CV → profile in one shot** — paste a CV and let Claude extract and apply headline, summary, skills, and certifications.
- **Publish posts directly from chat** — text posts and image posts both supported.
- **Eight focused tools** — small, predictable surface area instead of one mega-tool.

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
- [Claude Code](https://claude.ai/code) (or any other MCP-compatible client)
- A real LinkedIn account you're allowed to automate

---

## Installation

```bash
git clone https://github.com/khalidstark/linkedin-mcp.git
cd linkedin-mcp
npm install
npx playwright install chromium
npm run build
```

The build step compiles TypeScript into `dist/`. The compiled entry point is `dist/index.js` — that's the file the MCP client will run.

---

## Connect to Claude Code

The easiest way is the `claude mcp add` CLI command. From inside the cloned repo:

```bash
claude mcp add linkedin -s user -- node "$(pwd)/dist/index.js"
```

- `linkedin` is the server name you'll see in `claude mcp list`.
- `-s user` registers it globally for your user (use `-s project` to scope it to one project, or omit for the default `local` scope).
- Everything after `--` is the command Claude Code will spawn.

After running it, restart Claude Code (or any open session) and verify with:

```bash
claude mcp list
```

You should see `linkedin: node /…/linkedin-mcp/dist/index.js - ✓ Connected`.

### Manual config (alternative)

If you prefer to edit config files directly, Claude Code stores MCP servers inside `~/.claude.json` under the `mcpServers` key. Add this entry:

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-mcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/linkedin-mcp` with the actual path where you cloned the repo, then restart Claude Code.

### Other MCP clients

For Claude Desktop, Cursor, and other MCP-compatible clients, point them at the same `node /absolute/path/to/linkedin-mcp/dist/index.js` command in whatever config format they use.

---

## Usage

### 1. Log in (first time only)

Tell Claude:

> "Call linkedin_login"

A Chromium window will open. Log in to LinkedIn as you normally would, including any 2FA or captcha challenges. Once you land on the feed, the session is saved to `~/.linkedin-mcp-session/` and reused on future calls — you won't need to log in again unless the session expires.

### 2. Update your profile from a CV

Paste your CV into the conversation and ask Claude to extract and apply the relevant data:

> "Here is my CV: [paste]. Read it, update my LinkedIn headline and summary, add all my skills, and add all certifications."

Claude will call the appropriate tools automatically.

### 3. Publish a post

> "Write a short post about my new certification and publish it on LinkedIn."

> "Post this image to LinkedIn with the caption 'Excited to share this milestone!': /Users/you/photo.jpg"

Image paths must be absolute — relative paths won't resolve correctly inside the MCP subprocess.

---

## Session Management

Login sessions are stored in `~/.linkedin-mcp-session/state.json` (cookies + local storage). This file is **not** committed to the repo and is ignored by `.gitignore`. If your session expires, just call `linkedin_login` again to refresh it.

To force a fresh login at any time, delete the session directory:

```bash
rm -rf ~/.linkedin-mcp-session
```

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

When iterating on the tools, rebuild and restart the MCP client so it picks up the new `dist/index.js`. Claude Code reloads servers on restart, not on file change.

---

## Troubleshooting

**Claude Code says the server failed to connect**
Run `claude mcp list` to see the exact error. Most common causes:
- The path to `dist/index.js` is wrong or you forgot to run `npm run build`.
- Node isn't on the PATH that Claude Code's subprocess inherits — try the absolute path to your `node` binary (`which node`).

**`npx playwright install chromium` fails or hangs**
Re-run it with verbose logging: `DEBUG=pw:install npx playwright install chromium`. On macOS, make sure Xcode command line tools are installed (`xcode-select --install`). On Linux, you may also need `npx playwright install-deps chromium` for system libraries.

**LinkedIn shows a captcha or security check**
Solve it manually in the Chromium window that `linkedin_login` opens. The session is saved only after you land on the LinkedIn feed, so don't close the window until you're fully logged in.

**Session keeps expiring**
LinkedIn invalidates sessions if you log in elsewhere, change passwords, or trigger security alerts. Delete `~/.linkedin-mcp-session` and call `linkedin_login` again.

**A tool runs but the profile doesn't update**
LinkedIn occasionally ships UI changes that break selectors. Run with `npm run dev` to see Playwright errors in the terminal, and open an issue with the failing tool and a redacted screenshot if you can.

**"Browser closed unexpectedly" errors**
Usually means another `linkedin-mcp` instance is already holding the profile lock. Make sure only one Claude session is running, or kill stray `chromium` processes.

---

## Disclaimer

This project uses browser automation to interact with LinkedIn. Automating LinkedIn actions may violate their [User Agreement](https://www.linkedin.com/legal/user-agreement). Use it on your own account, at your own discretion. The author is not responsible for any account restrictions, suspensions, or other consequences that result from using this tool.

---

## License

MIT
