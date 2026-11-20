import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>SECRET</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset()
  })

  it('redirects to login when unauthenticated', () => {
    mockedUseAuth.mockReturnValue({
      status: 'unauthenticated',
      user: null,
      login: async () => {},
      logout: async () => {},
      completeCallback: async () => {},
    })
    renderAt('/secret')
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(screen.queryByText('SECRET')).not.toBeInTheDocument()
  })

  it('shows a loading state while resolving the session', () => {
    mockedUseAuth.mockReturnValue({
      status: 'loading',
      user: null,
      login: async () => {},
      logout: async () => {},
      completeCallback: async () => {},
    })
    renderAt('/secret')
    expect(screen.queryByText('SECRET')).not.toBeInTheDocument()
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument()
  })

  it('renders protected content when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: 'usr_1', name: 'Test', email: null },
      login: async () => {},
      logout: async () => {},
      completeCallback: async () => {},
    })
    renderAt('/secret')
    expect(screen.getByText('SECRET')).toBeInTheDocument()
  })
})
