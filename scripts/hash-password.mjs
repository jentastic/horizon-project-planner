import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const pw = await rl.question("Password to hash: ");
rl.close();
if (!pw) { console.error("No password given."); process.exit(1); }
console.log("\nAPP_PASSWORD_HASH=" + bcrypt.hashSync(pw, 12));
