import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'

export function RouteError() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let detail = 'An unexpected error occurred.'
  let status: number | null = null

  if (isRouteErrorResponse(error)) {
    status = error.status
    if (error.status === 404) {
      title = 'Page not found'
      detail = 'The page you are looking for does not exist.'
    } else {
      title = `Error ${error.status}`
      detail = error.statusText || 'The request could not be completed.'
    }
  } else if (error instanceof Error) {
    detail = error.message
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <BrandMark className="h-9 w-9" />
      <p className="mt-6 text-sm font-medium text-muted-foreground">{status ? `${status}` : 'Error'}</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{detail}</p>
      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Reload
        </Button>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        <AlertTriangle className="mr-1 inline h-3 w-3" />
        If this keeps happening, check the developer diagnostics for the request id.
      </p>
    </div>
  )
}
