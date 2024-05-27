import "dotenv/config";
import "elastic-apm-node/start.js";
import { startServer } from "./server";

startServer();
