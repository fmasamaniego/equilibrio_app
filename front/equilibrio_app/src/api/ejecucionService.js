import client from './client'

export async function crear(ejecucion) {
  const { data } = await client.post('/ejecuciones/', ejecucion)
  return data
}

export async function getMisEjecuciones({ rutina_id, dias, skip = 0, limit = 50 } = {}) {
  const params = { skip, limit }
  if (rutina_id) params.rutina_id = rutina_id
  if (dias) params.dias = dias
  const { data } = await client.get('/ejecuciones/mis-ejecuciones', { params })
  return data
}

export async function getByAlumno(alumnoId, { rutina_id, dias, skip = 0, limit = 50 } = {}) {
  const params = { skip, limit }
  if (rutina_id) params.rutina_id = rutina_id
  if (dias) params.dias = dias
  const { data } = await client.get(`/ejecuciones/alumno/${alumnoId}`, { params })
  return data
}

export async function getMiProgreso(dias = 30) {
  const { data } = await client.get('/ejecuciones/progreso/mi-progreso', { params: { dias } })
  return data
}

export async function getProgresoAlumno(alumnoId, dias = 30) {
  const { data } = await client.get(`/ejecuciones/progreso/alumno/${alumnoId}`, { params: { dias } })
  return data
}

export async function getActividadAlumnos() {
  const { data } = await client.get('/ejecuciones/actividad-alumnos')
  return data
}
