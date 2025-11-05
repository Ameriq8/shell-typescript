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
const builtins = new Set(["exit", "echo", "type", "pwd", "cd"]);
const paths = process.env["PATH"]?.split(":") || [];

function parseCommand(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"' || char === "'") {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = "";
      } else {
        current += char; // different quote inside another quote
      }
    } else if (char === "\\" && i + 1 < input.length) {
      // Only interpret escape sequences if not inside single quotes
      if (!inQuotes || quoteChar === '"') {
        current += input[i + 1];
        i++;
      } else {
        current += "\\";
      }
    } else if (char === " " && !inQuotes) {
      if (current !== "") {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current !== "") args.push(current);
  return args;
}

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
  const parts = parseCommand(input.trim());
  if (parts.length === 0) {
    rl.prompt();
    return;
  }
  const command = parts[0];
  const args = parts.slice(1);

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

    case "pwd":
      console.log(process.cwd());
      break;

    case "cd":
      const dir = args.length > 0 ? args[0] : process.env.HOME || "/";
      try {
        // Here if the args[0] was "~", we should expand it to home directory
        if (dir === "~") {
          process.chdir(process.env.HOME || "/");
        } else {
          process.chdir(dir);
        }
      } catch (err) {
        console.log(`cd: ${dir}: No such file or directory`);
      }
      break;

    default:
      const found = searchInPath(command);
      if (found) {
        execSync(input, { stdio: "inherit" });
      } else {
        console.log(`${command}: command not found`);
      }
  }
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
