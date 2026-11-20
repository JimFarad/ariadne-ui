/**
 * Provider credential schema — fetched from the API.
 *
 * `GET /v1/providers/{provider}/credential-schema` returns the ordered
 * credential fields each provider requires, served from the same definitions
 * the drivers read. Nothing is hardcoded here.
 */
import { api } from '@/lib/api/client'
import type { ProviderCredentialSchemaResource } from '@/types/api'

export function fetchCredentialSchema(providerSlug: string): Promise<ProviderCredentialSchemaResource> {
  return api.get<ProviderCredentialSchemaResource>(`/v1/providers/${providerSlug}/credential-schema`)
}
