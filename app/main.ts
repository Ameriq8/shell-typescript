import { createInterface } from "readline";
import { existsSync, statSync } from "fs";
import path from "path";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("$ ");
rl.prompt();

type BuiltinCommand = "exit" | "echo" | "type";

// Runtime array for lookup
const builtins: BuiltinCommand[] = ["exit", "echo", "type"];
const paths = process.env["PATH"]?.split(":") || [];

rl.on("line", (input) => {
  const [command, ...args] = input.trim().split(" ") as [
    BuiltinCommand,
    ...string[]
  ];

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
      if (builtins.includes(target as BuiltinCommand)) {
        console.log(`${target} is a shell builtin`);
        break;
      }

      // 2️⃣ Search in PATH
      let found = false;
      for (const dir of paths) {
        const filePath = path.join(dir, target);
        try {
          if (existsSync(filePath)) {
            const stats = statSync(filePath);
            // Check if executable (Unix-style)
            if ((stats.mode & 0o111) !== 0) {
              console.log(`${target} is ${filePath}`);
              found = true;
              break;
            }
          }
        } catch {
          continue; // ignore invalid dirs
        }
      }

      // 3️⃣ If not found
      if (!found) {
        console.log(`${target}: not found`);
      }

      break;

    default:
      console.log(`${command}: command not found`);
  }
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
