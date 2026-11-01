# Branch Restriction

- Work exclusively on `Antrixh_Ticket_v1.0`.
- Never switch to, edit, merge, rebase, cherry-pick, commit, or push changes on any other branch.
- Never use `main` or `tickethouse_v1` as a work branch.
- Do not change branches automatically. If the current branch is not `Antrixh_Ticket_v1.0`, stop and report the mismatch.
- Local Git hooks enforce the allowed branch for commits and pushes. They do not protect unsaved editor changes on another branch.

# Change Workflow

- Before acting on each new user request, briefly restate the intended outcome and ask for confirmation. Make no changes until the user confirms.
- After confirmation, execute the confirmed task directly without asking for redundant approvals.
- Ask focused questions only when the intended behavior, requirements, or acceptance criteria are genuinely ambiguous.
- Before the first edit, list the exact workspace-relative file paths that will change.
- If the scope or file list must change, stop and obtain confirmation before editing additional files.
- Once the scope is confirmed, do not repeat confirmations for individual edits within that scope.
- For clear, localized changes, inspect only the minimum necessary context and edit immediately.
- Avoid redundant shell commands, repeated file reads, broad searches, unnecessary diffs, and unrelated investigations.
- Do not run builds, tests, or linters unless requested or necessary to validate the change.
- Verify the result once using the smallest appropriate check.
- If an operation fails, use the actual error to correct it rather than repeating the same operation.
- Never claim a change succeeded unless the result has been verified.
- At completion, summarize the files changed and the verification performed.

# Environment File Restrictions

- Never open, read, print, or inspect environment files.
- Never ask the user to inspect or check environment files.
- You may request permission to inspect `.env.example`. Do not open or read it without explicit permission.
- Never open, read, or request inspection of any other environment file.

# Execution Priority

- Prioritize direct implementation over exploratory analysis.
- Reuse known file paths and context rather than rediscovering them.
- Do not modify unrelated code or perform speculative refactoring.
- Preserve existing project conventions and behavior outside the requested scope.
- Report blockers directly instead of performing unrelated investigative work.