/// <reference types="vite/client" />
/// <reference types="@electron-toolkit/preload" />

interface Window {
  electron: import('@electron-toolkit/preload').ElectronAPI
  api: {
    windowMove: (deltaX: number, deltaY: number) => void
    startWindowMove: () => void
    readTodos: () => Promise<any[]>
    writeTodos: (todos: any[]) => Promise<boolean>
  }
}
