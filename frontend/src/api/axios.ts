import axios from 'axios'

const api = axios.create({ baseURL: '/' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const AUTH_FLOW_PATHS = ['/users/login', '/users/register', '/auth/complete-totp', '/auth/complete-email-otp']

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const isAuthFlow = AUTH_FLOW_PATHS.some((p) => original?.url?.includes(p))
    if (err.response?.status === 401 && !original._retry && !isAuthFlow) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/users/refresh', JSON.stringify(refreshToken), {
            headers: { 'Content-Type': 'application/json' },
          })
          localStorage.setItem('token', data.token)
          localStorage.setItem('refreshToken', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
