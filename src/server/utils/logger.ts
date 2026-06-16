import chalk from "chalk";

export const logSection = (title: string) => {
  console.log("\n" + chalk.bgBlue.white.bold(` █ ${title.toUpperCase()} `));
};

export const logStep = (message: string) => {
  console.log(chalk.cyan(" ➜ ") + chalk.white(message));
};

export const logSuccess = (message: string) => {
  console.log(chalk.green(" ✓ ") + chalk.greenBright(message));
};

export const logWarn = (message: string) => {
  console.log(chalk.yellow(" ⚠ ") + chalk.yellowBright(message));
};

export const logError = (message: string) => {
  console.log(chalk.red(" ✖ ") + chalk.redBright(message));
};

export const logData = (label: string, data: unknown) => {
  console.log(chalk.magenta(` ${label}: `), data);
};

export const logDivider = () => {
  console.log(chalk.gray("────────────────────────────────────────────"));
};
