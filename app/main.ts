import { createInterface } from "readline";
import { existsSync } from "fs";

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

      if (builtins.includes(args[0] as BuiltinCommand)) {
        console.log(`${args[0]} is a shell builtin`);
      } else {
        for (const p of paths) {
          const filePath = `${p}/${args[0]}`;
          if (existsSync(filePath)) {
            rl.write(`${args[0]} is ${filePath}\n`);
            return;
          }
        }

        console.log(`${args[0]}: not found`);
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
