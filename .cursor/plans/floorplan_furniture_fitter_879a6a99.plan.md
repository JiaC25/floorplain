---
name: Floorplan Furniture Fitter
overview: Build a lightweight, frontend-only React web app that lets renters upload a 2D floorplan image, calibrate its scale, and place measured furniture rectangles to visually check fit.
todos:
  - id: phase1-scaffold
    content: "Phase 1: Vite + React + TS scaffolding, install deps, basic layout shell, Konva canvas with zoom/pan, image upload and display"
    status: completed
  - id: phase2-calibration
    content: "Phase 2: Two-point calibration flow -- click interaction, visual line, distance input, pixelsPerCm computation"
    status: completed
  - id: phase3-library
    content: "Phase 3: Dexie DB setup, furniture template CRUD, sidebar library panel, persist to IndexedDB"
    status: completed
  - id: phase4-placement
    content: "Phase 4: Place furniture on canvas as scaled rects, drag/select/rotate (45-deg)/duplicate/delete, labels"
    status: completed
  - id: phase5-projects
    content: "Phase 5: Project save/load/switch, auto-save, JSON export/import"
    status: completed
  - id: phase6-polish
    content: "Phase 6: Undo/redo, keyboard shortcuts, responsive sidebar, empty states, error handling, visual polish"
    status: completed
isProject: false
---

# Floorplan Furniture Fitter -- Implementation Plan

## Tech Stack

- **Vite + React + TypeScript** -- fast dev server, simple config, type safety
- **react-konva** (Konva) -- 2D canvas with built-in drag/rotate/zoom/pan
- **Zustand** -- lightweight state management (one store, no boilerplate)
- **Dexie** -- IndexedDB wrapper for persisting projects, images, and furniture library
- **Tailwind CSS** -- utility-first styling for the UI panels
- **nanoid** -- for generating short unique IDs

## App Layout (Single Page)

```
+----------------------------------------------------------+
|  Toolbar: project name | Save | New | Calibrate | Zoom   |
+------------+---------------------------------------------+
|            |                                              |
|  Sidebar   |           Canvas Workspace                  |
|            |                                              |
|  - My      |   (floorplan image + furniture rects)        |
|  Furniture |                                              |
|  Library   |                                              |
|            |                                              |
|  - Placed  |                                              |
|  Items     |                                              |
|            |                                              |
+------------+---------------------------------------------+
```

- **Toolbar (top):** project name (editable), save button, new project, project list, calibrate button, zoom controls
- **Sidebar (left, ~280px):** two sections -- furniture library (templates) and placed items list for the current project
- **Canvas (center):** Konva Stage rendering the floorplan image as a background layer, furniture rectangles + labels on a foreground layer, calibration line overlay
- **Modals/popovers:** furniture template editor, calibration flow, project list

## Calibration UX

1. User clicks "Calibrate" in the toolbar
2. App enters calibration mode -- cursor changes, instructions appear ("Click the first point of a known measurement")
3. User clicks point A on the floorplan (a dot appears)
4. User clicks point B (a line appears between A and B)
5. A small input popover appears near the line: "Enter the real distance (cm or m)"
6. User types e.g. "3.2m" or "320cm" -- the app parses both formats
7. App computes `pixelsPerCm = pixelDistance / realWorldDistanceCm`
8. Calibration is saved; the line stays visible (subtle) as a reference
9. User can recalibrate at any time by clicking the button again

## Phased Build Order

### Phase 1: Scaffolding + Canvas Foundation

- Vite + React + TypeScript project setup
- Install react-konva, zustand, dexie, tailwind, nanoid
- Basic app shell: toolbar, sidebar, canvas area
- Konva Stage with pan (drag) and zoom (scroll wheel, zoom-toward-cursor)
- Floorplan image upload (file input) and display on canvas
- Auto-fit image to viewport on load

### Phase 2: Calibration Flow

- Calibration mode toggle in toolbar
- Click-two-points interaction on the canvas
- Visual line between points with length label
- Distance input popover (parse cm and m)
- Compute and store pixelsPerCm in Zustand store
- Show/hide calibration line
- Allow recalibration (replaces previous)

