import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminStorage } from "./admin-api";
import { insertUserSchema, insertHazardReportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Hazard report routes
  app.post("/api/hazard-reports", async (req, res) => {
    try {
      const reportData = insertHazardReportSchema.parse(req.body);
      const userId = req.body.userId; // In a real app, this would come from auth session
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const report = await storage.createHazardReport({ ...reportData, userId });
      res.json({ report });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/hazard-reports", async (req, res) => {
    try {
      const reports = await storage.getHazardReports();
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/hazard-reports/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const reports = await storage.getHazardReportsByUser(userId);
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin API routes
  app.get("/api/admin/reports", async (req, res) => {
    try {
      // Get regular reports and convert to admin format
      const regularReports = await storage.getHazardReports();
      const adminReports = await adminStorage.getAllReports();
      
      // Convert any new regular reports to admin format
      for (const report of regularReports) {
        const existsInAdmin = adminReports.find(ar => ar.id === report.id);
        if (!existsInAdmin) {
          await adminStorage.convertToAdminReport(report);
        }
      }
      
      const allAdminReports = await adminStorage.getAllReports();
      res.json({ reports: allAdminReports });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;
      
      const updatedReport = await adminStorage.updateReportStatus(id, status, assignedTo);
      
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json({ report: updatedReport });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/reports/:id/priority", async (req, res) => {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      
      const updatedReport = await adminStorage.updateReportPriority(id, priority);
      
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json({ report: updatedReport });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/reports/:id/notes", async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const updatedReport = await adminStorage.addReportNotes(id, notes);
      
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json({ report: updatedReport });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/team", async (req, res) => {
    try {
      const users = await adminStorage.getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/team/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { isOnline, location } = req.body;
      
      const updatedUser = await adminStorage.updateUserStatus(id, isOnline, location);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/team", async (req, res) => {
    try {
      const userData = req.body;
      const newUser = await adminStorage.createUser(userData);
      res.json({ user: newUser });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/statistics", async (req, res) => {
    try {
      const stats = await adminStorage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
