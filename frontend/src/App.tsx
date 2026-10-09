import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { EditProfilePage } from './pages/EditProfilePage'
import { HomePage } from './pages/HomePage'
import { ListingFormPage } from './pages/ListingFormPage'
import { ListingPage } from './pages/ListingPage'
import { ListingsPage } from './pages/ListingsPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PeoplePage } from './pages/PeoplePage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { RequestsPage } from './pages/RequestsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="listings" element={<ListingsPage />} />
            <Route
              path="listings/new"
              element={
                <RequireAuth>
                  <ListingFormPage />
                </RequireAuth>
              }
            />
            <Route path="listings/:listingId" element={<ListingPage />} />
            <Route
              path="listings/:listingId/edit"
              element={
                <RequireAuth>
                  <ListingFormPage />
                </RequireAuth>
              }
            />
            <Route path="people" element={<PeoplePage />} />
            <Route path="people/:userId" element={<ProfilePage />} />
            <Route
              path="profile/edit"
              element={
                <RequireAuth>
                  <EditProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="requests"
              element={
                <RequireAuth>
                  <RequestsPage />
                </RequireAuth>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
