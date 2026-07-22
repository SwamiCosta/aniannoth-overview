import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import TopBar from '@/components/TopBar'
import TimelineBar from '@/components/TimelineBar'
import ExplorePage from '@/pages/ExplorePage'
import CharactersPage from '@/pages/CharactersPage'
import PlacesPage from '@/pages/PlacesPage'
import ItemsPage from '@/pages/ItemsPage'
import LorePage from '@/pages/LorePage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppProvider>
            <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
              <TopBar />
              <TimelineBar />
              <Routes>
                <Route path="/" element={<Navigate to="/explore" replace />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/characters" element={<CharactersPage />} />
                <Route path="/places" element={<PlacesPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/lore" element={<LorePage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
              </Routes>
            </div>
          </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
