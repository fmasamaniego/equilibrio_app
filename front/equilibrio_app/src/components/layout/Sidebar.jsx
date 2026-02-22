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
    { to: '/progreso', label: 'Progreso', Icon: ChartBarIcon },
  ],
  admin: [
    { to: '/', label: 'Inicio', Icon: HomeIcon },
    { to: '/usuarios', label: 'Usuarios', Icon: UserGroupIcon },
    { to: '/rutinas', label: 'Rutinas', Icon: ClipboardDocumentListIcon },
    { to: '/horarios', label: 'Horarios', Icon: ClockIcon },
    { to: '/ejercicios', label: 'Ejercicios', Icon: AcademicCapIcon },
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const items = navItems[user?.rol] || []

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 py-4">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 mx-2 rounded-xl text-base transition-all duration-150 ${
              isActive
                ? 'text-indigo-600 bg-indigo-50 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.Icon className="w-5 h-5 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  )
}
