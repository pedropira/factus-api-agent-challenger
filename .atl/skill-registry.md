# Skill Registry — factus-agent

> Auto-generated. Last updated: 2026-05-27

## User Skills (global)

### customize-opencode
- **Triggers**: Editing/creating opencode's own configuration (opencode.json, opencode.jsonc, .opencode/, ~/.config/opencode/)
- **Location**: `~/.config/opencode/skills/customize-opencode/SKILL.md`

### go-testing
- **Triggers**: Writing Go tests, using teatest, adding test coverage for Bubbletea TUIs
- **Location**: `~/.config/opencode/skills/go-testing/SKILL.md`

### branch-pr
- **Triggers**: Creating a pull request, opening a PR, preparing changes for review
- **Location**: `~/.config/opencode/skills/branch-pr/SKILL.md`

### issue-creation
- **Triggers**: Creating a GitHub issue, reporting a bug, requesting a feature
- **Location**: `~/.config/opencode/skills/issue-creation/SKILL.md`

### judgment-day
- **Triggers**: "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen"
- **Location**: `~/.config/opencode/skills/judgment-day/SKILL.md`

### skill-creator
- **Triggers**: Creating a new skill, adding agent instructions, documenting patterns for AI
- **Location**: `~/.config/opencode/skills/skill-creator/SKILL.md`

### skill-registry
- **Triggers**: "update skills", "skill registry", "actualizar skills", "update registry", after installing/removing skills
- **Location**: `~/.config/opencode/skills/skill-registry/SKILL.md`

## SDD Skills (built-in)

| Skill | Trigger |
|-------|---------|
| `sdd-explore` | Investigate codebase, think through ideas |
| `sdd-propose` | Create change proposals from explorations |
| `sdd-spec` | Write detailed specifications from proposals |
| `sdd-design` | Create technical design from proposals |
| `sdd-tasks` | Break down specs/designs into implementation tasks |
| `sdd-apply` | Implement code changes from task definitions |
| `sdd-verify` | Validate implementation against specs |
| `sdd-archive` | Archive completed change artifacts |
| `sdd-init` | Bootstrap SDD context in a project |
| `sdd-onboard` | Guide user through a full SDD cycle |

## Project Conventions

| File | Description |
|------|-------------|
| `AGENTS.md` | Main project instructions — architecture, stack, MCP server quirks, UI conventions, commands |
| `CLAUDE.md` | Index file referencing `AGENTS.md` |

## Notes

- Strict TDD Mode: **disabled** (no test runner detected)
- Project type: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
- External MCP server: `factus-mcp-server-challenge` (Python, Streamable HTTP on Render)
