# 🎲 Daicer Backend CLI

```text
.    .    .    .    .    .    .    .    .    .    .    .
   _____       _                    _____ _      _____
  |  __ \     (_)                  / ____| |    |_   _|
  | |  | | __ _ _  ___ ___ _ __   | |    | |      | |
  | |  | |/ _` | |/ __/ _ \ '__|  | |    | |      | |
  | |__| | (_| | | (_|  __/ |     | |____| |____ _| |_
  |_____/ \__,_|_|\___\___|_|      \_____|______|_____|

.    .    .    .    .    .    .    .    .    .    .    .
```

> **"The Lens through which the Agent perceives the World."**

The **Daicer CLI** is the _definitive_ interface for interacting with the Daicer Backend. It provides a shared reality for both Human Developers and AI Agents, ensuring that **Truth** is always accessible, typed, and verifiable.

---

## ⚡ Quick Start

**1. Database Access**
The CLI now runs as a **Standalone Instance**. It connects directly to your database.

- If using **SQLite**: Ensure no other heavy write operations are blocking the DB (though WAL mode usually handles this).
- If using **Postgres**: You can run CLI parallel to `yarn develop`.

**Status Check** relies on `http://localhost:1337` to report if the _API Server_ is online, but `explore` and `knowledge` work independently.

```bash
# Run CLI (Standalone)
yarn cli
```

**2. Launch Interactive Mode (Humans)**

```bash
yarn cli
```

_Navigates you through the Matrix._

---

## 🤖 The Agent Protocol (LLM Users)

**If you are an AI Agent (Claude, Gemini, GPT), READ THIS.**

You are **prohibited** from guessing database schemas. You are **prohibited** from hallucinating game rules. You MUST use this CLI to ground yourself in reality.

### The Golden Workflow

1.  **📡 Check Pulse**: Is the server online?
    ```bash
    yarn cli status --json
    ```
2.  **🔮 Inspect Reality**: What does the data structure look### `schema`
    Inspect Content Type schemas. Now supports **Deep Recursion** (2 levels) to visualize relation structures.

- `yarn cli schema -t <uid>`: View single schema with nested relations.
- `yarn cli schema --list`: List all available Content Types.
- `yarn cli schema --all`: Dump all schemas.

### `explore`

Interactive data explorer. Now supports **Deep Data Population** for `find` and `findOne`.

- `-t <uid>`: Target Content Type.
- `-a <action>`: Action (find, findOne, count).
- `--json`: Output strict, deeply populated JSON for Agents.

### `knowledge`

**RAG Interface**. Use this to query the Daicer knowledge base.

> [!IMPORTANT]
> The `knowledge` command now automatically fetches full entity data for search results, bridging the gap between vector snippets and actual database state.

- `-q <query>`: Semantic search query.
- `-e`: Restrict to Entity types.
- `--json`: Strict JSON output.

---

## 📚 Command Reference

### `🔍 explore`

_The Data Query Engine._

| Flag                 | Description                                   | usage                              |
| :------------------- | :-------------------------------------------- | :--------------------------------- |
| `--type <uid>`       | **Required**. The Collection/Single Type UID. | `api::spell.spell`                 |
| `--action <op>`      | `find` (default), `findOne`, `count`.         | `--action count`                   |
| `--filters <json>`   | MongoDB-style filter object.                  | `--filters '{"name": "Fireball"}'` |
| `--document-id <id>` | Required for `findOne`.                       | `--document-id abc...`             |
| `--json`             | **STRICT MODE**. Returns pure JSON.           | `--json`                           |

**Examples:**

```bash
# Find all Level 3 Spells
yarn cli explore -t api::spell.spell --filters '{"level": 3}' --json

# Get details of a specific character
yarn cli explore -t api::entity.entity --action findOne --document-id <docId> --json
```

### `🧠 knowledge`

_The RAG (Retrieval-Augmented Generation) Interface._

| Flag               | Description                                    | usage                      |
| :----------------- | :--------------------------------------------- | :------------------------- |
| `--query <text>`   | The semantic question to ask.                  | `--query "Goblin tactics"` |
| `--json`           | **STRICT MODE**. Returns scored JSON array.    | `--json`                   |
| `--entities`       | Search ONLY Entity records (Monsters, Spells). | `--entities`               |
| `--targets <list>` | Search specific scopes.                        | `--targets spell,manual`   |

**Examples:**

```bash
# General Rule Lookup
yarn cli knowledge -q "Grappling rules" --json

# Find a Monster by rough description
yarn cli knowledge -q "Large fire breathing lizard" --targets monster --json
```

### `🔮 schema`

_The Structure Inspector._
_Never assume a field name. Always check._

| Flag           | Description                            |
| :------------- | :------------------------------------- |
| `--type <uid>` | The UID to inspect.                    |
| `--list`       | List ALL available UIDs in the system. |
| `--json`       | **STRICT MODE**. Returns Schema JSON.  |

**Examples:**

```bash
# "What fields does a Weapon have?"
yarn cli schema -t api::item.item --json
```

---

## 🏗️ Philosophy

1.  **Truth over UI**: The Strapi Admin Panel is a convenient lie. The Database is the truth. The CLI reveals the truth.
2.  **Schema First**: We do not guess. We inspect, then we query.
3.  **Agent Native**: Every command has a `--json` mode that strips all ANSI codes, spinners, and human fluff, delivering raw, machine-readable data envelopes.

---

## 🛠️ Troubleshooting

### Automated checks

`yarn test:cli` runs bounded subprocess checks for offline status, filesystem
schema discovery and invalid exploration input. It also checks exploration's
document-count contract with a mocked Strapi bootstrap boundary. These checks do
not require a running server, compiled application or database. Process errors
and missing JSON framing fail the checks rather than being swallowed.

Actual standalone `explore` startup remains an environment integration check: it
loads the compiled application and connects to the configured PostgreSQL database.
The mocked bootstrap rejection test covers the command handler only; it does not
certify how a real Strapi startup failure exits or formats its error.

- **`fetch failed`**: The backend is not running. Run `yarn develop` in the backend workspace.
- **`403 Forbidden`**: Your `STRAPI_AUDIT_TOKEN` is missing or invalid in `.env`.
- **`SyntaxError` in Filters**: Ensure your `--filters` JSON is valid and properly escaped. Use single quotes for the argument wrapper: `'{"foo": "bar"}'`.
