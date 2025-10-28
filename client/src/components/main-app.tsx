import { useState, useEffect } from "react";
import { Bell, MapPin, LogOut, FileText, ChevronDown, Map } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FeedTab } from "./feed-tab";
import { ReportTab } from "./report-tab";
import { DashboardTab } from "./dashboard-tab";
import { MapTab } from "./map-tab";
import { BottomNavigation } from "./bottom-navigation";
import { MarineChatbot } from "./marine-chatbot";

interface MainAppProps {
  user: { id: string; username: string; email: string };
  onLogout: () => void;
}

export function MainApp({ user, onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState("feed");
  const [showMyReports, setShowMyReports] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Getting location...");
  const { latitude, longitude, error: locationError, loading: locationLoading, refetch: refetchLocation } = useGeolocation();

  // Get location name from coordinates
  useEffect(() => {
    if (latitude && longitude) {
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
        .then(response => response.json())
        .then(data => {
          const city = data.city || data.locality || 'Unknown';
          const country = data.countryCode || '';
          setCurrentLocation(`${city}, ${country}`);
        })
        .catch(() => {
          setCurrentLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        });
    } else if (locationError) {
      setCurrentLocation("Location unavailable");
    } else if (locationLoading) {
      setCurrentLocation("Getting location...");
    }
  }, [latitude, longitude, locationError, locationLoading]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "feed":
        return <FeedTab user={user} showMyReports={showMyReports} />;
      case "report":
        return <ReportTab user={user} />;
      case "dashboard":
        return <DashboardTab />;
      case "map":
        return <MapTab />;
      default:
        return <FeedTab user={user} showMyReports={showMyReports} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-50 glass-effect">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <svg className="text-primary w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-foreground">OceanSync</h1>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                <span data-testid="text-location">{currentLocation}</span>
                {locationError && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refetchLocation}
                    className="ml-1 h-4 text-xs p-1"
                    data-testid="button-retry-location"
                  >
                    📍
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                    <span className="text-primary text-xs font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate max-w-24">{user.username}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-2 border-b">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={() => setShowMyReports(!showMyReports)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {showMyReports ? 'Show All Reports' : 'Show My Reports'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={refetchLocation}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Refresh Location
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Location Permission Alert */}
      {locationError && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mx-4 mt-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-4 w-4 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                Location access is needed for reporting. Please allow location access and try again.
              </p>
              <Button 
                variant="link" 
                size="sm"
                onClick={refetchLocation}
                className="text-orange-600 p-0 h-auto text-sm"
                data-testid="button-enable-location"
              >
                Enable Location Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="pb-20">
        {renderActiveTab()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Marine Chatbot */}
      <MarineChatbot />
    </div>
  );
}