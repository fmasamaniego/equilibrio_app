import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import * as asignacionService from '../api/asignacionService'
import * as horarioService from '../api/horarioService'
import * as usuarioService from '../api/usuarioService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export default function AlumnoHorariosPage() {
  const { alumnoId } = useParams()
  const { showToast } = useToast()
  const [alumno, setAlumno] = useState(null)
  const [asignaciones, setAsignaciones] = useState([])
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ horario_id: '', dia_semana: 0 })
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [alumnoId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [alumnoData, asig, hrs] = await Promise.all([
        usuarioService.obtener(alumnoId),
        asignacionService.getByAlumno(alumnoId),
        horarioService.listar({ activo: true })
      ])
      setAlumno(alumnoData)
      setAsignaciones(asig)
      setHorarios(hrs)
    } catch (err) {
      showToast('Error cargando datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openModal = () => {
    setForm({ horario_id: horarios[0]?.id || '', dia_semana: 0 })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await asignacionService.crear({
        alumno_id: Number(alumnoId),
        horario_id: Number(form.horario_id),
        dia_semana: Number(form.dia_semana)
      })
      showToast('Horario asignado')
      setModal(false)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al asignar', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await asignacionService.eliminar(deleteId)
      showToast('Asignacion eliminada')
      setDeleteId(null)
      fetchData()
    } catch (err) {
      showToast('Error al eliminar', 'error')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <Link to="/" className="text-base text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        ← Volver
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {alumno?.nombre} {alumno?.apellido}
          </h2>
          <p className="text-base text-gray-500">Horarios fijos asignados</p>
        </div>
        <button
          onClick={openModal}
          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Asignar
        </button>
      </div>

      {asignaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-base">Sin horarios fijos asignados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {asignaciones.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-lg">{DIAS_SEMANA[a.dia_semana]}</p>
                <p className="text-base text-gray-500">{a.horario_inicio} - {a.horario_fin}</p>
              </div>
              <button
                onClick={() => setDeleteId(a.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Asignar Horario Fijo">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-base text-gray-700 mb-1">Dia de la semana</label>
            <select
              value={form.dia_semana}
              onChange={(e) => setForm({ ...form, dia_semana: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DIAS_SEMANA.map((dia, i) => (
                <option key={i} value={i}>{dia}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Horario</label>
            <select
              value={form.horario_id}
              onChange={(e) => setForm({ ...form, horario_id: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hora_inicio} - {h.hora_fin} {h.nombre && `(${h.nombre})`}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg text-base font-medium hover:bg-indigo-700"
          >
            Asignar
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Se eliminara esta asignacion de horario fijo."
      />
    </div>
  )
}
