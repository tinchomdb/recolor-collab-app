import express from "express";
import cors from "cors";
import { TicketRepository } from "./repositories/ticketRepository";
import { TicketService } from "./services/ticketService";
import { PhotoService } from "./services/photoService";
import { DashboardService } from "./services/dashboardService";
import { ticketRoutes } from "./routes/ticketRoutes";
import { photoRoutes } from "./routes/photoRoutes";
import { viewRoutes } from "./routes/viewRoutes";
import { SEEDED_TICKETS } from "./data/workflowData";
import { config } from "./config";
import { Role } from "@shared/constants";

export function createApp() {
  const app = express();

  // ── Dependency wiring ───────────────────────────────────────────────
  const repo = new TicketRepository();
  const ticketService = new TicketService(repo);
  const photoService = new PhotoService(config.uploadsPath);
  const dashboardService = new DashboardService(repo);

  // Seed demo tickets with deterministic timestamps.
  ticketService.seedTickets(SEEDED_TICKETS, Role.Operator);

  // ── Middleware ──────────────────────────────────────────────────────
  app.use(cors());
  app.use("/api/tickets/:id/photos", express.json({ limit: "15mb" }));
  app.use(express.json());
  app.use("/api/assets", express.static(config.assetsPath));

  // ── Routes ─────────────────────────────────────────────────────────
  app.use("/api/tickets", ticketRoutes(ticketService));
  app.use("/api/tickets", photoRoutes(ticketService, photoService));
  app.use(viewRoutes(ticketService, dashboardService));

  return app;
}
