import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { CollaborationsPage } from './pages/CollaborationsPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { FieldPage } from './pages/FieldPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PeoplePage } from './pages/PeoplePage'
import { ProfilePage } from './pages/ProfilePage'
import { QuizPage } from './pages/QuizPage'
import { RegisterPage } from './pages/RegisterPage'
import { SubFieldPage } from './pages/subfield/SubFieldPage'
import { TopicPage } from './pages/TopicPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="fields/:fieldSlug" element={<FieldPage />} />
            <Route path="fields/:fieldSlug/:subFieldSlug" element={<SubFieldPage />} />
            <Route path="topics/:topicId" element={<TopicPage />} />
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
              path="collaborations"
              element={
                <RequireAuth>
                  <CollaborationsPage />
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
