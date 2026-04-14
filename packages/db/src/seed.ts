import { createDb } from "./client.js";
import { workspaces, agents, goals, projects, issues } from "./schema/index.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const db = createDb(url);

console.log("Seeding database...");

const [workspace] = await db
  .insert(workspaces)
  .values({
    name: "Paperclip Demo Co",
    status: "active",
  })
  .returning();

const [ceo] = await db
  .insert(agents)
  .values({
    workspaceId: workspace!.id,
    name: "CEO Agent",
    role: "ceo",
    title: "Chief Executive Officer",
    status: "idle",
    adapterType: "process",
    adapterConfig: { command: "echo", args: ["hello from ceo"] },
  })
  .returning();

const [engineer] = await db
  .insert(agents)
  .values({
    workspaceId: workspace!.id,
    name: "Engineer Agent",
    role: "engineer",
    title: "Software Engineer",
    status: "idle",
    adapterType: "process",
    adapterConfig: { command: "echo", args: ["hello from engineer"] },
  })
  .returning();

const [goal] = await db
  .insert(goals)
  .values({
    workspaceId: workspace!.id,
    title: "Ship V1",
    description: "Deliver first control plane release",
    level: "company",
    status: "active",
    ownerAgentId: ceo!.id,
  })
  .returning();

const [project] = await db
  .insert(projects)
  .values({
    workspaceId: workspace!.id,
    goalId: goal!.id,
    name: "Control Plane MVP",
    description: "Implement core board + agent loop",
    status: "in_progress",
    leadAgentId: ceo!.id,
  })
  .returning();

await db.insert(issues).values([
  {
    workspaceId: workspace!.id,
    projectId: project!.id,
    goalId: goal!.id,
    title: "Implement atomic task checkout",
    description: "Ensure in_progress claiming is conflict-safe",
    status: "todo",
    priority: "high",
    assigneeAgentId: engineer!.id,
    createdByAgentId: ceo!.id,
  },
  {
    workspaceId: workspace!.id,
    projectId: project!.id,
    goalId: goal!.id,
    title: "Add budget auto-pause",
    description: "Pause agent at hard budget ceiling",
    status: "backlog",
    priority: "medium",
    createdByAgentId: ceo!.id,
  },
]);

console.log("Seed complete");
process.exit(0);
