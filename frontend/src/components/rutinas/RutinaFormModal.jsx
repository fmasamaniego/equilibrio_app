import { useState, useEffect } from 'react'
import { useToast } from '../../hooks/useToast'
import * as rutinaService from '../../api/rutinaService'
import Modal from '../ui/Modal'
import AlumnoSearchSelect from '../ui/AlumnoSearchSelect'

const emptyForm = { nombre: '', alumno_id: '', ejercicios: [] }

/**
 * Modal de crear/editar rutina. Reutilizado desde RutinasPage y MiAreaPage.
 *
 * Props:
 *   open, onClose        — control del modal
 *   editRutina           — rutina a editar, o null para crear
 *   alumnos              — array de { id, nombre, apellido }
 *   ejerciciosDisp        — array de ejercicios disponibles
 *   grupos               — array de grupos musculares (para mostrar en el buscador)
 *   defaultAlumnoId      — alumno preseleccionado al crear (opcional)
 *   onSaved()            — callback tras guardar con éxito
 */
export default function RutinaFormModal({
  open,
  onClose,
  editRutina,
  alumnos,
  ejerciciosDisp,
  grupos,
  defaultAlumnoId = '',
  onSaved,
}) {
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [esPlantilla, setEsPlantilla] = useState(false)
  const [activeDay, setActiveDay] = useState(1)
  const [searchState, setSearchState] = useState({ openIndex: null, query: '' })

  useEffect(() => {
    if (!open) return
    if (editRutina) {
      const dias = [...new Set(editRutina.ejercicios.map(e => e.dia))].sort((a, b) => a - b)
      setForm({
        nombre: editRutina.nombre,
        alumno_id: editRutina.alumno_id ?? '',
        ejercicios: editRutina.ejercicios.map((e) => ({
          ejercicio_id: e.ejercicio_id,
          series: e.series ?? 3,
          repeticiones: e.repeticiones,
          peso: e.peso || 0,
          dia: e.dia,
          notas: e.notas || '',
        })),
      })
      setEsPlantilla(editRutina.alumno_id == null)
      setActiveDay(dias[0] || 1)
    } else {
      setForm({ ...emptyForm, alumno_id: defaultAlumnoId || alumnos[0]?.id || '' })
      setEsPlantilla(false)
      setActiveDay(1)
    }
    setSearchState({ openIndex: null, query: '' })
  }, [open, editRutina])

  const addEjercicioForDay = (dia) => {
    setForm((prev) => ({
      ...prev,
      ejercicios: [
        ...prev.ejercicios,
        { ejercicio_id: ejerciciosDisp[0]?.id || '', series: 3, repeticiones: 12, peso: 0, dia, notas: '' },
      ],
    }))
  }

  const updateEjercicio = (index, field, value) => {
    setForm((prev) => {
      const ejercicios = [...prev.ejercicios]
      ejercicios[index] = {
        ...ejercicios[index],
        [field]: ['ejercicio_id', 'notas'].includes(field) ? value : Number(value) || 0
      }
      return { ...prev, ejercicios }
    })
  }

  const removeEjercicio = (index) => {
    setForm((prev) => ({
      ...prev,
      ejercicios: prev.ejercicios.filter((_, i) => i !== index),
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    if (form.ejercicios.length === 0) {
      showToast('Agrega al menos un ejercicio', 'error')
      return
    }
    try {
      const payload = {
        nombre: form.nombre,
        alumno_id: esPlantilla ? null : Number(form.alumno_id),
        ejercicios: form.ejercicios.map((ej) => ({
          ejercicio_id: Number(ej.ejercicio_id),
          series: ej.series ?? 3,
          repeticiones: ej.repeticiones,
          peso: ej.peso || null,
          dia: ej.dia,
          notas: ej.notas || null,
        })),
      }
      if (editRutina) await rutinaService.actualizar(editRutina.id, payload)
      else await rutinaService.crear(payload)
      showToast(editRutina ? 'Rutina actualizada' : 'Rutina creada')
      onSaved?.()
    } catch {
      showToast('Error guardando rutina', 'error')
    }
  }

  const grupoNombre = (id) => grupos.find((g) => g.id === id)?.nombre || ''

  const dias = [...new Set(form.ejercicios.map(e => e.dia))].sort((a, b) => a - b)
  if (dias.length === 0) dias.push(1)
  const maxDay = Math.max(...dias, 0)
  const ejerciciosDelDia = form.ejercicios
    .map((ej, idx) => ({ ...ej, _index: idx }))
    .filter(ej => ej.dia === activeDay)

  return (
    <Modal open={open} onClose={onClose} title={editRutina ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la rutina</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={esPlantilla}
              onChange={(e) => setEsPlantilla(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Crear como plantilla (sin alumno todavía)</span>
          </label>

          {!esPlantilla && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alumno</label>
              <AlumnoSearchSelect
                alumnos={alumnos}
                value={form.alumno_id}
                onChange={(id) => setForm({ ...form, alumno_id: id })}
                placeholder="Buscar alumno..."
                required
              />
            </>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
            {dias.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeDay === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Dia {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const newDay = maxDay + 1
                setActiveDay(newDay)
                addEjercicioForDay(newDay)
              }}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-50 text-indigo-600 hover:bg-indigo-50 whitespace-nowrap transition-colors"
            >
              + Dia
            </button>
            {dias.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    ejercicios: prev.ejercicios.filter(ej => ej.dia !== activeDay)
                  }))
                  setActiveDay(dias.find(d => d !== activeDay) || 1)
                }}
                className="px-2 py-2 text-sm text-red-500 hover:text-red-700 whitespace-nowrap transition-colors"
              >
                Quitar dia
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Ejercicios - Dia {activeDay}</label>
            <button type="button" onClick={() => addEjercicioForDay(activeDay)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">+ Agregar</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {ejerciciosDelDia.map((ej) => (
              <div key={ej._index} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Ejercicio</span>
                  <button type="button" onClick={() => removeEjercicio(ej._index)} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Quitar</button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar ejercicio..."
                    value={searchState.openIndex === ej._index ? searchState.query : (ejerciciosDisp.find(ed => ed.id === Number(ej.ejercicio_id))?.nombre || '')}
                    onFocus={() => setSearchState({ openIndex: ej._index, query: '' })}
                    onChange={(e) => setSearchState({ openIndex: ej._index, query: e.target.value })}
                    onBlur={() => setTimeout(() => setSearchState({ openIndex: null, query: '' }), 150)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchState.openIndex === ej._index && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {ejerciciosDisp
                        .filter(ed => ed.nombre.toLowerCase().includes(searchState.query.toLowerCase()))
                        .map(ed => (
                          <button
                            key={ed.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              updateEjercicio(ej._index, 'ejercicio_id', ed.id)
                              setSearchState({ openIndex: null, query: '' })
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex justify-between transition-colors"
                          >
                            <span>{ed.nombre}</span>
                            <span className="text-xs text-gray-400">{grupoNombre(ed.grupo_muscular_id)}</span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400">Series</label>
                    <input type="number" min="1" value={ej.series ?? 3} onChange={(e) => updateEjercicio(ej._index, 'series', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Reps</label>
                    <input type="number" min="1" value={ej.repeticiones} onChange={(e) => updateEjercicio(ej._index, 'repeticiones', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Peso (kg)</label>
                    <input type="number" min="0" value={ej.peso} onChange={(e) => updateEjercicio(ej._index, 'peso', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400">Notas para el alumno</label>
                  <input
                    type="text"
                    placeholder="Ej: 3 series, codo pegado..."
                    value={ej.notas || ''}
                    onChange={(e) => updateEjercicio(ej._index, 'notas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
            {ejerciciosDelDia.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sin ejercicios para este dia</p>
            )}
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150">
          {editRutina ? 'Guardar Cambios' : 'Crear Rutina'}
        </button>
      </form>
    </Modal>
  )
}
