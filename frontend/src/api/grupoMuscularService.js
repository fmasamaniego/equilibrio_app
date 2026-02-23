import client from './client'

export async function listar() {
  const { data } = await client.get('/grupos-musculares/')
  return data
}

export async function crear(grupo) {
  const { data } = await client.post('/grupos-musculares/', grupo)
  return data
}

export async function actualizar(id, grupo) {
  const { data } = await client.put(`/grupos-musculares/${id}`, grupo)
  return data
}

export async function eliminar(id) {
  await client.delete(`/grupos-musculares/${id}`)
}
