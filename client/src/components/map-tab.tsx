import { useQuery } from "@tanstack/react-query";
import { getHazardReports } from "@/lib/supabase";
import { useGeolocation } from "@/hooks/use-geolocation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { RefreshCw, Navigation } from "lucide-react";
import { useState, useEffect } from "react";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface HazardMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  severity: "low" | "medium" | "high";
  createdAt?: Date;
  imageUrl?: string;
  audioUrl?: string;
  distance?: number; // add for "near you"
}

// custom colored icons for hazard severity
const hazardIcon = (severity: "low" | "medium" | "high") =>
  L.icon({
    iconUrl:
      severity === "high"
        ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
        : severity === "medium"
        ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png"
        : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

// helper: haversine formula for distance (km)
function getDistanceFromLatLon(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function MapTab() {
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ["hazard-reports"],
    queryFn: getHazardReports,
    refetchInterval: 30000,
  });

  const { latitude: userLat, longitude: userLng, error: locationError } =
    useGeolocation();
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    13.0827,
    80.2707,
  ]);
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    if (userLat && userLng) {
      setMapCenter([userLat, userLng]);
      setZoom(12);
    }
  }, [userLat, userLng]);

  // severity detection
  function getSeverityFromDescription(description: string) {
    const lower = description?.toLowerCase() || "";
    if (
      lower.includes("danger") ||
      lower.includes("emergency") ||
      lower.includes("severe")
    )
      return "high";
    if (
      lower.includes("warning") ||
      lower.includes("caution") ||
      lower.includes("moderate")
    )
      return "medium";
    return "low";
  }

  // map points
  const mapPoints: HazardMapPoint[] = reports.map((report: any) => ({
    id: report.id,
    latitude: report.latitude,
    longitude: report.longitude,
    description: report.description,
    severity: getSeverityFromDescription(report.description),
    createdAt: report.created_at ? new Date(report.created_at) : undefined,
    imageUrl: report.image_url,
    audioUrl: report.audio_url,
  }));

  // severity color
  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-yellow-500";
    }
  };

  // counts
  const highCount = mapPoints.filter((p) => p.severity === "high").length || 0;
  const mediumCount =
    mapPoints.filter((p) => p.severity === "medium").length || 0;
  const lowCount = mapPoints.filter((p) => p.severity === "low").length || 0;

  // recent reports logic (sorted by distance if user location exists)
  const recentReports =
    userLat && userLng
      ? mapPoints
          .map((p) => ({
            ...p,
            distance: getDistanceFromLatLon(
              userLat,
              userLng,
              p.latitude,
              p.longitude
            ),
          }))
          .sort((a, b) => a.distance! - b.distance!)
          .slice(0, 5)
      : mapPoints.slice(0, 5);

  return (
    <div className="p-4 h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hazard Map</h2>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {userLat && userLng && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapCenter([userLat, userLng])}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Center
            </Button>
          )}
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="h-96 w-full rounded-lg z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        />

        {/* user location */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={hazardIcon("low")}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* hazard markers */}
        {mapPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={hazardIcon(point.severity)}
          >
            <Popup>
              <div>
                <strong>{point.description}</strong>
                <br />
                Severity: {point.severity}
                <br />
                {point.imageUrl && (
                  <img
                    src={point.imageUrl}
                    alt="Hazard"
                    className="w-32 h-20 object-cover mt-2 rounded"
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Location Error */}
      {locationError && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Location access needed:</strong> {locationError}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-red-600">{highCount}</div>
          <div className="text-xs text-muted-foreground">High Risk</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-orange-600">
            {mediumCount}
          </div>
          <div className="text-xs text-muted-foreground">Medium Risk</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-yellow-600">{lowCount}</div>
          <div className="text-xs text-muted-foreground">Low Risk</div>
        </div>
      </div>

      {/* Recent Reports List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium mb-3">Recent Reports Near You</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {recentReports.map((point) => (
            <div key={point.id} className="flex items-start space-x-3">
              <div
                className={`${getSeverityColor(
                  point.severity
                )} w-2 h-2 rounded-full mt-2 flex-shrink-0`}
              ></div>
              <div className="flex-1">
                <p className="text-sm">{point.description}</p>
                <p className="text-xs text-muted-foreground">
                  {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  {point.distance !== undefined &&
                    ` • ${point.distance.toFixed(1)} km away`}
                </p>
              </div>
            </div>
          ))}
          {mapPoints.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No reports in your area yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
