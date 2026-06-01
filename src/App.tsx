import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import TopBar from '@/components/TopBar'
import TimelineBar from '@/components/TimelineBar'
import ExplorePage from '@/pages/ExplorePage'
import CharactersPage from '@/pages/CharactersPage'
import PlacesPage from '@/pages/PlacesPage'
import ItemsPage from '@/pages/ItemsPage'
import LorePage from '@/pages/LorePage'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-background text-foreground">
          <TopBar />
          <TimelineBar />
          <Routes>
            <Route path="/" element={<Navigate to="/explore" replace />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/places" element={<PlacesPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/lore" element={<LorePage />} />
          </Routes>
        </div>
      </AppProvider>
    </BrowserRouter>
  )
}
