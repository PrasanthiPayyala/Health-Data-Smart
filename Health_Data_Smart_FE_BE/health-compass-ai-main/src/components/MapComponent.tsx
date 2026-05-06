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

function MapAutoCenter({ center, zoom }: { center?: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom ?? map.getZoom(), { animate: false });
    }, [center, zoom, map]);
    return null;
}

const LIGHT_MAP_CSS = `
.ap-light-leaflet .leaflet-popup-content-wrapper {
    background: #FFFFFF !important;
    color: #0F172A !important;
    border: 1px solid #90CAF9;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
}
.ap-light-leaflet .leaflet-popup-tip {
    background: #FFFFFF !important;
    border: 1px solid #90CAF9;
}
.ap-light-leaflet .leaflet-popup-close-button {
    color: #0D47A1 !important;
}
.ap-light-leaflet .leaflet-bar a,
.ap-light-leaflet .leaflet-bar a:hover {
    background: #FFFFFF !important;
    color: #0D47A1 !important;
    border-color: #90CAF9 !important;
}
.ap-light-leaflet .leaflet-control-attribution {
    background: rgba(255, 255, 255, 0.85) !important;
    color: #475569 !important;
}
.ap-light-leaflet .leaflet-control-attribution a {
    color: #1976D2 !important;
}
`;

function ensureLightMapCSS() {
    if (typeof document === "undefined") return;
    const old = document.getElementById("ap-dark-leaflet-css");
    if (old) old.remove();
    if (document.getElementById("ap-light-leaflet-css")) return;
    const style = document.createElement("style");
    style.id = "ap-light-leaflet-css";
    style.innerHTML = LIGHT_MAP_CSS;
    document.head.appendChild(style);
}

export default function MapComponent({ nodes, timelineDay = 0, center, zoom, catchmentCircle }: MapComponentProps) {
    useEffect(() => { ensureLightMapCSS(); }, []);

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
            className="ap-light-leaflet h-full w-full rounded-md z-0"
            scrollWheelZoom={true}
        >
            <MapAutoCenter center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
            />
            {catchmentCircle && (
                <Circle
                    center={[catchmentCircle.lat, catchmentCircle.lng]}
                    radius={catchmentCircle.radius_m}
                    pathOptions={{ color: "#2E7D32", fillColor: "#2E7D32", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
                >
                    {catchmentCircle.label && <Popup>{catchmentCircle.label}</Popup>}
                </Circle>
            )}
            {nodesWithScale.map((d) => {
                const isHot = d.intensity > 0.7;
                const isWarm = d.intensity > 0.5;
                const fill = isHot ? "#C62828" : isWarm ? "#E65100" : "#2E7D32";
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
                            color: "#FFFFFF",
                            weight: 2.5,
                            opacity: 1,
                            fillOpacity: 0.92,
                        }}
                        eventHandlers={{
                            mouseover: (e) => e.target.openPopup(),
                        }}
                    >
                        <Popup>
                            <div className="text-left text-xs">
                                <p className="font-bold" style={{ color: "#0D47A1" }}>{d.name}</p>
                                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                                    <span style={{ color: "#64748B" }}>Active Cases:</span>
                                    <span className="font-bold" style={{ color: "#C62828" }}>{projectedCases}</span>
                                    <span style={{ color: "#64748B" }}>Hospital Cap:</span>
                                    <span className="font-bold" style={{ color: "#E65100" }}>{projectedCap}%</span>
                                    <span style={{ color: "#64748B" }}>Disease:</span>
                                    <span className="font-bold" style={{ color: "#2E7D32" }}>{d.disease}</span>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
