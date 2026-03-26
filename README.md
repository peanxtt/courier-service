# Kiki's Courier Service

A CLI application for estimating delivery costs (with discount offers) and delivery times (with vehicle scheduling) for Kiki's courier service.

---

## Project Structure

```
courier-service/
├── src/
│   ├── main.ts                 # Entry point — routes piped vs interactive mode
│   ├── types/
│   │   └── types.ts            # Domain interfaces (Package, Shipment, VehicleConfig, etc.)
│   ├── libs/
│   │   └── utils.ts            # roundDown (truncate) and roundUp (round) precision helpers
│   ├── cli/
│   │   ├── parser.ts           # Input parsing and validation
│   │   ├── display.ts          # Formatted ANSI console output
│   │   └── prompts.ts          # Interactive TTY prompts
│   └── delivery/
│       ├── cost.ts             # Cost formula: base + weight×10 + distance×5
│       ├── offers.ts           # Offer registry and discount calculation
│       ├── planner.ts          # Shipment grouping (bitmask subset enumeration)
│       └── scheduler.ts        # Vehicle scheduling and delivery time estimation
└── tests/
    ├── utils.test.ts
    ├── offers.test.ts
    ├── cost.test.ts
    ├── planner.test.ts
    ├── scheduler.test.ts
    └── integration.test.ts
```

---

## Setup

**Prerequisites:** Node.js >= 18

```bash
pnpm install
```

That's it — no build step required. The app runs directly from TypeScript source via `tsx`.

---

## Running Tests

```bash
# Run all tests once
pnpm test

# Run in watch mode (re-runs on file changes)
pnpm run test:watch
```

---

## Running the Application

The app has two modes: **piped** (non-interactive) and **interactive** (TTY prompt).

### Piped mode

Pipe or redirect input directly:

```bash
# From a file
npm start < input.txt

# Inline with echo
echo "100 3
PKG1 5 5 OFR001
PKG2 15 5 OFR002
PKG3 10 100 OFR003" | npm start
```

### Interactive mode

Run with no input to enter guided prompts:

```bash
npm start
```

The app will ask you to choose a problem, then walk through each field interactively with validation and coloured output.

---

## Input Format

### Problem 1 — Cost estimation

```
<base_delivery_cost> <no_of_packages>
<pkg_id> <weight_kg> <distance_km> <offer_code>
...
```

### Problem 2 — Time estimation

Same as Problem 1, with a vehicle configuration line appended:

```
<base_delivery_cost> <no_of_packages>
<pkg_id> <weight_kg> <distance_km> <offer_code>
...
<no_of_vehicles> <max_speed_kmh> <max_carriable_weight_kg>
```

---

## Example Commands

### Problem 1 — Delivery cost with offers

**Input:**
```
100 3
PKG1 5 5 OFR001
PKG2 15 5 OFR002
PKG3 10 100 OFR003
```

**Command:**
```bash
echo "100 3
PKG1 5 5 OFR001
PKG2 15 5 OFR002
PKG3 10 100 OFR003" | npm start
```

**Output** (`<package_id> <discount> <total_cost>`):
```
PKG1 0 175
PKG2 0 275
PKG3 35 665
```

---

### Problem 2 — Delivery time with vehicle scheduling

**Input:**
```
100 5
PKG1 50 30 OFR001
PKG2 75 125 OFR008
PKG3 175 100 OFR003
PKG4 110 60 OFR002
PKG5 155 95 NA
2 70 200
```

**Command:**
```bash
echo "100 5
PKG1 50 30 OFR001
PKG2 75 125 OFR008
PKG3 175 100 OFR003
PKG4 110 60 OFR002
PKG5 155 95 NA
2 70 200" | npm start
```

**Output** (`<package_id> <discount> <total_cost> <estimated_delivery_time_hrs>`):
```
PKG1 0 750 3.98
PKG2 0 1475 1.78
PKG3 0 2350 1.42
PKG4 105 1395 0.85
PKG5 0 2125 4.19
```

---

## Assumptions and Tradeoffs

1. **Offer ranges are inclusive on both ends** — OFR001, for example, applies for distances [0, 200] km and weights [70, 200] kg with both endpoints included, as stated in the PDF.

2. **Package ID must be unique** — The parser rejects duplicate IDs with an error. Two packages with the same ID would produce ambiguous output ordering and corrupt the time/cost lookup maps.

3. **Truncation for delivery times** — Delivery times use `Math.trunc` (e.g., 3.456 → 3.45) as specified by the PDF.

4. **Rounding for monetary values** — Monetary values (discount, total cost) use `Math.round` instead of truncation, since rounding is the conventional and expected behaviour for currency. Using `Math.trunc` for all values would silently under-report costs by up to 1 cent. (Even though there are guard rails to prevent users from entering negative values)

5. **OFFER matching is case sensitive** — `OFR001` will be accepted while `ofr001` is ignored.

6.  **Output order follows input order** — Results are printed in the same order the packages appear in the input, regardless of delivery sequence.

---

## What I'd Do Next with More Time

### Logic and Algorithm

- **Configure pre-commit hooks** — Enforce that all tests pass and linting is clean before a commit is finalised, preventing broken code from ever entering the history.

- **Offer configuration file** — Load offer definitions from a JSON file rather than hardcoding them, making it easy to modify without touching source code.

- **Performance benchmarks** — Add a benchmark suite to track planner performance as package count grows, making it easy to detect regressions if the algorithm is changed.

---

## AI Disclosure
AI used: Claude Code (Anthropic). 
Assistance received: logic guidance, debugging, test cases and edge cases covering, interactive cli and partial code generation，documentations rephrasing
