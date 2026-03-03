import client from './client'

export async function listar({ activo } = {}) {
  const params = {}
  if (activo !== undefined) params.activo = activo
  const { data } = await client.get('/horarios/', { params })
  return data
}

export async function obtener(id) {
  const { data } = await client.get(`/horarios/${id}`)
  return data
}

export async function crear(horario) {
  const { data } = await client.post('/horarios/', horario)
  return data
}

export async function actualizar(id, horario) {
  const { data } = await client.put(`/horarios/${id}`, horario)
  return data
}

export async function eliminar(id) {
  await client.delete(`/horarios/${id}`)
}

export async function getDisponibilidad(fecha) {
  const { data } = await client.get('/horarios/disponibilidad', { params: { fecha } })
  return data
}

export async function getDisponibilidadSemanal(fechaInicio) {
  const { data } = await client.get('/horarios/disponibilidad-semanal', {
    params: { fecha_inicio: fechaInicio }
  })
  return data
}
