import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report to an error service if/when one is wired up.
    console.error('Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
