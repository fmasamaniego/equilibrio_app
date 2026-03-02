import { useState, useEffect, useMemo } from 'react'
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

const PAGE_SIZE = 20

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const isAdmin = currentUser.rol === 'admin'

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroRol, setFiltroRol] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ usuario: '', nombre: '', apellido: '', password: '', rol: 'alumno' })
  const [deleteId, setDeleteId] = useState(null)

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const data = await usuarioService.listar({ rol: filtroRol || undefined })
      setUsuarios(data)
    } catch { showToast('Error cargando usuarios', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchUsuarios()
    setPage(1)
  }, [filtroRol])

  // Resetear página al buscar
  useEffect(() => { setPage(1) }, [busqueda])

  const filtered = useMemo(() => {
    const base = !busqueda.trim()
      ? usuarios
      : (() => {
          const q = busqueda.toLowerCase()
          return usuarios.filter((u) =>
            `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
            u.usuario?.toLowerCase().includes(q)
          )
        })()
    return [...base].sort((a, b) =>
      `${a.apellido ?? ''} ${a.nombre ?? ''}`.localeCompare(`${b.apellido ?? ''} ${b.nombre ?? ''}`, 'es')
    )
  }, [usuarios, busqueda])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Páginas visibles en el paginador (máximo 5)
  const pageNumbers = useMemo(() => {
    const delta = 2
    const range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    return range
  }, [page, totalPages])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await usuarioService.crear(form)
      showToast('Usuario creado')
      setModal(false)
      setForm({ usuario: '', nombre: '', apellido: '', password: '', rol: 'alumno' })
      fetchUsuarios()
    } catch { showToast('Error creando usuario', 'error') }
  }

  const toggleActivo = async (u) => {
    try {
      if (u.activo) await usuarioService.desactivar(u.id)
      else await usuarioService.activar(u.id)
      showToast(u.activo ? 'Usuario desactivado' : 'Usuario activado')
      fetchUsuarios()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await usuarioService.eliminar(deleteId)
      showToast('Usuario eliminado')
      fetchUsuarios()
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

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o alias..."
          className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos</option>
          <option value="admin">Admin</option>
          <option value="profesor">Profesor</option>
          <option value="alumno">Alumno</option>
        </select>
      </div>

      {/* Conteo */}
      <p className="text-sm text-gray-400 mb-3">
        {filtered.length === 0
          ? 'Sin resultados'
          : `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} de ${filtered.length} usuario${filtered.length !== 1 ? 's' : ''}`
        }
      </p>

      {/* Lista */}
      <div className="space-y-2">
        {paginated.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-lg">{u.nombre} {u.apellido}</p>
              <p className="text-sm text-gray-400">@{u.usuario}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${rolColors[u.rol]}`}>{u.rol}</span>
                <span className={`text-sm ${u.activo ? 'text-green-600' : 'text-red-500'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
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
        {paginated.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin resultados</p>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-5">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹ Ant
          </button>

          {pageNumbers[0] > 1 && (
            <>
              <button onClick={() => setPage(1)} className="w-9 h-9 text-sm rounded-lg hover:bg-gray-100 transition-colors">1</button>
              {pageNumbers[0] > 2 && <span className="px-1 text-gray-400">…</span>}
            </>
          )}

          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors ${
                n === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {n}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
              <button onClick={() => setPage(totalPages)} className="w-9 h-9 text-sm rounded-lg hover:bg-gray-100 transition-colors">{totalPages}</button>
            </>
          )}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Sig ›
          </button>
        </div>
      )}

      {/* Modal crear */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Usuario">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Alias <span className="text-xs font-normal text-gray-400">(para ingresar al sistema)</span>
            </label>
            <input
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              required
              placeholder="ej: fsamaniego"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                placeholder="Juan"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Apellido</label>
              <input
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                required
                placeholder="Pérez"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Rol</label>
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
