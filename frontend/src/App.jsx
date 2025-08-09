import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FormCraftApp from './components/pages/FormCraftApp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen h-full w-full">
      <FormCraftApp />
    </div>
  )
}

export default App