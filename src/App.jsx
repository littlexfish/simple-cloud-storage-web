import {useCallback, useState} from 'react'
import './App.scss'
import FileView from "./FileView.jsx";

// https://staging-v6.patternfly.org/
function App() {
  const [count, setCount] = useState(0)
    const [, updateState] = useState();
    const forceUpdate = useCallback(() => updateState({}), []);
  return (
    <>
      <FileView />
    </>
  )
}

export default App
