import { loadCLIBinPath } from "./lib/downloader.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Skip download in monorepo development
if (process.cwd().includes("node_modules")) {
  if (process.env.DEBUG) {
    console.debug(`[DEBUG] downloading CLI binary`);
  }
  loadCLIBinPath(__dirname).then(
    () => {
      process.exit(0);
    },
    (err) => {
      console.error(err);
      process.exit(1);
    }
  );
}
