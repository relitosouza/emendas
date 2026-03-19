"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

// Fix for Leaflet icons in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface MapPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: MapPickerProps) {
    const map = useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (lat && lng && map) {
            map.flyTo([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);

    return lat && lng ? (
        <Marker position={[lat, lng]} icon={icon} />
    ) : null;
}

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
    // We still use isMounted to prevent hydration mismatch for the container, 
    // although the parent dynamic import handles most of this.
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-[300px] w-full rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                Carregando mapa...
            </div>
        );
    }

    const listLat = lat || -23.5329;
    const listLng = lng || -46.7915;

    return (
        <div className="space-y-2">
            <Label>Selecione no Mapa</Label>
            <div className="h-[300px] w-full overflow-hidden rounded-md border border-slate-200">
                <MapContainer
                    center={[listLat, listLng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker lat={lat} lng={lng} onChange={onChange} />
                </MapContainer>
            </div>
            <p className="text-xs text-muted-foreground">
                Clique no mapa para definir a localização exata do investimento.
            </p>
        </div>
    );
}
