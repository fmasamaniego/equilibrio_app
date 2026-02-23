import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarAlumnos } from '../../api/dashboardService'
import { MagnifyingGlassIcon } from '../ui/Icon'

export default function StudentSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true)
        try {
          const data = await buscarAlumnos(query)
          setResults(data)
          setIsOpen(true)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (alumno) => {
    setQuery('')
    setIsOpen(false)
    navigate(`/alumnos/${alumno.id}/horarios`)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar alumno..."
          className="w-40 md:w-56 px-3 py-2 pl-9 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          {results.map((alumno) => (
            <button
              key={alumno.id}
              onClick={() => handleSelect(alumno)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-base">
                    {alumno.nombre} {alumno.apellido}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {alumno.tiene_horario_fijo && (
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Horario fijo
                      </span>
                    )}
                    {!alumno.activo && (
                      <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                {alumno.proxima_reserva && (
                  <span className="text-sm text-gray-500">
                    {new Date(alumno.proxima_reserva).toLocaleDateString()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          No se encontraron alumnos
        </div>
      )}
    </div>
  )
}
