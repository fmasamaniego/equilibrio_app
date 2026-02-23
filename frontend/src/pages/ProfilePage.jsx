import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { cambiarPassword, miPerfil, actualizarMiPerfil } from '../api/usuarioService'
import PageTransition from '../components/ui/PageTransition'
import { UserCircleIcon, LockClosedIcon } from '../components/ui/Icon'

const rolLabels = { admin: 'Administrador', profesor: 'Profesor', alumno: 'Alumno' }
const rolColors = {
  admin: 'bg-purple-100 text-purple-700',
  profesor: 'bg-blue-100 text-blue-700',
  alumno: 'bg-green-100 text-green-700',
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  // ─── Contraseña ────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingPwd, setLoadingPwd] = useState(false)
  const [errorPwd, setErrorPwd] = useState('')

  // ─── Contacto / notificaciones ─────────
  const [email, setEmail] = useState('')
  const [recibirNotis, setRecibirNotis] = useState(false)
  const [loadingContact, setLoadingContact] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    miPerfil()
      .then((data) => {
        setEmail(data.email || '')
        setRecibirNotis(data.recibir_notificaciones || false)
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [])

  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    setErrorPwd('')

    if (newPassword !== confirmPassword) {
      setErrorPwd('Las contraseñas nuevas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      setErrorPwd('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoadingPwd(true)
    try {
      await cambiarPassword(currentPassword, newPassword)
      showToast('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setErrorPwd(err.response?.data?.detail || 'Error al cambiar contraseña')
    } finally {
      setLoadingPwd(false)
    }
  }

  const handleSaveContact = async (e) => {
    e.preventDefault()
    setLoadingContact(true)
    try {
      await actualizarMiPerfil({ email: email || null, recibir_notificaciones: recibirNotis })
      showToast('Datos de contacto guardados')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setLoadingContact(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <UserCircleIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        </div>

        {/* Info del usuario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {user?.nombre?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user?.nombre} {user?.apellido}</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rolColors[user?.rol] || ''}`}>
                {rolLabels[user?.rol] || user?.rol}
              </span>
            </div>
          </div>
        </div>

        {/* Contacto y notificaciones */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Contacto y notificaciones</h3>
          {loadingProfile ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : (
            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Se usará para enviarte confirmaciones de reservas.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={recibirNotis}
                    onChange={(e) => setRecibirNotis(e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${recibirNotis ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${recibirNotis ? 'translate-x-5' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Recibir notificaciones por email</p>
                  <p className="text-xs text-gray-400">Confirmaciones de reservas y avisos del gimnasio.</p>
                </div>
              </label>

              <button
                type="submit"
                disabled={loadingContact}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all duration-150"
              >
                {loadingContact ? 'Guardando...' : 'Guardar contacto'}
              </button>
            </form>
          )}
        </div>

        {/* Cambio de contraseña */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <LockClosedIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900">Cambiar contraseña</h3>
          </div>

          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Repetir nueva contraseña"
              />
            </div>

            {errorPwd && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{errorPwd}</p>
            )}

            <button
              type="submit"
              disabled={loadingPwd}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all duration-150"
            >
              {loadingPwd ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  )
}
