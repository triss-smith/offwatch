import type { CompanySecret, SecretProviderDescriptor, SecretProvider } from "@offwatch/shared";
import { api } from "./client";

export const secretsApi = {
  list: (workspaceId: string) => api.get<CompanySecret[]>(`/workspaces/${workspaceId}/secrets`),
  providers: (workspaceId: string) =>
    api.get<SecretProviderDescriptor[]>(`/workspaces/${workspaceId}/secret-providers`),
  create: (
    workspaceId: string,
    data: {
      name: string;
      value: string;
      provider?: SecretProvider;
      description?: string | null;
      externalRef?: string | null;
    },
  ) => api.post<CompanySecret>(`/workspaces/${workspaceId}/secrets`, data),
  rotate: (id: string, data: { value: string; externalRef?: string | null }) =>
    api.post<CompanySecret>(`/secrets/${id}/rotate`, data),
  update: (
    id: string,
    data: { name?: string; description?: string | null; externalRef?: string | null },
  ) => api.patch<CompanySecret>(`/secrets/${id}`, data),
  remove: (id: string) => api.delete<{ ok: true }>(`/secrets/${id}`),
};
