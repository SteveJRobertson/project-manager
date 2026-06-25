# Claude Instructions

Inherit all system rules and CLI commands from [AGENTS.md](./AGENTS.md).

## 🤖 Behavioral Overrides for Claude

- **Coding Style:** Claude, prioritise strict type safety and dry runs. When modifying code, output file diffs instead of rewriting entire files.
- **Verification:** After modifying code, you _must_ run `npm run lint` and the appropriate workspace test command to verify your changes before reporting success.
