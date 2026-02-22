import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleGuard from './components/auth/RoleGuard'
import AppLayout from './components/layout/AppLayout'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import ProgressPage from './pages/ProgressPage'
import RutinasPage from './pages/RutinasPage'
import EjerciciosPage from './pages/EjerciciosPage'
import UsuariosPage from './pages/UsuariosPage'
import HorariosPage from './pages/HorariosPage'
import AlumnoHorariosPage from './pages/AlumnoHorariosPage'
import MisReservasPage from './pages/MisReservasPage'
import ProfilePage from './pages/ProfilePage'

function LoginRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to="/" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="entrenar" element={
            <RoleGuard roles={['alumno']}>
              <WorkoutPage />
            </RoleGuard>
          } />

          <Route path="progreso" element={<ProgressPage />} />

          <Route path="rutinas" element={
            <RoleGuard roles={['admin', 'profesor']}>
              <RutinasPage />
            </RoleGuard>
          } />

          <Route path="ejercicios" element={
            <RoleGuard roles={['admin', 'profesor']}>
              <EjerciciosPage />
            </RoleGuard>
          } />

          <Route path="usuarios" element={
            <RoleGuard roles={['admin', 'profesor']}>
              <UsuariosPage />
            </RoleGuard>
          } />

          <Route path="horarios" element={
            <RoleGuard roles={['admin', 'profesor', 'alumno']}>
              <HorariosPage />
            </RoleGuard>
          } />

          <Route path="alumnos/:alumnoId/horarios" element={
            <RoleGuard roles={['admin', 'profesor']}>
              <AlumnoHorariosPage />
            </RoleGuard>
          } />

          <Route path="mis-reservas" element={
            <RoleGuard roles={['alumno']}>
              <MisReservasPage />
            </RoleGuard>
          } />

          <Route path="perfil" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
