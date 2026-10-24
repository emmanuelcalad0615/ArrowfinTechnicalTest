# Clean Architecture

Strict rules. Apply them to all code in the project.

## Layers and dependencies

- Organize code into four layers: `domain`, `application` (use cases), `infrastructure`, `presentation`.
- Make dependencies point inward only. `domain` depends on no other layer.
- Write `domain` in pure TypeScript. Do not import frameworks (Express, Nest, React) or Node modules such as `fs`.

## Business logic

- Put business logic (candle aggregation, deduplication, validation) in `domain` or `application`.
- Never put business logic in controllers or components.
- Limit controllers and components to translating input and output. Zero logic.

## Data access

- Define each repository as an interface in `domain`.
- Implement each repository in `infrastructure`.
- Access data only through those interfaces.

## Code

- Write pure, testable functions.
- Do not use `any`.
- Return typed errors. Never return `NaN` or leave exceptions unhandled.

## Simplicity

- Create only the abstractions the problem needs. No over-engineering.
