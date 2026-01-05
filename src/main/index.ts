import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs-extra'

let todoWindow: BrowserWindow | null = null
let toggleWindow: BrowserWindow | null = null

function createTodoWindow(): void {
  todoWindow = new BrowserWindow({
    width: 380,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Position it near the toggle button later or at a default position
  const { width } = screen.getPrimaryDisplay().workAreaSize
  todoWindow.setPosition(width - 400, 100)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    todoWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?type=todo`)
  } else {
    todoWindow.loadFile(join(__dirname, '../renderer/index.html'), { query: { type: 'todo' } })
  }

  todoWindow.on('closed', () => {
    todoWindow = null
  })
}

function createToggleWindow(): void {
  toggleWindow = new BrowserWindow({
    width: 60,
    height: 60,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  toggleWindow.setPosition(width - 80, height - 80)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    toggleWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?type=toggle`)
  } else {
    toggleWindow.loadFile(join(__dirname, '../renderer/index.html'), { query: { type: 'toggle' } })
  }

  toggleWindow.on('ready-to-show', () => {
    toggleWindow?.show()
  })

  toggleWindow.on('closed', () => {
    toggleWindow = null
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.todo')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('toggle-todo', () => {
    if (todoWindow) {
      if (todoWindow.isVisible()) {
        todoWindow.hide()
      } else {
        todoWindow.show()
      }
    }
  })

  ipcMain.on('start-window-move', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // Logic for starting movement if needed, though simple screen delta is used
    }
  })

  ipcMain.on('window-move', (event, { deltaX, deltaY }) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      const { x, y } = window.getBounds()
      window.setBounds({
        x: Math.round(x + deltaX),
        y: Math.round(y + deltaY),
        width: window.getBounds().width,
        height: window.getBounds().height
      })
    }
  })

  ipcMain.on('update-toggle-position', (_, position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => {
    if (toggleWindow) {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      let x = width - 80
      let y = height - 80

      if (position === 'bottom-left') {
        x = 20
        y = height - 80
      } else if (position === 'top-right') {
        x = width - 80
        y = 20
      } else if (position === 'top-left') {
        x = 20
        y = 20
      }

      toggleWindow.setPosition(x, y)
    }
  })

  const TODO_PATH = join(app.getPath('desktop'), 'todos.json')

  ipcMain.handle('read-todos', async () => {
    try {
      if (await fs.pathExists(TODO_PATH)) {
        return await fs.readJson(TODO_PATH)
      }
      return []
    } catch (err) {
      console.error('Error reading todos:', err)
      return []
    }
  })

  ipcMain.handle('write-todos', async (_, todos) => {
    try {
      await fs.writeJson(TODO_PATH, todos, { spaces: 2 })
      return true
    } catch (err) {
      console.error('Error writing todos:', err)
      return false
    }
  })

  ipcMain.on('close-app', () => {
    app.quit()
  })

  createTodoWindow()
  createToggleWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createTodoWindow()
      createToggleWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
