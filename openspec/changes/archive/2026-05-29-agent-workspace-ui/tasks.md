# Tasks: Agent Workspace UI

## Phase 1: Foundation — Context + CSS

- [x] 1.1 Create `src/context/workspace-context.tsx` — `WorkspaceProvider` + `useWorkspace` hook con `currentEntity`, `chatInputValue`, `refreshTrigger`
- [x] 1.2 Modify `src/app/globals.css` — añadir variables `--color-factus-primary` (índigo), `--color-factus-accent` (esmeralda), `--color-factus-sidebar` al bloque `@theme inline` y valores en `.dark`
- [x] 1.3 Wrap `WorkspaceProvider` en `src/app/layout.tsx` sobre `AuthProvider`

## Phase 2: Sidebar + Layout

- [x] 2.1 Create `src/components/sidebar.tsx` — 8 ítems con iconos Lucide, `useWorkspace().currentEntity`, resaltado visual del activo
- [x] 2.2 Modify `src/app/page.tsx` — layout 3 columnas: sidebar (w-56) | chat (flex-1) | entity (w-96 xl:w-[480px]), sin scroll global

## Phase 3: EntityWorkspace (Panel Derecho)

- [x] 3.1 Create `src/components/entity-workspace.tsx` — lookup table `ENTITY_CONFIG` con templates, tools, guía DIAN por entidad
- [x] 3.2 Implementar sección Top: cards de plantillas que llaman `setChatInputValue` al hacer clic
- [x] 3.3 Implementar sección Middle: fetch a `/api/records?type=` con skeleton loading, tabla compacta, refresh en `refreshTrigger`
- [x] 3.4 Implementar sección Bottom: split column con guía DIAN (izquierda) y tools activas con labels legibles (derecha)

## Phase 4: CoPilotChat (Panel Central)

- [x] 4.1 Create `src/components/co-pilot-chat.tsx` — fork de `ChatShell.tsx` que consume `chatInputValue` del contexto y llama `triggerRefresh()` al completar stream
- [x] 4.2 Aplicar paleta Factus: burbuja user índigo, burbuja agent zinc-800, input con borde zinc-700

## Phase 5: TypeScript

- [x] 5.1 `npx tsc --noEmit` — verificar tipado estricto sin errores
- [x] 5.2 `npm run dev` — verificar que arranca sin warnings
