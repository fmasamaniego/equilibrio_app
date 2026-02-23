import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import * as horarioService from '../api/horarioService'
import * as asignacionService from '../api/asignacionService'
import * as reservaService from '../api/reservaService'
import * as dashboardService from '../api/dashboardService'
import { listar as listarUsuarios } from '../api/usuarioService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AlumnoSearchSelect from '../components/ui/AlumnoSearchSelect'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageTransition from '../components/ui/PageTransition'
import {
  ClockIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '../components/ui/Icon'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDateShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDate()
}

function formatWeekLabel(start) {
  const end = addDays(start, 5)
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return `${s.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
}

function slotColor(ocupados, capacidad) {
  if (!capacidad) return { bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-600' }
  const pct = (ocupados / capacidad) * 100
  if (pct >= 90) return { bar: 'bg-red-500', badge: 'bg-red-50 text-red-700' }
  if (pct >= 60) return { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' }
  return { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' }
}

export default function HorariosPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isAdmin = user?.rol === 'admin'
  const isAlumno = user?.rol === 'alumno'

  const [tab, setTab] = useState('calendario')

  // ─── Semana y día seleccionado ───────────
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay()
    return today === 0 ? 5 : Math.min(today - 1, 5)
  })
  const [weekData, setWeekData] = useState([])
  const [loadingWeek, setLoadingWeek] = useState(true)

  // ─── Mis reservas (alumno) ───────────────
  const [misReservas, setMisReservas] = useState([])

  // ─── Slot expandido (inline) ─────────────
  const [expandedSlotId, setExpandedSlotId] = useState(null)
  const [alumnosEnSlot, setAlumnosEnSlot] = useState([])
  const [loadingSlot, setLoadingSlot] = useState(false)

  // ─── Agregar alumno ──────────────────────
  const [alumnos, setAlumnos] = useState([])
  const [addAlumnoId, setAddAlumnoId] = useState('')
  const [addingAlumno, setAddingAlumno] = useState(false)

  // ─── Buscador inline ─────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef(null)

  // ─── Config slots (admin) ────────────────
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotModal, setSlotModal] = useState(false)
  const [editSlot, setEditSlot] = useState(null)
  const [slotForm, setSlotForm] = useState({ hora_inicio: '', hora_fin: '', nombre: '', capacidad: '' })
  const [deleteSlotId, setDeleteSlotId] = useState(null)

  useEffect(() => {
    if (!isAlumno) listarUsuarios({ rol: 'alumno', activo: true }).then(setAlumnos).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'calendario') fetchWeekData()
  }, [weekStart, tab])

  useEffect(() => {
    if (tab === 'config') fetchSlots()
  }, [tab])

  // Cerrar slot expandido al cambiar de día
  useEffect(() => {
    setExpandedSlotId(null)
    setAlumnosEnSlot([])
  }, [selectedDay, weekStart])

  const fetchWeekData = async () => {
    setLoadingWeek(true)
    try {
      const [data, reservas] = await Promise.all([
        horarioService.getDisponibilidadSemanal(weekStart),
        isAlumno ? reservaService.getMisReservas({ desde: weekStart, hasta: addDays(weekStart, 5) }) : Promise.resolve([]),
      ])
      setWeekData(data)
      setMisReservas(reservas)
    } catch {
      showToast('Error cargando calendario', 'error')
    } finally {
      setLoadingWeek(false)
    }
  }

  const fetchSlots = async () => {
    setLoadingSlots(true)
    try {
      const data = await horarioService.listar()
      setSlots(data)
    } catch {
      showToast('Error cargando horarios', 'error')
    } finally {
      setLoadingSlots(false)
    }
  }

  // ─── Navegación semana ───────────────────
  const prevWeek = () => setWeekStart(addDays(weekStart, -7))
  const nextWeek = () => setWeekStart(addDays(weekStart, 7))
  const goToday = () => {
    setWeekStart(getMonday(new Date()))
    const today = new Date().getDay()
    setSelectedDay(today === 0 ? 5 : Math.min(today - 1, 5))
  }
  const isCurrentWeek = getMonday(new Date()) === weekStart
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedFecha = addDays(weekStart, selectedDay)

  // ─── Expandir slot inline ────────────────
  const handleSlotToggle = async (horario) => {
    if (expandedSlotId === horario.id) {
      setExpandedSlotId(null)
      setAlumnosEnSlot([])
      return
    }
    setExpandedSlotId(horario.id)
    setAddAlumnoId('')
    setSearchQuery('')
    setSearchResults([])
    setLoadingSlot(true)
    try {
      const data = await dashboardService.alumnosEnHorario(horario.id, selectedFecha)
      setAlumnosEnSlot(data)
    } catch {
      showToast('Error cargando alumnos', 'error')
    } finally {
      setLoadingSlot(false)
    }
  }

  const refreshSlotAlumnos = async () => {
    if (!expandedSlotId) return
    try {
      const data = await dashboardService.alumnosEnHorario(expandedSlotId, selectedFecha)
      setAlumnosEnSlot(data)
      fetchWeekData()
    } catch {}
  }

  // ─── Agregar / quitar alumno ─────────────
  const diaSemana = () => {
    const d = new Date(selectedFecha + 'T00:00:00')
    const day = d.getDay()
    return day === 0 ? 6 : day - 1
  }

  const handleAddAlumno = async () => {
    if (!addAlumnoId || !expandedSlotId) return
    setAddingAlumno(true)
    try {
      await asignacionService.crear({
        alumno_id: Number(addAlumnoId),
        horario_id: expandedSlotId,
        dia_semana: diaSemana(),
      })
      showToast('Alumno agregado como fijo')
      setAddAlumnoId('')
      refreshSlotAlumnos()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al agregar', 'error')
    } finally {
      setAddingAlumno(false)
    }
  }

  const handleAddReserva = async () => {
    if (!addAlumnoId || !expandedSlotId) return
    setAddingAlumno(true)
    try {
      await reservaService.crearAdmin({
        alumno_id: Number(addAlumnoId),
        horario_id: expandedSlotId,
        fecha: selectedFecha,
      })
      showToast('Reserva creada')
      setAddAlumnoId('')
      refreshSlotAlumnos()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al reservar', 'error')
    } finally {
      setAddingAlumno(false)
    }
  }

  const handleRemoveAlumno = async (alumno) => {
    try {
      if (alumno.tipo === 'fijo' && alumno.asignacion_id) {
        await asignacionService.eliminar(alumno.asignacion_id)
        showToast('Asignación eliminada')
      } else if (alumno.tipo === 'reserva' && alumno.reserva_id) {
        await reservaService.cancelar(alumno.reserva_id)
        showToast('Reserva cancelada')
      }
      refreshSlotAlumnos()
    } catch {
      showToast('Error al quitar alumno', 'error')
    }
  }

  // ─── Reservar / cancelar (alumno) ────────
  const yaReservado = (h) =>
    misReservas.find((r) => r.horario_id === h.id && r.fecha === selectedFecha && r.estado !== 'cancelada') || null

  const handleReservar = async (horario) => {
    try {
      await reservaService.crear({ horario_id: horario.id, fecha: selectedFecha })
      showToast('Reserva creada')
      fetchWeekData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al reservar', 'error')
    }
  }

  const handleCancelarReserva = async (reservaId) => {
    try {
      await reservaService.cancelar(reservaId)
      showToast('Reserva cancelada')
      setMisReservas((prev) => prev.map((r) => (r.id === reservaId ? { ...r, estado: 'cancelada' } : r)))
      fetchWeekData()
    } catch {
      showToast('Error al cancelar reserva', 'error')
    }
  }

  // ─── Buscador ────────────────────────────
  const handleSearch = (value) => {
    setSearchQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (value.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await dashboardService.buscarAlumnos(value, 10)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  // ─── CRUD config slots ───────────────────
  const openSlotModal = (slot = null) => {
    setEditSlot(slot)
    if (slot) {
      setSlotForm({ hora_inicio: slot.hora_inicio, hora_fin: slot.hora_fin, nombre: slot.nombre || '', capacidad: slot.capacidad || '' })
    } else {
      setSlotForm({ hora_inicio: '', hora_fin: '', nombre: '', capacidad: '' })
    }
    setSlotModal(true)
  }

  const saveSlot = async (e) => {
    e.preventDefault()
    const payload = {
      hora_inicio: slotForm.hora_inicio,
      hora_fin: slotForm.hora_fin,
      nombre: slotForm.nombre || null,
      capacidad: slotForm.capacidad ? Number(slotForm.capacidad) : null,
    }
    try {
      if (editSlot) {
        await horarioService.actualizar(editSlot.id, payload)
        showToast('Horario actualizado')
      } else {
        await horarioService.crear(payload)
        showToast('Horario creado')
      }
      setSlotModal(false)
      fetchSlots()
    } catch {
      showToast('Error guardando horario', 'error')
    }
  }

  const toggleSlotActivo = async (slot) => {
    try {
      await horarioService.actualizar(slot.id, { activo: !slot.activo })
      showToast(slot.activo ? 'Horario desactivado' : 'Horario activado')
      fetchSlots()
    } catch {
      showToast('Error actualizando horario', 'error')
    }
  }

  const handleDeleteSlot = async () => {
    try {
      await horarioService.eliminar(deleteSlotId)
      showToast('Horario eliminado')
      setDeleteSlotId(null)
      fetchSlots()
    } catch {
      showToast('Error al eliminar', 'error')
    }
  }

  const toggleDiaSlot = async (slot, dia) => {
    const current = slot.dias_activos ?? [0, 1, 2, 3, 4, 5]
    const newDias = current.includes(dia)
      ? current.filter((d) => d !== dia)
      : [...current, dia].sort((a, b) => a - b)
    try {
      await horarioService.actualizar(slot.id, { dias_activos: newDias })
      fetchSlots()
    } catch {
      showToast('Error actualizando días', 'error')
    }
  }

  const handleQuitarDia = async (horario) => {
    const diaActual = diaSemana()
    const current = horario.dias_activos ?? [0, 1, 2, 3, 4, 5]
    const newDias = current.filter((d) => d !== diaActual)
    try {
      await horarioService.actualizar(horario.id, { dias_activos: newDias })
      showToast(`Turno quitado del ${DIAS_FULL[diaActual]}`)
      fetchWeekData()
    } catch {
      showToast('Error al quitar turno', 'error')
    }
  }

  // ─── Datos derivados ─────────────────────
  const alumnosDisponibles = alumnos.filter(
    (a) => !alumnosEnSlot.some((e) => e.alumno_id === a.id)
  )
  const dayHorarios = weekData[selectedDay]?.horarios || []

  return (
    <PageTransition>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <ClockIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Horarios</h2>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab('calendario')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === 'calendario' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setTab('config')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === 'config' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Configurar turnos
            </button>
          </div>
        )}

        {/* ─── TAB CALENDARIO ─────────────────────── */}
        {tab === 'calendario' && (
          <>
            {/* Navegación semanal */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-700">{formatWeekLabel(weekStart)}</p>
                {!isCurrentWeek && (
                  <button onClick={goToday} className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    Hoy
                  </button>
                )}
              </div>
              <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Tabs de días */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {DIAS.map((dia, i) => {
                const fecha = addDays(weekStart, i)
                const isToday = fecha === todayStr
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`flex-1 min-w-[52px] py-2.5 rounded-xl text-center transition-all duration-150 ${
                      selectedDay === i
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isToday
                          ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <p className="text-xs font-medium">{dia}</p>
                    <p className="text-base font-bold">{formatDateShort(fecha)}</p>
                  </button>
                )
              })}
            </div>

            {/* Lista de turnos del día */}
            {loadingWeek && weekData.length === 0 ? (
              <LoadingSpinner />
            ) : dayHorarios.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No hay turnos configurados</p>
            ) : (
              <div className="space-y-3">
                {dayHorarios.map((h) => {
                  const pct = h.capacidad ? Math.min(100, (h.ocupados / h.capacidad) * 100) : 0
                  const { bar, badge } = slotColor(h.ocupados, h.capacidad)
                  const isExpanded = expandedSlotId === h.id

                  return (
                    <div key={h.id} className="rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
                      {/* Slot header — clickeable */}
                      <button
                        onClick={() => !isAlumno && handleSlotToggle(h)}
                        className={`w-full p-4 text-left transition-colors ${isAlumno ? 'cursor-default' : isExpanded ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-gray-900 text-base">
                                {h.hora_inicio?.slice(0, 5)} — {h.hora_fin?.slice(0, 5)}
                              </p>
                              {h.nombre && <p className="text-sm text-gray-500">{h.nombre}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${badge}`}>
                              {h.ocupados}{h.capacidad ? ` / ${h.capacidad}` : ''}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuitarDia(h) }}
                                title={`Quitar del ${DIAS_FULL[diaSemana()]}`}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                            {!isAlumno && (
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            )}
                          </div>
                        </div>
                        {h.capacidad && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                            <div className={`h-full rounded-full transition-all duration-300 ${bar}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </button>

                      {/* Reservar — solo alumno */}
                      {isAlumno && (() => {
                        const reserva = yaReservado(h)
                        if (reserva) return (
                          <div className="px-4 pb-3 flex items-center justify-between gap-2">
                            <span className="text-sm text-emerald-600 font-semibold">✓ Ya reservado</span>
                            <button
                              onClick={() => handleCancelarReserva(reserva.id)}
                              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                              Cancelar reserva
                            </button>
                          </div>
                        )
                        if (h.capacidad && h.ocupados >= h.capacidad) return (
                          <div className="px-4 pb-3">
                            <p className="text-center text-sm text-red-500 font-medium">Turno completo</p>
                          </div>
                        )
                        return (
                          <div className="px-4 pb-3">
                            <button
                              onClick={() => handleReservar(h)}
                              className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Reservar este turno
                            </button>
                          </div>
                        )
                      })()}

                      {/* Panel expandido — alumnos inline */}
                      {isExpanded && !isAlumno && (
                        <div className="border-t border-gray-100 animate-fade-in">
                          {loadingSlot ? (
                            <div className="py-6"><LoadingSpinner /></div>
                          ) : (
                            <div className="p-4 space-y-4">
                              {/* Lista de alumnos */}
                              {alumnosEnSlot.length === 0 ? (
                                <p className="text-center text-gray-400 py-3 text-sm">No hay alumnos en este turno</p>
                              ) : (
                                <div className="space-y-2">
                                  {alumnosEnSlot.map((a, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm truncate">{a.nombre} {a.apellido}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                          a.tipo === 'fijo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                          {a.tipo === 'fijo' ? 'Fijo' : 'Reserva'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <button
                                          onClick={() => window.open(`/rutinas?alumno=${a.alumno_id}`, '_blank')}
                                          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                          title="Ver rutina"
                                        >
                                          <EyeIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveAlumno(a)}
                                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Quitar"
                                        >
                                          <XMarkIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Buscador de alumnos */}
                              <div className="border-t border-gray-100 pt-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">Buscar alumno</p>
                                <div className="relative">
                                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Nombre o apellido..."
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                  />
                                </div>
                                {searching && <p className="text-xs text-gray-400 mt-2">Buscando...</p>}
                                {searchResults.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {searchResults.map((r) => (
                                      <button
                                        key={r.id}
                                        onClick={() => window.open(`/rutinas?alumno=${r.id}`, '_blank')}
                                        className="w-full text-left flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors"
                                      >
                                        <span className="text-sm font-medium text-gray-900">{r.nombre} {r.apellido}</span>
                                        <span className="text-xs text-indigo-500 flex items-center gap-1">
                                          <EyeIcon className="w-3.5 h-3.5" />
                                          Rutina
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                                  <p className="text-xs text-gray-400 mt-2">Sin resultados</p>
                                )}
                              </div>

                              {/* Agregar alumno al turno */}
                              <div className="border-t border-gray-100 pt-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">Agregar al turno</p>
                                <div className="mb-2">
                                  <AlumnoSearchSelect
                                    alumnos={alumnosDisponibles}
                                    value={addAlumnoId}
                                    onChange={setAddAlumnoId}
                                    placeholder="Buscar alumno..."
                                  />
                                </div>
                                {addAlumnoId && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleAddAlumno}
                                      disabled={addingAlumno}
                                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                      Fijo semanal
                                    </button>
                                    <button
                                      onClick={handleAddReserva}
                                      disabled={addingAlumno}
                                      className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                    >
                                      Reserva hoy
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── TAB CONFIG ─────────────────────────── */}
        {tab === 'config' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => openSlotModal()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150"
              >
                + Turno
              </button>
            </div>

            {loadingSlots ? (
              <LoadingSpinner />
            ) : slots.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No hay turnos configurados</p>
            ) : (
              <div className="space-y-2">
                {slots.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-md ${
                      s.activo ? 'border-gray-200' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-base">
                          {s.hora_inicio} - {s.hora_fin}
                        </p>
                        <div className="flex gap-2 mt-1 text-sm text-gray-500 flex-wrap">
                          {s.nombre && <span>{s.nombre}</span>}
                          <span>Cap: {s.capacidad || 'ilimitada'}</span>
                          {!s.activo && <span className="text-red-500 font-medium">Inactivo</span>}
                        </div>
                        {/* Pills de días */}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {DIAS.map((dia, i) => {
                            const activo = (s.dias_activos ?? [0,1,2,3,4,5]).includes(i)
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => toggleDiaSlot(s, i)}
                                title={activo ? `Quitar ${DIAS_FULL[i]}` : `Agregar ${DIAS_FULL[i]}`}
                                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                                  activo
                                    ? 'bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500'
                                }`}
                              >
                                {dia}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openSlotModal(s)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                          Editar
                        </button>
                        <button onClick={() => toggleSlotActivo(s)} className={`text-sm font-medium transition-colors ${s.activo ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'}`}>
                          {s.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => setDeleteSlotId(s.id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Modal open={slotModal} onClose={() => setSlotModal(false)} title={editSlot ? 'Editar Turno' : 'Nuevo Turno'}>
              <form onSubmit={saveSlot} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Inicio</label>
                    <input type="time" value={slotForm.hora_inicio} onChange={(e) => setSlotForm({ ...slotForm, hora_inicio: e.target.value })} required className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fin</label>
                    <input type="time" value={slotForm.hora_fin} onChange={(e) => setSlotForm({ ...slotForm, hora_fin: e.target.value })} required className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre (opcional)</label>
                  <input type="text" value={slotForm.nombre} onChange={(e) => setSlotForm({ ...slotForm, nombre: e.target.value })} placeholder="Ej: Turno mañana" className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacidad (vacío = ilimitada)</label>
                  <input type="number" min="1" value={slotForm.capacidad} onChange={(e) => setSlotForm({ ...slotForm, capacidad: e.target.value })} placeholder="Ej: 15" className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150">
                  {editSlot ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </form>
            </Modal>

            <ConfirmDialog
              open={!!deleteSlotId}
              onClose={() => setDeleteSlotId(null)}
              onConfirm={handleDeleteSlot}
              message="Se eliminará el turno y todas sus asignaciones y reservas asociadas."
            />
          </>
        )}
      </div>
    </PageTransition>
  )
}
