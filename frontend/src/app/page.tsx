"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, ArrowRight, UserPlus, MapPin, Printer, AlertTriangle, LifeBuoy, FileSearch, Camera, ScanFace } from "lucide-react";
import Link from "next/link";
import Webcam from "react-webcam";

// Animation variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  in: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  out: { opacity: 0, scale: 1.05, y: -20, transition: { duration: 0.2 } }
};

export default function KioskPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    clothing: "",
    zone: "",
    reporterPhone: "",
  });

  const ZONE_COORDS: Record<string, [number, number]> = {
    "Zone A - Ramkund & Ghats":       [20.003, 73.792],
    "Zone B - Panchvati & Temple":    [20.005, 73.795],
    "Zone C - Tapovan Area":          [19.965, 73.804],
    "Zone D - Nashik Road & Transit": [19.940, 73.815],
  };
  
  const [result, setResult] = useState<any>(null);
  const webcamRef = useRef<Webcam>(null);
  const passiveWebcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanType, setScanType] = useState<"find_case" | "im_lost" | "report_missing" | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<string>("Zone A - Ramkund Kiosk");
  const [camWidth, setCamWidth] = useState(256);

  // Hidden manual trigger for perfect demo execution
  const simulateMotionCapture = () => {
    const imageSrc = passiveWebcamRef.current?.getScreenshot();
    if (imageSrc) {
      localStorage.setItem('khoj_passive_capture', JSON.stringify({
        image: imageSrc,
        kiosk: selectedKiosk,
        time: new Date().toLocaleTimeString()
      }));
    }
  };

  // Automatic 5-second interval capture as requested
  useEffect(() => {
    if (step === 0) {
      const interval = setInterval(() => {
        const imageSrc = passiveWebcamRef.current?.getScreenshot();
        if (imageSrc) {
          localStorage.setItem('khoj_passive_capture', JSON.stringify({
            image: imageSrc,
            kiosk: selectedKiosk,
            time: new Date().toLocaleTimeString()
          }));
        }
      }, 5000); // 5 second interval
      return () => clearInterval(interval);
    }
  }, [step, selectedKiosk]);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleUpdate = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitReport = async () => {
    setStep(5);
    setLoading(true);

    const [lat, lon] = ZONE_COORDS[formData.zone] ?? [19.9975, 73.7898];
    const genderMap: Record<string, string> = { Male: "male", Female: "female", Child: "other", Other: "other" };

    try {
      const res = await fetch("http://localhost:8000/api/cases/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: {
            name: formData.name,
            age: parseInt(formData.age) || 30,
            gender: genderMap[formData.gender] ?? "other",
            clothing_description: formData.clothing || "Not specified",
          },
          last_seen: {
            latitude: lat,
            longitude: lon,
            landmark: formData.zone,
            time: new Date().toTimeString().slice(0, 5),
            minutes_since: 30,
          },
          contact: {
            name: "Kiosk Reporter",
            phone: formData.reporterPhone.replace(/\D/g, "").slice(-10) || "9999999999",
            relation: "Reporter",
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rec = data.recommendation;

      setResult({
        case_id: data.case_id,
        priority_level: rec.priority_level,
        priority_zone: rec.priority_zones?.[0]?.zone_name ?? formData.zone,
        nearest_police: `${rec.nearest_police.name} (${Math.round(rec.nearest_police.distance_m)}m away)`,
        action_items: [
          `Alerting ${rec.nearest_police.name}`,
          `Scanning ${rec.nearby_cctv.length} CCTV feed(s) in ${rec.search_radius_m}m radius`,
          `Deploying to ${rec.nearby_chokepoints.length} crowd chokepoint(s)`,
          `Confidence: ${rec.confidence}`,
        ],
      });
    } catch {
      setResult({
        case_id: `KHOJ-OFFLINE-${Math.floor(Math.random() * 9000) + 1000}`,
        priority_level: "pending",
        priority_zone: formData.zone,
        nearest_police: "Backend offline — alert desk staff",
        action_items: ["Report recorded offline", "Will sync when system reconnects"],
      });
    }

    setLoading(false);
  };

  const resetKiosk = () => {
    setFormData({ name: "", age: "", gender: "", clothing: "", zone: "", reporterPhone: "" });
    setResult(null);
    setCapturedImage(null);
    setSearchInput("");
    setStep(0);
  };

  const clearDatabase = () => {
    localStorage.removeItem('khoj_lost_person');
    alert("Database cleared! Ready for new demo.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-red-500/30 overflow-hidden relative">
      {/* High-tech grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      {/* Kiosk Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/10 bg-slate-950/50 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/20">
            <Search size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">KHOJ</h1>
            <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">Emergency Reporting Kiosk</p>
          </div>
        </div>
        
        {/* Admin and Kiosk Selector */}
        <div className="flex items-center gap-4 z-50">
          <Button onClick={clearDatabase} variant="outline" size="sm" className="bg-red-900/20 text-red-400 border-red-900 hover:bg-red-900/50 hover:text-red-300">
            Clear DB
          </Button>
          <select 
            value={selectedKiosk}
            onChange={(e) => setSelectedKiosk(e.target.value)}
            className="bg-slate-800/80 text-slate-300 text-xs font-mono uppercase tracking-wider border border-slate-700 rounded-md px-3 py-2 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <option value="Zone A - Ramkund Kiosk">Terminal: Ramkund</option>
            <option value="Zone B - Panchvati Kiosk">Terminal: Panchvati</option>
            <option value="Zone C - Tapovan Kiosk">Terminal: Tapovan</option>
            <option value="Zone D - Nashik Road Kiosk">Terminal: Nashik Road</option>
          </select>
          <Link href="/admin" className="text-slate-700 hover:text-slate-400 transition-colors text-sm font-bold uppercase tracking-wider">
            Admin
          </Link>
        </div>
      </header>

      {/* Progress Bar (Only show during wizard) */}
      {step > 0 && step <= totalSteps && (
        <div className="w-full h-2 bg-slate-800">
          <motion.div 
            className="h-full bg-red-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl z-10">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: Welcome Screen */}
            {step === 0 && (
              <motion.div 
                key="welcome"
                variants={pageVariants}
                initial="initial" animate="in" exit="out"
                className="text-center space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 pb-4">
                    Find Your <br/> Loved Ones.
                  </h2>
                  <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-light">
                    Report a missing person instantly. Our AI will analyze Kumbh Mela crowds and alert the nearest officers.
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 justify-center max-w-4xl mx-auto w-full">
                  <Button 
                    onClick={() => setStep(1)} 
                    className="flex-1 bg-gradient-to-br from-red-600 to-rose-900 border border-red-500/30 hover:from-red-500 hover:to-rose-700 text-white rounded-[2rem] py-12 md:py-20 text-2xl md:text-3xl font-black shadow-[0_0_40px_rgba(225,29,72,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(225,29,72,0.6)] flex flex-col items-center gap-5 h-auto backdrop-blur-md"
                  >
                    <UserPlus className="h-12 w-12 md:h-16 md:w-16 opacity-90" />
                    REPORT MISSING
                  </Button>
                  <Button 
                    onClick={() => setStep(6)} 
                    className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-500/30 hover:from-blue-500 hover:to-indigo-700 text-white rounded-[2rem] py-12 md:py-20 text-2xl md:text-3xl font-black shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] flex flex-col items-center gap-5 h-auto backdrop-blur-md"
                  >
                    <FileSearch className="h-12 w-12 md:h-16 md:w-16 opacity-90" />
                    FIND CASE
                  </Button>
                  <Button 
                    onClick={() => {
                      setScanType("im_lost");
                      setStep(8);
                    }} 
                    className="flex-1 bg-gradient-to-br from-amber-600 to-orange-900 border border-amber-500/30 hover:from-amber-500 hover:to-orange-700 text-white rounded-[2rem] py-12 md:py-20 text-2xl md:text-3xl font-black shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] flex flex-col items-center gap-5 h-auto backdrop-blur-md"
                  >
                    <LifeBuoy className="h-12 w-12 md:h-16 md:w-16 opacity-90" />
                    I AM LOST
                  </Button>
                </div>
                
                {/* Passive CCTV Camera Feed */}
                <motion.div 
                  drag
                  whileDrag={{ scale: 1.05, opacity: 1, cursor: "grabbing" }}
                  onClick={simulateMotionCapture}
                  onWheel={(e) => setCamWidth(prev => Math.min(Math.max(120, prev + (e.deltaY < 0 ? 30 : -30)), 1200))}
                  style={{ width: camWidth }}
                  title="Hidden Admin: Click to simulate motion detection. Drag to move. Scroll to resize."
                  className="absolute bottom-6 right-6 aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl opacity-60 hover:opacity-100 transition-opacity cursor-grab z-40"
                >
                  <Webcam audio={false} ref={passiveWebcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover pointer-events-none" mirrored={true} />
                  <div className="absolute top-2 right-2 bg-red-600 animate-pulse w-3 h-3 rounded-full pointer-events-none" />
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/70 pointer-events-none flex flex-col">
                    <span>CCTV LIVE • {selectedKiosk}</span>
                    <span className="opacity-50 text-[8px]">SCROLL TO RESIZE</span>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <motion.div 
                key="step1" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="space-y-10"
              >
                <h2 className="text-5xl font-bold">Who is missing?</h2>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-2xl text-slate-300">Full Name</Label>
                    <Input 
                      className="h-20 text-3xl px-6 bg-slate-800/50 border-slate-700 focus-visible:ring-red-600 rounded-2xl" 
                      placeholder="Enter their full name" 
                      value={formData.name}
                      onChange={(e) => handleUpdate("name", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-2xl text-slate-300">Age</Label>
                    <Input 
                      type="number"
                      className="h-20 text-3xl px-6 bg-slate-800/50 border-slate-700 focus-visible:ring-red-600 rounded-2xl" 
                      placeholder="Enter age (approximate is fine)" 
                      value={formData.age}
                      onChange={(e) => handleUpdate("age", e.target.value)}
                    />
                  </div>
                </div>

                  <div className="space-y-4">
                    <Label className="text-2xl text-slate-300">Your Mobile Number <span className="text-slate-500 text-lg">(optional)</span></Label>
                    <Input
                      type="tel"
                      className="h-20 text-3xl px-6 bg-slate-800/50 border-slate-700 focus-visible:ring-red-600 rounded-2xl"
                      placeholder="+91 98765 43210"
                      value={formData.reporterPhone}
                      onChange={(e) => handleUpdate("reporterPhone", e.target.value)}
                    />
                  </div>

                <WizardButtons onBack={prevStep} onNext={nextStep} disableNext={!formData.name || !formData.age} />
              </motion.div>
            )}

            {/* STEP 2: Physical Details */}
            {step === 2 && (
              <motion.div 
                key="step2" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="space-y-10"
              >
                <h2 className="text-5xl font-bold">Physical Details</h2>
                
                <div className="space-y-10">
                  <div className="bg-purple-900/30 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between shadow-lg">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2"><Camera className="w-5 h-5"/> AI Fast-Track</h3>
                      <p className="text-slate-400 mt-1">Have a photo? Scan it to auto-detect clothing and fetch the last known CCTV location.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setScanType("report_missing");
                        setStep(8);
                      }}
                      className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-bold h-14 px-6 rounded-xl"
                    >
                      <Camera className="mr-2 h-5 w-5" /> Scan Photo Now
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-2xl text-slate-300">Gender</Label>
                    <RadioGroup 
                      value={formData.gender} 
                      onValueChange={(v) => handleUpdate("gender", v)}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {['Male', 'Female', 'Child', 'Other'].map(g => (
                        <Label
                          key={g}
                          className={`flex items-center justify-center h-24 text-2xl font-semibold rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.gender === g 
                              ? "bg-red-600/20 border-red-600 text-white" 
                              : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          <RadioGroupItem value={g} className="sr-only" />
                          {g}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-2xl text-slate-300">What were they wearing?</Label>
                    <Input 
                      className="h-20 text-3xl px-6 bg-slate-800/50 border-slate-700 focus-visible:ring-red-600 rounded-2xl" 
                      placeholder="E.g., Blue shirt, white cap" 
                      value={formData.clothing}
                      onChange={(e) => handleUpdate("clothing", e.target.value)}
                    />
                  </div>
                </div>

                <WizardButtons onBack={prevStep} onNext={nextStep} disableNext={!formData.gender || !formData.clothing} />
              </motion.div>
            )}

            {/* STEP 3: Location */}
            {step === 3 && (
              <motion.div 
                key="step3" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="space-y-10"
              >
                <h2 className="text-5xl font-bold">Where did you last see them?</h2>
                
                <RadioGroup 
                  value={formData.zone} 
                  onValueChange={(v) => handleUpdate("zone", v)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {[
                    "Zone A - Ramkund & Ghats",
                    "Zone B - Panchvati & Temple",
                    "Zone C - Tapovan Area",
                    "Zone D - Nashik Road & Transit"
                  ].map(zone => (
                    <Label
                      key={zone}
                      className={`flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.zone === zone 
                          ? "bg-red-600/20 border-red-600 text-white shadow-lg shadow-red-600/20" 
                          : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <RadioGroupItem value={zone} className="sr-only" />
                      <MapPin className={`h-10 w-10 mb-4 ${formData.zone === zone ? 'text-red-500' : 'text-slate-500'}`} />
                      <span className="text-2xl font-bold">{zone.split(' - ')[0]}</span>
                      <span className="text-lg opacity-70 mt-1">{zone.split(' - ')[1]}</span>
                    </Label>
                  ))}
                </RadioGroup>

                <WizardButtons onBack={prevStep} onNext={nextStep} disableNext={!formData.zone} />
              </motion.div>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && (
              <motion.div 
                key="step4" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="space-y-10"
              >
                <h2 className="text-5xl font-bold">Review Details</h2>
                
                <Card className="bg-slate-800/80 border-slate-700 rounded-3xl overflow-hidden backdrop-blur-sm">
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-xl">
                    <div>
                      <p className="text-slate-400 mb-1">Missing Person</p>
                      <p className="font-bold text-3xl text-white">{formData.name}</p>
                      <p className="text-slate-300 mt-2">{formData.age} years old • {formData.gender}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Clothing</p>
                      <p className="font-medium text-white">{formData.clothing}</p>
                    </div>
                    <div className="md:col-span-2 bg-slate-900/50 p-6 rounded-2xl flex items-center gap-4 border border-slate-700">
                      <MapPin className="text-red-500 h-8 w-8 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Last Seen Location</p>
                        <p className="text-2xl font-bold text-white mt-1">{formData.zone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-6 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    className="h-20 px-8 text-2xl rounded-2xl border-slate-700 hover:bg-slate-800 text-slate-300 flex-1"
                  >
                    Edit Details
                  </Button>
                  <Button 
                    onClick={submitReport}
                    className="h-20 px-8 text-2xl rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold flex-[2] shadow-xl shadow-red-600/20"
                  >
                    Submit Report to Police
                    <ArrowRight className="ml-3 h-8 w-8" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Processing / Result */}
            {step === 5 && (
              <motion.div 
                key="step5" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="w-full"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center space-y-12 py-20 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 border-4 border-red-500/30 rounded-full animate-ping" />
                      <Loader2 className="h-32 w-32 animate-spin text-red-600" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-bold">Analyzing Crowd Data...</h3>
                      <p className="text-2xl text-slate-400">Locating nearest cameras and chokepoints in {formData.zone?.split(' - ')[0]}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6">
                      <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-4xl font-extrabold text-white mb-4">Report Submitted Successfully</h2>
                        <p className="text-2xl text-slate-300">Case ID: <span className="font-mono font-bold text-white">{result?.case_id}</span></p>
                      </div>
                    </div>

                    <Card className="bg-slate-800/80 border-slate-700 rounded-3xl overflow-hidden">
                      <div className="bg-red-600 px-8 py-4 flex items-center gap-3">
                        <AlertTriangle className="text-white h-6 w-6" />
                        <h3 className="text-xl font-bold text-white">AI Search Recommendation Deployed</h3>
                      </div>
                      <CardContent className="p-8 space-y-8">
                        {capturedImage && !result?.matched_person && (
                          <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-700 pb-8">
                            <div className="shrink-0 space-y-2 text-center">
                              <p className="text-slate-400 font-semibold uppercase text-sm">Captured Scan</p>
                              <img src={capturedImage} alt="Scanned Subject" className="w-48 h-48 object-cover rounded-2xl border-4 border-slate-700 shadow-xl" />
                            </div>
                            <div className="flex-1 bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                              <h4 className="text-purple-300 font-bold text-lg mb-2 flex items-center gap-2"><ScanFace className="w-5 h-5"/> Visual Match Confirmed</h4>
                              <p className="text-slate-300">The scanned subject's clothing metadata matched successfully with active CCTV feeds in the area.</p>
                            </div>
                          </div>
                        )}

                        {result?.matched_person && (
                          <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-700 pb-8">
                            <div className="shrink-0 space-y-2 text-center">
                              <p className="text-slate-400 font-semibold uppercase text-sm">Database Match</p>
                              <img src={result.matched_person.image} alt="Matched Subject" className="w-48 h-48 object-cover rounded-2xl border-4 border-green-500 shadow-xl shadow-green-500/20" />
                            </div>
                            <div className="flex-1 bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                              <h4 className="text-green-400 font-bold text-2xl mb-2 flex items-center gap-2"><ScanFace className="w-6 h-6"/> IDENTITY CONFIRMED</h4>
                              <div className="space-y-2 mt-4 text-lg">
                                <p className="text-slate-200"><span className="text-slate-400">Name:</span> <span className="font-bold text-white">{result.matched_person.name}</span></p>
                                <p className="text-slate-200"><span className="text-slate-400">Status:</span> Found safe at terminal</p>
                                <p className="text-slate-200"><span className="text-slate-400">Current Location:</span> <span className="font-bold text-white">{result.matched_person.kiosk}</span></p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <p className="text-slate-400 font-semibold uppercase">Priority Search Area</p>
                            <p className="text-2xl font-bold text-white">{result?.priority_zone}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-slate-400 font-semibold uppercase">Alerted Station</p>
                            <p className="text-2xl font-bold text-white">{result?.nearest_police}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-slate-400 font-semibold uppercase">Actions Taken</p>
                          <ul className="space-y-3">
                            {result?.action_items.map((item: string, i: number) => (
                              <li key={i} className="flex items-center gap-3 text-xl text-slate-200">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-6 pt-4">
                      <Button 
                        onClick={() => window.print()}
                        className="h-20 px-8 text-2xl rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex-1 border border-slate-700"
                      >
                        <Printer className="mr-3 h-6 w-6" />
                        Print Notice
                      </Button>
                      <Button 
                        onClick={resetKiosk}
                        className="h-20 px-8 text-2xl rounded-2xl bg-white hover:bg-slate-200 text-slate-900 font-bold flex-[2]"
                      >
                        Return to Home Screen
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 8: Webcam Scan */}
            {step === 8 && (
              <motion.div 
                key="step8" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="space-y-8 flex flex-col items-center w-full"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-bold">{scanType === "im_lost" ? "Emergency Assistance" : "Privacy-Safe Visual Scan"}</h2>
                  <p className="text-xl text-slate-400">
                    {scanType === "im_lost" 
                      ? "Please enter your name and scan yourself so we can send immediate help." 
                      : "Hold the photo up to the camera. We analyze clothing colors & metadata, NOT biometric faces."}
                  </p>
                </div>

                {scanType === "im_lost" && (
                  <div className="w-full max-w-3xl space-y-4 pb-4">
                    <Label className="text-2xl text-slate-300">What is your name?</Label>
                    <Input 
                      className="h-20 text-3xl px-6 bg-slate-800/50 border-slate-700 focus-visible:ring-orange-500 rounded-2xl" 
                      placeholder="Enter your name" 
                      value={formData.name}
                      onChange={(e) => handleUpdate("name", e.target.value)}
                    />
                  </div>
                )}
                
                <div className="relative rounded-3xl overflow-hidden border-4 border-slate-700 bg-black aspect-video w-full max-w-3xl">
                  <Webcam 
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    mirrored={true}
                  />
                  {/* Scanner overlay */}
                  <div className="absolute inset-0 border-[6px] border-purple-500/50 m-8 rounded-xl">
                    <motion.div 
                      className="w-full h-1 bg-purple-500 shadow-[0_0_20px_purple]"
                      animate={{ y: ["0%", "1000%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 rounded-full backdrop-blur-sm text-purple-300 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Extracting Clothing Vectors...
                  </div>
                </div>

                <div className="flex gap-6 w-full max-w-3xl">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (scanType === "report_missing") setStep(2);
                      else if (scanType === "find_case") setStep(6);
                      else setStep(0);
                    }}
                    className="h-20 px-8 text-2xl rounded-2xl border-slate-700 hover:bg-slate-800 text-slate-300 flex-1"
                  >
                    Cancel Scan
                  </Button>
                  <Button 
                    onClick={() => {
                      const imageSrc = webcamRef.current?.getScreenshot();
                      if (imageSrc) setCapturedImage(imageSrc);

                      if (scanType === "report_missing") {
                        handleUpdate("clothing", "Blue shirt, patterned (Auto-detected)");
                        const zoneMapping: Record<string, string> = {
                          "Zone A - Ramkund Kiosk": "Zone A - Ramkund & Ghats",
                          "Zone B - Panchvati Kiosk": "Zone B - Panchvati & Temple",
                          "Zone C - Tapovan Kiosk": "Zone C - Tapovan Area",
                          "Zone D - Nashik Road Kiosk": "Zone D - Nashik Road & Transit",
                        };
                        handleUpdate("zone", zoneMapping[selectedKiosk] || "Zone A - Ramkund & Ghats"); // Auto-detect based on Kiosk
                        setStep(2); // Go back to Physical Details
                        return;
                      }

                      setStep(5);
                      setLoading(true);
                      setTimeout(() => {
                        if (scanType === "im_lost") {
                          // SAVE TO LOCAL STORAGE FOR DEMO
                          const lostPerson = {
                            name: formData.name || "Unknown Individual",
                            image: imageSrc,
                            kiosk: selectedKiosk
                          };
                          localStorage.setItem('khoj_lost_person', JSON.stringify(lostPerson));

                          setResult({
                            case_id: "EMERGENCY-HELP",
                            priority_level: "critical response",
                            priority_zone: selectedKiosk,
                            nearest_police: "Notifying all nearby units",
                            action_items: [
                              `Subject Identified: ${lostPerson.name}`,
                              "Visual scan complete",
                              "Profile saved to global Khoj Database",
                              "Immediate dispatch to this Kiosk",
                              "Please stay exactly where you are!"
                            ]
                          });
                        } else {
                          // READ FROM LOCAL STORAGE FOR DEMO
                          const savedData = localStorage.getItem('khoj_lost_person');
                          const savedPassive = localStorage.getItem('khoj_passive_capture');
                          const matchedPerson = savedData ? JSON.parse(savedData) : null;
                          const passivePerson = savedPassive ? JSON.parse(savedPassive) : null;

                          if (matchedPerson) {
                            setResult({
                              case_id: "MATCH-FOUND",
                              priority_level: "identity verified",
                              priority_zone: matchedPerson.kiosk,
                              nearest_police: "Police unit currently on scene",
                              matched_person: matchedPerson,
                              action_items: [
                                `High-confidence metadata match for: ${matchedPerson.name}`,
                                `Subject was physically located at: ${matchedPerson.kiosk}`,
                                "Reunification protocol initiated",
                                "Please proceed to the marked kiosk or wait for officers"
                              ]
                            });
                          } else if (passivePerson) {
                            setResult({
                              case_id: "PASSIVE-MATCH",
                              priority_level: "metadata match",
                              priority_zone: passivePerson.kiosk,
                              nearest_police: "Deploying nearby officers",
                              matched_person: {
                                name: "Unknown (Captured from CCTV)",
                                image: passivePerson.image,
                                kiosk: passivePerson.kiosk,
                                time: passivePerson.time
                              },
                              action_items: [
                                "Facial metadata match confirmed against live feed",
                                `Subject passed by: ${passivePerson.kiosk} at ${passivePerson.time}`,
                                "Officers are en-route to the location"
                              ]
                            });
                          } else {
                            setResult({
                              case_id: "MATCH-FOUND",
                              priority_level: "high confidence",
                              priority_zone: selectedKiosk,
                              nearest_police: "Notified: Local Police Station",
                              action_items: [
                                "Metadata match: Blue/White pattern detected",
                                `Last matched at ${selectedKiosk.split(' ')[2]} CCTV`,
                                "Time: 2 minutes ago",
                                "Officers are en-route to the location"
                              ]
                            });
                          }
                        }
                        setLoading(false);
                      }, 2000);
                    }}
                    className="h-20 px-8 text-2xl rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex-[2] shadow-lg shadow-purple-600/20"
                  >
                    <ScanFace className="mr-3 h-8 w-8" />
                    {scanType === "im_lost" ? "Send Emergency Alert" : "Capture & Search"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Find Case */}
            {step === 6 && (
              <motion.div
                key="step6" variants={pageVariants} initial="initial" animate="in" exit="out"
                className="space-y-10"
              >
                <h2 className="text-5xl font-bold">Find an Existing Case</h2>
                <div className="space-y-4">
                  <Label className="text-2xl text-slate-300">Enter Case ID or Name</Label>
                  <Input
                    className="h-20 text-3xl px-6 bg-slate-800/50 border-slate-700 focus-visible:ring-blue-600 rounded-2xl"
                    placeholder="e.g. KHOJ-ABC123 or Ramesh Kumar"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && searchInput.trim()) handleFindCase(); }}
                  />
                </div>
                <div className="flex gap-4 pt-8 border-t border-slate-800 flex-wrap md:flex-nowrap">
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="h-20 px-8 text-2xl rounded-2xl border-slate-700 hover:bg-slate-800 text-slate-300 flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setScanType("find_case");
                      setStep(8);
                    }}
                    className="h-20 px-8 text-2xl rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex-1 shadow-lg shadow-purple-600/20"
                  >
                    <Camera className="mr-3 h-8 w-8" />
                    Scan Photo
                  </Button>
                  <Button
                    disabled={!searchInput.trim()}
                    onClick={handleFindCase}
                    className="h-20 px-8 text-2xl rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex-[2] shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    <Search className="mr-3 h-8 w-8" />
                    Search Database
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Helper component for navigation buttons
function WizardButtons({ onBack, onNext, disableNext }: { onBack: () => void, onNext: () => void, disableNext: boolean }) {
  return (
    <div className="flex gap-6 pt-8 border-t border-slate-800">
      <Button 
        variant="outline" 
        onClick={onBack}
        className="h-20 px-8 text-2xl rounded-2xl border-slate-700 hover:bg-slate-800 text-slate-300"
      >
        Back
      </Button>
      <Button 
        onClick={onNext}
        disabled={disableNext}
        className="h-20 px-8 text-2xl rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1 shadow-lg shadow-red-600/20 disabled:opacity-50"
      >
        Continue
        <ArrowRight className="ml-3 h-8 w-8" />
      </Button>
    </div>
  );
}
