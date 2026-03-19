"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface WorkLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: string;
}

const locations: WorkLocation[] = [
    { id: "1", name: "Reforma UBS Centro", lat: -23.55052, lng: -46.633308, status: "Em andamento" },
    { id: "2", name: "Pavimentação Jd. Flores", lat: -23.559, lng: -46.64, status: "Parada" },
    { id: "3", name: "Creche Vila Nova", lat: -23.54, lng: -46.62, status: "Atrasada" },
];

export default function WorksMap() {
    return (
        <Card className="col-span-2 h-full">
            <CardHeader>
                <CardTitle>Mapa de Obras</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-0 overflow-hidden rounded-b-lg">
                <MapContainer
                    center={[-23.55052, -46.633308]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {locations.map((loc) => (
                        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
                            <Popup>
                                <strong>{loc.name}</strong>
                                <br />
                                Status: {loc.status}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </CardContent>
        </Card>
    );
}
