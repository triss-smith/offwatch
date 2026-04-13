import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Workspace } from "@paperclipai/shared";
import { workspacesApi } from "../api/workspaces";
import { ApiError } from "../api/client";
import { queryKeys } from "../lib/queryKeys";
import type { CompanySelectionSource } from "../lib/company-selection";
type WorkspaceSelectionOptions = { source?: CompanySelectionSource };

interface WorkspaceContextValue {
  companies: Workspace[];
  selectedCompanyId: string | null;
  selectedCompany: Workspace | null;
  selectionSource: CompanySelectionSource;
  loading: boolean;
  error: Error | null;
  setSelectedCompanyId: (workspaceId: string, options?: WorkspaceSelectionOptions) => void;
  reloadCompanies: () => Promise<void>;
  createCompany: (data: {
    name: string;
    description?: string | null;
    budgetMonthlyCents?: number;
  }) => Promise<Workspace>;
}

const STORAGE_KEY = "paperclip.selectedCompanyId";

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectionSource, setSelectionSource] = useState<CompanySelectionSource>("bootstrap");
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: async () => {
      try {
        return await workspacesApi.list();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return [];
        }
        throw err;
      }
    },
    retry: false,
  });
  const sidebarCompanies = useMemo(
    () => companies.filter((workspace) => workspace.status !== "archived"),
    [companies],
  );

  // Auto-select first workspace when list loads
  useEffect(() => {
    if (companies.length === 0) return;

    const selectableCompanies = sidebarCompanies.length > 0 ? sidebarCompanies : companies;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && selectableCompanies.some((c) => c.id === stored)) return;
    if (selectedCompanyId && selectableCompanies.some((c) => c.id === selectedCompanyId)) return;

    const next = selectableCompanies[0]!.id;
    setSelectedCompanyIdState(next);
    setSelectionSource("bootstrap");
    localStorage.setItem(STORAGE_KEY, next);
  }, [companies, selectedCompanyId, sidebarCompanies]);

  const setSelectedCompanyId = useCallback((workspaceId: string, options?: WorkspaceSelectionOptions) => {
    setSelectedCompanyIdState(workspaceId);
    setSelectionSource(options?.source ?? "manual");
    localStorage.setItem(STORAGE_KEY, workspaceId);
  }, []);

  const reloadCompanies = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string | null;
      budgetMonthlyCents?: number;
    }) =>
      workspacesApi.create(data),
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      setSelectedCompanyId(workspace.id);
    },
  });

  const createCompany = useCallback(
    async (data: {
      name: string;
      description?: string | null;
      budgetMonthlyCents?: number;
    }) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation],
  );

  const selectedCompany = useMemo(
    () => companies.find((workspace) => workspace.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const value = useMemo(
    () => ({
      companies,
      selectedCompanyId,
      selectedCompany,
      selectionSource,
      loading: isLoading,
      error: error as Error | null,
      setSelectedCompanyId,
      reloadCompanies,
      createCompany,
    }),
    [
      companies,
      selectedCompanyId,
      selectedCompany,
      selectionSource,
      isLoading,
      error,
      setSelectedCompanyId,
      reloadCompanies,
      createCompany,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