### Phase 3: Furniture Library + Persistence Layer

- Dexie database schema: furniture templates table, projects table, images table
- Furniture template CRUD: create, edit, delete
- Sidebar "My Furniture" section with list of templates
- Template editor form (name, width cm, depth cm, color picker)
- Persist templates to IndexedDB
- Load templates on app startup

### Phase 4: Furniture Placement + Manipulation

- Drag a furniture template from the sidebar onto the canvas (or click "Place" button)
- Render placed furniture as Konva Rect scaled using pixelsPerCm
- Labels on each rect (name + dimensions)
- Drag to reposition
- Click to select (visual highlight / selection border)
- Rotate 45 degrees (button or keyboard shortcut)
- Duplicate placed item
- Delete placed item
- Deselect on click-away
- Right panel or popover for editing a selected placed item

### Phase 5: Project Management + Save/Load

- Project CRUD in IndexedDB: create, rename, delete
- Save current project state (calibration + placed furniture + image reference)
- Auto-save on changes (debounced)
- Project list modal/dropdown to switch between projects
- Export project as .json file (image as base64 data URL)
- Import project from .json file

### Phase 6: Polish

- Undo/redo (zustand middleware or manual history stack)
- Keyboard shortcuts: Delete key, R to rotate, Escape to deselect, Ctrl+Z undo
- Responsive sidebar (collapsible on narrow screens)
- Empty states and helpful prompts
- Loading states for image processing
- Visual polish: shadows on selected items, smooth transitions, hover states
- Error handling edge cases

## Key State (Zustand Store)

- `currentProjectId: string | null`
- `projects: Project[]` (metadata only, not images)
- `floorplanImage: HTMLImageElement | null` (loaded in memory for canvas)
- `calibration: Calibration | null`
- `placedFurniture: PlacedFurniture[]`
- `furnitureLibrary: FurnitureTemplate[]`
- `selectedFurnitureId: string | null`
- `mode: 'default' | 'calibrating'`
- `stageScale: number`
- `stagePosition: { x: number, y: number }`

## File Structure

```
src/
  App.tsx                    -- main layout shell
  main.tsx                   -- entry point
  stores/
    useAppStore.ts           -- Zustand store
  db/
    database.ts              -- Dexie schema and DB instance
    projectStorage.ts        -- project CRUD helpers
    furnitureStorage.ts      -- template CRUD helpers
  components/
    Toolbar.tsx
    Sidebar/
      FurnitureLibrary.tsx   -- template list + add button
      PlacedItemsList.tsx    -- placed items for current project
      FurnitureForm.tsx      -- create/edit template form
    Canvas/
      WorkspaceCanvas.tsx    -- Konva Stage wrapper, zoom/pan
      FloorplanLayer.tsx     -- background image layer
      FurnitureLayer.tsx     -- placed furniture rects
      CalibrationOverlay.tsx -- calibration points + line
      FurnitureRect.tsx      -- single furniture rectangle component
    Modals/
      ProjectListModal.tsx
      CalibrationInput.tsx   -- distance input popover
  utils/
    coordinates.ts           -- pixel <-> cm conversion helpers
    units.ts                 -- parse "3.2m" -> 320cm etc.
    export.ts                -- JSON export/import logic
  types.ts                   -- shared TypeScript interfaces
```

## Risks + Mitigations

- **Coordinate bugs:** Isolate all conversion math into `coordinates.ts` with unit tests. Always convert through a single `pixelsToCm` / `cmToPixels` pair.
- **Image fit on load:** Compute an initial scale so the image fits the viewport with padding, store this as the base transform.
- **Calibration on zoomed canvas:** Calibration points must be stored in original image coordinates (not screen or zoomed coordinates). Convert mouse events through the inverse stage transform.
- **Large images in IndexedDB:** Store as Blob, not base64. Only convert to base64 for JSON export.
- **Zoom toward cursor:** Use the standard Konva wheel-zoom recipe (adjust stage position based on pointer relative to stage).

