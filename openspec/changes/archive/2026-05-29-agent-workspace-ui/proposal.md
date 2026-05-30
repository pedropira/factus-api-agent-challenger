# Proposal: Agent Workspace UI

## Intent

Refactor el layout monolítico de 2 columnas (chat + dashboard) a un workspace
agéntico de 3 columnas con sidebar de navegación, chat agentivo al centro,
y panel de entidad dinámico a la derecha. El chat es el protagonista
(Agent-First) y las entidades se exploran sin perder contexto de conversación.

## Scope

### In Scope

- `WorkspaceContext` — estado global para comunicación sidebar ↔ centro ↔ derecha
- Sidebar de navegación vertical con iconos Lucide y 8 entidades
- EntityWorkspace (panel derecho) — plantillas de prompt + tabla Top 10 + panel
  de soporte DIAN + herramientas MCP activas
- CoPilotChat (panel central) — refactor del ChatShell existente integrado al
  contexto, leyendo `chatInputValue` y disparando `refreshTrigger`
- Layout 3 columnas en `page.tsx`: sidebar (16%) | chat (44%) | entidad (40%)
- Paleta de colores Factus: fondo zinc-950, primario índigo, acento esmeralda
- Instalación de componentes shadcn faltantes: `tabs`, `table`, `card`, `badge`, `scroll-area`

### Out of Scope

- Modificar `/api/chat/route.ts` o `chat-pipeline.ts` — el backend del agente
  no cambia, solo el frontend
- Modificar `/api/records/route.ts` — el endpoint ya funciona
- Modificar `AuthProvider` o `middleware.ts` — la capa de auth no cambia
- Responsive design para tablets/mobile — diferido a cambio futuro
- Paginación en la tabla Top 10 — diferido

## Capabilities

### New Capabilities
- `workspace-layout`: Layout de 3 columnas con sidebar, chat central y panel
  de entidad dinámico, sincronizados via WorkspaceContext

### Modified Capabilities
- `chat-agent`: El frontend del chat se mueve al centro y se integra con
  el WorkspaceContext para recibir texto de plantillas y notificar
  finalización de operaciones CRUD

## Approach

WorkspaceContext como átomo de estado global (useContext + useReducer liviano).
El sidebar setea `currentEntity`, el entity-workspace lo consume para mostrar
plantillas/tabla/soporte específicos de la entidad, y el CoPilotChat lo usa
para recibir `chatInputValue` y notificar `refreshTrigger`.

La tabla Top 10 se conecta al `/api/records?type=...` existente via fetch +
SWR pattern (useEffect + useState para simplicidad, sin dependencias extra).

Paleta Factus vía CSS variables en globals.css, respetando el modo oscuro
existente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/context/workspace-context.tsx` | New | Contexto atómico del workspace |
| `src/components/sidebar.tsx` | New | Menú vertical de navegación |
| `src/components/entity-workspace.tsx` | New | Panel derecho dinámico |
| `src/components/co-pilot-chat.tsx` | New | Chat central integrado al contexto |
| `src/components/chat/ChatShell.tsx` | Kept | Se mantiene como base, pero no se usa desde page.tsx |
| `src/app/page.tsx` | Modified | Layout 3 columnas con WorkspaceProvider |
| `src/app/globals.css` | Modified | Variables CSS de paleta Factus |
| `.env` | Modified | Ninguno |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Re-renders excesivos por Context | Medium | Valores atómicos, memo en componentes hijos |
| Tabla Top 10 lenta si MCP cold start | High | Skeleton loading + stale-while-revalidate implícito |
| Ruptura de ChatShell existente | Low | CoPilotChat es nuevo componente, ChatShell se preserva |

## Rollback Plan

`git revert HEAD` elimina los archivos nuevos (context, sidebar, entity-workspace,
co-pilot-chat) y restaura `page.tsx` y `globals.css`.

## Dependencies

- `npx shadcn add tabs table card badge scroll-area` (componentes UI)
- WorkspaceProvider debe wrap-parse root layout

## Success Criteria

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run dev` arranca sin warnings
- [ ] Sidebar muestra 8 entidades, clic cambia panel derecho
- [ ] Panel derecho muestra plantillas + tabla + soporte según entidad
- [ ] Clic en plantilla inyecta texto en input del chat
- [ ] Chat al centro renderiza correctamente y hace streaming
- [ ] Al completar operación CRUD, tabla derecha se refresca
- [ ] Paleta Factus visible: sidebar índigo, acentos esmeralda, fondo oscuro
