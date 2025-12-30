# Tool Name: `tool_name`

**Category**: [Combat | Exploration | DM | System]  
**Engine Layer**: [ActionDispatcher | Physics | Narrative | Persistence]

## 1. Introduction

A brief, high-level description of what this tool does and why it exists.

## 2. Use Case

Specific scenarios where this tool MUST be used by the Agent.

- _Example 1_
- _Example 2_

## 3. Tool Definition (Schema)

```typescript
// Zod Schema or Interface Definition
interface ToolInput {
  // Define strict inputs
}
```

## 4. Expected Results

Describe the successful output and state changes.

- **State Change**: What changes in the DB/GameState?
- **Logs**: What events are emitted?
- **Feedback**: What does the User/LLM see?

## 5. Implementation Locations

- **Frontend**: Where does the UI request this? (e.g., Context Menu)
- **Backend Service**: Which service handles the logic?
- **Shared Engine**: Which Rules/Dispatcher handles the math?
