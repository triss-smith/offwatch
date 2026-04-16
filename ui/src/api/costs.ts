import type {
  CostSummary,
  CostByAgent,
  CostByProviderModel,
  CostByBiller,
  CostByAgentModel,
  CostByProject,
  CostWindowSpendRow,
  FinanceSummary,
  FinanceByBiller,
  FinanceByKind,
  FinanceEvent,
  ProviderQuotaResult,
} from "@offwatch/shared";
import { api } from "./client";

function dateParams(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const costsApi = {
  summary: (workspaceId: string, from?: string, to?: string) =>
    api.get<CostSummary>(`/workspaces/${workspaceId}/costs/summary${dateParams(from, to)}`),
  byAgent: (workspaceId: string, from?: string, to?: string) =>
    api.get<CostByAgent[]>(`/workspaces/${workspaceId}/costs/by-agent${dateParams(from, to)}`),
  byAgentModel: (workspaceId: string, from?: string, to?: string) =>
    api.get<CostByAgentModel[]>(`/workspaces/${workspaceId}/costs/by-agent-model${dateParams(from, to)}`),
  byProject: (workspaceId: string, from?: string, to?: string) =>
    api.get<CostByProject[]>(`/workspaces/${workspaceId}/costs/by-project${dateParams(from, to)}`),
  byProvider: (workspaceId: string, from?: string, to?: string) =>
    api.get<CostByProviderModel[]>(`/workspaces/${workspaceId}/costs/by-provider${dateParams(from, to)}`),
  byBiller: (workspaceId: string, from?: string, to?: string) =>
    api.get<CostByBiller[]>(`/workspaces/${workspaceId}/costs/by-biller${dateParams(from, to)}`),
  financeSummary: (workspaceId: string, from?: string, to?: string) =>
    api.get<FinanceSummary>(`/workspaces/${workspaceId}/costs/finance-summary${dateParams(from, to)}`),
  financeByBiller: (workspaceId: string, from?: string, to?: string) =>
    api.get<FinanceByBiller[]>(`/workspaces/${workspaceId}/costs/finance-by-biller${dateParams(from, to)}`),
  financeByKind: (workspaceId: string, from?: string, to?: string) =>
    api.get<FinanceByKind[]>(`/workspaces/${workspaceId}/costs/finance-by-kind${dateParams(from, to)}`),
  financeEvents: (workspaceId: string, from?: string, to?: string, limit: number = 100) =>
    api.get<FinanceEvent[]>(`/workspaces/${workspaceId}/costs/finance-events${dateParamsWithLimit(from, to, limit)}`),
  windowSpend: (workspaceId: string) =>
    api.get<CostWindowSpendRow[]>(`/workspaces/${workspaceId}/costs/window-spend`),
  quotaWindows: (workspaceId: string) =>
    api.get<ProviderQuotaResult[]>(`/workspaces/${workspaceId}/costs/quota-windows`),
};

function dateParamsWithLimit(from?: string, to?: string, limit?: number): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
