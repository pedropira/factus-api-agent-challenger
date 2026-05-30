# Workspace Layout Specification

## Purpose

Define la estructura visual del workspace agéntico de 3 columnas: sidebar de
navegación a la izquierda, chat del agente al centro, y panel de entidad
dinámico a la derecha. Las columnas se comunican via WorkspaceContext sin
dependencias de routing de Next.js.

## Requirements

### Requirement: Layout de 3 columnas fijas

El layout MUST ocupar `100vh` sin scroll global. Cada columna MUST tener
desbordamiento vertical independiente.

| Columna | Proporción | Contenido |
|---------|-----------|-----------|
| Sidebar | ~16% (w-56) | Navegación vertical de entidades |
| Chat | ~44% (flex-1) | CoPilotChat persistente |
| Entidad | ~40% (w-96 xl:w-[480px]) | EntityWorkspace dinámico |

#### Scenario: Render inicial sin scroll global

- GIVEN un usuario autenticado en `/`
- WHEN la página carga
- THEN el layout MUST ocupar `100vh` sin scroll en el body
- AND cada columna MUST hacer scroll independiente si su contenido excede

#### Scenario: Chat permanece al cambiar entidad

- GIVEN un usuario en el workspace
- WHEN cambia la entidad desde el sidebar
- THEN el chat central NO MUST cambiar ni perder mensajes
- AND el panel derecho MUST actualizarse a la nueva entidad

### Requirement: WorkspaceContext de sincronización

El sistema MUST exponer un `WorkspaceContext` con estado atómico para
comunicar las 3 columnas.

#### Scenario: Sidebar actualiza entidad

- GIVEN el WorkspaceContext con `currentEntity: "dashboard"`
- WHEN el usuario hace clic en "Clientes" en el sidebar
- THEN `currentEntity` MUST cambiar a `"customers"`
- AND el EntityWorkspace MUST re-renderizar con datos de clientes

#### Scenario: Plantilla inyecta texto en chat

- GIVEN el WorkspaceContext activo
- WHEN el usuario hace clic en "➕ Registrar Cliente" en el panel derecho
- THEN `chatInputValue` MUST actualizarse con el texto de la plantilla
- AND el input del chat central MUST reflejar el nuevo valor

#### Scenario: Chat notifica finalización CRUD

- GIVEN una operación CRUD completada por el agente
- WHEN el chat llama `triggerRefresh()`
- THEN `refreshTrigger` MUST incrementarse
- AND el EntityWorkspace MUST recargar su tabla Top 10

### Requirement: Sidebar de navegación

El sidebar MUST listar 8 entidades con iconos Lucide. La entidad activa
MUST resaltarse visualmente con color de acento.

#### Scenario: Navegación por entidades

- GIVEN el sidebar renderizado
- WHEN el usuario hace clic en "Facturas"
- THEN la entidad activa MUST ser "invoices"
- AND el ítem "Facturas" MUST mostrar acento visual (bg sutil + icono color)
- AND los demás ítems MUST mantener estilo inactivo

### Requirement: EntityWorkspace dinámico

El panel derecho MUST mostrar 3 secciones verticales según la entidad activa:
plantillas de prompt (arriba), tabla Top 10 (medio), panel de soporte (abajo).

#### Scenario: Plantillas específicas por entidad

- GIVEN `currentEntity = "customers"`
- WHEN el EntityWorkspace renderiza
- THEN MUST mostrar plantillas: "➕ Registrar Cliente", "🔍 Buscar Cliente"
- AND MUST NO mostrar plantillas de facturas o productos

#### Scenario: Tabla Top 10 se conecta a /api/records

- GIVEN `currentEntity = "invoices"`
- WHEN el EntityWorkspace monta
- THEN MUST hacer fetch a `/api/records?type=invoices`
- AND MUST mostrar loading skeleton mientras carga
- AND MUST mostrar los 10 resultados en una tabla compacta

#### Scenario: Panel de soporte muestra guía DIAN y tools

- GIVEN `currentEntity = "products"`
- WHEN el panel de soporte renderiza
- THEN MUST mostrar requisitos DIAN para productos
- AND MUST listar tools MCP activas: `create_product`, `search_products`
- AND los nombres de tools MUST ser legibles (no raw identifiers)

### Requirement: Identidad visual Factus

La UI MUST usar la paleta corporativa Factus en modo oscuro.

#### Scenario: Paleta aplicada

- GIVEN el workspace renderizado
- THEN el fondo MUST ser `zinc-950` oscuro profundo
- AND el sidebar MUST usar fondo índigo oscuro
- AND los acentos activos / CTAs MUST ser verde esmeralda (`emerald-500`)
- AND los bordes MUST ser sutiles (`zinc-800`)

#### Scenario: Tipografía limpia

- GIVEN cualquier texto en el workspace
- THEN MUST usar `Geist` / `Inter` con tracking ajustado (`tracking-tight`)
- AND el código / datos tabulares MUST usar `Geist Mono`
