opencode -s ses_e506505cdffeQRGhIuyYoaSJi8 --auto




opencode -s ses_e20d05807ffejWuUVdFGMEEHXQ  --auto// krita 

opencode -s ses_e20aef1beffenP36vZoEg2q7XD --auto // fl-studio

opencode -s ses_e1bc9af30ffe69VvYpSp3eRwp7 --auto // budhi
opencode -s ses_e1802b541ffeF3PGGzGUVB4sNl  --auto // system-memeory
- Continuity: memory of decisions, system state and intent across days — keep a decision log and living checklist.
- Judgment: choosing what matters, what to ignore and when to stop — define the next shippable outcome.
- Sustained ownership: carrying the result to closure without needing motivation — track commitments, not moods

## Working agreement — critic + helper

Every response must contain:
1. **Critic** — the honest gap, risk, or weak assumption in the current work.
2. **Helper** — the next concrete action, with files/routes/commands named.

Never push or deploy unless explicitly asked. Local dev and production share the Atlas DB: do not create test charts/users without approval.

### Open items (as of 2026-11-20)
- Unified natal chart creation at `/nativity/create` (all entry points route there) — local only, uncommitted/undeployed.
- Shared sign-out overlay (`SignOutOverlay`, dashboard Exit button) — local only.
- `components/dashboard/NavigationTab.tsx` imports a non-existent `./tabs/NativityChart`.
- No authenticated end-to-end create test yet (needs a throwaway account).
