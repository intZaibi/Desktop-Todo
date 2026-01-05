import { useEffect, useState } from 'react'
import TodoApp from './components/TodoApp'
import ToggleButton from './components/ToggleButton'

function App(): React.JSX.Element {
  const [windowType, setWindowType] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setWindowType(params.get('type'))
  }, [])

  if (windowType === 'toggle') {
    return <ToggleButton />
  }

  if (windowType === 'todo') {
    return <TodoApp />
  }

  // Default to todo if no type is provided (shouldn't happen with current setup)
  return <TodoApp />
}

export default App
