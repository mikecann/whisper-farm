import express from "express";

export const startHealthCheckServer = () => {
  const app = express();

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  return app.listen(3000, () => {
    console.log("Health check server running on port 3000");
  });
};
