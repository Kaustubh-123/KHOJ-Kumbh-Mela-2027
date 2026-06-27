"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-muted/20 border rounded-md">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const API = "http://localhost:8000";

const ZONE_COORDS: Record<string, [number, number]> = {
  "Zone A - Ramkund & Ghats":       [20.003, 73.792],
  "Zone B - Panchvati & Temple":    [20.005, 73.795],
  "Zone C - Tapovan Area":          [19.965, 73.804],
  "Zone D - Nashik Road & Transit": [19.940, 73.815],
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [mapCoords, setMapCoords] = useState({ lat: 19.9975, lng: 73.7898 });

  // Live stats — polled every 5 s
  const [liveStats, setLiveStats] = useState<{
    active_cases: number;
    total_cases: number;
    found_cases: number;
    closed_cases: number;
    cctv_count: number;
    chokepoint_count: number;
    police_count: number;
  } | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/stats/`);
        if (res.ok) setLiveStats(await res.json());
      } catch {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const name     = fd.get("name") as string;
    const age      = parseInt(fd.get("age") as string) || 30;
    const gender   = (fd.get("gender") as string) === "child" ? "other" : (fd.get("gender") as string);
    const clothing = fd.get("clothing") as string;
    const zone     = fd.get("zone") as string;
    const [lat, lon] = ZONE_COORDS[zone] ?? [19.9975, 73.7898];

    setMapCoords({ lat, lng: lon });

    try {
      const res = await fetch(`${API}/api/cases/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: { name, age, gender, clothing_description: clothing },
          last_seen: {
            latitude: lat, longitude: lon,
            landmark: zone,
            time: new Date().toTimeString().slice(0, 5),
            minutes_since: 30,
          },
          contact: { name: "Admin Reporter", phone: "9999999999", relation: "Officer" },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReportResult(await res.json());
    } catch {
      setReportResult({
        case_id: "KHOJ-OFFLINE",
        status: "active",
        recommendation: {
          priority_level: "pending",
          confidence: "Backend offline",
          search_radius_m: 1000,
          ai_summary: `Report for ${name} recorded offline. Backend not reachable at ${API}.`,
          current_zone: { name: zone },
          nearest_police: { id: "PS-000", name: "Backend offline", distance_m: 0, latitude: lat, longitude: lon, properties: {} },
          nearby_cctv: [],
          nearby_chokepoints: [],
          priority_zones: [],
        },
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-6 md:px-12 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">KHOJ AI KIOSK</h1>
            <p className="text-primary-foreground/80 text-sm">Kumbh Mela 2027 Missing Person Triage</p>
          </div>
          <div className="flex items-center gap-3">
            {liveStats ? (
              <>
                <Badge variant="outline" className="bg-white/10 border-white/20">
                  Active: {liveStats.active_cases}
                </Badge>
                <Badge variant="outline" className="bg-white/10 border-white/20">
                  Total: {liveStats.total_cases}
                </Badge>
                <Badge variant="outline" className="bg-green-500/20 border-green-400/30 text-green-200">
                  ● Live
                </Badge>
              </>
            ) : (
              <Badge variant="outline" className="bg-white/10 border-white/20">
                <Loader2 className="h-3 w-3 animate-spin mr-1" /> Connecting…
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Form & Result */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-border/50">
              <CardTitle>Report Missing Person</CardTitle>
              <CardDescription>Enter details to generate an immediate search recommendation.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="E.g. Ramesh Kumar" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="E.g. 68" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clothing">Clothing & Appearance</Label>
                  <Input id="clothing" name="clothing" placeholder="E.g. Blue kurta, white pyjama" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Last Known Location (Zone)</Label>
                  <Select name="zone" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zone A - Ramkund & Ghats">Zone A - Ramkund & Ghats</SelectItem>
                      <SelectItem value="Zone B - Panchvati & Temple">Zone B - Panchvati & Temple</SelectItem>
                      <SelectItem value="Zone C - Tapovan Area">Zone C - Tapovan Area</SelectItem>
                      <SelectItem value="Zone D - Nashik Road & Transit">Zone D - Nashik Road & Transit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 pt-4 border-t border-border/50">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Geography…
                    </>
                  ) : (
                    "Generate Search Recommendation"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Result Card */}
          {reportResult && (
            <Card className="border-red-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-red-600 h-2 w-full"></div>
              <CardHeader className="bg-red-50/50 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-red-700">Priority Search Generated</CardTitle>
                    <CardDescription className="text-red-600/80 mt-1 font-mono text-xs">
                      CASE ID: {reportResult.case_id}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive" className="uppercase font-bold tracking-wider">
                    {reportResult.recommendation.priority_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm leading-relaxed whitespace-pre-wrap">
                {reportResult.recommendation.ai_summary}
              </CardContent>
              <CardFooter className="bg-slate-50 border-t flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  Print Report
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  Dispatch Teams
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card className="border-border shadow-sm h-[600px] flex flex-col">
            <CardHeader className="py-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Live Geographic Triage</CardTitle>
                <CardDescription>Real-time Kumbh Mela 2027 CCTV & Chokepoint Data</CardDescription>
              </div>
              {reportResult && (
                <div className="text-right text-sm">
                  <span className="font-semibold text-slate-700">Search Radius:</span>{" "}
                  <Badge variant="secondary">{reportResult.recommendation.search_radius_m}m</Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 relative z-0">
              <Map
                lastSeen={reportResult ? mapCoords : { lat: 19.9975, lng: 73.7898 }}
                searchRadius={reportResult?.recommendation.search_radius_m}
                cctv={reportResult?.recommendation.nearby_cctv}
                police={reportResult?.recommendation.nearest_police}
                chokepoints={reportResult?.recommendation.nearby_chokepoints}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 mt-2">
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {liveStats ? liveStats.cctv_count : <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
                </div>
                <div className="text-xs text-blue-600/80 font-semibold uppercase">Active CCTVs</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50/50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {liveStats ? liveStats.chokepoint_count : <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
                </div>
                <div className="text-xs text-orange-600/80 font-semibold uppercase">Chokepoints</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {liveStats ? liveStats.police_count : <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
                </div>
                <div className="text-xs text-red-600/80 font-semibold uppercase">Police Stations</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
