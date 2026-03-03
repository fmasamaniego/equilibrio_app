import client from './client'

export async function listar({ alumno_id, skip = 0, limit = 100 } = {}) {
  const params = { skip, limit }
  if (alumno_id) params.alumno_id = alumno_id
  const { data } = await client.get('/rutinas/', { params })
  return data
}

export async function obtener(id) {
  const { data } = await client.get(`/rutinas/${id}`)
  return data
}

export async function getMiRutinaHoy() {
  const { data } = await client.get('/rutinas/mi-rutina/hoy')
  return data
}

export async function getEjerciciosDelDia(rutinaId, dia) {
  const { data } = await client.get(`/rutinas/${rutinaId}/dia/${dia}`)
  return data
}

export async function crear(rutina) {
  const { data } = await client.post('/rutinas/', rutina)
  return data
}

export async function actualizar(id, rutina) {
  const { data } = await client.put(`/rutinas/${id}`, rutina)
  return data
}

export async function eliminar(id) {
  await client.delete(`/rutinas/${id}`)
}

export async function duplicar(id, { alumno_id, nombre }) {
  const { data } = await client.post(`/rutinas/${id}/duplicar`, { alumno_id, nombre: nombre || undefined })
  return data
}
