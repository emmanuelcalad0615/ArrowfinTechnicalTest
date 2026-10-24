# Registro de prompts

Recopilación cronológica de los prompts enviados durante el desarrollo de este proyecto.

---

## 1. Crear carpeta de documentación

**Fecha:** 2026-10-24

> En primer luugar, quisiera que crees una carpeta docs, donde haya un markdown que recopile los prompts que te arroje

## 2. Crear estructura de .claude

**Fecha:** 2026-10-24

> Creemos una carpeta .claude, que va a contener una carpeta rules, una carpeta skills y una carpeta agents

## 3. Reglas de Clean Architecture

**Fecha:** 2026-10-24

> Quiero que dentro de rules, me crees un markdown llamado clean architecture que contenga las siguientes reglas estrictas:
>
> - Capas: domain, application (casos de uso), infrastructure, presentation. Las dependencias solo apuntan hacia adentro.
> - domain no importa frameworks, ni Express/Nest, ni fs, ni React. Solo TypeScript puro.
> - La lógica de negocio (agregación de velas, deduplicación, validación) vive en domain/application, nunca en controllers ni componentes.
> - Acceso a datos detrás de una interfaz (repository) definida en domain e implementada en infrastructure.
> - Controllers y componentes solo traducen entrada/salida; cero lógica.
> - Funciones puras y testeables; nada de any; errores tipados, nunca NaN ni excepciones sin manejar.
> - Sin sobreingeniería: solo las abstracciones que el problema necesite.
>
> lista corta de reglas en imperativo, máximo 40 líneas.

## 4. Crear carpetas backend y frontend

**Fecha:** 2026-10-24

> Crea una carpeta backend y una carpeta frontend

## 5. Inicializar proyectos Express y React con Vite

**Fecha:** 2026-10-24

> inicializa el proyecto de express dentro de la carpeta backend y el proyecto react dentro de la carpeta frontend y utilicemos vite

## 6. Error al hacer git add

**Fecha:** 2026-10-24

> emmanuelcaladcorrea@Emmanuels-MacBook-Air pruebaArrowFin % git add .
> error: 'backend/' does not have a commit checked out
> fatal: adding files failed
