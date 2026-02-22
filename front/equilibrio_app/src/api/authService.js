import client from './client'

export async function login(username, password) {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  const { data } = await client.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function getMe() {
  const { data } = await client.get('/auth/me')
  return data
}
