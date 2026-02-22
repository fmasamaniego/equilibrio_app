import client from './client'

export async function listar({ fecha, alumno_id, horario_id, estado } = {}) {
  const params = {}
  if (fecha) params.fecha = fecha
  if (alumno_id) params.alumno_id = alumno_id
  if (horario_id) params.horario_id = horario_id
  if (estado) params.estado = estado
  const { data } = await client.get('/reservas/', { params })
  return data
}

export async function getMisReservas({ desde, hasta } = {}) {
  const params = {}
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const { data } = await client.get('/reservas/mis-reservas', { params })
  return data
}

export async function crear(reserva) {
  const { data } = await client.post('/reservas/', reserva)
  return data
}

export async function crearAdmin(reserva) {
  const { data } = await client.post('/reservas/admin', reserva)
  return data
}

export async function actualizar(id, update) {
  const { data } = await client.patch(`/reservas/${id}`, update)
  return data
}

export async function cancelar(id) {
  await client.delete(`/reservas/${id}`)
}
