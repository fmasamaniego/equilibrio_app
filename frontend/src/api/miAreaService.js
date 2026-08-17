import client from './client'

export async function getHorariosAlumnos() {
  const { data } = await client.get('/mi-area/horarios-alumnos')
  return data
}
