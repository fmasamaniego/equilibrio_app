import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import * as reservaService from '../api/reservaService'
import * as horarioService from '../api/horarioService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

export default function MisReservasPage() {
  const { showToast } = useToast()
  const [reservas, setReservas] = useState([])
  const [horarios, setHorarios] = useState([])
  const [disponibilidad, setDisponibilidad] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ horario_id: '', fecha: '', notas: '' })
  const [cancelId, setCancelId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [res, hrs] = await Promise.all([
        reservaService.getMisReservas(),
        horarioService.listar({ activo: true })
      ])
      setReservas(res)
      setHorarios(hrs)
    } catch (err) {
      showToast('Error cargando datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openModal = async () => {
    const today = new Date().toISOString().split('T')[0]
    setForm({ horario_id: '', fecha: today, notas: '' })
    try {
      const disp = await horarioService.getDisponibilidad(today)
      setDisponibilidad(disp)
    } catch (err) {
      setDisponibilidad([])
    }
    setModal(true)
  }

  const handleDateChange = async (fecha) => {
    setForm({ ...form, fecha, horario_id: '' })
    try {
      const disp = await horarioService.getDisponibilidad(fecha)
      setDisponibilidad(disp)
    } catch (err) {
      setDisponibilidad([])
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.horario_id) {
      showToast('Selecciona un horario', 'error')
      return
    }
    try {
      await reservaService.crear({
        horario_id: Number(form.horario_id),
        fecha: form.fecha,
        notas: form.notas || null
      })
      showToast('Reserva creada')
      setModal(false)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al reservar', 'error')
    }
  }

  const handleCancel = async () => {
    try {
      await reservaService.cancelar(cancelId)
      showToast('Reserva cancelada')
      setCancelId(null)
      fetchData()
    } catch (err) {
      showToast('Error al cancelar', 'error')
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) return <LoadingSpinner />

  const reservasActivas = reservas.filter(r => r.estado !== 'cancelada')
  const reservasPasadas = reservas.filter(r => r.estado === 'cancelada')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Mis Reservas</h2>
        <button
          onClick={openModal}
          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Reservar
        </button>
      </div>

      {reservasActivas.length === 0 ? (
        <EmptyState message="No tienes reservas activas" />
      ) : (
        <div className="space-y-2 mb-6">
          {reservasActivas.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-lg capitalize">{formatDate(r.fecha)}</p>
                  <p className="text-base text-gray-500">{r.horario_inicio} - {r.horario_fin}</p>
                  {r.notas && <p className="text-sm text-gray-400 mt-1">{r.notas}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    r.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.estado}
                  </span>
                  {new Date(r.fecha) >= new Date(new Date().toDateString()) && (
                    <button
                      onClick={() => setCancelId(r.id)}
                      className="block mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reservasPasadas.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Canceladas</h3>
          <div className="space-y-2 opacity-60">
            {reservasPasadas.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-base capitalize">{formatDate(r.fecha)}</p>
                    <p className="text-sm text-gray-500">{r.horario_inicio} - {r.horario_fin}</p>
                  </div>
                  <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    Cancelada
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva Reserva">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-base text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Horario</label>
            <select
              value={form.horario_id}
              onChange={(e) => setForm({ ...form, horario_id: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar horario</option>
              {disponibilidad.map((h) => (
                <option
                  key={h.id}
                  value={h.id}
                  disabled={h.capacidad && h.disponibles === 0}
                >
                  {h.hora_inicio} - {h.hora_fin}
                  {h.nombre && ` (${h.nombre})`}
                  {h.capacidad && ` - ${h.disponibles} disponibles`}
                  {h.capacidad && h.disponibles === 0 && ' - LLENO'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej: Llego 10 min tarde"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg text-base font-medium hover:bg-indigo-700"
          >
            Reservar
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        message="Se cancelara esta reserva."
      />
    </div>
  )
}
