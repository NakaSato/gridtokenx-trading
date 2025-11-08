"use client";
import { useState, useEffect, useRef } from "react";
import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Zap,
  Battery,
  BatteryCharging,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import energyGridConfig from "@/lib/data/energyGridConfig.json";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

interface EnergyNode {
  id: string;
  name: string;
  buildingCode?: string;
  type: "generator" | "storage" | "consumer";
  longitude: number;
  latitude: number;
  capacity: string;
  status: "active" | "idle" | "maintenance";
  // Generator specific
  currentOutput?: string;
  solarPanels?: number;
  panelType?: string;
  efficiency?: string;
  peakGeneration?: string;
  tiltAngle?: string;
  orientation?: string;
  // Storage specific
  currentCharge?: string;
  batteryType?: string;
  batteryPacks?: number;
  chargeRate?: string;
  dischargeRate?: string;
  cycleCount?: number;
  temperature?: string;
  // Consumer specific
  currentLoad?: string;
  floors?: number;
  area?: string;
  occupancy?: string;
  hvacSystem?: string;
  lighting?: string;
  avgDailyConsumption?: string;
  peakDemand?: string;
  laboratories?: number;
  studySeats?: number;
  specialEquipment?: string;
  // Common
  installDate?: string;
  lastMaintenance?: string;
  lastUpgrade?: string;
}

interface EnergyTransfer {
  from: string;
  to: string;
  power: number; // in kW
}

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN";

// Load energy grid data from config
const {
  campus,
  energyNodes: configNodes,
  energyTransfers: configTransfers,
} = energyGridConfig;
const energyNodes = configNodes as EnergyNode[];
const energyTransfers = configTransfers as EnergyTransfer[];

