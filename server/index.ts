import { createPulseServer } from "./app.js";
const size = Number(process.env.PULSE_SIZE || 5000);
if (![0, 5000, 100000].includes(size))
  throw new Error("PULSE_SIZE must be 0, 5000 or 100000");
const app = createPulseServer(size);
app.server.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
  console.log("Pulse simulation: http://127.0.0.1:3001"),
);
process.on("SIGINT", () => app.close());
process.on("SIGTERM", () => app.close());
