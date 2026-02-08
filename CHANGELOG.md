# Changelog

All notable changes to this fork are documented here.
Upstream releases are summarised; local features are documented in detail.

---

## Unreleased — Merge upstream v0.4.0

Merged upstream releases v0.3.1 through v0.4.0 while preserving all local features.

### Upstream Features (v0.3.1 → v0.4.0)

#### v0.4.0 — LLM Connections, Codex Support, Workspace Defaults
- **LLM Connections** — Add multiple AI providers (Anthropic, OpenRouter, Codex/OpenAI), validate and manage each independently
- **Codex / OpenAI Support** — Connect OpenAI via Codex using OAuth, run Codex-powered sessions alongside Anthropic
- **Default Connection per Workspace** — Workspaces can set their own default LLM connection
- **Workspace-Specific Default Themes** — Each workspace can set a default theme via `defaults.colorTheme`

#### v0.3.5 — Claude Opus 4.6 & Auto-Update Reliability
- **Claude Opus 4.6** support (`claude-opus-4-6`)
- **macOS Auto-Update** — Real download progress (upgraded electron-updater v6.8.0+)
- **Automatic Image Resizing** — Large images auto-resize instead of being rejected
- **Skill Mentions** — Dot/space support in workspace IDs

#### v0.3.4 — Skills Convention & Windows Build
- **`.agents/skills` Convention** — Cross-tool compatibility with Codex, Gemini, etc.
- **Theme Config Priority Fix** — `config.json` theme properly overrides localStorage
- **Windows Build** — Major reliability improvements, `bun.lock` for consistent builds
- Provider error messages with guidance, custom model support in summarisation

#### v0.3.3 — Token Refresh & Multi-Header Auth
- **Automatic OAuth Token Refresh** — MCP tokens refresh in the background
- **Multi-Header Authentication** — API sources with multiple auth headers
- **RFC 9728** protected resource metadata discovery
- Parallelised token checks, lazy loading of bundled docs

#### v0.3.2 — Focus Mode & OAuth Improvements
- **Focus Mode** (`Cmd+.`) — Hide both sidebars for distraction-free work
- **Basic Auth Password Support** — `passwordRequired` option for basic auth sources
- **Security Fix** — Path traversal vulnerability in STORE_ATTACHMENT handler
- Progressive OAuth metadata discovery per RFC 8414

#### v0.3.1 — Session Search & Mini Agents
- **Session Search** (`Cmd+F`) — Full-text search across all sessions via ripgrep, match snippets in session list, chevron navigation between matches, auto-scroll to matching text
- **Mini Agents** — Lightweight agents for quick config edits (statuses, labels), configurable to use faster models (Haiku), inline execution UI in popovers
- **Draggable Popovers** — Edit popovers now have a grip handle, drag them anywhere on screen
- Session search sections ("In Current View" / "Other Conversations")
- Auto-capitalisation, spell-check, send-message-key input settings

### Merge Fixes
- Build scripts (`electron-dev.ts`, `electron-build-main.ts`) fall back to pre-built resource bundles when MCP server source isn't available (OSS repo)
- Added `projectId` to `SESSION_PERSISTENT_FIELDS` for session-project persistence
- Added `'multi-header'` to core `CredentialInputMode` type
- Added `labelId` to `ProjectConfig` type
- Added missing props to overlay component interfaces (`filePath`, `className`, `shikiTheme`, `disableBackground`, `onOpenFile`, `error`, `embedded`)
- Auto-recovery of project-session associations on startup (matches `workingDirectory` to project `rootPath`)

---

## Local Features

### Projects Hierarchy (#1, #3)
*Commits: 36d8fff, d2e1f3e*

Git-repo-anchored project organisation within workspaces.

- **Project CRUD** — Create, rename, delete projects anchored to git repo root paths
- **Session Grouping** — Assign sessions to projects, filter by project in sidebar
- **Project Navigator** — Dedicated sidebar section with session counts per project
- **Auto-Label Assignment** — Projects can auto-assign labels to new sessions via `labelId`
- **Project Badge** — Inline badge on sessions showing project assignment with dropdown
- **Open in Finder** — Right-click to open project root in Finder

### Worktree UI & Working Directory Tool (#2)
*Commit: 66dafbe*

- **`session_set_working_directory` tool** — Agents can change the session's working directory
- **Worktree button** (GitBranch icon) in chat footer for quick `/worktree` skill invocation
- **`Cmd+Shift+W`** hotkey to invoke worktree skill

### Session Changes View
*Commits: 6adbe9e, 61ea132*

- **Git diff in info panel** — View files modified during a session with +/- line counts
- **Single file diff** — Click a file to view its changes
- **Review All** — Multi-diff overlay to review all session changes at once
- **Auto-refresh** — Changes refresh every 10 seconds while session is active
- Plan files filtered out from diff display

### Sound Notifications
*Commits: 2d85db2, a7bd5ee*

- **Notification sounds** — Distinct sounds for different events
- **Sound toggle** — Enable/disable in Settings > Notifications

### UI Fixes
- **AcceptPlanDropdown** (1262e48) — Fixed positioning using Radix DropdownMenu
- **Info Panel hotkey** — `Cmd+O` toggles right sidebar (info panel)
- **Left Sidebar hotkey** — `Cmd+B` toggles left sidebar (upstream)
