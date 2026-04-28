import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapNode = {
    name: string;
    lat: number;
    lng: number;
    intensity: number;
    cases: number;
    capacity: number;
    disease: string;
    scale?: number;
};

const AP_CENTER: [number, number] = [15.9129, 80.1800];
const DEFAULT_ZOOM = 7;

type MapComponentProps = {
    nodes: MapNode[];
    timelineDay?: number;
    center?: [number, number];
    zoom?: number;
    catchmentCircle?: { lat: number; lng: number; radius_m: number; label?: string };
};

// Re-centres the map when center/zoom prop changes (Leaflet doesn't auto-update)
function MapAutoCenter({ center, zoom }: { center?: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom ?? map.getZoom(), { animate: true });
    }, [center, zoom, map]);
    return null;
}

export default function MapComponent({ nodes, timelineDay = 0, center, zoom, catchmentCircle }: MapComponentProps) {
    const nodesWithScale = useMemo(() => {
        const getScale = (baseIntensity: number) => {
            const growth = 1 + timelineDay * 0.12 * baseIntensity;
            return Math.min(growth, 2.2);
        };
        return nodes.map((n) => ({
            ...n,
            scale: n.scale ?? getScale(n.intensity),
        }));
    }, [nodes, timelineDay]);

    return (
        <MapContainer
            center={center || AP_CENTER}
            zoom={zoom || DEFAULT_ZOOM}
            className="h-full w-full rounded-xl z-0"
            scrollWheelZoom={true}
        >
            <MapAutoCenter center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {catchmentCircle && (
                <Circle
                    center={[catchmentCircle.lat, catchmentCircle.lng]}
                    radius={catchmentCircle.radius_m}
                    pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
                >
                    {catchmentCircle.label && <Popup>{catchmentCircle.label}</Popup>}
                </Circle>
            )}
            {nodesWithScale.map((d) => {
                const isHot = d.intensity > 0.7;
                const isWarm = d.intensity > 0.5;
                const fill = isHot ? "#ef4444" : isWarm ? "#f59e0b" : "#10b981";
                const radius = (8 + d.intensity * 6) * (d.scale ?? 1);
                const projectedCases = Math.round(d.cases * (1 + timelineDay * 0.08));
                const projectedCap = Math.min(99, d.capacity + timelineDay * 3);

                return (
                    <CircleMarker
                        key={d.name}
                        center={[d.lat, d.lng]}
                        radius={Math.min(radius, 24)}
                        pathOptions={{
                            fillColor: fill,
                            color: "#1e293b",
                            weight: 1.5,
                            opacity: 1,
                            fillOpacity: 0.9,
                        }}
                        eventHandlers={{
                            mouseover: (e) => e.target.openPopup(),
                        }}
                    >
                        <Popup>
                            <div className="text-left text-xs">
                                <p className="font-bold text-slate-900">{d.name}</p>
                                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                                    <span className="text-slate-500">Active Cases:</span>
                                    <span className="font-bold text-red-600">{projectedCases}</span>
                                    <span className="text-slate-500">Hospital Cap:</span>
                                    <span className="font-bold text-amber-600">{projectedCap}%</span>
                                    <span className="text-slate-500">Disease:</span>
                                    <span className="font-bold text-emerald-600">{d.disease}</span>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
