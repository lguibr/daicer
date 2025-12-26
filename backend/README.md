# 🎲 Daicer Backend

> **Server-Authoritative Voxel Roleplaying Engine**

This is the Brain and Heart of Project Daicer. It is not just a CMS; it is a hybrid state machine that combines a deterministic Voxel Physics Engine with an agentic LLM Narrator.

## 🏛 The Trinity Architecture

The backend operates on a tri-fold architectural pattern:

| Component    | Concept           | Responsibility                                                                                                                | Documentation                                     |
| :----------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **The Body** | **Physics**       | The **Deterministic Voxel Engine**. Handles movement, collision, line-of-sight, and world generation. It never hallucinates.  | [📖 Voxel Engine](src/api/voxel-engine/README.md) |
| **The Soul** | **Narrator**      | The **AI Dungeon Master**. Interprets user intent, creates flavor text, and invokes engine tools. It brings the math to life. | [📖 Narrator API](src/api/narrator/README.md)     |
| **The Mind** | **Orchestration** | The **Game Loop**. Manages turns, processes queues, and creates the definitive history of the session.                        | [📖 Game API](src/api/game/README.md)             |

---

## 🔮 Core Systems

### ⏳ Time-Framed State

Unlike traditional VTTs where the room state is static, Daicer uses a **TimeFrame** architecture. The "Server Truth" is a historical record of snapshots. What the client sees is a computed "Point of View" (POV) derived from specific logic.

- [Stats & Truth](src/api/time-frame/README.md)
- [Turn Processing](src/api/turn/README.md)

### ⚡️ Real-Time Event Stream

The backend broadcasts state changes via Socket.IO. We differentiate between **Global Events** (Roome-wide) and **Local Events** (User-specific streams).

- [Socket Lifecycle & Events](src/lifecycle/socket/README.md)

### 📜 Data & Content

Powered by **Strapi 5**. We use a **GraphQL-first** approach for the frontend API, while maintaining a strict schema for game data (Monsters, Spells, Classes).

- [Character System](src/api/character/README.md) - Blueprints vs. Sheets
- [Seed Data](seeds/README.md) - Default content loading

---

## 🗺 Documentation Map

### Key Modules

- **Game Logic**: [`src/api/game`](src/api/game/README.md)
- **Time Frames**: [`src/api/time-frame`](src/api/time-frame/README.md)
- **Narrator**: [`src/api/narrator`](src/api/narrator/README.md)
- **Socket**: [`src/lifecycle/socket`](src/lifecycle/socket/README.md)
- **Character**: [`src/api/character`](src/api/character/README.md)
- **Game Events**: [`src/api/game-event`](src/api/game-event/README.md)

### Utilities

- **LLM / AI**: [`src/utils/llm`](src/utils/llm/README.md)
- **Map Generation**: [`src/api/voxel-engine`](src/api/voxel-engine/README.md)

---

## 🛠 Developer Cheatsheet

### 🏃‍♂️ Run the Backend

```bash
yarn develop
# Starts Strapi on http://localhost:1337
```

### 🌱 Seeding Data

If your database is empty, seed the core game rules (SRD content):

```bash
yarn seed
```

_(See [Seeds README](seeds/README.md) for details)_

### 🧪 Processing a Turn (Manual Trigger)

You can manually trigger a turn via the Narrator API or using the God Mode tools in the frontend.

```bash
# Example Payload for /api/narrator/action
{
  "roomId": "documentId...",
  "input": "I attack the goblin",
  "userId": "user-uid..."
}
```
