import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ArrowRightStartOnRectangleIcon, UserCircleIcon } from '../ui/Icon'
import StudentSearch from '../search/StudentSearch'

const rolLabels = { admin: 'Admin', profesor: 'Profesor', alumno: 'Alumno' }
const rolColors = {
  admin: 'bg-purple-100 text-purple-700',
  profesor: 'bg-blue-100 text-blue-700',
  alumno: 'bg-green-100 text-green-700',
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const showSearch = user?.rol === 'admin' || user?.rol === 'profesor'

  return (
    <header className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-indigo-600">Equi</span>
          <span className="text-gray-900">librio</span>
        </h1>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rolColors[user?.rol] || ''}`}>
          {rolLabels[user?.rol] || user?.rol}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {showSearch && <StudentSearch />}
        <span className="text-base text-gray-500 hidden sm:block">
          {user?.nombre} {user?.apellido}
        </span>
        <button
          onClick={() => navigate('/perfil')}
          className="p-2 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
          title="Mi perfil"
        >
          <UserCircleIcon className="w-6 h-6" />
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Cerrar sesion"
        >
          <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  )
}
