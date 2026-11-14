# Glendale2Biz

Read **[MASTER_INSTRUCTIONS.md](MASTER_INSTRUCTIONS.md)** before doing anything — it defines scope, architecture, contracts (`lib/contracts.ts`), file ownership, the direct-to-`main` git rules, and the timeline. Phase details are in `docs/phases/`.

Key rules at a glance:
- Commit subjects: `feat|docs|cicd|test|uiux|chore/<topic>: <description>`. Push after every commit.
- Shared working tree: stage only your own paths; never `git add .`, stash, reset, or force-push.
- Never commit or print secrets (`GLENDALE_GIS_MCP_KEY`, `.env.local`).
- Mock data is always labeled; zoning output is guidance, not legal advice.
