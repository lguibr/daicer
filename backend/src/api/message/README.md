# Message API

## Purpose

The `message` module manages all communication within a Game Room. It handles public chat, system announcements, and private "whispers" (DM to Player).

## Architecture

Messages are the atomic unit of communication. They are immutable and time-stamped.

- **Persistence**: Stored in the database for history retrieval.
- **Relay**: Synced to the frontend via WebSockets (in the `socket` lifecycle).
- **Context**: Linked to a specific `Room` and optionally a specific `Turn`.

## Key Entities

- **Message (`schema.json`)**:
  - `content`: Richtext body of the message.
  - `senderType`: `dm` | `player` | `system`.
  - `recipient`: If set, the message is **Private** (visible only to that user). If null, it is **Public**.
  - `turn`: Links the message to the specific turn it occurred in (for "What happened then?" lookups).

## Usage

- **Chat**: Standard user messages.
- **Narrative**: The DM's description of events.
- **System**: "Player X joined the room."

## Dependencies

- **Upstream**: Created by `room` (Turn Service) or `socket` (User Chat).
- **Downstream**: Consumed by the Frontend Chat Component.
