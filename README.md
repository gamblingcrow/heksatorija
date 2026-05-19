# Heksatorija

A browser-based hex-grid strategy game for 2–4 players (or fully AI-driven simulation). Players claim vertices on a 19-hex board by building, moving, attacking, and collecting special powers — last player standing or first to hit a territory threshold wins.

## Rules

### Setup

- **2–4 players** start with one base vertex each, placed evenly around the outer ring of the board.
- Each player begins every turn with **4 AP** (Action Points), configurable in the setup screen.

### On your turn

Spend AP on any combination of actions:

| Action | Default cost | Description |
|---|---|---|
| **Build** | 2 AP (3 in center) | Claim an empty vertex adjacent to one of your active vertices. |
| **Move** | 2 AP | Relocate one of your active vertices up to 2 edges away (must land on an empty vertex). |
| **Attack** | 3 / 4 / 5 AP | Remove an enemy vertex (normal / center hex / enemy base). Destroying a base eliminates that player. |
| **Gamble** | 3 AP | Roll a d6; net gain/loss averages ≈ 0 at the default cost. |
| **Bank** | free | Save up to 6 AP across turns (configurable). |

**Connectivity matters:** a vertex is *active* only if it is your base or is part of a chain of two or more of your vertices that traces back to your base. Isolated vertices are shown dimmed and cannot be built from.

**Undo:** you can undo your last action once per turn (Ctrl+Z or the ↶ button).

### Special powers

Certain outer-ring hexes hide a power token. Stepping on them grants one of:

- **+1 AP / turn** — permanent bonus AP at the start of each turn.
- **Bank +2** — raises your bank capacity to 8.
- **Cheap gamble** — gamble costs 1 AP less.
- **Defensive shield** — your base is immune to attack for 2 turns.
- **AP refund** — successful attacks return 1 AP.

### Winning

The first player to meet **any** of these conditions wins:

1. Control **6 of the 6 center vertices** (default; adjustable 3–6).
2. Own **8 or more hexagons** (default; adjustable 3–18).
3. Be the **last player alive**.

All thresholds are adjustable on the setup screen before the game starts.

### AI archetypes

When playing against AI (or running a simulation with 0 humans), each AI slot can be set to:

| Archetype | Style |
|---|---|
| **Balanced** | Well-rounded mix of all strategies |
| **Aggressor** | Prioritises attacking |
| **Builder** | Focuses on expansion and center control |
| **Turtle** | Defends and gambles |
| **Runner** | Moves aggressively to reposition |

## How to run

No build step required — the game is a single self-contained HTML file.

1. Clone or download the repository.
2. Open `index.html` in any modern browser.
3. Configure players, costs, and win conditions on the setup screen, then click **START GAME**.

To watch an AI-only simulation, set humans to 0 and click **RUN SIMULATION**.
