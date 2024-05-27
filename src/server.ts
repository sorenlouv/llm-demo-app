import express from "express";
import { chat } from "./chat";
import { logger } from "./logger";

export function startServer() {
  const app = express();
  app.use(express.json());
  app.post("/chat", async (req, res) => {
    try {
      const messages = await chat(req.body.prompt);
      res.json(messages);
    } catch (e) {
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}
