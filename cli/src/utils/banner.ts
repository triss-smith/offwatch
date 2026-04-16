import pc from "picocolors";

const OFFWATCH_ART = [
  `  ______    _______  ___________    __    ____  ___   .___________.  ______  __    __  `,
  ` /  __  \  |   ____||   ____\   \  /  \  /   / /   \  |           | /      ||  |  |  | `,
  `|  |  |  | |  |__   |  |__   \   \/    \/   / /  ^  \ \`---|  |----\`|  ,----'|  |__|  | `,
  `|  |  |  | |   __|  |   __|   \            / /  /_\  \    |  |     |  |     |   __   | `,
  `|  \`--'  | |  |     |  |       \    /\    / /  _____  \   |  |     |  \`----.|  |  |  | `,
  ` \______/  |__|     |__|        \__/  \__/ /__/     \__\  |__|      \______||__|  |__| `,
] as const;

const TAGLINE = "Orchestrate AI agent teams to automate your dev work";

export function printOffwatchCliBanner(): void {
  const lines = [
    "",
    ...OFFWATCH_ART.map((line) => pc.cyan(line)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
