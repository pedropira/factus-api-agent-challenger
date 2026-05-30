# Design: Agent Workspace UI

## Technical Approach

WorkspaceContext como átomo de estado global (Context + useState) envuelve
el layout en `layout.tsx`. page.tsx consume el contexto y renderiza 3
columnas independientes. El CoPilotChat (centro) es un fork adaptado de
ChatShell que lee `chatInputValue` y llama `triggerRefresh()`.

El EntityWorkspace (derecha) es un componente dinámico que según
`currentEntity` renderiza: plantillas de prompt (cards clickeables), tabla
Top 10 (fetch a `/api/records?type=`), y panel de soporte (guía DIAN + tools).

No se toca ni `/api/chat`, ni `chat-pipeline.ts`, ni `mcp-client.ts`.

## Architecture Decisions

### Decision: Context puro vs Zustand

| Option | Tradeoff |
|--------|----------|
| **Context + useState** | Nativo React, sin dependencias. Rendimiento ok con 3 fields |
| Zustand | Más boilerplate setup, sobreingeniería para 3 valores |

**Choice**: Context + useState.
**Rationale**: Solo 3 valores atómicos. Context evita añadir dependencias.
Si crece, se migra a useReducer sin cambiar la API del context.

### Decision: CoPilotChat como componente nuevo vs modificar ChatShell

| Option | Tradeoff |
|--------|----------|
| **Nuevo CoPilotChat** | ChatShell intacto como respaldo, CoPilotChat optimizado para 3-col |
| Modificar ChatShell | Riesgo de romper streaming existente, acoplamiento |

**Choice**: Nuevo componente `CoPilotChat.tsx`.
**Rationale**: ChatShell queda como referencia/fallback. CoPilotChat es
copia adaptada con integración de contexto.

### Decision: Fetch directo en EntityWorkspace vs custom hook

| Option | Tradeoff |
|--------|----------|
| **useEffect + useState inline** | Simple, 0 abstracciones, fácil de leer |
| Custom hook `useEntityRecords` | Reutilizable pero over-engineering para 1 uso |

**Choice**: useEffect + useState inline en EntityWorkspace.
**Rationale**: Un solo lugar consume records. Si aparece otro consumidor,
se extrae el hook.

### Decision: Nombres de tools legibles con lookup table

**Choice**: Map `Record<McpToolName, string>` con labels en español.
**Rationale**: La spec exige no exponer raw identifiers (`create_customer` →
"Registrar Cliente"). Una lookup table es mantenible y tipada.

## Data Flow

```
Sidebar click                           EntityWorkspace
  │ setCurrentEntity("customers")           │
  └─────────────────────┬───────────────────┘
                        │
                  WorkspaceContext
                  { currentEntity, chatInputValue, refreshTrigger }
                        │
            ┌───────────┴───────────┐
            │                       │
      CoPilotChat              EntityWorkspace
      (center col)             (right col)
            │                       │
      Lee chatInputValue       Lee currentEntity
      POST /api/chat           GET /api/records?type=
      Al completar →           Muestra tabla
      triggerRefresh()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/context/workspace-context.tsx` | Create | WorkspaceProvider + useWorkspace hook + EntityType |
| `src/components/sidebar.tsx` | Create | Menú vertical 8 entidades, iconos Lucide, active state |
| `src/components/entity-workspace.tsx` | Create | Panel derecho: templates + tabla + soporte |
| `src/components/co-pilot-chat.tsx` | Create | Chat central conectado al contexto |
| `src/app/page.tsx` | Modify | Layout 3 columnas con WorkspaceProvider |
| `src/app/globals.css` | Modify | Variables CSS Factus (índigo, esmeralda) |

## Interfaces / Contracts

### WorkspaceContext

```typescript
type EntityType = 'dashboard' | 'customers' | 'products' | 'invoices'
  | 'credit_notes' | 'support_documents' | 'adjustment_notes'
  | 'establishments';

interface WorkspaceContextType {
  currentEntity: EntityType;
  setCurrentEntity: (e: EntityType) => void;
  chatInputValue: string;
  setChatInputValue: (v: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}
```

### EntityConfig (lookup interna en EntityWorkspace)

```typescript
interface EntityConfig {
  label: string;
  icon: LucideIcon;
  templates: { label: string; prompt: string }[];
  tools: string[];
  dianGuide: string;
  recordType?: string; // para /api/records?type=
}
```

## Testing Strategy

Verificación manual post-implementación:
- `npx tsc --noEmit` pasa
- `npm run dev` arranca
- Probar navegación sidebar → panel derecho cambia
- Probar clic en plantilla → input del chat se llena
- Probar envío de mensaje → streaming funciona en columna central

## Migration / Rollout

No migration required. Todos los archivos son nuevos excepto page.tsx y
globals.css que se modifican in-place. ChatShell.tsx existente se preserva.

## Open Questions

- [ ] None
