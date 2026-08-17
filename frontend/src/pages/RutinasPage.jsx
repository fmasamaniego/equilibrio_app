import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import * as rutinaService from '../api/rutinaService'
import * as ejercicioService from '../api/ejercicioService'
import * as usuarioService from '../api/usuarioService'
import * as grupoService from '../api/grupoMuscularService'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/ui/PageTransition'
import { ClipboardDocumentListIcon } from '../components/ui/Icon'
import RutinaDetailDrawer from '../components/ui/RutinaDetailDrawer'
import AlumnoSearchSelect from '../components/ui/AlumnoSearchSelect'
import RutinaFormModal from '../components/rutinas/RutinaFormModal'
import RutinaDuplicarModal from '../components/rutinas/RutinaDuplicarModal'

export default function RutinasPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [rutinas, setRutinas] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [profesores, setProfesores] = useState([])
  const [ejerciciosDisp, setEjerciciosDisp] = useState([])
  const [grupos, setGrupos] = useState([])
  const [filtroAlumno, setFiltroAlumno] = useState(searchParams.get('alumno') || '')
  const [soloSinProfesor, setSoloSinProfesor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editRutina, setEditRutina] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [drawerRutina, setDrawerRutina] = useState(null)
  const [dupRutina, setDupRutina] = useState(null)
  const [seleccionadas, setSeleccionadas] = useState(new Set())
  const [bulkProfesorId, setBulkProfesorId] = useState('')

  const esAdmin = user?.rol === 'admin'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [r, a, p, e, g] = await Promise.all([
        rutinaService.listar({
          alumno_id: filtroAlumno || undefined,
          sin_profesor: soloSinProfesor || undefined,
          limit: 500,
        }),
        usuarioService.listar({ rol: 'alumno', activo: true }),
        usuarioService.listar({ rol: 'profesor', activo: true }),
        ejercicioService.listar(),
        grupoService.listar(),
      ])
      setRutinas(r)
      setAlumnos(a)
      setProfesores(p)
      setEjerciciosDisp(e)
      setGrupos(g)
    } catch { showToast('Error cargando datos', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filtroAlumno, soloSinProfesor])

  const openModal = (rutina = null) => {
    setEditRutina(rutina)
    setModal(true)
  }

  const handleDelete = async () => {
    try {
      await rutinaService.eliminar(deleteId)
      showToast('Rutina eliminada')
      fetchData()
    } catch { showToast('Error al eliminar', 'error') }
  }

  const handleReclamar = async (rutinaId) => {
    try {
      await rutinaService.asignarProfesor(rutinaId, user.id)
      showToast('Rutina asignada a vos')
      fetchData()
    } catch {
      showToast('Error al asignar', 'error')
    }
  }

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkAssign = async () => {
    if (!bulkProfesorId || seleccionadas.size === 0) return
    try {
      const { actualizadas } = await rutinaService.asignarProfesorBulk(
        Array.from(seleccionadas),
        Number(bulkProfesorId)
      )
      showToast(`${actualizadas} rutina${actualizadas === 1 ? '' : 's'} asignada${actualizadas === 1 ? '' : 's'}`)
      setSeleccionadas(new Set())
      setBulkProfesorId('')
      fetchData()
    } catch {
      showToast('Error al asignar en bloque', 'error')
    }
  }

  const alumnoNombre = (id) => {
    if (id == null) return null
    const a = alumnos.find((a) => a.id === id)
    return a ? `${a.nombre} ${a.apellido}` : '-'
  }

  const profesorNombre = (id) => {
    if (id == null) return null
    const p = profesores.find((p) => p.id === id)
    return p ? `${p.nombre} ${p.apellido}` : null
  }

  const formatFecha = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

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

        <div className="mb-2">
          <AlumnoSearchSelect
            alumnos={alumnos}
            value={filtroAlumno}
            onChange={setFiltroAlumno}
            placeholder="Filtrar por alumno..."
            includeAll
          />
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={soloSinProfesor}
            onChange={(e) => { setSoloSinProfesor(e.target.checked); setSeleccionadas(new Set()) }}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-600">Solo sin profesor asignado</span>
        </label>

        {esAdmin && seleccionadas.size > 0 && (
          <div className="sticky top-0 z-10 mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-indigo-700">{seleccionadas.size} seleccionada{seleccionadas.size === 1 ? '' : 's'}</span>
            <select
              value={bulkProfesorId}
              onChange={(e) => setBulkProfesorId(e.target.value)}
              className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Asignar a...</option>
              {profesores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={!bulkProfesorId}
              className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Asignar
            </button>
            <button onClick={() => setSeleccionadas(new Set())} className="text-sm text-gray-500 hover:text-gray-700">
              Cancelar
            </button>
          </div>
        )}

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
                  <div className="flex items-start gap-3">
                    {esAdmin && (
                      <input
                        type="checkbox"
                        checked={seleccionadas.has(r.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSeleccion(r.id)}
                        className="w-4 h-4 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-base">{r.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {r.alumno_id == null ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium mr-1">Plantilla · sin alumno</span>
                        ) : (
                          alumnoNombre(r.alumno_id)
                        )}
                        {' · '}{r.ejercicios.length} ejercicios · {[...new Set(r.ejercicios.map((e) => e.dia))].length} dias
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {profesorNombre(r.profesor_id) ? `Creada por ${profesorNombre(r.profesor_id)}` : 'Sin profesor asignado'}
                        {r.creado_en && ` · Desde ${formatFecha(r.creado_en)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!esAdmin && r.profesor_id == null && user?.rol === 'profesor' && (
                      <button onClick={(e) => { e.stopPropagation(); handleReclamar(r.id) }} className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors">Asignar a mí</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openModal(r) }} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); setDupRutina(r) }} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors">Duplicar</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id) }} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <RutinaFormModal
          open={modal}
          onClose={() => setModal(false)}
          editRutina={editRutina}
          alumnos={alumnos}
          ejerciciosDisp={ejerciciosDisp}
          grupos={grupos}
          onSaved={() => { setModal(false); fetchData() }}
        />

        <RutinaDuplicarModal
          rutina={dupRutina}
          alumnos={alumnos}
          onClose={() => setDupRutina(null)}
          onSaved={() => { setDupRutina(null); fetchData() }}
        />

        <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Se eliminara la rutina y todos sus ejercicios asociados." />

        <RutinaDetailDrawer
          rutina={drawerRutina}
          alumnoNombre={drawerRutina ? alumnoNombre(drawerRutina.alumno_id) : ''}
          ejerciciosDisp={ejerciciosDisp}
          grupos={grupos}
          onClose={() => setDrawerRutina(null)}
        />
      </div>
    </PageTransition>
  )
}
