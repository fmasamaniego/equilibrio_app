import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '../ui/Icon'

const navItems = {
  alumno: [
    { to: '/', label: 'Inicio', Icon: HomeIcon },
    { to: '/entrenar', label: 'Entrenar', Icon: BoltIcon },
    { to: '/horarios', label: 'Horarios', Icon: ClockIcon },
    { to: '/mis-reservas', label: 'Reservas', Icon: CalendarDaysIcon },
    { to: '/progreso', label: 'Progreso', Icon: ChartBarIcon },
  ],
  profesor: [
    { to: '/', label: 'Inicio', Icon: HomeIcon },
    { to: '/rutinas', label: 'Rutinas', Icon: ClipboardDocumentListIcon },
    { to: '/horarios', label: 'Horarios', Icon: ClockIcon },
    { to: '/ejercicios', label: 'Ejercicios', Icon: AcademicCapIcon },
  ],
  admin: [
    { to: '/', label: 'Inicio', Icon: HomeIcon },
    { to: '/usuarios', label: 'Usuarios', Icon: UserGroupIcon },
    { to: '/horarios', label: 'Horarios', Icon: ClockIcon },
    { to: '/rutinas', label: 'Rutinas', Icon: ClipboardDocumentListIcon },
  ],
}

export default function BottomNav() {
  const { user } = useAuth()
  const items = navItems[user?.rol] || []

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-sm transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400'
              }`
            }
          >
            <item.Icon className="w-6 h-6 mb-1" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
