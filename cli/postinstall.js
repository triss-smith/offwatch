import { loadCLIBinPath } from "./lib/downloader.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Skip download in monorepo development (workspace packages are used directly)
if (!process.cwd().includes("node_modules")) {
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
