import { useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { FurnitureLibrary } from './components/Sidebar/FurnitureLibrary'
import { PlacedItemsList } from './components/Sidebar/PlacedItemsList'
import { WorkspaceCanvas } from './components/Canvas/WorkspaceCanvas'
import { SelectionToolbar } from './components/Canvas/SelectionToolbar'
import { ReferenceLineToolbar } from './components/Canvas/ReferenceLineToolbar'
import { useInitializeApp } from './hooks/useInitializeApp'
import { useAutoSave } from './hooks/useAutoSave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  useInitializeApp()
  useAutoSave()
  useKeyboardShortcuts()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-full flex-col bg-white text-zinc-900">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="sidebar-scroll z-10 flex w-64 lg:w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 bg-white p-4">
            <FurnitureLibrary />
            <div className="h-px bg-zinc-100" />
            <PlacedItemsList />
            <div className="mt-auto pt-4">
              <p className="text-[10px] leading-relaxed text-zinc-300">
                Shortcuts: R rotate · Del remove · Ctrl+Z undo · Esc deselect
              </p>
            </div>
          </div>
        )}

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="z-10 flex w-4 shrink-0 items-center justify-center border-r border-zinc-200 bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="text-xs">{sidebarOpen ? '‹' : '›'}</span>
        </button>

        {/* Canvas workspace */}
        <div className="relative flex flex-1">
          <WorkspaceCanvas />
          <SelectionToolbar />
          <ReferenceLineToolbar />
        </div>
      </div>
    </div>
  )
}

export default App
