import { type User, type InsertUser, type HazardReport, type InsertHazardReport } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createHazardReport(report: InsertHazardReport & { userId: string }): Promise<HazardReport>;
  getHazardReports(): Promise<HazardReport[]>;
  getHazardReportsByUser(userId: string): Promise<HazardReport[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private hazardReports: Map<string, HazardReport>;

  constructor() {
    this.users = new Map();
    this.hazardReports = new Map();
    
    // Add some sample data for demonstration
    this.addSampleData();
  }

  private addSampleData() {
    // Add sample users
    const sampleUsers = [
      {
        id: 'user-1',
        username: 'MarineSafety',
        email: 'marine@safety.com',
        password: 'password',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: 'user-2', 
        username: 'CoastGuard',
        email: 'coast@guard.com',
        password: 'password',
        createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));

    // Add sample hazard reports
    const sampleReports = [
      {
        id: 'report-1',
        userId: 'user-1',
        description: 'Strong rip current observed near Marina Beach. Multiple swimmers have been rescued.',
        latitude: 13.0542,
        longitude: 80.2825,
        location: '13.0542, 80.2825',
        imageUrl: null,
        audioUrl: null,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: 'report-2',
        userId: 'user-2',
        description: 'Oil spill detected in Bay of Bengal near Ennore Port. Immediate cleanup required.',
        latitude: 13.2846,
        longitude: 80.3371,
        location: '13.2846, 80.3371',
        imageUrl: null,
        audioUrl: null,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        id: 'report-3',
        userId: 'user-1',
        description: 'Plastic debris and fishing nets washed up on Besant Nagar Beach.',
        latitude: 13.0067,
        longitude: 80.2669,
        location: '13.0067, 80.2669',
        imageUrl: null,
        audioUrl: null,
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
      }
    ];

    sampleReports.forEach(report => this.hazardReports.set(report.id, report));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createHazardReport(report: InsertHazardReport & { userId: string }): Promise<HazardReport> {
    const id = randomUUID();
    const hazardReport: HazardReport = {
      ...report,
      id,
      imageUrl: report.imageUrl || null,
      audioUrl: report.audioUrl || null,
      location: report.location || null,
      createdAt: new Date()
    };
    this.hazardReports.set(id, hazardReport);
    return hazardReport;
  }

  async getHazardReports(): Promise<HazardReport[]> {
    return Array.from(this.hazardReports.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getHazardReportsByUser(userId: string): Promise<HazardReport[]> {
    return Array.from(this.hazardReports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
}

export const storage = new MemStorage();
