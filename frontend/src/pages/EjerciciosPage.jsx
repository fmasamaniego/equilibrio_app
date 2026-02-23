import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import * as ejercicioService from '../api/ejercicioService'
import * as grupoService from '../api/grupoMuscularService'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

export default function EjerciciosPage() {
  const { showToast } = useToast()
  const [ejercicios, setEjercicios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalEj, setModalEj] = useState(false)
  const [editEj, setEditEj] = useState(null)
  const [formEj, setFormEj] = useState({ nombre: '', descripcion: '', grupo_muscular_id: '' })

  const [modalGrupo, setModalGrupo] = useState(false)
  const [formGrupo, setFormGrupo] = useState({ nombre: '' })
  const [editGrupo, setEditGrupo] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteType, setDeleteType] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ej, gr] = await Promise.all([
        ejercicioService.listar({ grupo_muscular_id: filtroGrupo || undefined }),
        grupoService.listar(),
      ])
      setEjercicios(ej)
      setGrupos(gr)
    } catch { showToast('Error cargando datos', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filtroGrupo])

  const openEjModal = (ej = null) => {
    setEditEj(ej)
    setFormEj(ej ? { nombre: ej.nombre, descripcion: ej.descripcion || '', grupo_muscular_id: ej.grupo_muscular_id } : { nombre: '', descripcion: '', grupo_muscular_id: grupos[0]?.id || '' })
    setModalEj(true)
  }

  const saveEj = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formEj, grupo_muscular_id: Number(formEj.grupo_muscular_id) }
      if (editEj) await ejercicioService.actualizar(editEj.id, payload)
      else await ejercicioService.crear(payload)
      showToast(editEj ? 'Ejercicio actualizado' : 'Ejercicio creado')
      setModalEj(false)
      fetchData()
    } catch { showToast('Error guardando ejercicio', 'error') }
  }

  const openGrupoModal = (g = null) => {
    setEditGrupo(g)
    setFormGrupo(g ? { nombre: g.nombre } : { nombre: '' })
    setModalGrupo(true)
  }

  const saveGrupo = async (e) => {
    e.preventDefault()
    try {
      if (editGrupo) await grupoService.actualizar(editGrupo.id, formGrupo)
      else await grupoService.crear(formGrupo)
      showToast(editGrupo ? 'Grupo actualizado' : 'Grupo creado')
      setModalGrupo(false)
      fetchData()
    } catch { showToast('Error guardando grupo', 'error') }
  }

  const handleDelete = async () => {
    try {
      if (deleteType === 'ejercicio') await ejercicioService.eliminar(deleteTarget)
      else await grupoService.eliminar(deleteTarget)
      showToast('Eliminado correctamente')
      fetchData()
    } catch { showToast('Error al eliminar', 'error') }
  }

  const grupoNombre = (id) => grupos.find((g) => g.id === id)?.nombre || '-'

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Ejercicios</h2>
        <div className="flex gap-2">
          <button onClick={() => openGrupoModal()} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">+ Grupo</button>
          <button onClick={() => openEjModal()} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Ejercicio</button>
        </div>
      </div>

      {/* Filtro */}
      <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="w-full mb-4 px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">Todos los grupos</option>
        {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
      </select>

      {/* Grupos */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-2">Grupos Musculares</h3>
        <div className="flex flex-wrap gap-2">
          {grupos.map((g) => (
            <span key={g.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm">
              {g.nombre}
              <button onClick={() => openGrupoModal(g)} className="text-gray-400 hover:text-indigo-600 ml-1">✎</button>
              <button onClick={() => { setDeleteTarget(g.id); setDeleteType('grupo') }} className="text-gray-400 hover:text-red-600">✕</button>
            </span>
          ))}
        </div>
      </div>

      {/* Lista ejercicios */}
      {ejercicios.length === 0 ? (
        <EmptyState message="No hay ejercicios" />
      ) : (
        <div className="space-y-2">
          {ejercicios.map((ej) => (
            <div key={ej.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-lg">{ej.nombre}</p>
                <p className="text-sm text-gray-500">{grupoNombre(ej.grupo_muscular_id)}{ej.descripcion ? ` · ${ej.descripcion}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEjModal(ej)} className="text-sm text-indigo-600 hover:text-indigo-800">Editar</button>
                <button onClick={() => { setDeleteTarget(ej.id); setDeleteType('ejercicio') }} className="text-sm text-red-600 hover:text-red-800">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ejercicio */}
      <Modal open={modalEj} onClose={() => setModalEj(false)} title={editEj ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}>
        <form onSubmit={saveEj} className="space-y-3">
          <div>
            <label className="block text-base text-gray-700 mb-1">Nombre</label>
            <input value={formEj.nombre} onChange={(e) => setFormEj({ ...formEj, nombre: e.target.value })} required className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Grupo Muscular</label>
            <select value={formEj.grupo_muscular_id} onChange={(e) => setFormEj({ ...formEj, grupo_muscular_id: e.target.value })} required className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Seleccionar</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Descripción (opcional)</label>
            <input value={formEj.descripcion} onChange={(e) => setFormEj({ ...formEj, descripcion: e.target.value })} className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg text-base font-medium hover:bg-indigo-700">Guardar</button>
        </form>
      </Modal>

      {/* Modal Grupo */}
      <Modal open={modalGrupo} onClose={() => setModalGrupo(false)} title={editGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}>
        <form onSubmit={saveGrupo} className="space-y-3">
          <div>
            <label className="block text-base text-gray-700 mb-1">Nombre</label>
            <input value={formGrupo.nombre} onChange={(e) => setFormGrupo({ ...formGrupo, nombre: e.target.value })} required className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg text-base font-medium hover:bg-indigo-700">Guardar</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message="Esta acción no se puede deshacer." />
    </div>
  )
}
