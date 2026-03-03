import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMiRutinaHoy } from '../api/rutinaService'
import { listar as listarUsuarios } from '../api/usuarioService'
import { getActividadAlumnos } from '../api/ejecucionService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import PageTransition from '../components/ui/PageTransition'
import QuienVieneAhora from '../components/dashboard/QuienVieneAhora'
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  BoltIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
} from '../components/ui/Icon'

function AlumnoDashboard() {
  const [rutina, setRutina] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    getMiRutinaHoy()
      .then((data) => {
        setRutina(data)
        const dias = [...new Set(data.ejercicios.map((e) => e.dia))].sort((a, b) => a - b)
        if (dias.length > 0) setActiveDay(dias[0])
      })
      .catch(() => setError('No tienes una rutina asignada'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPdf = async () => {
    if (!rutina) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const margin = 15
    let y = 20

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(rutina.nombre, margin, y)
    y += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    const dias = [...new Set(rutina.ejercicios.map((e) => e.dia))].sort((a, b) => a - b)
    doc.text(`${dias.length} dia${dias.length !== 1 ? 's' : ''} · ${rutina.ejercicios.length} ejercicio${rutina.ejercicios.length !== 1 ? 's' : ''}`, margin, y)
    y += 10
    doc.setTextColor(0)

    for (const dia of dias) {
      const ejercicios = rutina.ejercicios.filter((e) => e.dia === dia)
      if (y > 260) { doc.addPage(); y = 20 }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(79, 70, 229)
      doc.roundedRect(margin, y - 5, 180, 9, 2, 2, 'F')
      doc.setTextColor(255)
      doc.text(`Dia ${dia}`, margin + 3, y + 1.5)
      doc.setTextColor(0)
      y += 12

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y - 4, 180, 7, 'F')
      doc.text('Ejercicio', margin + 2, y)
      doc.text('Reps', margin + 110, y)
      doc.text('Peso (kg)', margin + 135, y)
      doc.text('Notas', margin + 160, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      for (const ej of ejercicios) {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(ej.ejercicio_nombre || `Ejercicio #${ej.ejercicio_id}`, margin + 2, y, { maxWidth: 105 })
        doc.text(String(ej.repeticiones ?? '-'), margin + 110, y)
        doc.text(ej.peso ? String(ej.peso) : '-', margin + 135, y)
        doc.text(ej.notas || '', margin + 160, y, { maxWidth: 32 })
        y += 7
      }
      y += 4
    }

    const safeName = rutina.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    doc.save(`rutina-${safeName}.pdf`)
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-2">{error}</p>
        <p className="text-sm text-gray-400">Pide a tu profesor que te asigne una rutina</p>
      </div>
    )
  }

  const dias = [...new Set(rutina.ejercicios.map((e) => e.dia))].sort((a, b) => a - b)
  const ejerciciosDelDia = rutina.ejercicios.filter((e) => e.dia === activeDay)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <BoltIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Mi Rutina</h2>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          PDF
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5 ml-10">{rutina.nombre}</p>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {dias.map((dia) => (
          <button
            key={dia}
            onClick={() => setActiveDay(dia)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              activeDay === dia
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Dia {dia}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {ejerciciosDelDia.map((ej) => (
          <div key={ej.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 text-base">
              {ej.ejercicio_nombre || `Ejercicio #${ej.ejercicio_id}`}
            </h4>
            <div className="flex gap-3 mt-1 text-sm text-gray-500">
              <span>{ej.repeticiones} reps</span>
              {ej.peso > 0 && <span>{ej.peso} kg</span>}
            </div>
            {ej.notas && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mt-2">
                <p className="text-sm text-indigo-700">{ej.notas}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Link
        to={`/entrenar?rutina=${rutina.id}&dia=${activeDay}`}
        className="block w-full bg-indigo-600 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-indigo-600/20 text-center"
      >
        Entrenar Dia {activeDay}
      </Link>

      <Link
        to="/progreso"
        className="mt-4 flex items-center justify-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
      >
        <ChartBarIcon className="w-4 h-4" />
        Ver mi progreso
      </Link>
    </div>
  )
}

function ProfesorDashboard() {
  const [actividad, setActividad] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActividadAlumnos()
      .then(setActividad)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const getIndicatorColor = (ultimaSesion) => {
    if (!ultimaSesion) return 'bg-gray-300'
    const days = (Date.now() - new Date(ultimaSesion).getTime()) / (1000 * 60 * 60 * 24)
    if (days <= 3) return 'bg-emerald-500'
    if (days <= 7) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div>
      <div className="mb-6">
        <QuienVieneAhora />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Mis Alumnos</h2>
      {actividad.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay alumnos registrados</p>
      ) : (
        <div className="grid gap-2">
          {actividad.map((a) => (
            <Link
              key={a.alumno_id}
              to={`/progreso?alumno=${a.alumno_id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getIndicatorColor(a.ultima_sesion)}`} />
                  <div>
                    <p className="font-medium text-gray-900 text-base">{a.nombre} {a.apellido}</p>
                    <p className="text-sm text-gray-500">
                      {a.ultima_sesion
                        ? `Ultima sesion: ${new Date(a.ultima_sesion).toLocaleDateString()}`
                        : 'Sin sesiones'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{a.sesiones_semana} esta semana</p>
                  <p className="text-xs text-gray-400">{a.sesiones_mes} este mes</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState({ alumnos: 0, profesores: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listarUsuarios({ rol: 'alumno', activo: true }),
      listarUsuarios({ rol: 'profesor', activo: true }),
    ])
      .then(([alumnos, profesores]) =>
        setStats({ alumnos: alumnos.length, profesores: profesores.length })
      )
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <QuienVieneAhora />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Panel de Administracion</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{stats.alumnos}</p>
          <p className="text-sm text-gray-500">Alumnos activos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.profesores}</p>
          <p className="text-sm text-gray-500">Profesores</p>
        </div>
      </div>
      <div className="grid gap-2">
        <Link to="/usuarios" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 flex items-center gap-3 text-base font-medium text-gray-900">
          <UserGroupIcon className="w-5 h-5 text-indigo-600" />
          Gestionar Usuarios
        </Link>
        <Link to="/rutinas" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 flex items-center gap-3 text-base font-medium text-gray-900">
          <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600" />
          Gestionar Rutinas
        </Link>
        <Link to="/ejercicios" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 flex items-center gap-3 text-base font-medium text-gray-900">
          <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
          Gestionar Ejercicios
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <PageTransition>
      {user.rol === 'alumno' && <AlumnoDashboard />}
      {user.rol === 'profesor' && <ProfesorDashboard />}
      {user.rol === 'admin' && <AdminDashboard />}
    </PageTransition>
  )
}
