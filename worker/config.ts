import inquirer from "inquirer";
import { ensure } from "@shared/ensure.ts";

export const configure = () => {
  // const key = process.env.FLY_MACHINE_ID || undefined;
  // //const url = process.env.VITE_CONVEX_URL || undefined;
  // const answers = await inquirer.prompt(
  //   [
  //     {
  //       type: "input",
  //       name: "convexUrl",
  //       message: ".convex.cloud URL?",
  //     },
  //     {
  //       type: "input",
  //       name: "apiKey",
  //       message: "Worker API key?",
  //     },
  //   ],
  //   { apiKey: key, convexUrl: url },
  // );
  // const { apiKey, convexUrl } = answers;
  // console.log(apiKey, convexUrl);
  // if (!key) {
  //   appendFile(".env", `\nWORKER_API_KEY=${apiKey}\n`, (err) => {
  //     if (err) throw err;
  //     console.log("Saved WORKER_API_KEY to .env");
  //   });
  // }
  // if (!url) {
  //   appendFile(".env", `\nVITE_CONVEX_URL=${convexUrl}\n`, (err) => {
  //     if (err) throw err;
  //     console.log("Saved VITE_CONVEX_URL to .env");
  //   });
  // }
  // if (!apiKey || !convexUrl) {
  //   throw new Error("Missing environment variables WORKER_API_KEY or CONVEX_URL");
  // }

  return {
    machineId: ensure(process.env.FLY_MACHINE_ID, `Missing FLY_MACHINE_ID`),
  };
};
