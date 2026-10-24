# Clean Architecture

Reglas estrictas. Aplícalas a todo el código del proyecto.

## Capas y dependencias

- Organiza el código en cuatro capas: `domain`, `application` (casos de uso), `infrastructure`, `presentation`.
- Haz que las dependencias apunten solo hacia adentro. `domain` no depende de ninguna otra capa.
- Escribe `domain` en TypeScript puro. No importes frameworks (Express, Nest, React) ni módulos de Node como `fs`.

## Lógica de negocio

- Coloca la lógica de negocio (agregación de velas, deduplicación, validación) en `domain` o `application`.
- Nunca pongas lógica de negocio en controllers ni en componentes.
- Limita controllers y componentes a traducir entrada y salida. Cero lógica.

## Acceso a datos

- Define cada repository como interfaz en `domain`.
- Implementa cada repository en `infrastructure`.
- Accede a datos solo a través de esas interfaces.

## Código

- Escribe funciones puras y testeables.
- No uses `any`.
- Devuelve errores tipados. Nunca devuelvas `NaN` ni dejes excepciones sin manejar.

## Simplicidad

- Crea solo las abstracciones que el problema necesite. Sin sobreingeniería.
