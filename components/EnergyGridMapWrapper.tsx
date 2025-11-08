"use client";
import { useEffect, useState } from "react";

export default function EnergyGridMapWrapper() {
  const [MapComponent, setMapComponent] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Only import and render on client side after component is mounted
    if (typeof window !== "undefined") {
      import("./EnergyGridMap")
        .then((mod) => {
          setMapComponent(() => mod.default);
        })
        .catch((err) => {
          console.error("Failed to load map:", err);
        });
    }
  }, []);

  if (!isMounted || !MapComponent) {
    return (
      <div className="w-full h-full border rounded-b-sm bg-secondary/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-secondary-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapComponent />;
}
