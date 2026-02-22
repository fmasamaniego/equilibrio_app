import client from './client'

export async function listar({ grupo_muscular_id, skip = 0, limit = 100 } = {}) {
  const params = { skip, limit }
  if (grupo_muscular_id) params.grupo_muscular_id = grupo_muscular_id
  const { data } = await client.get('/ejercicios/', { params })
  return data
}

export async function obtener(id) {
  const { data } = await client.get(`/ejercicios/${id}`)
  return data
}

export async function crear(ejercicio) {
  const { data } = await client.post('/ejercicios/', ejercicio)
  return data
}

export async function actualizar(id, ejercicio) {
  const { data } = await client.put(`/ejercicios/${id}`, ejercicio)
  return data
}

export async function eliminar(id) {
  await client.delete(`/ejercicios/${id}`)
}
