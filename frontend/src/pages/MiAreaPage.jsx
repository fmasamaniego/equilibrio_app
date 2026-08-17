import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import * as rutinaService from '../api/rutinaService'
import * as ejercicioService from '../api/ejercicioService'
import * as usuarioService from '../api/usuarioService'
import * as grupoService from '../api/grupoMuscularService'
import * as miAreaService from '../api/miAreaService'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/ui/PageTransition'
import { BriefcaseIcon, MagnifyingGlassIcon, ClockIcon } from '../components/ui/Icon'
import RutinaDetailDrawer from '../components/ui/RutinaDetailDrawer'
import RutinaFormModal from '../components/rutinas/RutinaFormModal'
import RutinaDuplicarModal from '../components/rutinas/RutinaDuplicarModal'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export default function MiAreaPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [misRutinas, setMisRutinas] = useState([])
  const [huerfanas, setHuerfanas] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [ejerciciosDisp, setEjerciciosDisp] = useState([])
  const [grupos, setGrupos] = useState([])
  const [horariosAlumnos, setHorariosAlumnos] = useState([])
  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [busquedaHuerfanas, setBusquedaHuerfanas] = useState('')
  const [modal, setModal] = useState(false)
  const [editRutina, setEditRutina] = useState(null)
  const [dupRutina, setDupRutina] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [drawerRutina, setDrawerRutina] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [r, hu, a, e, g, h] = await Promise.all([
        rutinaService.listar({ profesor_id: user.id, limit: 500 }),
        rutinaService.listar({ sin_profesor: true, limit: 500 }),
        usuarioService.listar({ rol: 'alumno', activo: true }),
        ejercicioService.listar(),
        grupoService.listar(),
        miAreaService.getHorariosAlumnos(),
      ])
      setMisRutinas(r)
      setHuerfanas(hu)
      setAlumnos(a)
      setEjerciciosDisp(e)
      setGrupos(g)
      setHorariosAlumnos(h)
    } catch {
      showToast('Error cargando datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleReclamar = async (rutinaId) => {
    try {
      await rutinaService.asignarProfesor(rutinaId, user.id)
      showToast('Rutina asignada a vos')
      fetchData()
    } catch {
      showToast('Error al asignar', 'error')
    }
  }

  const alumnoNombre = (id) => {
    if (id == null) return null
    const a = alumnos.find((a) => a.id === id)
    return a ? `${a.nombre} ${a.apellido}` : '-'
  }

  const stats = useMemo(() => {
    const ahora = new Date()
    const rutinasEsteMes = misRutinas.filter((r) => {
      if (!r.creado_en) return false
      const fecha = new Date(r.creado_en)
      return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth()
    }).length
    const alumnosDistintos = new Set(misRutinas.map((r) => r.alumno_id).filter((id) => id != null)).size
    return { total: misRutinas.length, alumnosDistintos, rutinasEsteMes }
  }, [misRutinas])

  const rutinasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return misRutinas
    return misRutinas.filter((r) => {
      const nombreAlumno = (alumnoNombre(r.alumno_id) || '').toLowerCase()
      return r.nombre.toLowerCase().includes(q) || nombreAlumno.includes(q)
    })
  }, [misRutinas, busqueda, alumnos])

  const huerfanasFiltradas = useMemo(() => {
    const q = busquedaHuerfanas.trim().toLowerCase()
    if (!q) return huerfanas
    return huerfanas.filter((r) => {
      const nombreAlumno = (alumnoNombre(r.alumno_id) || '').toLowerCase()
      return r.nombre.toLowerCase().includes(q) || nombreAlumno.includes(q)
    })
  }, [huerfanas, busquedaHuerfanas, alumnos])

  const horariosPorDia = useMemo(() => {
    const grupos = DIAS_SEMANA.map(() => [])
    for (const h of horariosAlumnos) {
      if (grupos[h.dia_semana]) grupos[h.dia_semana].push(h)
    }
    return grupos
  }, [horariosAlumnos])

  const openModal = (rutina = null) => {
    setEditRutina(rutina)
    setModal(true)
  }

  const handleDelete = async () => {
    try {
      await rutinaService.eliminar(deleteId)
      showToast('Rutina eliminada')
      fetchData()
    } catch {
      showToast('Error al eliminar', 'error')
    }
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
            <BriefcaseIcon className="w-7 h-7 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Mi área</h2>
          </div>
          <button onClick={() => openModal()} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150">
            + Rutina
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
            <p className="text-sm text-gray-500">Rutinas creadas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.alumnosDistintos}</p>
            <p className="text-sm text-gray-500">Alumnos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.rutinasEsteMes}</p>
            <p className="text-sm text-gray-500">Este mes</p>
          </div>
        </div>

        {huerfanas.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Rutinas sin profesor asignado ({huerfanas.length})
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Son rutinas creadas antes de que existiera esta sección. Si alguna es tuya, reclamala.
            </p>

            <div className="relative mb-3">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaHuerfanas}
                onChange={(e) => setBusquedaHuerfanas(e.target.value)}
                placeholder="Buscar por rutina o alumno..."
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {huerfanasFiltradas.map((r) => (
                <div key={r.id} className="bg-amber-50 rounded-xl border border-amber-100 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{r.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {r.alumno_id == null ? 'Plantilla · sin alumno' : alumnoNombre(r.alumno_id)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReclamar(r.id)}
                    className="shrink-0 px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-[0.98] transition-all duration-150"
                  >
                    Es mía
                  </button>
                </div>
              ))}
              {huerfanasFiltradas.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin resultados para tu búsqueda</p>
              )}
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-3">Mis rutinas</h3>

        <div className="relative mb-4">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por rutina o alumno..."
            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {rutinasFiltradas.length === 0 ? (
          <EmptyState message={misRutinas.length === 0 ? 'Todavía no tenés rutinas asignadas' : 'Sin resultados para tu búsqueda'} />
        ) : (
          <div className="space-y-2 mb-8">
            {rutinasFiltradas.map((r) => (
              <div
                key={r.id}
                onClick={() => setDrawerRutina(r)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-base">{r.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {r.alumno_id == null ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">Plantilla · sin alumno</span>
                      ) : (
                        alumnoNombre(r.alumno_id)
                      )}
                      {' · '}{r.ejercicios.length} ejercicios
                    </p>
                    {r.creado_en && (
                      <p className="text-xs text-gray-400 mt-0.5">Desde {formatFecha(r.creado_en)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openModal(r) }} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); setDupRutina(r) }} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors">Duplicar</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id) }} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-indigo-600" />
          Horarios en que entrenan mis alumnos
        </h3>

        {horariosAlumnos.length === 0 ? (
          <EmptyState message="Ninguno de tus alumnos tiene un horario fijo asignado todavía" />
        ) : (
          <div className="space-y-4">
            {DIAS_SEMANA.map((dia, i) => (
              horariosPorDia[i].length > 0 && (
                <div key={dia}>
                  <p className="text-sm font-medium text-gray-500 mb-1.5">{dia}</p>
                  <div className="space-y-1.5">
                    {horariosPorDia[i].map((h, idx) => (
                      <div key={`${h.alumno_id}-${h.horario_id}-${idx}`} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{h.alumno_nombre} {h.alumno_apellido}</span>
                        <span className="text-sm text-gray-500">{h.horario_inicio} - {h.horario_fin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
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
