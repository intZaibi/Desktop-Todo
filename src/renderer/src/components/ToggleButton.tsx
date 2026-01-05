import { ListCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ToggleButton() {
  const handleToggle = () => {
    window.electron.ipcRenderer.send('toggle-todo')
  }

  return (
    <div className="flex items-center justify-center p-2 truncate relative ring-0 outline-hidden">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center text-white cursor-pointer border border-white/20 relative group"
      >
        <ListCheck size={24} className="pointer-events-none" />
      </motion.button>
    </div>
  )
}
