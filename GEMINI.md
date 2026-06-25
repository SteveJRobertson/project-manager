# Gemini Instructions

Inherit all system rules and CLI commands from [AGENTS.md](./AGENTS.md).

## 🤖 Behavioral Overrides for Gemini

- **Context Handling:** You have an immense context window. When optimising code, review the entire state machine structure in `backend` before suggesting breaking changes.
- **UI Reviews:** If screenshots or UI layouts are provided in the context, evaluate the visual boundaries against the contrast rules specified in `AGENTS.md`.
