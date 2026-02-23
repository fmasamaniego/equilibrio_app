import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const TOUR_KEY = (userId) => `equilibrio_tour_${userId}`

const stepsByRole = {
  alumno: [
    {
      title: '¡Bienvenido a Equilibrio!',
      content: 'Esta es tu app de gestión del gimnasio. Te mostramos en unos pasos cómo sacarle el máximo provecho.',
    },
    {
      title: 'Inicio',
      content: 'En el Inicio encontrarás tu rutina asignada para hoy y un resumen de tu actividad reciente.',
    },
    {
      title: 'Horarios',
      content: 'En Horarios podés ver los turnos disponibles de la semana y reservar el que más te convenga.',
    },
    {
      title: 'Mis Reservas',
      content: 'En Reservas encontrarás todas tus reservas activas. También podés cancelarlas desde ahí.',
    },
    {
      title: 'Progreso',
      content: 'En Progreso podés ver el historial de tus entrenamientos y seguir tu evolución.',
    },
    {
      title: 'Perfil',
      content: 'Desde tu perfil (ícono de usuario en el encabezado) podés cambiar la contraseña y configurar notificaciones por email.',
    },
  ],
  profesor: [
    {
      title: '¡Bienvenido a Equilibrio!',
      content: 'Esta es tu app de gestión del gimnasio. Te mostramos en unos pasos cómo sacarle el máximo provecho.',
    },
    {
      title: 'Inicio',
      content: 'En el Inicio ves el resumen del día: alumnos activos, reservas y ocupación de turnos.',
    },
    {
      title: 'Rutinas',
      content: 'En Rutinas podés crear y asignar rutinas a los alumnos, con ejercicios, series y pesos.',
    },
    {
      title: 'Horarios',
      content: 'En Horarios ves el calendario semanal, los alumnos por turno y podés agregar o quitar participantes.',
    },
    {
      title: 'Ejercicios',
      content: 'En Ejercicios gestionás el catálogo de ejercicios disponibles para armar rutinas.',
    },
  ],
  admin: [
    {
      title: '¡Bienvenido a Equilibrio!',
      content: 'Esta es tu app de gestión del gimnasio. Te mostramos en unos pasos cómo sacarle el máximo provecho.',
    },
    {
      title: 'Inicio',
      content: 'En el Inicio ves métricas generales: alumnos activos, reservas del día y ocupación de turnos.',
    },
    {
      title: 'Usuarios',
      content: 'En Usuarios gestionás alumnos, profesores y administradores: crear, activar, desactivar o eliminar.',
    },
    {
      title: 'Horarios',
      content: 'En Horarios configurás los turnos disponibles (hora, capacidad) y ves el calendario semanal con todos los alumnos.',
    },
    {
      title: 'Rutinas',
      content: 'En Rutinas podés revisar y gestionar todas las rutinas creadas por los profesores.',
    },
  ],
}

export default function TourGuide() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const done = localStorage.getItem(TOUR_KEY(user.id))
    if (!done) setVisible(true)
  }, [user?.id])

  const steps = stepsByRole[user?.rol] || []
  const total = steps.length
  const current = steps[step]

  const finish = () => {
    localStorage.setItem(TOUR_KEY(user.id), 'done')
    setVisible(false)
  }

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1)
    else finish()
  }

  const prev = () => setStep((s) => Math.max(0, s - 1))

  if (!visible || !current) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        {/* Step dots */}
        <div className="flex gap-1.5 mb-5 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'bg-indigo-600 w-6' : 'bg-gray-200 w-3'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{current.title}</h3>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">{current.content}</p>

        {/* Counter */}
        <p className="text-xs text-gray-400 text-center mb-4">{step + 1} de {total}</p>

        {/* Buttons */}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={prev}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {step < total - 1 ? 'Siguiente' : 'Empezar'}
          </button>
        </div>

        <button
          onClick={finish}
          className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Saltar tour
        </button>
      </div>
    </div>
  )
}
