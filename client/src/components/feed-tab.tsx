import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin, Eye, CheckCircle, Share } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hazardReportApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Mock data for initial display - these are community reports from other users
const mockReports = [
  {
    id: "1",
    userId: "other-user-1",
    author: "Maria Rodriguez",
    initials: "MR",
    description: "Strong rip current observed near Pier 39. Swimmers should avoid this area.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    latitude: 34.0194,
    longitude: -118.4912,
    timestamp: "2 hours ago",
    views: 23,
  },
  {
    id: "2",
    userId: "other-user-2",
    author: "Jake Chen",
    initials: "JC",
    description: "Large debris washed up on beach. Appears to be plastic containers and fishing nets.",
    imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    latitude: 34.0089,
    longitude: -118.4968,
    timestamp: "4 hours ago",
    views: 47,
    hasAudio: true,
  },
];

interface FeedTabProps {
  user?: { id: string; username: string; email: string };
  showMyReports?: boolean;
}

export function FeedTab({ user, showMyReports = false }: FeedTabProps = {}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [verifiedReports, setVerifiedReports] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/hazard-reports', refreshKey],
    queryFn: hazardReportApi.getAll,
    initialData: { reports: [] },
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const handleVerifyReport = (reportId: string) => {
    setVerifiedReports(prev => {
      const newSet = new Set(prev);
      const wasVerified = newSet.has(reportId);
      if (wasVerified) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      
      // Use setTimeout to avoid calling toast during render
      setTimeout(() => {
        if (wasVerified) {
          toast({ title: "Verification removed", description: "Report verification removed." });
        } else {
          toast({ title: "Report verified", description: "Thank you for verifying this report!" });
        }
      }, 0);
      
      return newSet;
    });
  };

  const handleShareReport = (reportId: string, description: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Ocean Hazard Report',
        text: description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`Ocean Hazard: ${description} - ${window.location.href}`);
      setTimeout(() => {
        toast({ title: "Link copied", description: "Report link copied to clipboard!" });
      }, 0);
    }
  };

  // Filter reports based on mode
  let reports = data?.reports?.length > 0 ? data.reports : mockReports;
  
  if (showMyReports && user) {
    // Only show reports created by the current user
    reports = reports.filter((report: any) => report.userId === user.id);
  } else if (!showMyReports) {
    // Show all reports from other users (community feed)
    reports = reports.filter((report: any) => !report.userId || report.userId !== user?.id);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {showMyReports ? 'My Reports' : 'Nearby Reports'}
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          data-testid="button-refresh"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alert Banner */}
      <div className="hazard-alert rounded-lg p-3 text-destructive-foreground">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-sm">High surf warning in effect</span>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report: any) => (
          <div key={report.id} className="bg-card border border-border rounded-lg p-4 shadow-sm" data-testid={`card-report-${report.id}`}>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-secondary text-sm font-medium">
                  {report.initials || report.author?.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm" data-testid={`text-author-${report.id}`}>
                    {report.author}
                  </span>
                  <span className="text-muted-foreground text-xs" data-testid={`text-timestamp-${report.id}`}>
                    {report.timestamp || (report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'Unknown')}
                  </span>
                </div>
                <p className="text-foreground mt-1 text-sm" data-testid={`text-description-${report.id}`}>
                  {report.description}
                </p>
                
                {/* Image */}
{(report.imageUrl || report.imageFile) && (
  <div className="mt-3 rounded-lg overflow-hidden">
    <img
      src={
        report.imageUrl 
          ? report.imageUrl 
          : URL.createObjectURL(report.imageFile)
      }
      alt="Hazard report"
      className="w-full h-32 object-cover"
      data-testid={`img-report-${report.id}`}
    />
  </div>
)}

                
                {/* Audio player */}
                {report.hasAudio && (
                  <div className="bg-accent/50 rounded-lg p-2 mt-3">
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.415A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.414 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 bg-muted rounded-full h-1">
                        <div className="bg-primary h-1 rounded-full w-1/3"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">0:15</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-muted-foreground text-xs">
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      <span data-testid={`text-coordinates-${report.id}`}>
                        {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                      </span>
                    </span>
                    <span className="flex items-center">
                      <Eye className="mr-1 h-3 w-3" />
                      {report.views || 0} views
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      data-testid={`button-verify-${report.id}`}
                      onClick={() => handleVerifyReport(report.id)}
                      className={verifiedReports.has(report.id) ? 'text-green-600' : ''}
                    >
                      <CheckCircle className={`h-4 w-4 ${verifiedReports.has(report.id) ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      data-testid={`button-share-${report.id}`}
                      onClick={() => handleShareReport(report.id, report.description)}
                    >
                      <Share className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && !isLoading && (
        <div className="text-center py-8">
          {showMyReports ? (
            <>
              <p className="text-muted-foreground">You haven't created any reports yet.</p>
              <p className="text-muted-foreground text-sm">Tap the Report tab to create your first hazard report!</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">No hazard reports in your area yet.</p>
              <p className="text-muted-foreground text-sm">Be the first to report an ocean hazard!</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}