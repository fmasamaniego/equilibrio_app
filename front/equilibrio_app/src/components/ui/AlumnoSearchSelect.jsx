import { useState, useRef, useEffect } from 'react'

/**
 * Combobox de búsqueda de alumnos reutilizable.
 * Reemplaza los <select> de lista fija con un input que filtra escribiendo.
 *
 * Props:
 *   alumnos      — array de { id, nombre, apellido }
 *   value        — id del alumno seleccionado (string o number, '' = ninguno)
 *   onChange(id) — callback con el id seleccionado (string) o '' para "todos"
 *   placeholder  — texto del input vacío (default: "Buscar alumno...")
 *   includeAll   — si true, agrega la opción "Todos los alumnos" arriba
 *   required     — si true, inserta un <select> oculto para validación nativa
 */
export default function AlumnoSearchSelect({
  alumnos = [],
  value = '',
  onChange,
  placeholder = 'Buscar alumno...',
  includeAll = false,
  required = false,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedAlumno = alumnos.find((a) => String(a.id) === String(value))

  // Muestra el nombre seleccionado cuando está cerrado, o lo que escribe cuando está abierto
  const displayValue = open
    ? query
    : selectedAlumno
    ? `${selectedAlumno.nombre} ${selectedAlumno.apellido}`
    : ''

  const filtered = alumnos.filter((a) =>
    `${a.nombre} ${a.apellido}`.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Select oculto para validación nativa del navegador */}
      {required && (
        <select
          tabIndex={-1}
          value={value || ''}
          required
          onChange={() => {}}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <option value="" />
          {alumnos.map((a) => (
            <option key={a.id} value={String(a.id)} />
          ))}
        </select>
      )}

      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {includeAll && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect('')
              }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                !value ? 'font-medium text-indigo-600' : 'text-gray-500'
              }`}
            >
              Todos los alumnos
            </button>
          )}
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(String(a.id))
              }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                String(value) === String(a.id) ? 'font-medium text-indigo-600' : 'text-gray-700'
              }`}
            >
              {a.nombre} {a.apellido}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2.5 text-sm text-gray-400">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  )
}
