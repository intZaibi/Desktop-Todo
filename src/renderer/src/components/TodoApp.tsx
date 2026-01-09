import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Check, X, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface SortableItemProps {
  todo: Todo
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string, newText: string) => void
}

function SortableTodoItem({ todo, onDelete, onToggle, onEdit }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  const handleSave = () => {
    onEdit(todo.id, editText)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 mb-2 rounded-xl transition-all',
        'glass bg-white/5 border-white/10 hover:bg-white/10',
        isDragging && 'opacity-50 scale-105 shadow-2xl bg-indigo-500/20 shadow-indigo-500/40'
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-white/30 hover:text-white/60">
        <GripVertical size={18} />
      </div>

      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
          todo.completed
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : 'border-white/20 hover:border-white/40'
        )}
      >
        {todo.completed && <Check size={14} />}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full bg-white/10 border-none rounded px-2 py-1 text-white focus:outline-none focus:ring-1 ring-indigo-500"
          />
        ) : (
          <span
            title={todo.text}
            className={cn(
              'text-white transition-all block truncate',
              todo.completed && 'line-through text-white/50 opacity-50'
            )}
            onDoubleClick={() => setIsEditing(true)}
          >
            {todo.text}
          </span>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1 text-white/40 hover:text-white transition-colors"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 text-white/40 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load todos from file on mount
  useEffect(() => {
    const loadTodos = async () => {
      const data = await window.api.readTodos()
      setTodos(data)
      setIsLoaded(true)
    }
    loadTodos()
  }, [])

  // Save todos to file whenever they change
  useEffect(() => {
    if (isLoaded) {
      window.api.writeTodos(todos)
    }
  }, [todos, isLoaded])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
    }
    setTodos([newTodo, ...todos])
    setInputValue('')
  }

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const handleEditTodo = (id: string, newText: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text: newText } : t)))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleToggleWindow = () => {
    window.electron.ipcRenderer.send('toggle-todo')
  }

  return (
    <div className="w-screen h-screen bg-black/80 flex flex-col rounded-3xl overflow-hidden border border-white/20">
      {/* Header */}
      <div className="p-6 pb-2 flex items-center justify-between drag-region">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">
            Stay Focused
          </h1>
          <div className="no-drag mt-4">
            <select
              onChange={(e) => window.electron.ipcRenderer.send('update-toggle-position', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/40 focus:outline-none hover:bg-white/10 transition-colors uppercase tracking-widest cursor-pointer"
              defaultValue="bottom-right"
            >
              <option className='text-gray-600' value="bottom-right">Bottom Right</option>
              <option className='text-gray-600' value="bottom-left">Bottom Left</option>
              <option className='text-gray-600' value="top-right">Top Right</option>
              <option className='text-gray-600' value="top-left">Top Left</option>
            </select>
          </div>
        </div>
        <button
          title='Hide Window'
          onClick={handleToggleWindow}
          className="no-drag p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors self-start mt-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Input Section */}
      <form onSubmit={handleAddTodo} className="px-6 py-3 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a new task..."
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 ring-indigo-500/50 transition-all font-medium"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 spinner p-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group cursor-pointer"
                >
                  <SortableTodoItem
                    todo={todo}
                    onDelete={handleDeleteTodo}
                    onToggle={handleToggleTodo}
                    onEdit={handleEditTodo}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {todos.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-white py-12">
            <Plus size={48} className="mb-4" />
            <p className="font-medium">No tasks yet</p>
          </div>
        )}
      </div>
      
      {/* Footer / Stats */}
      <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between text-xs text-white/40">
        <span>{todos.filter(t => t.completed).length} of {todos.length} tasks completed</span>
      </div>
    </div>
  )
}
