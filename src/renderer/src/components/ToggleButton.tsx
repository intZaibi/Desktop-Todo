import { ListCheck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ToggleButton() {
  const [isDragging, setIsDragging] = useState(false)

  const handleToggle = () => {
    if (!isDragging) {
      window.electron.ipcRenderer.send('toggle-todo')
    }
  }

  useEffect(() => {
    // return cleanup function
    return () => {
      window.electron.ipcRenderer.removeAllListeners('toggle-move')
    }
  }, [])  

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const handleMouseMove = (e: MouseEvent) => {
      setIsDragging(true)
      window.electron.ipcRenderer.send('toggle-move', {
        deltaX: e.movementX,
        deltaY: e.movementY
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // Reset dragging state after a brief delay to prevent click from firing
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="flex items-center justify-center p-2 truncate relative ring-0 outline-hidden group">
      {/* quit button */}
      <button
        title='Close App'
        onClick={() => window.electron.ipcRenderer.send('close-app')}
        className="size-0 group-hover:size-5 transition-all duration-300 z-10 absolute top-1 right-1 rounded-full bg-red-500 shadow-lg flex items-center justify-center text-white cursor-pointer border border-white/20 group"
      >
        <X size={24} className="pointer-events-none" />
      </button>
      {/* toggle button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center text-white cursor-move border border-white/20 relative group"
      >
        <ListCheck size={24} className="pointer-events-none" />
      </motion.button>
    </div>
  )
}