# Minimal Engineering Loop

This project uses a small Linear-centered engineering loop. The goal is to make recurring agent work predictable without hiding decisions from the human maintainer.

The loop follows the principles in Addy Osmani's loop engineering model: use automation as the heartbeat, Linear as durable state, subagents for isolated execution/review, and explicit human-review states for decisions the agent should not guess.

Reference: https://addyosmani.com/blog/loop-engineering/

## State Model

Linear is the source of truth.

Project team:

```text
RUN - https://linear.app/grocerlo/team/RUN/all
```

Workflow states:

- `Backlog`: scoped future work.
- `Todo`: work the loop is allowed to pick up.
- `In Progress`: work currently being executed by an agent.
- `In Review`: PR is open and awaiting automated/human review.
- `Human Review`: blocked on a human decision.
- `Done`: completed, merged, or explicitly closed.
- `Blocked`: blocked on an external dependency that is not a decision.

## Loop Responsibilities

### 1. PM Pass

The PM pass runs first on every loop tick.

Responsibilities:

- Inspect recently completed Linear issues.
- Inspect In Review issues and complete them if PRs are merged.
- Inspect open issues, known blockers, and current repo state.
- Scope follow-up work when completed tasks reveal a next step.
- Create new Linear issues in `Backlog` for future work.
- Move clearly actionable issues from `Backlog` to `Todo` only when the next step is specific enough for an agent.
- Avoid creating duplicate issues.

The PM pass should prefer small, reviewable issues that map to one PR.

### 2. Execution Pass

The execution pass picks up `Todo` issues.

Responsibilities:

- Select one or more `Todo` issues that are ready and independent.
- Move selected issues to `In Progress`.
- Create a branch per changeset, ideally including the Linear key.
- Launch subagents for implementation when useful.
- Keep each changeset isolated; use worktrees for parallel work when multiple agents run.
- Run validation appropriate to the change.
- Open a PR for every changeset.
- Move the issue to `In Review` after the PR is ready.

The loop must not push directly to `main`.

### 3. Human Decision Pass

When an issue requires a human judgment call, the loop creates or moves an issue to `Human Review`.

Use `Human Review` for decisions such as:

- choosing between product approaches
- approving a visual/design direction
- accepting a non-free service or usage limit
- deciding ambiguous route/blog metadata
- resolving conflicting requirements
- approving launch timing

The Human Review issue should include:

- the exact decision needed
- relevant options
- the recommended option when there is one
- the consequence of each option
- what the loop will do after the decision

Human workflow:

1. Human comments with the decision.
2. Human moves the issue back to `Todo`.
3. Loop picks up the issue, applies the decision, and records the result.
4. Loop moves the Human Review issue to `Done` once the decision has been consumed.

Decision issues should not contain large implementation work. If the decision creates implementation work, the loop should create a separate Linear issue for that work.

## Subagent Pattern

Use subagents where separation improves quality:

- `explore`: read-only repo exploration and impact assessment.
- `implementation`: make a scoped change on a branch/worktree.
- `review`: check the implementation against the Linear issue and project rules.
- `ci-investigator`: investigate failing checks when a PR is open.

Minimal default sequence:

1. Parent loop reads the Linear issue and repo state.
2. `explore` subagent gathers context if the implementation path is unclear.
3. Implementation agent makes the change.
4. Review subagent checks the diff before PR or before marking ready.
5. Parent loop updates Linear and PR state.

## Cadence

Start with a conservative in-session heartbeat:

```text
every 10 minutes
```

Each tick should:

1. Run the PM pass.
2. Launch up to five parallel subagents per tick for independent `Todo` issues. Each subagent works on its own branch with strict non-overlapping file ownership.
3. Update Linear with the current state.
4. Stop when there is no actionable `Todo` work or when blocked on `Human Review`.

When running parallel subagents, assign clear file ownership to each so changes don't conflict. If two issues must edit the same file, run them sequentially or in separate ticks.

## Stop Conditions

The loop should pause when:

- no `Todo` issues are actionable
- all remaining work is in `Human Review`, `Blocked`, or `In Review`
- a PR has failing checks that need human credentials or production access
- the repo has unrelated local changes that would make the next branch unsafe
- the user asks the loop to stop

## Minimal Tick Prompt

Use this as the recurring loop prompt:

```text
Run the runskitirol engineering loop:
1. PM pass: inspect RUN Linear issues, completed work, repo state, and known blockers. Create or update Linear issues for newly discovered work without duplicating existing issues.
2. Execution pass: pick up to 5 independent actionable RUN issues in Todo, move them to In Progress, launch parallel subagents (one per issue, each on its own branch with non-overlapping file ownership), validate, open PRs, and move to In Review.
3. Human decision pass: if explicit human input is required, create or move a Linear issue to Human Review with options and a recommendation. When a Human Review issue has a decision and is moved back to Todo, apply the decision, record what changed, and move the decision issue to Done.
Always make a PR for every changeset and never push directly to main.
```

## Current Project Shape

Done:

- `RUN-1`: Ingest RUN Komoot collection into baseline data files.
- `RUN-2`: Ingest SKIMO Komoot collection into baseline data files.
- `RUN-3`: Define route data contract and override workflow.
- `RUN-4`: Build visible end-to-end route map slice.
- `RUN-5`: Render all routes on an interactive free map.
- `RUN-6`: Add route list, search, and filters.
- `RUN-9`: Set up GitHub Pages deployment.
- `RUN-12`: Thicken route lines for easier clicking.
- `RUN-13`: Remove RUN/SKIMO switch from the top banner.
- `RUN-14`: Match RUN map banner look/feel to runskitirol.com/trails.
- `RUN-15`: Match SKIMO map banner look/feel to runskitirol.com/skimo.

In Progress:

- `RUN-17`: Replace distance and climb inputs with range sliders.
- `RUN-18`: Fix tags filter not working.
- `RUN-19`: Restyle route detail popups to match themed banners and remove collection badge.

Todo:

- `RUN-8`: Map blog posts to routes and enrich metadata.

Blocked:

- `RUN-7`: Support single-route and Squarespace embed modes.
- `RUN-10`: Add lightweight QA and data validation.
- `RUN-11`: Prepare launch and Squarespace replacement plan.

Backlog:

- `RUN-16`: Add rating filters and show blog URL in route details (blocked by RUN-8).
