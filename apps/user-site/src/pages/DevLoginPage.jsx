import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import useAuthStore from '../auth/authStore'
import authService from '../authService'

const TEST_ACCOUNTS = [
  {
    label: 'Войти как ПОЛЬЗОВАТЕЛЬ',
    email: 'user@tpu.ru',
    password: 'password123',
    description: 'Иван Петров, студент ИНК, 280 баллов',
  },
  {
    label: 'Войти как АДМИНИСТРАТОР',
    email: 'admin@tpu.ru',
    password: 'admin123',
    description: 'Администратор системы',
  },
]

export default function DevLoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  async function handleLogin(email, password) {
    setLoading(email)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || `Ошибка ${response.status}`)
      }

      const data = await response.json()

      // 1) Сохраняем в localStorage 'user_data' (как делает authService.setUser)
      authService.setUser(data.user)

      // 2) ОБНОВЛЯЕМ Zustand store — это ключевое!
      // persist-middleware сам сохранит состояние в localStorage 'auth-storage'
      useAuthStore.setState({
        isAuthenticated: true,
        user: data.user,
        loading: false,
        error: null,
      })

      // 3) Редирект на главную (без reload — store change уже триггерит re-render)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 20px', fontFamily: 'Kontora, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Тестовый вход</h1>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Временная страница для разработки, пока TPU OAuth недоступен.
      </p>
      {TEST_ACCOUNTS.map((acc) => (
        <button
          key={acc.email}
          onClick={() => handleLogin(acc.email, acc.password)}
          disabled={loading !== null}
          style={{
            display: 'block', width: '100%', padding: '16px', marginBottom: '12px',
            border: '1px solid #ddd', borderRadius: '8px',
            background: loading === acc.email ? '#f0f0f0' : 'white',
            cursor: loading !== null ? 'wait' : 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{acc.label}</div>
          <div style={{ color: '#666', fontSize: '13px' }}>{acc.email} · {acc.description}</div>
        </button>
      ))}
      {error && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#fee', borderRadius: '6px', color: '#c00' }}>
          {error}
        </div>
      )}
    </div>
  )
}