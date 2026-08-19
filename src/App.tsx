import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ActivityPage from './pages/ActivityPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activity/:id" element={<ActivityPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App
