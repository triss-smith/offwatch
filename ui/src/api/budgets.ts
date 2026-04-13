import type {
  BudgetIncident,
  BudgetIncidentResolutionInput,
  BudgetOverview,
  BudgetPolicySummary,
  BudgetPolicyUpsertInput,
} from "@paperclipai/shared";
import { api } from "./client";

export const budgetsApi = {
  overview: (workspaceId: string) =>
    api.get<BudgetOverview>(`/workspaces/${workspaceId}/budgets/overview`),
  upsertPolicy: (workspaceId: string, data: BudgetPolicyUpsertInput) =>
    api.post<BudgetPolicySummary>(`/workspaces/${workspaceId}/budgets/policies`, data),
  resolveIncident: (workspaceId: string, incidentId: string, data: BudgetIncidentResolutionInput) =>
    api.post<BudgetIncident>(
      `/workspaces/${workspaceId}/budget-incidents/${encodeURIComponent(incidentId)}/resolve`,
      data,
    ),
};
