# Branch restriction

- Work only on `Antrixh_Ticket_v1.0`.
- Do not switch to, edit, merge, rebase, cherry-pick, commit, or push changes on any other branch.
- Do not use `main` or `tickethouse_v1` as a work branch.
- The local Git hooks enforce the allowed branch for commits and pushes. These hooks do not prevent unsaved editor changes on another branch.

# Change requirements

- Before acting on each user request, restate the intended outcome and ask the user to confirm it. Do not make changes until the user confirms.
- Do not make anonymous, vague, speculative, or ambiguous edits. If the intended behavior or acceptance criteria are unclear, ask focused questions and wait for clarification.
- Before every edit, list the exact workspace-relative file paths that will change. If the file list or scope needs to change, stop and get confirmation first.

# Environment files

- Never open or read environment files, and never ask the user to inspect or check them.
- You may ask permission to inspect `.env.example`; open or read it only after permission is granted.
- Do not open, read, or ask the user to inspect or check any other environment file.