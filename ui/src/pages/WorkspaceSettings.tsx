import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "../context/WorkspaceContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { workspacesApi } from "../api/workspaces";
import { accessApi } from "../api/access";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Settings, Check } from "lucide-react";
import { CompanyPatternIcon } from "../components/CompanyPatternIcon";
import {
  Field,
  ToggleField,
  HintIcon
} from "../components/agent-config-primitives";

type AgentSnippetInput = {
  onboardingTextUrl: string;
  connectionCandidates?: string[] | null;
  testResolutionUrl?: string | null;
};

export function WorkspaceSettings() {
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId
  } = useWorkspace();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  // General settings local state
  const [workspaceName, setWorkspaceName] = useState("");
  const [brandColor, setBrandColor] = useState("");

  // Issue tracker / repo local state
  const [repoPath, setRepoPath] = useState("");
  const [worktreesPath, setWorktreesPath] = useState("");
  const [issueTrackerConfigText, setIssueTrackerConfigText] = useState("");
  const [issueTrackerConfigError, setIssueTrackerConfigError] = useState<string | null>(null);

  // Invite state
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSnippet, setInviteSnippet] = useState<string | null>(null);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [snippetCopyDelightId, setSnippetCopyDelightId] = useState(0);

  // Sync local state from selected workspace
  useEffect(() => {
    if (!selectedCompany) return;
    setWorkspaceName(selectedCompany.name);
    setBrandColor(selectedCompany.brandColor ?? "");
    setRepoPath(selectedCompany.repoPath ?? "");
    setWorktreesPath(selectedCompany.worktreesPath ?? "");
    setIssueTrackerConfigText(
      selectedCompany.issueTrackerConfig
        ? JSON.stringify(selectedCompany.issueTrackerConfig, null, 2)
        : ""
    );
    setIssueTrackerConfigError(null);
  }, [selectedCompany]);

  useEffect(() => {
    setInviteError(null);
    setInviteSnippet(null);
    setSnippetCopied(false);
    setSnippetCopyDelightId(0);
  }, [selectedCompanyId]);

  const generalDirty =
    !!selectedCompany &&
    (workspaceName !== selectedCompany.name ||
      brandColor !== (selectedCompany.brandColor ?? ""));

  const issueTrackerDirty =
    !!selectedCompany &&
    (repoPath !== (selectedCompany.repoPath ?? "") ||
      worktreesPath !== (selectedCompany.worktreesPath ?? "") ||
      issueTrackerConfigText !==
        (selectedCompany.issueTrackerConfig
          ? JSON.stringify(selectedCompany.issueTrackerConfig, null, 2)
          : ""));

  const generalMutation = useMutation({
    mutationFn: (data: { name: string; brandColor: string | null }) =>
      workspacesApi.update(selectedCompanyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      pushToast({ title: "Workspace updated", tone: "success" });
    },
    onError: (err) => {
      pushToast({
        title: "Failed to save",
        body: err instanceof Error ? err.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const issueTrackerMutation = useMutation({
    mutationFn: (data: {
      repoPath: string | null;
      worktreesPath: string | null;
      issueTrackerConfig: Record<string, unknown> | null;
    }) => workspacesApi.update(selectedCompanyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      pushToast({ title: "Issue tracker settings saved", tone: "success" });
    },
    onError: (err) => {
      pushToast({
        title: "Failed to save issue tracker settings",
        body: err instanceof Error ? err.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (requireApproval: boolean) =>
      workspacesApi.update(selectedCompanyId!, {
        requireBoardApprovalForNewAgents: requireApproval
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      accessApi.createOpenClawInvitePrompt(selectedCompanyId!),
    onSuccess: async (invite) => {
      setInviteError(null);
      const base = window.location.origin.replace(/\/+$/, "");
      const onboardingTextLink =
        invite.onboardingTextUrl ??
        invite.onboardingTextPath ??
        `/api/invites/${invite.token}/onboarding.txt`;
      const absoluteUrl = onboardingTextLink.startsWith("http")
        ? onboardingTextLink
        : `${base}${onboardingTextLink}`;
      setSnippetCopied(false);
      setSnippetCopyDelightId(0);
      let snippet: string;
      try {
        const manifest = await accessApi.getInviteOnboarding(invite.token);
        snippet = buildAgentSnippet({
          onboardingTextUrl: absoluteUrl,
          connectionCandidates:
            manifest.onboarding.connectivity?.connectionCandidates ?? null,
          testResolutionUrl:
            manifest.onboarding.connectivity?.testResolutionEndpoint?.url ??
            null
        });
      } catch {
        snippet = buildAgentSnippet({
          onboardingTextUrl: absoluteUrl,
          connectionCandidates: null,
          testResolutionUrl: null
        });
      }
      setInviteSnippet(snippet);
      try {
        await navigator.clipboard.writeText(snippet);
        setSnippetCopied(true);
        setSnippetCopyDelightId((prev) => prev + 1);
        setTimeout(() => setSnippetCopied(false), 2000);
      } catch {
        /* clipboard may not be available */
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.sidebarBadges(selectedCompanyId!)
      });
    },
    onError: (err) => {
      setInviteError(
        err instanceof Error ? err.message : "Failed to create invite"
      );
    }
  });

  const archiveMutation = useMutation({
    mutationFn: ({
      workspaceId,
      nextWorkspaceId
    }: {
      workspaceId: string;
      nextWorkspaceId: string | null;
    }) => workspacesApi.archive(workspaceId).then(() => ({ nextWorkspaceId })),
    onSuccess: async ({ nextWorkspaceId }) => {
      if (nextWorkspaceId) {
        setSelectedCompanyId(nextWorkspaceId);
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.companies.all
      });
    }
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Workspace", href: "/dashboard" },
      { label: "Settings" }
    ]);
  }, [setBreadcrumbs, selectedCompany?.name]);

  if (!selectedCompany) {
    return (
      <div className="text-sm text-muted-foreground">
        No workspace selected. Select a workspace from the switcher above.
      </div>
    );
  }

  function handleSaveGeneral() {
    generalMutation.mutate({
      name: workspaceName.trim(),
      brandColor: brandColor || null,
    });
  }

  function handleSaveIssueTracker() {
    let issueTrackerConfig: Record<string, unknown> | null = null;
    if (issueTrackerConfigText.trim()) {
      try {
        issueTrackerConfig = JSON.parse(issueTrackerConfigText) as Record<string, unknown>;
        setIssueTrackerConfigError(null);
      } catch {
        setIssueTrackerConfigError("Invalid JSON — please fix before saving.");
        return;
      }
    }
    issueTrackerMutation.mutate({
      repoPath: repoPath.trim() || null,
      worktreesPath: worktreesPath.trim() || null,
      issueTrackerConfig,
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Workspace Settings</h1>
      </div>

      {/* General */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          General
        </div>
        <div className="space-y-3 rounded-md border border-border px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <CompanyPatternIcon
                companyName={workspaceName || selectedCompany.name}
                logoUrl={null}
                brandColor={brandColor || null}
                className="rounded-[14px]"
              />
            </div>
            <div className="flex-1 space-y-3">
              <Field label="Workspace name" hint="The display name for your workspace.">
                <input
                  className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </Field>
              <Field
                label="Brand color"
                hint="Sets the hue for the workspace icon. Leave empty for auto-generated color."
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor || "#6366f1"}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^#[0-9a-fA-F]{0,6}$/.test(v)) {
                        setBrandColor(v);
                      }
                    }}
                    placeholder="Auto"
                    className="w-28 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none"
                  />
                  {brandColor && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBrandColor("")}
                      className="text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Field>
            </div>
          </div>
        </div>
        {generalDirty && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveGeneral}
              disabled={generalMutation.isPending || !workspaceName.trim()}
            >
              {generalMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Issue Tracker & Repository */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Issue Tracker &amp; Repository
        </div>
        <div className="space-y-3 rounded-md border border-border px-4 py-4">
          <Field
            label="Repository path"
            hint="Absolute path to the main git repository clone on this machine."
          >
            <input
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none"
              type="text"
              value={repoPath}
              placeholder="/home/user/projects/my-repo"
              onChange={(e) => setRepoPath(e.target.value)}
            />
          </Field>
          <Field
            label="Worktrees path"
            hint="Directory where git worktrees will be created for checked-out issues."
          >
            <input
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none"
              type="text"
              value={worktreesPath}
              placeholder="/home/user/projects/my-repo/.worktrees"
              onChange={(e) => setWorktreesPath(e.target.value)}
            />
          </Field>
          <Field
            label="Issue tracker config"
            hint="JSON configuration for the issue tracker adapter (e.g. Linear API key, team ID)."
          >
            <textarea
              className="h-32 w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none"
              value={issueTrackerConfigText}
              placeholder='{"type": "linear", "apiKey": "lin_api_...", "teamId": "..."}'
              onChange={(e) => {
                setIssueTrackerConfigText(e.target.value);
                setIssueTrackerConfigError(null);
              }}
            />
            {issueTrackerConfigError && (
              <span className="text-xs text-destructive">{issueTrackerConfigError}</span>
            )}
          </Field>
        </div>
        {issueTrackerDirty && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveIssueTracker}
              disabled={issueTrackerMutation.isPending}
            >
              {issueTrackerMutation.isPending ? "Saving..." : "Save issue tracker settings"}
            </Button>
          </div>
        )}
      </div>

      {/* Agent settings */}
      <div className="space-y-4" data-testid="workspace-settings-team-section">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Agent Settings
        </div>
        <div className="rounded-md border border-border px-4 py-3">
          <ToggleField
            label="Require board approval for new agents"
            hint="New agent registrations stay pending until approved by a board user."
            checked={!!selectedCompany.requireBoardApprovalForNewAgents}
            onChange={(v) => settingsMutation.mutate(v)}
            toggleTestId="workspace-settings-team-approval-toggle"
          />
        </div>
      </div>

      {/* Invites */}
      <div className="space-y-4" data-testid="workspace-settings-invites-section">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Invites
        </div>
        <div className="space-y-3 rounded-md border border-border px-4 py-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              Generate an OpenClaw agent invite snippet.
            </span>
            <HintIcon text="Creates a short-lived OpenClaw agent invite and renders a copy-ready prompt." />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              data-testid="workspace-settings-invites-generate-button"
              size="sm"
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending
                ? "Generating..."
                : "Generate OpenClaw Invite Prompt"}
            </Button>
          </div>
          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}
          {inviteSnippet && (
            <div
              className="rounded-md border border-border bg-muted/30 p-2"
              data-testid="workspace-settings-invites-snippet"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  OpenClaw Invite Prompt
                </div>
                {snippetCopied && (
                  <span
                    key={snippetCopyDelightId}
                    className="flex items-center gap-1 text-xs text-green-600 animate-pulse"
                  >
                    <Check className="h-3 w-3" />
                    Copied
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1.5">
                <textarea
                  data-testid="workspace-settings-invites-snippet-textarea"
                  className="h-[28rem] w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none"
                  value={inviteSnippet}
                  readOnly
                />
                <div className="flex justify-end">
                  <Button
                    data-testid="workspace-settings-invites-copy-button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteSnippet);
                        setSnippetCopied(true);
                        setSnippetCopyDelightId((prev) => prev + 1);
                        setTimeout(() => setSnippetCopied(false), 2000);
                      } catch {
                        /* clipboard may not be available */
                      }
                    }}
                  >
                    {snippetCopied ? "Copied snippet" : "Copy snippet"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-destructive uppercase tracking-wide">
          Danger Zone
        </div>
        <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Archive this workspace to hide it from the sidebar. This persists in
            the database.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={
                archiveMutation.isPending ||
                selectedCompany.status === "archived"
              }
              onClick={() => {
                if (!selectedCompanyId) return;
                const confirmed = window.confirm(
                  `Archive workspace "${selectedCompany.name}"? It will be hidden from the sidebar.`
                );
                if (!confirmed) return;
                const nextWorkspaceId =
                  companies.find(
                    (workspace) =>
                      workspace.id !== selectedCompanyId &&
                      workspace.status !== "archived"
                  )?.id ?? null;
                archiveMutation.mutate({
                  workspaceId: selectedCompanyId,
                  nextWorkspaceId
                });
              }}
            >
              {archiveMutation.isPending
                ? "Archiving..."
                : selectedCompany.status === "archived"
                ? "Already archived"
                : "Archive workspace"}
            </Button>
            {archiveMutation.isError && (
              <span className="text-xs text-destructive">
                {archiveMutation.error instanceof Error
                  ? archiveMutation.error.message
                  : "Failed to archive workspace"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildAgentSnippet(input: AgentSnippetInput) {
  const candidateUrls = buildCandidateOnboardingUrls(input);
  const resolutionTestUrl = buildResolutionTestUrl(input);

  const candidateList =
    candidateUrls.length > 0
      ? candidateUrls.map((u) => `- ${u}`).join("\n")
      : "- (No candidate URLs available yet.)";

  const connectivityBlock =
    candidateUrls.length === 0
      ? `No candidate URLs are available. Ask your user to configure a reachable hostname in Offwatch, then retry.
Suggested steps:
- choose a hostname that resolves to the Offwatch host from your runtime
- run: pnpm offwatchai allowed-hostname <host>
- restart Offwatch
- verify with: curl -fsS http://<host>:3100/api/health
- regenerate this invite snippet`
      : `If none are reachable, ask your user to add a reachable hostname in Offwatch, restart, and retry.
Suggested command:
- pnpm offwatchai allowed-hostname <host>
Then verify with: curl -fsS <base-url>/api/health`;

  const resolutionLine = resolutionTestUrl
    ? `\nYou MUST test Offwatch-to-gateway reachability, call: ${resolutionTestUrl}?url=<urlencoded-gateway-url> (using the hostname that worked above). Do not assume your 172.x is necessarily reachable from Offwatch. Test it. `
    : "";

  return `You're invited to join a Offwatch organization.

The URLs you should try are:
${candidateList}

Connectivity guidance:
If you are running on a different machine than Offwatch, Offwatch must be reachable at one of the hostnames used above.
Verify the hostname works from your runtime with: GET <base-url>/api/health

${connectivityBlock}

For your "agentName", just use your own agent name (OpenClaw or whatever your name is) and send it directly.
You also need to send a gateway URL that Offwatch can access. Check your config and include that URL.${resolutionLine}

---

This onboarding flow is for OpenClaw Gateway.
When you submit the join request, use:
- \`adapterType: "openclaw_gateway"\`
- \`agentDefaultsPayload.url\` as your \`ws://\` or \`wss://\` gateway URL
- \`agentDefaultsPayload.headers["x-openclaw-token"]\` with your gateway token
- (legacy accepted) \`agentDefaultsPayload.headers["x-openclaw-auth"]\`
- Keep device auth enabled (recommended). If \`devicePrivateKeyPem\` is omitted, Offwatch will generate and persist one during join so pairing approvals remain stable.
- Only use \`disableDeviceAuth=true\` for special environments where pairing cannot be completed.

Do NOT use \`/v1/responses\` or \`/hooks/*\` in this join flow.

Before you do anything, please respond to your user that you understand the instructions and you're going to work on them. Then do the step above in another session called "offwatch-onboarding" and then tell your user when you're done. Update your user in intermediate steps along the way so they know what's going on.

Then after you've connected to Offwatch (exchanged keys etc.) you MUST review and follow the onboarding instructions in onboarding.txt they give you.

`;
}

function buildCandidateOnboardingUrls(input: AgentSnippetInput): string[] {
  const candidates = (input.connectionCandidates ?? [])
    .map((candidate) => candidate.trim())
    .filter(Boolean);
  const urls = new Set<string>();
  let onboardingUrl: URL | null = null;

  try {
    onboardingUrl = new URL(input.onboardingTextUrl);
    urls.add(onboardingUrl.toString());
  } catch {
    const trimmed = input.onboardingTextUrl.trim();
    if (trimmed) {
      urls.add(trimmed);
    }
  }

  if (!onboardingUrl) {
    for (const candidate of candidates) {
      urls.add(candidate);
    }
    return Array.from(urls);
  }

  const onboardingPath = `${onboardingUrl.pathname}${onboardingUrl.search}`;
  for (const candidate of candidates) {
    try {
      const base = new URL(candidate);
      urls.add(`${base.origin}${onboardingPath}`);
    } catch {
      urls.add(candidate);
    }
  }

  return Array.from(urls);
}

function buildResolutionTestUrl(input: AgentSnippetInput): string | null {
  const explicit = input.testResolutionUrl?.trim();
  if (explicit) return explicit;

  try {
    const onboardingUrl = new URL(input.onboardingTextUrl);
    const testPath = onboardingUrl.pathname.replace(
      /\/onboarding\.txt$/,
      "/test-resolution"
    );
    return `${onboardingUrl.origin}${testPath}`;
  } catch {
    return null;
  }
}
