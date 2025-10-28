
import { useState, useEffect } from "react";
import { Users, AlertTriangle, Clock, CheckCircle, MapPin, Filter, Search, Plus, UserPlus, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hazardReportApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AdminAuthScreen } from "./admin-auth-screen";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'field_officer';
  isOnline: boolean;
  location?: { lat: number; lng: number };
  pin?: string;
}

interface ReportWithStatus {
  id: string;
  userId: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'incoming' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  imageUrl?: string;
}

export function AdminPortal() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportWithStatus | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock admin users data
  const [adminUsers] = useState<AdminUser[]>([
    { id: 'admin-1', name: 'Sarah Johnson', email: 'sarah@authority.gov', role: 'admin', isOnline: true, location: { lat: 13.0827, lng: 80.2707 } },
    { id: 'admin-2', name: 'Mike Chen', email: 'mike@authority.gov', role: 'supervisor', isOnline: true, location: { lat: 13.0900, lng: 80.2800 } },
    { id: 'admin-3', name: 'Lisa Rodriguez', email: 'lisa@authority.gov', role: 'field_officer', isOnline: false, location: { lat: 13.0750, lng: 80.2650 } },
    { id: 'admin-4', name: 'David Park', email: 'david@authority.gov', role: 'field_officer', isOnline: true, location: { lat: 13.0950, lng: 80.2900 } },
  ]);

  // Fetch reports with admin enhancements
  const { data, isLoading } = useQuery({
    queryKey: ['/api/hazard-reports'],
    queryFn: hazardReportApi.getAll,
  });

  // Convert reports to admin format with status
  const [reportsWithStatus, setReportsWithStatus] = useState<ReportWithStatus[]>([]);

  useEffect(() => {
    if (data?.reports) {
      const adminReports = data.reports.map((report: any) => ({
        ...report,
        status: 'incoming' as const,
        priority: getPriorityFromDescription(report.description),
        assignedTo: undefined,
        notes: '',
      }));
      setReportsWithStatus(adminReports);
    }
  }, [data]);

  const getPriorityFromDescription = (description: string): ReportWithStatus['priority'] => {
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
  };

  const handleStatusChange = (reportId: string, newStatus: string) => {
    setReportsWithStatus(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus as ReportWithStatus['status'] }
          : report
      )
    );
    toast({ title: "Status updated", description: `Report status changed to ${newStatus}` });
  };

  const handlePriorityChange = (reportId: string, newPriority: string) => {
    setReportsWithStatus(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, priority: newPriority as ReportWithStatus['priority'] }
          : report
      )
    );
    toast({ title: "Priority updated", description: `Report priority changed to ${newPriority}` });
  };

  const handleAssignReport = (reportId: string, userId: string) => {
    const user = adminUsers.find(u => u.id === userId);
    setReportsWithStatus(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, assignedTo: userId, status: 'in_progress' as const }
          : report
      )
    );
    toast({ title: "Report assigned", description: `Report assigned to ${user?.name}` });
  };

  const handleAddNotes = (reportId: string, notes: string) => {
    setReportsWithStatus(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, notes }
          : report
      )
    );
    toast({ title: "Notes added", description: "Report notes have been updated" });
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    toast({ title: "Logged out", description: "You have been logged out of the authority portal" });
  };

  // Show authentication screen if not logged in
  if (!currentAdmin) {
    return <AdminAuthScreen onLogin={setCurrentAdmin} />;
  }

  // Filter reports
  const filteredReports = reportsWithStatus.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Statistics
  const stats = {
    total: reportsWithStatus.length,
    incoming: reportsWithStatus.filter(r => r.status === 'incoming').length,
    inProgress: reportsWithStatus.filter(r => r.status === 'in_progress').length,
    resolved: reportsWithStatus.filter(r => r.status === 'resolved').length,
    critical: reportsWithStatus.filter(r => r.priority === 'critical').length,
    onlineTeam: adminUsers.filter(u => u.isOnline).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marine Authority Portal</h1>
              <p className="text-sm text-gray-600">Ocean Hazard Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{stats.onlineTeam} Team Online</span>
              </Badge>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome, {currentAdmin.name}</span>
                <Badge variant="outline">{currentAdmin.role}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Incoming</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.incoming}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Online</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.onlineTeam}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportsWithStatus.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{report.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          report.priority === 'critical' ? 'destructive' :
                          report.priority === 'high' ? 'destructive' :
                          report.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {report.priority}
                        </Badge>
                        <Badge variant={
                          report.status === 'resolved' ? 'default' :
                          report.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={
                            report.priority === 'critical' ? 'destructive' :
                            report.priority === 'high' ? 'destructive' :
                            report.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {report.priority}
                          </Badge>
                          <Badge variant={
                            report.status === 'resolved' ? 'default' :
                            report.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {report.status.replace('_', ' ')}
                          </Badge>
                          {report.assignedTo && (
                            <Badge variant="outline">
                              Assigned to {adminUsers.find(u => u.id === report.assignedTo)?.name}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-900 mb-2">{report.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </span>
                        </div>

                        {report.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{report.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Manage Report</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Priority</Label>
                                <Select onValueChange={(value) => handlePriorityChange(report.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Assign to Team Member</Label>
                                <Select onValueChange={(value) => handleAssignReport(report.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {adminUsers.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        <div className="flex items-center space-x-2">
                                          <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                          <span>{user.name} ({user.role})</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Update Status</Label>
                                <Select onValueChange={(value) => handleStatusChange(report.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="incoming">Incoming</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Add Notes</Label>
                                <Textarea
                                  placeholder="Add investigation notes..."
                                  onBlur={(e) => handleAddNotes(report.id, e.target.value)}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Live Hazard Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-blue-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                  {/* Simulated map background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300">
                    <div className="absolute inset-0 opacity-20">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,20 Q25,10 50,20 T100,20 L100,80 Q75,90 50,80 T0,80 Z" fill="rgba(34,197,94,0.3)" />
                        <path d="M0,60 Q25,50 50,60 T100,60 L100,100 L0,100 Z" fill="rgba(34,197,94,0.5)" />
                      </svg>
                    </div>
                  </div>

                  {/* Report markers */}
                  {reportsWithStatus.map((report, index) => (
                    <div
                      key={report.id}
                      className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer ${
                        report.priority === 'critical' ? 'bg-red-600' :
                        report.priority === 'high' ? 'bg-orange-500' :
                        report.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{
                        left: `${20 + (index * 15) % 60}%`,
                        top: `${30 + (index * 20) % 40}%`,
                      }}
                      title={`${report.description} - ${report.priority} priority`}
                    >
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        report.priority === 'critical' ? 'bg-red-600' :
                        report.priority === 'high' ? 'bg-orange-500' :
                        report.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      {report.priority === 'critical' && (
                        <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                      )}
                    </div>
                  ))}

                  {/* Team member locations */}
                  {adminUsers.filter(u => u.isOnline && u.location).map((user, index) => (
                    <div
                      key={user.id}
                      className="absolute w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg"
                      style={{
                        left: `${30 + (index * 20)}%`,
                        top: `${60 + (index * 10) % 20}%`,
                      }}
                      title={`${user.name} - ${user.role}`}
                    >
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  ))}

                  {/* Map legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                    <h4 className="font-medium text-sm mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                        <span>Critical Reports</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>High Priority</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Medium Priority</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Low Priority</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
                        <span>Team Members</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Team Management</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input placeholder="Full name" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" placeholder="email@authority.gov" />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="field_officer">Field Officer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Add Member</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {adminUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{user.role}</Badge>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <span className="text-xs text-gray-500">
                                {user.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}