export default function EnergyGridMap() {
  const [viewState, setViewState] = useState({
    longitude: campus.center.longitude,
    latitude: campus.center.latitude,
    zoom: campus.defaultZoom,
  });
  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedNode) {
        setSelectedNode(null);
      }
      if (e.key === "r" || e.key === "R") {
        // Animate reset view with GSAP
        gsap.to(viewState, {
          longitude: campus.center.longitude,
          latitude: campus.center.latitude,
          zoom: campus.defaultZoom,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => {
            setViewState({ ...viewState });
          },
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedNode, viewState]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Double click on marker to zoom
  const handleMarkerDoubleClick = (node: EnergyNode) => {
    // Animate zoom with GSAP
    const newZoom = 18;
    gsap.to(viewState, {
      longitude: node.longitude,
      latitude: node.latitude,
      zoom: newZoom,
      duration: 1,
      ease: "power2.inOut",
      onUpdate: () => {
        setViewState({ ...viewState });
      },
    });
    setSelectedNode(node);
  };

  const toggleFullscreen = async () => {
    const element = mapContainerRef.current;

    if (!element) return;

    try {
      if (!isFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "generator":
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case "storage":
        return <BatteryCharging className="h-4 w-4 text-green-500" />;
      case "consumer":
        return <Battery className="h-4 w-4 text-blue-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full relative rounded-b-sm overflow-hidden"
    >
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.7);
        }
      `}</style>
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-50">
          <p className="text-foreground">Loading map...</p>
        </div>
      )}
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        onLoad={() => {
          console.log("Map loaded successfully");
          setMapLoaded(true);
        }}
        onError={(e: any) => console.error("Map error:", e)}
      >
        <NavigationControl position="top-right" />

        {/* Fullscreen Toggle Button */}
        <div className="absolute top-4 right-16 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-background/95 hover:bg-background backdrop-blur-md border border-primary/30 shadow-lg"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-primary" />
            ) : (
              <Maximize2 className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        {energyNodes.map((node) => (
          <Marker
            key={node.id}
            longitude={node.longitude}
            latitude={node.latitude}
          >
            <Popover
              open={selectedNode?.id === node.id}
              onOpenChange={(open) => {
                if (!open) setSelectedNode(null);
              }}
            >
              <PopoverTrigger asChild>
                <div
                  className="cursor-pointer hover:scale-125 transition-all duration-300 relative group"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  onDoubleClick={(e: any) => {
                    e.stopPropagation();
                    handleMarkerDoubleClick(node);
                  }}
                  title={`${node.name} - Double click to zoom`}
                >
                  {/* Pulsing outer ring */}
                  <div
                    className={`absolute inset-0 rounded-full ${getStatusColor(
                      node.status
                    )} opacity-30 animate-ping`}
                  />
                  {/* Status indicator */}
                  <div
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusColor(
                      node.status
                    )} animate-pulse z-10 border border-background`}
                  />
                  {/* Main marker */}
                  <div className="relative bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-md p-2 rounded-full border border-primary/60 shadow-xl group-hover:shadow-primary/50 group-hover:border-primary transition-all">
                    {getMarkerIcon(node.type)}
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </PopoverTrigger>
              {selectedNode?.id === node.id && (
                <PopoverContent
                  className="p-0 min-w-[280px] max-w-[320px] border border-primary/40"
                  side="top"
                  align="center"
                  sideOffset={10}
                >
                  <div className="relative p-4 bg-gradient-to-br from-background to-background/95 text-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => setSelectedNode(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <h3 className="font-bold text-base mb-2 text-primary flex items-center gap-2 pr-8">
                      {getMarkerIcon(selectedNode.type)}
                      <span className="flex-1">{selectedNode.name}</span>
                    </h3>
                    {selectedNode.buildingCode && (
                      <p className="text-xs text-secondary-foreground mb-3 font-mono">
                        {selectedNode.buildingCode}
                      </p>
                    )}

                    <div className="space-y-1 text-xs max-h-[400px] overflow-y-auto custom-scrollbar">
                      {/* Status Section */}
                      <div className="bg-secondary/20 rounded-lg p-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-secondary-foreground font-medium">
                            Type:
                          </span>
                          <span className="font-semibold capitalize text-foreground">
                            {selectedNode.type}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-secondary-foreground font-medium">
                            Status:
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
                                selectedNode.status
                              )} animate-pulse`}
                            />
                            <span className="font-semibold capitalize text-foreground">
                              {selectedNode.status}
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-secondary-foreground font-medium">
                            Capacity:
                          </span>
                          <span className="font-semibold text-foreground">
                            {selectedNode.capacity}
                          </span>
                        </div>
                      </div>

                      {/* Building Details */}
                      {(selectedNode.floors ||
                        selectedNode.area ||
                        selectedNode.occupancy) && (
                        <div className="bg-secondary/20 rounded-lg p-2 space-y-1.5">
                          <h4 className="font-semibold text-foreground mb-1">
                            Building Info
                          </h4>
                          {selectedNode.floors && (
                            <div className="flex justify-between items-center">
                              <span className="text-secondary-foreground">
                                Floors:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.floors}
                              </span>
                            </div>
                          )}
                          {selectedNode.area && (
                            <div className="flex justify-between items-center">
                              <span className="text-secondary-foreground">
                                Area:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.area}
                              </span>
                            </div>
                          )}
                          {selectedNode.occupancy && (
                            <div className="flex justify-between items-center">
                              <span className="text-secondary-foreground">
                                Use:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.occupancy}
                              </span>
                            </div>
                          )}
                          {selectedNode.studySeats && (
                            <div className="flex justify-between items-center">
                              <span className="text-secondary-foreground">
                                Seats:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.studySeats}
                              </span>
                            </div>
                          )}
                          {selectedNode.laboratories && (
                            <div className="flex justify-between items-center">
                              <span className="text-secondary-foreground">
                                Labs:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.laboratories}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </Marker>
        ))}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-8 left-2 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md border border-primary/30 rounded p-2 text-xs shadow-xl">
        <h4 className="font-bold mb-1 text-foreground text-[10px]">Legend</h4>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 p-0.5 hover:bg-secondary/20 rounded transition-colors cursor-pointer">
            <div className="p-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40">
              <Zap className="h-2 w-2 text-yellow-500" />
            </div>
            <span className="text-secondary-foreground font-medium text-[9px]">
              Prosumer
            </span>
          </div>
          <div className="flex items-center gap-1 p-0.5 hover:bg-secondary/20 rounded transition-colors cursor-pointer">
            <div className="p-0.5 rounded-full bg-green-500/20 border border-green-500/40">
              <BatteryCharging className="h-2 w-2 text-green-500" />
            </div>
            <span className="text-secondary-foreground font-medium text-[9px]">
              Storage
            </span>
          </div>
          <div className="flex items-center gap-1 p-0.5 hover:bg-secondary/20 rounded transition-colors cursor-pointer">
            <div className="p-0.5 rounded-full bg-blue-500/20 border border-blue-500/40">
              <Battery className="h-2 w-2 text-blue-500" />
            </div>
            <span className="text-secondary-foreground font-medium text-[9px]">
              Consumer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
