import * as path from "node:path";
import Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true });
  const testsRoot = path.resolve(__dirname, "..");
  const files = await glob("**/*.test.js", { cwd: testsRoot });

  for (const file of files) {
    const filePath = path.resolve(testsRoot, file);
    mocha.addFile(filePath);
  }

  await new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        const error = new Error(`${failures} tests failed.`);
        reject(error);
        return;
      }

      resolve();
    });
  });
}
