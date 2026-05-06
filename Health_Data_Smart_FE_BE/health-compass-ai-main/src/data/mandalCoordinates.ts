// AP mandal coordinates — top mandals by case count from the dataset.
// Used by district/CHC/PHC dashboards to render mandal-level heat circles.
// Coordinates from public AP government data + OpenStreetMap.

export type MandalLatLng = { lat: number; lng: number };

export const MANDAL_COORDS: Record<string, Record<string, MandalLatLng>> = {
  "EAST GODAVARI": {
    "Rajanagaram":      { lat: 17.0890, "lng": 81.9410 },
    "Rajamahendravaram":{ lat: 17.0005, "lng": 81.8040 },
    "Rampachodavaram":  { lat: 17.4500, "lng": 81.7833 },
    "Maredumilli":      { lat: 17.5833, "lng": 81.7000 },
    "Korukonda":        { lat: 17.1500, "lng": 81.7500 },
    "Seethanagaram":    { lat: 17.1167, "lng": 82.0833 },
    "Anaparthi":        { lat: 16.9100, "lng": 82.0200 },
    "Biccavolu":        { lat: 16.9333, "lng": 82.0000 },
    "Gokavaram":        { lat: 17.2000, "lng": 81.9000 },
    "Kadiyam":          { lat: 17.0667, "lng": 81.7667 },
  },
  "KRISHNA": {
    "Vijayawada":       { lat: 16.5062, "lng": 80.6480 },
    "Machilipatnam":    { lat: 16.1875, "lng": 81.1389 },
    "Avanigadda":       { lat: 16.0167, "lng": 80.9167 },
    "Bantumilli":       { lat: 16.4167, "lng": 81.0167 },
    "Gudivada":         { lat: 16.4333, "lng": 80.9833 },
    "Gannavaram":       { lat: 16.5333, "lng": 80.7833 },
    "Tiruvuru":         { lat: 17.0833, "lng": 80.6167 },
    "Nuzvid":           { lat: 16.7833, "lng": 80.8500 },
    "Pamarru":          { lat: 16.3500, "lng": 80.9667 },
    "Mylavaram":        { lat: 16.7833, "lng": 80.6500 },
  },
  "WEST GODAVARI": {
    "Bhimavaram":       { lat: 16.5444, "lng": 81.5212 },
    "Tadepalligudem":   { lat: 16.8137, "lng": 81.5269 },
    "Eluru":            { lat: 16.7107, "lng": 81.0952 },
    "Tanuku":           { lat: 16.7547, "lng": 81.6778 },
    "Palakollu":        { lat: 16.5167, "lng": 81.7333 },
    "Narasapur":        { lat: 16.4333, "lng": 81.7000 },
    "Achanta":          { lat: 16.5833, "lng": 81.6833 },
    "Akiveedu":         { lat: 16.5833, "lng": 81.4500 },
    "Ungutur":          { lat: 16.7000, "lng": 81.3833 },
    "Pedavegi":         { lat: 16.7833, "lng": 81.1833 },
  },
  "VISAKHAPATNAM": {
    "Visakhapatnam":    { lat: 17.6868, "lng": 83.2185 },
    "Anakapalle":       { lat: 17.6912, "lng": 83.0040 },
    "Narsipatnam":      { lat: 17.6667, "lng": 82.6167 },
    "Yelamanchili":     { lat: 17.5500, "lng": 82.8500 },
    "Gajuwaka":         { lat: 17.6833, "lng": 83.2000 },
    "Bheemunipatnam":   { lat: 17.8893, "lng": 83.4498 },
    "Pendurthi":        { lat: 17.7833, "lng": 83.2167 },
    "Madugula":         { lat: 17.9833, "lng": 82.9667 },
    "Chodavaram":       { lat: 17.8167, "lng": 82.9500 },
    "Paravada":         { lat: 17.5667, "lng": 83.0167 },
  },
  "GUNTUR": {
    "Guntur":           { lat: 16.3067, "lng": 80.4365 },
    "Tenali":           { lat: 16.2433, "lng": 80.6403 },
    "Mangalagiri":      { lat: 16.4308, "lng": 80.5571 },
    "Tadepalle":        { lat: 16.4806, "lng": 80.6022 },
    "Ponnur":           { lat: 16.0667, "lng": 80.5500 },
    "Nizampatnam":      { lat: 15.9000, "lng": 80.6667 },
    "Pedanandipadu":    { lat: 16.2167, "lng": 80.2833 },
    "Vinukonda":        { lat: 16.0500, "lng": 79.7500 },
    "Repalle":          { lat: 16.0167, "lng": 80.8333 },
    "Bhattiprolu":      { lat: 16.1000, "lng": 80.7833 },
  },
  "SRI POTTI SRIRAMULU NELLORE": {
    "Nellore":          { lat: 14.4426, "lng": 79.9865 },
    "Kavali":           { lat: 14.9132, "lng": 79.9931 },
    "Gudur":            { lat: 14.1500, "lng": 79.8500 },
    "Atmakur":          { lat: 14.6167, "lng": 79.6167 },
    "Sullurpeta":       { lat: 13.7167, "lng": 80.0167 },
    "Naidupet":         { lat: 13.9000, "lng": 79.9000 },
    "Venkatagiri":      { lat: 13.9667, "lng": 79.5833 },
    "Udayagiri":        { lat: 14.8833, "lng": 79.3000 },
    "Indukurpet":       { lat: 14.4333, "lng": 80.1500 },
    "Kovur":            { lat: 14.5000, "lng": 79.9667 },
  },
  "VIZIANAGARAM": {
    "Vizianagaram":     { lat: 18.1167, "lng": 83.4167 },
    "Bobbili":          { lat: 18.5667, "lng": 83.3667 },
    "Salur":            { lat: 18.5167, "lng": 83.2000 },
    "Parvathipuram":    { lat: 18.7833, "lng": 83.4250 },
    "Cheepurupalli":    { lat: 18.3000, "lng": 83.5667 },
    "Gajapathinagaram": { lat: 18.3667, "lng": 83.3000 },
    "Nellimarla":       { lat: 18.1667, "lng": 83.4500 },
    "Pusapatirega":     { lat: 18.2167, "lng": 83.6000 },
  },
  "SRIKAKULAM": {
    "Srikakulam":       { lat: 18.2969, "lng": 83.8973 },
    "Tekkali":          { lat: 18.6167, "lng": 84.2333 },
    "Palasa":           { lat: 18.7667, "lng": 84.4167 },
    "Amadalavalasa":    { lat: 18.4167, "lng": 83.9000 },
    "Etcherla":         { lat: 18.3667, "lng": 83.7833 },
    "Pathapatnam":      { lat: 18.7667, "lng": 84.0667 },
    "Sompeta":          { lat: 18.9333, "lng": 84.5833 },
    "Ranasthalam":      { lat: 18.0833, "lng": 83.6833 },
  },
  "PRAKASAM": {
    "Ongole":           { lat: 15.5057, "lng": 80.0499 },
    "Chirala":          { lat: 15.8237, "lng": 80.3522 },
    "Kandukur":         { lat: 15.2167, "lng": 79.9000 },
    "Markapur":         { lat: 15.7333, "lng": 79.2667 },
    "Giddalur":         { lat: 15.3667, "lng": 78.9167 },
    "Kanigiri":         { lat: 15.4000, "lng": 79.5167 },
    "Darsi":            { lat: 15.7667, "lng": 79.6833 },
    "Yerragondapalem":  { lat: 15.9000, "lng": 79.0667 },
  },
  "KURNOOL": {
    "Kurnool":          { lat: 15.8281, "lng": 78.0373 },
    "Adoni":            { lat: 15.6333, "lng": 77.2667 },
    "Yemmiganur":       { lat: 15.7667, "lng": 77.4833 },
    "Nandyal":          { lat: 15.4778, "lng": 78.4837 },
    "Allagadda":        { lat: 15.1333, "lng": 78.5000 },
    "Atmakur":          { lat: 15.8833, "lng": 78.5833 },
    "Banaganapalle":    { lat: 15.3167, "lng": 78.2333 },
    "Dhone":            { lat: 15.4000, "lng": 77.8667 },
  },
  "CHITTOOR": {
    "Chittoor":         { lat: 13.2172, "lng": 79.1003 },
    "Tirupati":         { lat: 13.6288, "lng": 79.4192 },
    "Madanapalle":      { lat: 13.5500, "lng": 78.5000 },
    "Punganur":         { lat: 13.3667, "lng": 78.5833 },
    "Palamaner":        { lat: 13.2000, "lng": 78.7500 },
    "Srikalahasti":     { lat: 13.7500, "lng": 79.7000 },
    "Puttur":           { lat: 13.4500, "lng": 79.5500 },
    "Kuppam":           { lat: 12.7500, "lng": 78.3500 },
  },
  "ANANTHAPURAMU": {
    "Anantapur":        { lat: 14.6819, "lng": 77.6006 },
    "Hindupur":         { lat: 13.8333, "lng": 77.4833 },
    "Dharmavaram":      { lat: 14.4333, "lng": 77.7167 },
    "Kadiri":           { lat: 14.1167, "lng": 78.1667 },
    "Tadipatri":        { lat: 14.9167, "lng": 78.0167 },
    "Penukonda":        { lat: 14.0833, "lng": 77.5833 },
    "Puttaparthi":      { lat: 14.1667, "lng": 77.8167 },
    "Madakasira":       { lat: 13.9333, "lng": 77.2833 },
  },
  "YSR KADAPA": {
    "Kadapa":           { lat: 14.4674, "lng": 78.8241 },
    "Proddatur":        { lat: 14.7500, "lng": 78.5500 },
    "Pulivendula":      { lat: 14.4167, "lng": 78.2333 },
    "Rayachoti":        { lat: 14.0500, "lng": 78.7500 },
    "Rajampet":         { lat: 14.2000, "lng": 79.1500 },
    "Mydukur":          { lat: 14.7833, "lng": 78.7833 },
    "Badvel":           { lat: 14.7500, "lng": 79.0500 },
  },
  // New AP districts (post-2022) — central mandals only, mock data covers them
  "PARVATHIPURAM MANYAM": {
    "Parvathipuram":    { lat: 18.7833, "lng": 83.4250 },
    "Salur":            { lat: 18.5167, "lng": 83.2000 },
    "Bobbili":          { lat: 18.5667, "lng": 83.3667 },
    "Kurupam":          { lat: 18.8167, "lng": 83.2833 },
  },
  "ANAKAPALLI": {
    "Anakapalle":       { lat: 17.6912, "lng": 83.0040 },
    "Narsipatnam":      { lat: 17.6667, "lng": 82.6167 },
    "Yelamanchili":     { lat: 17.5500, "lng": 82.8500 },
    "Chodavaram":       { lat: 17.8167, "lng": 82.9500 },
  },
  "ALLURI SITHARAMA RAJU": {
    "Paderu":           { lat: 18.0833, "lng": 82.6833 },
    "Chintapalle":      { lat: 17.8500, "lng": 82.5500 },
    "Araku Valley":     { lat: 18.3333, "lng": 82.8667 },
    "Ananthagiri":      { lat: 18.3167, "lng": 82.9667 },
  },
  "KAKINADA": {
    "Kakinada Urban":   { lat: 16.9891, "lng": 82.2475 },
    "Kakinada Rural":   { lat: 16.9667, "lng": 82.2333 },
    "Pithapuram":       { lat: 17.1167, "lng": 82.2500 },
    "Samalkota":        { lat: 17.0500, "lng": 82.1667 },
  },
  "DR. B.R. AMBEDKAR KONASEEMA": {
    "Amalapuram":       { lat: 16.5783, "lng": 82.0064 },
    "Mummidivaram":     { lat: 16.6500, "lng": 82.1167 },
    "Razole":           { lat: 16.4833, "lng": 81.8333 },
    "Ravulapalem":      { lat: 16.7500, "lng": 81.7833 },
  },
  "ELURU": {
    "Eluru":            { lat: 16.7107, "lng": 81.0952 },
    "Nuzvid":           { lat: 16.7833, "lng": 80.8500 },
    "Bhimadole":        { lat: 16.8167, "lng": 81.2833 },
    "Polavaram":        { lat: 17.2483, "lng": 81.6583 },
  },
  "POLAVARAM": {
    "Polavaram":        { lat: 17.2483, "lng": 81.6583 },
    "Buttayagudem":     { lat: 17.2667, "lng": 81.0500 },
    "Jeelugumilli":     { lat: 17.3333, "lng": 81.4167 },
  },
  "NTR": {
    "Vijayawada Central": { lat: 16.5062, "lng": 80.6480 },
    "Vijayawada East":  { lat: 16.5167, "lng": 80.6833 },
    "Vijayawada West":  { lat: 16.5000, "lng": 80.6167 },
    "Mylavaram":        { lat: 16.7833, "lng": 80.6500 },
    "Nandigama":        { lat: 16.7667, "lng": 80.2833 },
  },
  "PALNADU": {
    "Narasaraopet":     { lat: 16.2350, "lng": 80.0500 },
    "Sattenapalli":     { lat: 16.4000, "lng": 80.1500 },
    "Macherla":         { lat: 16.4833, "lng": 79.4333 },
    "Gurazala":         { lat: 16.5667, "lng": 79.6500 },
  },
  "BAPATLA": {
    "Bapatla":          { lat: 15.9043, "lng": 80.4670 },
    "Repalle":          { lat: 16.0167, "lng": 80.8333 },
    "Chirala":          { lat: 15.8237, "lng": 80.3522 },
    "Vetapalem":        { lat: 15.7833, "lng": 80.3167 },
  },
  "MARKAPURAM": {
    "Markapur":         { lat: 15.7333, "lng": 79.2667 },
    "Tarlupadu":        { lat: 15.5333, "lng": 79.1167 },
    "Yerragondapalem":  { lat: 15.9000, "lng": 79.0667 },
    "Cumbum":           { lat: 15.5833, "lng": 79.1167 },
  },
  "NANDYAL": {
    "Nandyal":          { lat: 15.4778, "lng": 78.4837 },
    "Atmakur":          { lat: 15.8833, "lng": 78.5833 },
    "Allagadda":        { lat: 15.1333, "lng": 78.5000 },
    "Banaganapalle":    { lat: 15.3167, "lng": 78.2333 },
  },
  "SRI SATHYA SAI": {
    "Puttaparthi":      { lat: 14.1667, "lng": 77.8167 },
    "Hindupur":         { lat: 13.8333, "lng": 77.4833 },
    "Penukonda":        { lat: 14.0833, "lng": 77.5833 },
    "Madakasira":       { lat: 13.9333, "lng": 77.2833 },
  },
  "ANNAMAYYA": {
    "Rayachoti":        { lat: 14.0500, "lng": 78.7500 },
    "Madanapalle":      { lat: 13.5500, "lng": 78.5000 },
    "Rajampet":         { lat: 14.2000, "lng": 79.1500 },
    "Pulivendula":      { lat: 14.4167, "lng": 78.2333 },
  },
  "TIRUPATI": {
    "Tirupati Urban":   { lat: 13.6288, "lng": 79.4192 },
    "Tirupati Rural":   { lat: 13.6500, "lng": 79.4500 },
    "Srikalahasti":     { lat: 13.7500, "lng": 79.7000 },
    "Renigunta":        { lat: 13.6500, "lng": 79.5167 },
  },
  "MADANAPALLE": {
    "Madanapalle":      { lat: 13.5500, "lng": 78.5000 },
    "Punganur":         { lat: 13.3667, "lng": 78.5833 },
    "Palamaner":        { lat: 13.2000, "lng": 78.7500 },
    "Kuppam":           { lat: 12.7500, "lng": 78.3500 },
  },
};

export function getMandalCoords(district: string, mandal: string): MandalLatLng | null {
  const districtKey = district.toUpperCase().trim();
  const districtMandals = MANDAL_COORDS[districtKey];
  if (!districtMandals) return null;
  // Try exact match first, then case-insensitive
  if (districtMandals[mandal]) return districtMandals[mandal];
  const lower = mandal.toLowerCase().trim();
  for (const [name, coords] of Object.entries(districtMandals)) {
    if (name.toLowerCase() === lower) return coords;
    if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) return coords;
  }
  return null;
}
