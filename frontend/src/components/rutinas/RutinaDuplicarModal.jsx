import { useState, useEffect } from 'react'
import { useToast } from '../../hooks/useToast'
import * as rutinaService from '../../api/rutinaService'
import Modal from '../ui/Modal'
import AlumnoSearchSelect from '../ui/AlumnoSearchSelect'

/**
 * Modal para duplicar una rutina existente asignándola a un alumno.
 * Props: rutina (rutina a duplicar, o null = cerrado), alumnos, onClose, onSaved()
 */
export default function RutinaDuplicarModal({ rutina, alumnos, onClose, onSaved }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({ alumno_id: '', nombre: '' })

  useEffect(() => {
    if (rutina) setForm({ alumno_id: '', nombre: '' })
  }, [rutina])

  const handleDuplicate = async (e) => {
    e.preventDefault()
    try {
      await rutinaService.duplicar(rutina.id, {
        alumno_id: Number(form.alumno_id),
        nombre: form.nombre,
      })
      showToast('Rutina duplicada')
      onSaved?.()
    } catch {
      showToast('Error al duplicar', 'error')
    }
  }

  return (
    <Modal open={!!rutina} onClose={onClose} title="Duplicar Rutina">
      <form onSubmit={handleDuplicate} className="space-y-4">
        <p className="text-sm text-gray-500">
          Copiando: <strong>{rutina?.nombre}</strong>
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignar a alumno</label>
          <AlumnoSearchSelect
            alumnos={alumnos}
            value={form.alumno_id}
            onChange={(id) => setForm({ ...form, alumno_id: id })}
            placeholder="Buscar alumno..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nuevo nombre (opcional)</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder={rutina?.nombre ? `${rutina.nombre} (copia)` : ''} className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150">
          Duplicar
        </button>
      </form>
    </Modal>
  )
}
