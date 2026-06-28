"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon issue with Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface NearbyFeature {
  id: string;
  name: string;
  distance_m: number;
  latitude: number;
  longitude: number;
  properties: Record<string, any>;
}

interface MapProps {
  lastSeen?: { lat: number; lng: number };
  cctv?: NearbyFeature[];
  police?: NearbyFeature;
  chokepoints?: NearbyFeature[];
  searchRadius?: number;
}

export default function Map({ lastSeen, cctv = [], police, chokepoints = [], searchRadius }: MapProps) {
  // Default to Nashik Kumbh area
  const defaultCenter = { lat: 19.9975, lng: 73.7898 };
  const center = lastSeen ? { lat: lastSeen.lat, lng: lastSeen.lng } : defaultCenter;

  const cctvIcon = L.icon({
    ...defaultIcon.options,
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  });

  const policeIcon = L.icon({
    ...defaultIcon.options,
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  });

  const chokepointIcon = L.icon({
    ...defaultIcon.options,
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  });

  const [cctvGeoData, setCctvGeoData] = useState<any>(null);
  const [policeGeoData, setPoliceGeoData] = useState<any>(null);
  const [chokepointGeoData, setChokepointGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/cctv_dataset.json').then(r => r.json()).then(setCctvGeoData).catch(console.error);
    fetch('/data/police_stations.json').then(r => r.json()).then(setPoliceGeoData).catch(console.error);
    fetch('/data/nashik_kumbh_chokepoints_parking_map.json').then(r => r.json()).then(setChokepointGeoData).catch(console.error);
  }, []);

  const renderGeoJsonFeatures = (geoData: any, icon: L.Icon, labelPrefix: string) => {
    if (!geoData || !geoData.features) return null;
    return geoData.features.map((feature: any, idx: number) => {
      if (feature.geometry && feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        const name = feature.properties?.name || 'Unknown';
        return (
          <Marker key={`bg-${labelPrefix}-${idx}`} position={[lat, lng]} icon={icon} opacity={0.4}>
            <Popup>
              <div className="font-semibold">{labelPrefix} (Database): {name}</div>
            </Popup>
          </Marker>
        );
      }
      return null;
    });
  };

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-border shadow-sm z-0 relative">
      <MapContainer center={center} zoom={14} className="h-[500px] w-full" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Global Dataset Background Markers */}
        {renderGeoJsonFeatures(cctvGeoData, cctvIcon, "CCTV")}
        {renderGeoJsonFeatures(policeGeoData, policeIcon, "Police Station")}
        {renderGeoJsonFeatures(chokepointGeoData, chokepointIcon, "Chokepoint")}

        {/* Last Seen Location */}
        {lastSeen && (
          <>
            <Marker position={[lastSeen.lat, lastSeen.lng]}>
              <Popup>
                <div className="font-semibold text-lg">Last Seen Location</div>
              </Popup>
            </Marker>
            {searchRadius && (
              <Circle
                center={[lastSeen.lat, lastSeen.lng]}
                radius={searchRadius}
                pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* CCTV Locations */}
        {cctv.map((camera) => (
          <Marker key={camera.id} position={[camera.latitude, camera.longitude]} icon={cctvIcon}>
            <Popup>
              <div className="font-semibold">CCTV: {camera.name}</div>
              <div className="text-sm">Distance: {camera.distance_m}m</div>
            </Popup>
          </Marker>
        ))}

        {/* Chokepoint Locations */}
        {chokepoints.map((cp) => (
          <Marker key={cp.id} position={[cp.latitude, cp.longitude]} icon={chokepointIcon}>
            <Popup>
              <div className="font-semibold">Chokepoint: {cp.name}</div>
              <div className="text-sm">Risk Level: {cp.properties?.risk_level}</div>
              <div className="text-sm">Distance: {cp.distance_m}m</div>
            </Popup>
          </Marker>
        ))}

        {/* Nearest Police */}
        {police && (
          <Marker position={[police.latitude, police.longitude]} icon={policeIcon}>
            <Popup>
              <div className="font-semibold">Police: {police.name}</div>
              <div className="text-sm text-red-600 font-bold">ALERT THIS STATION</div>
              <div className="text-sm">Distance: {police.distance_m}m</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
