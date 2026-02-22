import { useState, useEffect } from 'react'
import { quienVieneAhora } from '../../api/dashboardService'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function QuienVieneAhora() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const result = await quienVieneAhora()
      setData(result)
      setError(null)
    } catch (err) {
      setError('No hay horarios activos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-gray-500 text-center text-base">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Ahora / Proximo</h3>
          <p className="text-base text-gray-500">
            {data.hora_inicio} - {data.hora_fin}
            {data.nombre && ` (${data.nombre})`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-indigo-600">{data.total_alumnos}</p>
          <p className="text-sm text-gray-500">
            {data.capacidad ? `de ${data.capacidad}` : 'alumnos'}
          </p>
        </div>
      </div>

      {data.alumnos.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.alumnos.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-900 text-base">{a.nombre} {a.apellido}</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${
                a.tipo === 'fijo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {a.tipo === 'fijo' ? 'F' : 'R'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-4 text-base">Sin alumnos en este horario</p>
      )}
    </div>
  )
}
