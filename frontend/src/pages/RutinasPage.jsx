import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import * as rutinaService from '../api/rutinaService'
import * as ejercicioService from '../api/ejercicioService'
import * as usuarioService from '../api/usuarioService'
import * as grupoService from '../api/grupoMuscularService'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/ui/PageTransition'
import { ClipboardDocumentListIcon } from '../components/ui/Icon'
import RutinaDetailDrawer from '../components/ui/RutinaDetailDrawer'
import AlumnoSearchSelect from '../components/ui/AlumnoSearchSelect'

export default function RutinasPage() {
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [rutinas, setRutinas] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [ejerciciosDisp, setEjerciciosDisp] = useState([])
  const [grupos, setGrupos] = useState([])
  const [filtroAlumno, setFiltroAlumno] = useState(searchParams.get('alumno') || '')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editRutina, setEditRutina] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [drawerRutina, setDrawerRutina] = useState(null)

  const [form, setForm] = useState({ nombre: '', alumno_id: '', ejercicios: [] })
  const [activeDay, setActiveDay] = useState(1)
  const [searchState, setSearchState] = useState({ openIndex: null, query: '' })

  const [dupRutina, setDupRutina] = useState(null)
  const [dupForm, setDupForm] = useState({ alumno_id: '', nombre: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [r, a, e, g] = await Promise.all([
        rutinaService.listar({ alumno_id: filtroAlumno || undefined }),
        usuarioService.listar({ rol: 'alumno', activo: true }),
        ejercicioService.listar(),
        grupoService.listar(),
      ])
      setRutinas(r)
      setAlumnos(a)
      setEjerciciosDisp(e)
      setGrupos(g)
    } catch { showToast('Error cargando datos', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filtroAlumno])

  const openModal = (rutina = null) => {
    setEditRutina(rutina)
    if (rutina) {
      const dias = [...new Set(rutina.ejercicios.map(e => e.dia))].sort((a, b) => a - b)
      setForm({
        nombre: rutina.nombre,
        alumno_id: rutina.alumno_id,
        ejercicios: rutina.ejercicios.map((e) => ({
          ejercicio_id: e.ejercicio_id,
          repeticiones: e.repeticiones,
          peso: e.peso || 0,
          dia: e.dia,
          notas: e.notas || '',
        })),
      })
      setActiveDay(dias[0] || 1)
    } else {
      setForm({ nombre: '', alumno_id: alumnos[0]?.id || '', ejercicios: [] })
      setActiveDay(1)
    }
    setSearchState({ openIndex: null, query: '' })
    setModal(true)
  }

  const addEjercicioForDay = (dia) => {
    setForm((prev) => ({
      ...prev,
      ejercicios: [
        ...prev.ejercicios,
        { ejercicio_id: ejerciciosDisp[0]?.id || '', repeticiones: 12, peso: 0, dia, notas: '' },
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
        alumno_id: Number(form.alumno_id),
        ejercicios: form.ejercicios.map((ej) => ({
          ejercicio_id: Number(ej.ejercicio_id),
          repeticiones: ej.repeticiones,
          peso: ej.peso || null,
          dia: ej.dia,
          notas: ej.notas || null,
        })),
      }
      if (editRutina) await rutinaService.actualizar(editRutina.id, payload)
      else await rutinaService.crear(payload)
      showToast(editRutina ? 'Rutina actualizada' : 'Rutina creada')
      setModal(false)
      fetchData()
    } catch { showToast('Error guardando rutina', 'error') }
  }

  const handleDelete = async () => {
    try {
      await rutinaService.eliminar(deleteId)
      showToast('Rutina eliminada')
      fetchData()
    } catch { showToast('Error al eliminar', 'error') }
  }

  const handleDuplicate = async (e) => {
    e.preventDefault()
    try {
      await rutinaService.duplicar(dupRutina.id, {
        alumno_id: Number(dupForm.alumno_id),
        nombre: dupForm.nombre,
      })
      showToast('Rutina duplicada')
      setDupRutina(null)
      fetchData()
    } catch { showToast('Error al duplicar', 'error') }
  }

  const alumnoNombre = (id) => {
    const a = alumnos.find((a) => a.id === id)
    return a ? `${a.nombre} ${a.apellido}` : '-'
  }

  const grupoNombre = (id) => grupos.find((g) => g.id === id)?.nombre || ''

  const dias = [...new Set(form.ejercicios.map(e => e.dia))].sort((a, b) => a - b)
  if (dias.length === 0) dias.push(1)
  const maxDay = Math.max(...dias, 0)
  const ejerciciosDelDia = form.ejercicios
    .map((ej, idx) => ({ ...ej, _index: idx }))
    .filter(ej => ej.dia === activeDay)

  if (loading) return <LoadingSpinner />

  return (
    <PageTransition>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Rutinas</h2>
          </div>
          <button onClick={() => openModal()} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150">
            + Rutina
          </button>
        </div>

        <div className="mb-4">
          <AlumnoSearchSelect
            alumnos={alumnos}
            value={filtroAlumno}
            onChange={setFiltroAlumno}
            placeholder="Filtrar por alumno..."
            includeAll
          />
        </div>

        {rutinas.length === 0 ? (
          <EmptyState message="No hay rutinas" />
        ) : (
          <div className="space-y-2">
            {rutinas.map((r) => (
              <div
                key={r.id}
                onClick={() => setDrawerRutina(r)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-base">{r.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {alumnoNombre(r.alumno_id)} · {r.ejercicios.length} ejercicios · {[...new Set(r.ejercicios.map((e) => e.dia))].length} dias
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openModal(r) }} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); setDupRutina(r); setDupForm({ alumno_id: '', nombre: '' }) }} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors">Duplicar</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id) }} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={modal} onClose={() => setModal(false)} title={editRutina ? 'Editar Rutina' : 'Nueva Rutina'}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la rutina</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alumno</label>
              <AlumnoSearchSelect
                alumnos={alumnos}
                value={form.alumno_id}
                onChange={(id) => setForm({ ...form, alumno_id: id })}
                placeholder="Buscar alumno..."
                required
              />
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

                    <div className="grid grid-cols-2 gap-2">
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

        <Modal open={!!dupRutina} onClose={() => setDupRutina(null)} title="Duplicar Rutina">
          <form onSubmit={handleDuplicate} className="space-y-4">
            <p className="text-sm text-gray-500">
              Copiando: <strong>{dupRutina?.nombre}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignar a alumno</label>
              <AlumnoSearchSelect
                alumnos={alumnos}
                value={dupForm.alumno_id}
                onChange={(id) => setDupForm({ ...dupForm, alumno_id: id })}
                placeholder="Buscar alumno..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nuevo nombre (opcional)</label>
              <input value={dupForm.nombre} onChange={(e) => setDupForm({ ...dupForm, nombre: e.target.value })} placeholder={dupRutina?.nombre ? `${dupRutina.nombre} (copia)` : ''} className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150">
              Duplicar
            </button>
          </form>
        </Modal>

        <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Se eliminara la rutina y todos sus ejercicios asociados." />

        <RutinaDetailDrawer
          rutina={drawerRutina}
          alumnoNombre={drawerRutina ? alumnoNombre(drawerRutina.alumno_id) : ''}
          ejerciciosDisp={ejerciciosDisp}
          onClose={() => setDrawerRutina(null)}
        />
      </div>
    </PageTransition>
  )
}
