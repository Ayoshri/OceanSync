
export interface AdminReport {
  id: string;
  userId: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'incoming' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'field_officer';
  isOnline: boolean;
  location?: { lat: number; lng: number };
  createdAt: Date;
  lastActiveAt: Date;
}

// In-memory storage for admin data (in production, use proper database)
let adminReports: AdminReport[] = [];
let adminUsers: AdminUser[] = [
  {
    id: 'admin-1',
    name: 'Sarah Johnson',
    email: 'sarah@authority.gov',
    role: 'admin',
    isOnline: true,
    location: { lat: 13.0827, lng: 80.2707 },
    createdAt: new Date(),
    lastActiveAt: new Date(),
  },
  {
    id: 'admin-2',
    name: 'Mike Chen',
    email: 'mike@authority.gov',
    role: 'supervisor',
    isOnline: true,
    location: { lat: 13.0900, lng: 80.2800 },
    createdAt: new Date(),
    lastActiveAt: new Date(),
  },
  {
    id: 'admin-3',
    name: 'Lisa Rodriguez',
    email: 'lisa@authority.gov',
    role: 'field_officer',
    isOnline: false,
    location: { lat: 13.0750, lng: 80.2650 },
    createdAt: new Date(),
    lastActiveAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'admin-4',
    name: 'David Park',
    email: 'david@authority.gov',
    role: 'field_officer',
    isOnline: true,
    location: { lat: 13.0950, lng: 80.2900 },
    createdAt: new Date(),
    lastActiveAt: new Date(),
  },
];

export const adminStorage = {
  // Report management
  async getAllReports(): Promise<AdminReport[]> {
    return adminReports;
  },

  async getReportById(id: string): Promise<AdminReport | null> {
    return adminReports.find(r => r.id === id) || null;
  },

  async updateReportStatus(id: string, status: AdminReport['status'], assignedTo?: string): Promise<AdminReport | null> {
    const reportIndex = adminReports.findIndex(r => r.id === id);
    if (reportIndex === -1) return null;

    adminReports[reportIndex] = {
      ...adminReports[reportIndex],
      status,
      assignedTo,
      updatedAt: new Date(),
    };

    return adminReports[reportIndex];
  },

  async updateReportPriority(id: string, priority: AdminReport['priority']): Promise<AdminReport | null> {
    const reportIndex = adminReports.findIndex(r => r.id === id);
    if (reportIndex === -1) return null;

    adminReports[reportIndex] = {
      ...adminReports[reportIndex],
      priority,
      updatedAt: new Date(),
    };

    return adminReports[reportIndex];
  },

  async addReportNotes(id: string, notes: string): Promise<AdminReport | null> {
    const reportIndex = adminReports.findIndex(r => r.id === id);
    if (reportIndex === -1) return null;

    adminReports[reportIndex] = {
      ...adminReports[reportIndex],
      notes,
      updatedAt: new Date(),
    };

    return adminReports[reportIndex];
  },

  // Team management
  async getAllUsers(): Promise<AdminUser[]> {
    return adminUsers;
  },

  async getUserById(id: string): Promise<AdminUser | null> {
    return adminUsers.find(u => u.id === id) || null;
  },

  async updateUserStatus(id: string, isOnline: boolean, location?: { lat: number; lng: number }): Promise<AdminUser | null> {
    const userIndex = adminUsers.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    adminUsers[userIndex] = {
      ...adminUsers[userIndex],
      isOnline,
      location: location || adminUsers[userIndex].location,
      lastActiveAt: new Date(),
    };

    return adminUsers[userIndex];
  },

  async createUser(userData: Omit<AdminUser, 'id' | 'createdAt' | 'lastActiveAt'>): Promise<AdminUser> {
    const newUser: AdminUser = {
      ...userData,
      id: `admin-${Date.now()}`,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    adminUsers.push(newUser);
    return newUser;
  },

  // Statistics
  async getStatistics() {
    const total = adminReports.length;
    const incoming = adminReports.filter(r => r.status === 'incoming').length;
    const inProgress = adminReports.filter(r => r.status === 'in_progress').length;
    const resolved = adminReports.filter(r => r.status === 'resolved').length;
    const critical = adminReports.filter(r => r.priority === 'critical').length;
    const onlineTeam = adminUsers.filter(u => u.isOnline).length;

    return {
      total,
      incoming,
      inProgress,
      resolved,
      critical,
      onlineTeam,
    };
  },

  // Convert regular reports to admin reports
  async convertToAdminReport(regularReport: any): Promise<AdminReport> {
    const priority = this.getPriorityFromDescription(regularReport.description);
    const status = 'incoming' as const;

    const adminReport: AdminReport = {
      ...regularReport,
      status,
      priority,
      updatedAt: new Date(),
      createdAt: new Date(regularReport.createdAt || Date.now()),
    };

    adminReports.push(adminReport);
    return adminReport;
  },

  getPriorityFromDescription(description: string): AdminReport['priority'] {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('emergency') || lowerDesc.includes('dangerous') || lowerDesc.includes('critical')) {
      return 'critical';
    }
    if (lowerDesc.includes('severe') || lowerDesc.includes('warning')) {
      return 'high';
    }
    if (lowerDesc.includes('moderate') || lowerDesc.includes('caution')) {
      return 'medium';
    }
    return 'low';
  },
};
