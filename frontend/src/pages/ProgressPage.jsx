import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMiProgreso, getProgresoAlumno } from '../api/ejecucionService'
import { listar as listarUsuarios } from '../api/usuarioService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/ui/PageTransition'
import MiniChart from '../components/ui/MiniChart'
import { ChartBarIcon } from '../components/ui/Icon'

export default function ProgressPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [progreso, setProgreso] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [alumnoId, setAlumnoId] = useState(searchParams.get('alumno') || '')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const isStaff = user.rol === 'profesor' || user.rol === 'admin'

  useEffect(() => {
    if (isStaff) {
      listarUsuarios({ rol: 'alumno', activo: true }).then(setAlumnos).catch(() => {})
    }
  }, [isStaff])

  useEffect(() => {
    setLoading(true)
    const fetchProgress = isStaff && alumnoId
      ? getProgresoAlumno(alumnoId, 30)
      : !isStaff
        ? getMiProgreso(30)
        : Promise.resolve([])

    fetchProgress
      .then(setProgreso)
      .catch(() => setProgreso([]))
      .finally(() => setLoading(false))
  }, [alumnoId, isStaff])

  const handleAlumnoChange = (e) => {
    const id = e.target.value
    setAlumnoId(id)
    if (id) setSearchParams({ alumno: id })
    else setSearchParams({})
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <PageTransition>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <ChartBarIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Progreso</h2>
        </div>

        {isStaff && (
          <select
            value={alumnoId}
            onChange={handleAlumnoChange}
            className="w-full mb-5 px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Selecciona un alumno</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
            ))}
          </select>
        )}

        {isStaff && !alumnoId ? (
          <EmptyState message="Selecciona un alumno para ver su progreso" />
        ) : loading ? (
          <LoadingSpinner />
        ) : progreso.length === 0 ? (
          <EmptyState message="No hay datos de progreso aun" />
        ) : (
          <div className="space-y-4">
            {progreso.map((item) => {
              const pesos = item.historial.map((h) => h.peso_usado || 0)
              const reps = item.historial.map((h) => h.repeticiones_realizadas || 0)
              const isExpanded = expandedId === item.ejercicio_id
              const lastEntry = item.historial[item.historial.length - 1]

              return (
                <div
                  key={item.ejercicio_id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => toggleExpand(item.ejercicio_id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-base">{item.ejercicio_nombre}</h3>
                      <span className="text-xs text-gray-400">{item.historial.length} registros</span>
                    </div>

                    {lastEntry && (
                      <div className="flex gap-4 text-sm text-gray-500 mb-3">
                        <span>{lastEntry.series_completadas} series</span>
                        <span>{lastEntry.repeticiones_realizadas} reps</span>
                        {lastEntry.peso_usado > 0 && <span>{lastEntry.peso_usado} kg</span>}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Peso (kg)</p>
                        <MiniChart data={pesos} color="#6366f1" height={50} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Repeticiones</p>
                        <MiniChart data={reps} color="#10b981" height={50} />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4 animate-fade-in">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm mt-3">
                          <thead>
                            <tr className="text-left text-gray-400 text-xs">
                              <th className="pb-2 font-medium">Fecha</th>
                              <th className="pb-2 text-center font-medium">Series</th>
                              <th className="pb-2 text-center font-medium">Reps</th>
                              <th className="pb-2 text-center font-medium">Peso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.historial.slice(-10).reverse().map((h, i) => (
                              <tr key={i} className="border-t border-gray-50">
                                <td className="py-2 text-gray-600">{new Date(h.fecha).toLocaleDateString()}</td>
                                <td className="py-2 text-center text-gray-700">{h.series_completadas}</td>
                                <td className="py-2 text-center text-gray-700">{h.repeticiones_realizadas}</td>
                                <td className="py-2 text-center text-gray-700">{h.peso_usado ? `${h.peso_usado} kg` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
