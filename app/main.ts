import { createInterface } from "readline";
import { existsSync, statSync } from "fs";
import path from "path";
import { execSync } from "child_process";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("$ ");
rl.prompt();

// Runtime array for lookup
const builtins = new Set(["exit", "echo", "type"]);
const paths = process.env["PATH"]?.split(":") || [];

function searchInPath(command: string): string | null {
  for (const dir of paths) {
    const filePath = path.join(dir, command);
    try {
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        // Check if executable (Unix-style)
        if ((stats.mode & 0o111) !== 0) {
          return filePath;
        }
      }
    } catch {
      continue; // ignore invalid dirs
    }
  }
  return null;
}

rl.on("line", (input) => {
  const [command, ...args] = input.trim().split(" ");

  switch (command) {
    case "exit":
      const code = args.length > 0 ? parseInt(args[0], 10) : 0;
      process.exit(code);

    case "echo":
      if (args.length > 0) {
        console.log(args.join(" "));
      } else {
        console.log();
      }
      break;

    case "type":
      if (args.length === 0) {
        console.log("type: missing operand");
      }

      const target = args[0];

      // 1️⃣ Check if builtin
      if (builtins.has(target)) {
        console.log(`${target} is a shell builtin`);
        break;
      }

      // 2️⃣ Search in PATH
      const foundPath = searchInPath(target);
      if (foundPath) {
        console.log(`${target} is ${foundPath}`);
      } else {
        console.log(`${target}: not found`);
      }

      break;

    default:
      const found = searchInPath(command);
      if (found) {
        execSync(`${found} ${args.join(" ")}`, { stdio: "inherit" });
      } else {
        console.log(`${command}: command not found`);
      }
  }
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
