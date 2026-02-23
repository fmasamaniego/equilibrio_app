import client from './client'

export async function buscarAlumnos(query, limit = 20) {
  const { data } = await client.get('/dashboard/buscar-alumnos', {
    params: { q: query, limit }
  })
  return data
}

export async function quienVieneAhora() {
  const { data } = await client.get('/dashboard/quien-viene-ahora')
  return data
}

export async function alumnosEnHorario(horarioId, fecha) {
  const { data } = await client.get(`/dashboard/horario/${horarioId}/fecha/${fecha}`)
  return data
}
