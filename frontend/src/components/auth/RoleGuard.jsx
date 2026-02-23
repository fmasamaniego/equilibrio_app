import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function RoleGuard({ roles, children }) {
  const { user } = useAuth()

  if (!roles.includes(user?.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}
