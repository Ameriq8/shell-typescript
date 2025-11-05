import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("$ ");
rl.prompt();

rl.on("line", (input) => {
  const command = input.trim().split(" ")[0];
  const args = input.trim().split(" ").slice(1);

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
    default:
      console.log(`${command}: command not found`);
  }
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
