import client from './client'

export async function listar({ rol, activo, skip = 0, limit = 100 } = {}) {
  const params = {}
  if (rol) params.rol = rol
  if (activo !== undefined) params.activo = activo
  params.skip = skip
  params.limit = limit
  const { data } = await client.get('/usuarios/', { params })
  return data
}

export async function obtener(id) {
  const { data } = await client.get(`/usuarios/${id}`)
  return data
}

export async function crear(usuario) {
  const { data } = await client.post('/usuarios/', usuario)
  return data
}

export async function actualizar(id, usuario) {
  const { data } = await client.put(`/usuarios/${id}`, usuario)
  return data
}

export async function activar(id) {
  const { data } = await client.patch(`/usuarios/${id}/activar`)
  return data
}

export async function desactivar(id) {
  const { data } = await client.patch(`/usuarios/${id}/desactivar`)
  return data
}

export async function eliminar(id) {
  await client.delete(`/usuarios/${id}`)
}

export async function miPerfil() {
  const { data } = await client.get('/usuarios/me')
  return data
}

export async function cambiarPassword(currentPassword, newPassword) {
  const { data } = await client.patch('/usuarios/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return data
}

export async function actualizarMiPerfil(datos) {
  const { data } = await client.patch('/usuarios/me', datos)
  return data
}
