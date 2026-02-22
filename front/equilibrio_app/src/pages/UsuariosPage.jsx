import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import * as usuarioService from '../api/usuarioService'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const rolColors = {
  admin: 'bg-purple-100 text-purple-700',
  profesor: 'bg-blue-100 text-blue-700',
  alumno: 'bg-green-100 text-green-700',
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const isAdmin = currentUser.rol === 'admin'

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroRol, setFiltroRol] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', password: '', rol: 'alumno' })
  const [deleteId, setDeleteId] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await usuarioService.listar({ rol: filtroRol || undefined })
      setUsuarios(data)
    } catch { showToast('Error cargando usuarios', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [filtroRol])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await usuarioService.crear(form)
      showToast('Usuario creado')
      setModal(false)
      setForm({ nombre: '', apellido: '', password: '', rol: 'alumno' })
      fetch()
    } catch { showToast('Error creando usuario', 'error') }
  }

  const toggleActivo = async (u) => {
    try {
      if (u.activo) await usuarioService.desactivar(u.id)
      else await usuarioService.activar(u.id)
      showToast(u.activo ? 'Usuario desactivado' : 'Usuario activado')
      fetch()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await usuarioService.eliminar(deleteId)
      showToast('Usuario eliminado')
      fetch()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Usuario</button>
        )}
      </div>

      <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="w-full mb-4 px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">Todos los roles</option>
        <option value="admin">Admin</option>
        <option value="profesor">Profesor</option>
        <option value="alumno">Alumno</option>
      </select>

      <div className="space-y-2">
        {usuarios.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-gray-900 text-lg">{u.nombre} {u.apellido}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${rolColors[u.rol]}`}>{u.rol}</span>
                  <span className={`text-sm ${u.activo ? 'text-green-600' : 'text-red-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && u.id !== currentUser.id && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActivo(u)}
                  className={`text-sm px-2 py-1 rounded-lg ${u.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => setDeleteId(u.id)} className="text-sm text-red-600 hover:text-red-800">Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal crear */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Usuario">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-base text-gray-700 mb-1">Nombre de usuario</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Apellido</label>
            <input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-base text-gray-700 mb-1">Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg text-base font-medium hover:bg-indigo-700">Crear Usuario</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Se eliminará el usuario permanentemente." />
    </div>
  )
}
