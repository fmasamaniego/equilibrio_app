import client from './client'

export async function listar({ alumno_id, horario_id, dia_semana } = {}) {
  const params = {}
  if (alumno_id) params.alumno_id = alumno_id
  if (horario_id) params.horario_id = horario_id
  if (dia_semana !== undefined) params.dia_semana = dia_semana
  const { data } = await client.get('/asignaciones/', { params })
  return data
}

export async function getByAlumno(alumnoId) {
  const { data } = await client.get(`/asignaciones/alumno/${alumnoId}`)
  return data
}

export async function crear(asignacion) {
  const { data } = await client.post('/asignaciones/', asignacion)
  return data
}

export async function crearBulk(alumnoId, asignaciones) {
  const { data } = await client.post('/asignaciones/bulk', {
    alumno_id: alumnoId,
    asignaciones
  })
  return data
}

export async function eliminar(id) {
  await client.delete(`/asignaciones/${id}`)
}
