import express from "express";
import { chat } from "./chat";
import { logger } from "./logger";

export function startServer() {
  const app = express();
  app.use(express.json());
  app.post("/chat", async (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    try {
      const stream = await chat(req.body.prompt);
      for await (const chunk of stream) {
        const msg = chunk.choices[0]?.delta?.content || "";
        res.write(`${msg}\n`);
      }
      res.end();
    } catch (e) {
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}
