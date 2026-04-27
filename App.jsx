import { useState, useEffect, useRef } from "react";

// ── EmailJS config ─────────────────────────────────────────────────────────────
// Einmalig einrichten auf emailjs.com → Service ID, Template ID, Public Key eintragen
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";   // z.B. "service_abc123"
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";  // z.B. "template_xyz789"
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";   // z.B. "abcDEF123..."
const MANAGER_EMAIL       = "lukas.weidinger@topgolfwien.com";

async function sendEmail(subject, body) {
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: MANAGER_EMAIL,
          subject,
          message: body,
        },
      }),
    });
    return res.ok;
  } catch { return false; }
}

// ── Storage ────────────────────────────────────────────────────────────────────
async function loadData(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : []; } catch { return []; }
}
async function saveData(key, data) {
  try { await window.storage.set(key, JSON.stringify(data)); } catch {}
}

// ── Checklisten-Zonen ──────────────────────────────────────────────────────────
const ZONES = [
  { id:"elektro_2og", label:"Elektroraum 2. OG", floor:"2. OG", icon:"⚡", color:"#a855f7", items:[
    {text:"Lüftungsanlage störungsfrei?",days:"all"},{text:"Alle Sicherungen eingeschaltet?",days:"all"}]},
  { id:"eventraum", label:"Eventräume 2. OG", floor:"2. OG", icon:"🎉", color:"#f59e0b", items:[
    {text:"Eventraum Groß – Beleuchtung funktioniert?",days:"all"},{text:"Eventraum Groß – Keine Auffälligkeiten?",days:"all"},{text:"Eventraum Groß – Türen i.O.?",days:"all"},
    {text:"Eventraum Klein – Beleuchtung funktioniert?",days:"all"},{text:"Eventraum Klein – Keine Auffälligkeiten?",days:"all"},{text:"Eventraum Klein – Türen i.O.?",days:"all"}]},
  { id:"wc_herren_2og", label:"Herren WC 2. OG", floor:"2. OG", icon:"🚹", color:"#38bdf8", items:[
    {text:"Vorraum – Seifenspender testen",days:"all"},{text:"Vorraum – Wasserhähne testen",days:"all"},{text:"Vorraum – Türgriff fest?",days:"all"},{text:"Vorraum – Türschließer funktioniert?",days:"all"},{text:"Vorraum – Handtuchhalter fest?",days:"all"},{text:"Vorraum – Alle Lichter gehen?",days:"all"},
    {text:"Toilettenraum – Toilettensitz fest?",days:"all"},{text:"Toilettenraum – Kleiderhaken vorhanden?",days:"all"},{text:"Toilettenraum – Türpuffer angebracht?",days:"all"},{text:"Toilettenraum – Aufkleber in der Toilette?",days:"all"},{text:"Toilettenraum – Toilettenpapierhalter i.O.?",days:"all"},
    {text:"Toilettenraum – Urinale i.O.?",days:"all"},{text:"Toilettenraum – Alle Spülungen gehen?",days:"all"},{text:"Toilettenraum – Trennwände auf festen Sitz geprüft?",days:"all"},{text:"Toilettenraum – Trennwand zwischen Urinalen fest?",days:"all"},{text:"Toilettenraum – Alle Lichter gehen?",days:"all"}]},
  { id:"wc_damen_2og", label:"Damen WC 2. OG", floor:"2. OG", icon:"🚺", color:"#ec4899", items:[
    {text:"Vorraum – Seifenspender testen",days:"all"},{text:"Vorraum – Wasserhähne testen",days:"all"},{text:"Vorraum – Türgriff fest?",days:"all"},{text:"Vorraum – Türschließer funktioniert?",days:"all"},{text:"Vorraum – Alle Lichter gehen?",days:"all"},{text:"Vorraum – Bildschirm funktioniert?",days:"all"},
    {text:"Toilettenraum – Toilettensitz fest?",days:"all"},{text:"Toilettenraum – Kleiderhaken vorhanden?",days:"all"},{text:"Toilettenraum – Türpuffer angebracht?",days:"all"},{text:"Toilettenraum – Aufkleber in der Toilette?",days:"all"},{text:"Toilettenraum – Toilettenpapierhalter i.O.?",days:"all"},
    {text:"Toilettenraum – Hygienebeutelspender i.O.?",days:"all"},{text:"Toilettenraum – Alle Spülungen gehen?",days:"all"},{text:"Toilettenraum – Trennwände auf festen Sitz geprüft?",days:"all"},{text:"Toilettenraum – Alle Lichter gehen?",days:"all"}]},
  { id:"terrasse_2og", label:"Terrasse 2. OG", floor:"2. OG", icon:"🌤️", color:"#22c55e", items:[
    {text:"Verschmutzungen beseitigt?",days:"all"},{text:"Alle Schirme i.O.?",days:"all"},{text:"Beleuchtung funktionsfähig?",days:"all"},{text:"Hinter der Scheibe alles sauber?",days:"all"}]},
  { id:"teeline_2og", label:"Tee Line 2. OG", floor:"2. OG", icon:"⛳", color:"#22c55e", items:[
    {text:"Alle Monitore funktionsfähig?",days:"all"},{text:"Alle Monitore an?",days:"all"},{text:"Alle Game Panel i.O.?",days:"all"},{text:"Alle Schläger da?",days:"all"},
    {text:"Abschlagmatten am Dispenser angeschoben?",days:"all"},{text:"Alle Dispenser abgeschlossen?",days:"all"},{text:"Haben alle Abschlagmatten 2 Tees?",days:"all"},
    {text:"Alle Heizungen funktionieren? (Sommer: Di prüfen)",days:"di"},{text:"Kein Kantenschutz an Bagstands abstehend?",days:"di"},{text:"Alle Stühle i.O.?",days:"di"},
    {text:"Absturzsicherung (Netz) i.O.?",days:"all"}]},
  { id:"bar_2og", label:"Bar & Common Area 2. OG", floor:"2. OG", icon:"🍺", color:"#f59e0b", items:[
    {text:"Lagerraum – Leitern an ihrem Platz?",days:"all"},{text:"Bar – Störung auf der Schankanlage?",days:"all"},{text:"Bar – Sichtkontrolle, alles OK?",days:"all"},
    {text:"Common Area – Alle Lampen gehen?",days:"all"},{text:"Common Area – Alle Bildschirme an mit Programm?",days:"all"}]},
  { id:"elektro_1og", label:"Elektroraum 1. OG", floor:"1. OG", icon:"⚡", color:"#a855f7", items:[
    {text:"Alle Sicherungen eingeschaltet?",days:"all"}]},
  { id:"wc_herren_1og", label:"Herren WC 1. OG", floor:"1. OG", icon:"🚹", color:"#38bdf8", items:[
    {text:"Vorraum – Seifenspender testen",days:"all"},{text:"Vorraum – Wasserhähne testen",days:"all"},{text:"Vorraum – Türgriff fest?",days:"all"},{text:"Vorraum – Türschließer funktioniert?",days:"all"},{text:"Vorraum – Handtuchhalter fest?",days:"all"},{text:"Vorraum – Alle Lichter gehen?",days:"all"},
    {text:"Toilettenraum – Toilettensitz fest?",days:"all"},{text:"Toilettenraum – Kleiderhaken vorhanden?",days:"all"},{text:"Toilettenraum – Türpuffer angebracht?",days:"all"},{text:"Toilettenraum – Aufkleber in der Toilette?",days:"all"},{text:"Toilettenraum – Toilettenpapierhalter i.O.?",days:"all"},
    {text:"Toilettenraum – Urinale i.O.?",days:"all"},{text:"Toilettenraum – Alle Spülungen gehen?",days:"all"},{text:"Toilettenraum – Trennwände auf festen Sitz geprüft?",days:"all"},{text:"Toilettenraum – Trennwand zwischen Urinalen fest?",days:"all"},{text:"Toilettenraum – Alle Lichter gehen?",days:"all"}]},
  { id:"wc_damen_1og", label:"Damen WC 1. OG", floor:"1. OG", icon:"🚺", color:"#ec4899", items:[
    {text:"Vorraum – Seifenspender testen",days:"all"},{text:"Vorraum – Wasserhähne testen",days:"all"},{text:"Vorraum – Türgriff fest?",days:"all"},{text:"Vorraum – Türschließer funktioniert?",days:"all"},{text:"Vorraum – Alle Lichter gehen?",days:"all"},{text:"Vorraum – Bildschirm funktioniert?",days:"all"},
    {text:"Toilettenraum – Toilettensitz fest?",days:"all"},{text:"Toilettenraum – Kleiderhaken vorhanden?",days:"all"},{text:"Toilettenraum – Türpuffer angebracht?",days:"all"},{text:"Toilettenraum – Aufkleber in der Toilette?",days:"all"},{text:"Toilettenraum – Toilettenpapierhalter i.O.?",days:"all"},
    {text:"Toilettenraum – Hygienebeutelspender i.O.?",days:"all"},{text:"Toilettenraum – Alle Spülungen gehen?",days:"all"},{text:"Toilettenraum – Trennwände auf festen Sitz geprüft?",days:"all"},{text:"Toilettenraum – Alle Lichter gehen?",days:"all"}]},
  { id:"terrasse_1og", label:"Terrasse 1. OG", floor:"1. OG", icon:"🌤️", color:"#22c55e", items:[
    {text:"Verschmutzungen beseitigt?",days:"all"},{text:"Alle Schirme i.O.?",days:"all"},{text:"Beleuchtung funktionsfähig?",days:"all"},{text:"Alles sauber?",days:"all"},{text:"Bodenplatten i.O.?",days:"all"}]},
  { id:"teeline_1og", label:"Tee Line 1. OG", floor:"1. OG", icon:"⛳", color:"#22c55e", items:[
    {text:"Alle Monitore funktionsfähig?",days:"all"},{text:"Alle Monitore an?",days:"all"},{text:"Alle Game Panel i.O.?",days:"all"},{text:"Alle Schläger da?",days:"all"},
    {text:"Abschlagmatten am Dispenser angeschoben?",days:"all"},{text:"Alle Dispenser abgeschlossen?",days:"all"},{text:"Haben alle Abschlagmatten 2 Tees?",days:"all"},
    {text:"Alle Heizungen funktionieren? (Sommer: Di prüfen)",days:"di"},{text:"Kein Kantenschutz an Bagstands abstehend?",days:"di"},{text:"Alle Stühle i.O.?",days:"di"},
    {text:"Absturzsicherung (Netz) i.O.?",days:"all"}]},
  { id:"bar_kueche_1og", label:"Bar, Küche & Common Area 1. OG", floor:"1. OG", icon:"🍔", color:"#f59e0b", items:[
    {text:"Lagerraum – Leitern an ihrem Platz?",days:"all"},{text:"Bar – Störung auf der Schankanlage?",days:"all"},{text:"Bar – Sichtkontrolle, alles OK?",days:"all"},
    {text:"Küche – Lüftung an?",days:"all"},{text:"Küche – Sichtkontrolle, alles OK?",days:"all"},
    {text:"Common Area – Alle Lampen gehen?",days:"all"},{text:"Common Area – Alle Bildschirme an mit Programm?",days:"all"},{text:"Common Area – Video Wall i.O.?",days:"all"}]},
  { id:"technik_eg", label:"Technikräume EG", floor:"EG", icon:"🔧", color:"#a855f7", items:[
    {text:"Elektroraum – Alle Sicherungen eingeschaltet?",days:"all"},{text:"Elektroraum – BMZ störungsfrei?",days:"all"},
    {text:"Heizraum – Störungsfrei?",days:"all"},{text:"Wasserraum – Salz aufgefüllt?",days:"all"},{text:"Wasserraum – Genügend Salz vorhanden?",days:"all"},{text:"Wasserraum – Rest störungsfrei?",days:"all"}]},
  { id:"wc_herren_eg", label:"Herren WC EG", floor:"EG", icon:"🚹", color:"#38bdf8", items:[
    {text:"Vorraum – Seifenspender testen",days:"all"},{text:"Vorraum – Wasserhähne testen",days:"all"},{text:"Vorraum – Türgriff fest?",days:"all"},{text:"Vorraum – Türschließer funktioniert?",days:"all"},{text:"Vorraum – Handtuchhalter fest?",days:"all"},{text:"Vorraum – Alle Lichter gehen?",days:"all"},
    {text:"Toilettenraum – Toilettensitz fest?",days:"all"},{text:"Toilettenraum – Kleiderhaken vorhanden?",days:"all"},{text:"Toilettenraum – Türpuffer angebracht?",days:"all"},{text:"Toilettenraum – Aufkleber in der Toilette?",days:"all"},{text:"Toilettenraum – Toilettenpapierhalter i.O.?",days:"all"},
    {text:"Toilettenraum – Urinale i.O.?",days:"all"},{text:"Toilettenraum – Alle Spülungen gehen?",days:"all"},{text:"Toilettenraum – Trennwände auf festen Sitz geprüft?",days:"all"},{text:"Toilettenraum – Trennwand zwischen Urinalen fest?",days:"all"},{text:"Toilettenraum – Alle Lichter gehen?",days:"all"}]},
  { id:"wc_damen_eg", label:"Damen WC EG", floor:"EG", icon:"🚺", color:"#ec4899", items:[
    {text:"Vorraum – Seifenspender testen",days:"all"},{text:"Vorraum – Wasserhähne testen",days:"all"},{text:"Vorraum – Türgriff fest?",days:"all"},{text:"Vorraum – Türschließer funktioniert?",days:"all"},{text:"Vorraum – Alle Lichter gehen?",days:"all"},{text:"Vorraum – Bildschirm funktioniert?",days:"all"},
    {text:"Toilettenraum – Toilettensitz fest?",days:"all"},{text:"Toilettenraum – Kleiderhaken vorhanden?",days:"all"},{text:"Toilettenraum – Türpuffer angebracht?",days:"all"},{text:"Toilettenraum – Aufkleber in der Toilette?",days:"all"},{text:"Toilettenraum – Toilettenpapierhalter i.O.?",days:"all"},
    {text:"Toilettenraum – Hygienebeutelspender i.O.?",days:"all"},{text:"Toilettenraum – Alle Spülungen gehen?",days:"all"},{text:"Toilettenraum – Trennwände auf festen Sitz geprüft?",days:"all"},{text:"Toilettenraum – Alle Lichter gehen?",days:"all"},
    {text:"Behindertentoilette – Notrufanlage funktioniert?",days:"do"},{text:"Behindertentoilette – Toilette und Griffe fest?",days:"do"},{text:"Behindertentoilette – Wickeltisch richtig befestigt?",days:"do"}]},
  { id:"bar_eg", label:"Bar, Lager & Tee Line EG", floor:"EG", icon:"🏌️", color:"#f59e0b", items:[
    {text:"Lager – Leitern an ihrem Platz?",days:"all"},{text:"Lager – CO2 Flaschen i.O.?",days:"all"},{text:"Lager – Genügend CO2 Flaschen vorhanden?",days:"all"},{text:"Lager – CO2 Konzentration im Kühlhaus i.O.?",days:"all"},
    {text:"Tee Line – Alle Monitore funktionsfähig?",days:"all"},{text:"Tee Line – Alle Monitore an?",days:"all"},{text:"Tee Line – Alle Game Panel i.O.?",days:"all"},{text:"Tee Line – Alle Schläger da?",days:"all"},
    {text:"Tee Line – Abschlagmatten am Dispenser angeschoben?",days:"all"},{text:"Tee Line – Alle Dispenser abgeschlossen?",days:"all"},{text:"Tee Line – Haben alle Abschlagmatten 2 Tees?",days:"all"},
    {text:"Bar – Störung auf der Schankanlage?",days:"all"},{text:"Bar – Sichtkontrolle, alles OK?",days:"all"},
    {text:"Common Area – Alle Lampen gehen?",days:"all"},{text:"Common Area – Alle Bildschirme an mit Programm?",days:"all"},{text:"Common Area – Regenschirme aufgefüllt?",days:"all"},{text:"Common Area – Schrankenanlage störungsfrei?",days:"all"},
    {text:"Terrasse EG – Verschmutzungen beseitigt?",days:"all"},{text:"Terrasse EG – Alle Schirme i.O.?",days:"all"},{text:"Terrasse EG – Beleuchtung funktionsfähig?",days:"all"},{text:"Terrasse EG – Alles sauber?",days:"all"}]},
  { id:"dach", label:"Dachgeschoss", floor:"DG", icon:"🏗️", color:"#64748b", items:[
    {text:"Dach frei von Müll?",days:"so"},{text:"Alle Abflüsse sauber?",days:"so"},
    {text:"Küchenabluft – Taschenfilter i.O.? (ggf. wechseln)",days:"mi"},{text:"Küchenabluft – Filter Küchenzuluft (Blech) tauschen",days:"mi"},{text:"Küchenabluft – Filter in die Küche gebracht?",days:"mi"}]},
  { id:"aussen", label:"Außenbereiche", floor:"Außen", icon:"🌿", color:"#10b981", items:[
    {text:"Parkplatz – Schirme aufgefüllt?",days:"all"},{text:"Parkplatz – Schrankenanlage + Kassenautomat i.O.?",days:"all"},{text:"Parkplatz – Schmutz entfernt?",days:"all"},
    {text:"Entertainmentwalk – Saubergemacht?",days:"all"},
    {text:"Höhenkontrolle – Golfbälle noch dran?",days:"mo_di_sa"},{text:"Höhenkontrolle – Unbeschädigt?",days:"mo_di_sa"},
    {text:"Wiener Straße – Müll aus der Hecke entfernt?",days:"mi"},{text:"Wiener Straße – Gehweg gereinigt?",days:"mi"},
    {text:"Lieferanteneinfahrt – Alles sauber?",days:"mo_mi_sa"},{text:"Lieferanteneinfahrt – Feuerwehrumkehr gereinigt?",days:"mo_mi_sa"},
    {text:"Grünanlagen – Alle Rasenflächen ordentlich?",days:"all"},
    {text:"Serverraum – Checken",days:"mi"}]},
];

// Techniker Kategorien
const TECH_CATEGORIES = ["Elektro / Beleuchtung","Heizung / Klima","Sanitär / Wasser","Tee Line / Technik","Bar / Küche","Gebäude / Bausubstanz","IT / AV / Monitore","Außenanlage","Sonstiges"];
const PRIORITY_LEVELS = [{label:"Niedrig",color:"#22c55e",icon:"🟢"},{label:"Mittel",color:"#f59e0b",icon:"🟡"},{label:"Hoch",color:"#ef4444",icon:"🔴"}];

const DAY_IDX_KEY = ["so","mo","di","mi","do","fr","sa"];
const DAY_NAMES   = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

function itemActiveToday(item, di) {
  if (item.days==="all") return true;
  const dk = DAY_IDX_KEY[di];
  if (item.days==="so") return di===0;
  return item.days.split("_").includes(dk);
}
function getZonesToday(di) {
  return ZONES.map(z=>({...z,items:z.items.filter(it=>itemActiveToday(it,di))})).filter(z=>z.items.length>0);
}
function nowStr() { return new Date().toLocaleString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function todayStr() { return new Date().toLocaleDateString("de-AT"); }
function statusColor(s) { return s==="ok"?"#22c55e":s==="mangel"?"#ef4444":"#475569"; }

function PhotoCapture({ onPhoto, photo }) {
  const ref = useRef();
  return (
    <div style={{marginTop:6}}>
      {photo ? (
        <div style={{position:"relative",display:"inline-block"}}>
          <img src={photo} alt="" style={{width:80,height:60,objectFit:"cover",borderRadius:8,border:"2px solid #22c55e"}}/>
          <button onClick={()=>onPhoto(null)} style={{position:"absolute",top:-6,right:-6,background:"#ef4444",color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,fontSize:10,cursor:"pointer"}}>✕</button>
        </div>
      ) : (
        <button onClick={()=>ref.current.click()} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"1px dashed #475569",background:"transparent",color:"#94a3b8",cursor:"pointer"}}>📷 Foto</button>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{display:"none"}}
        onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onPhoto(ev.target.result);r.readAsDataURL(f);}}/>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function App() {
  const todayDI    = new Date().getDay();
  const todayZones = getZonesToday(todayDI);

  const [view, setView]               = useState("home");
  const [staffName, setStaffName]     = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinInput, setPinInput]       = useState("");
  const [pinError, setPinError]       = useState(false);
  const ADMIN_PIN = "1701";

  // Checklist state
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [checks, setChecks]   = useState({});
  const [photos, setPhotos]   = useState({});
  const [notes, setNotes]     = useState({});
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [floorFilter, setFloorFilter] = useState("all");

  // Techniker state
  const [techName, setTechName]           = useState("");
  const [techCategory, setTechCategory]   = useState(TECH_CATEGORIES[0]);
  const [techPriority, setTechPriority]   = useState(1);
  const [techLocation, setTechLocation]   = useState("");
  const [techDesc, setTechDesc]           = useState("");
  const [techPhoto, setTechPhoto]         = useState(null);
  const [techSubmitting, setTechSubmitting] = useState(false);
  const [techFilter, setTechFilter]       = useState("all"); // all | open | done

  // Persistent data
  const [inspections, setInspections] = useState([]);
  const [techTickets, setTechTickets] = useState([]);
  const [alerts, setAlerts]           = useState([]);
  const [toast, setToast]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const [histExp, setHistExp]         = useState(null);

  useEffect(() => {
    loadData("tg4-inspections").then(setInspections);
    loadData("tg4-tickets").then(setTechTickets);
    loadData("tg4-alerts").then(setAlerts);
  }, []);

  function showToast(msg, color="#22c55e") { setToast({msg,color}); setTimeout(()=>setToast(null),3500); }

  // GPS
  function getGPS() {
    setGpsStatus("loading");
    navigator.geolocation?.getCurrentPosition(
      p=>{setGpsCoords({lat:p.coords.latitude.toFixed(5),lng:p.coords.longitude.toFixed(5)});setGpsStatus("ok");},
      ()=>setGpsStatus("error")
    );
  }

  // PIN
  function handlePin(digit) {
    const next = pinInput + digit;
    setPinInput(next); setPinError(false);
    if (next.length===4) {
      if (next===ADMIN_PIN) { setAdminUnlocked(true); setPinInput(""); }
      else { setPinError(true); setTimeout(()=>setPinInput(""),600); }
    }
  }

  // ── Checklist submit ───────────────────────────────────────────────────────
  function startInspection(zoneId) {
    setActiveZoneId(zoneId); setChecks({}); setPhotos({}); setNotes({});
    getGPS(); setView("inspect");
  }

  async function submitInspection() {
    setSaving(true);
    const zone = todayZones.find(z=>z.id===activeZoneId);
    const sn   = staffName.trim()||"Unbekannt";
    const itemResults = zone.items.map((item,idx)=>({
      item:item.text, status:checks[`${zone.id}-${idx}`]||"offen",
      photo:photos[`${zone.id}-${idx}`]||null, note:notes[`${zone.id}-${idx}`]||"",
    }));
    const hasMangel = itemResults.some(r=>r.status==="mangel");
    const allDone   = itemResults.every(r=>r.status!=="offen");
    const entry = {
      id:Date.now(), zone:zone.id, zoneLabel:zone.label, zoneIcon:zone.icon, floor:zone.floor,
      staff:sn, timestamp:nowStr(), date:todayStr(), dayName:DAY_NAMES[todayDI], gps:gpsCoords,
      items:itemResults, status:!allDone?"Unvollständig":hasMangel?"Mängel":"Bestanden",
    };
    const updated = [entry,...inspections];
    setInspections(updated); await saveData("tg4-inspections", updated);

    if (hasMangel) {
      const na = itemResults.filter(r=>r.status==="mangel").map(r=>({
        id:Date.now()+Math.random(), zone:zone.label, item:r.item, staff:sn, timestamp:nowStr(), read:false,
      }));
      const ua = [...na,...alerts]; setAlerts(ua); await saveData("tg4-alerts", ua);

      // E-Mail sofort bei Mängeln
      const mangelList = itemResults.filter(r=>r.status==="mangel").map(r=>`• ${r.item}${r.note?" – "+r.note:""}`).join("\n");
      await sendEmail(
        `🔴 Neue Mängel: ${zone.label} – ${todayStr()}`,
        `Topgolf Wien – Facility Rundgang\n\nMitarbeiter: ${sn}\nZone: ${zone.label} (${zone.floor})\nZeitpunkt: ${nowStr()}\n\nGefundene Mängel:\n${mangelList}\n\nBitte zeitnah prüfen.`
      );
    }
    setSaving(false);
    showToast(hasMangel?"⚠️ Mängel gemeldet & E-Mail versendet!":"✅ Rundgang abgeschlossen!");
    setView("home");
  }

  // ── Techniker ticket submit ────────────────────────────────────────────────
  async function submitTechTicket() {
    if (!techName.trim() || !techDesc.trim() || !techLocation.trim()) {
      showToast("Bitte Name, Ort und Beschreibung ausfüllen.", "#ef4444"); return;
    }
    setTechSubmitting(true);
    const prio = PRIORITY_LEVELS[techPriority];
    const ticket = {
      id: Date.now(), name:techName.trim(), category:techCategory,
      priority:techPriority, priorityLabel:prio.label, priorityColor:prio.color,
      location:techLocation.trim(), description:techDesc.trim(),
      photo:techPhoto, timestamp:nowStr(), date:todayStr(), status:"offen",
    };
    const updated = [ticket,...techTickets];
    setTechTickets(updated); await saveData("tg4-tickets", updated);

    // E-Mail sofort
    await sendEmail(
      `${prio.icon} Techniker-Störung [${prio.label}]: ${techCategory} – ${techLocation.trim()}`,
      `Topgolf Wien – Techniker Meldung\n\nGemeldet von: ${techName.trim()}\nKategorie: ${techCategory}\nPriorität: ${prio.label}\nOrt/Zone: ${techLocation.trim()}\nZeitpunkt: ${nowStr()}\n\nBeschreibung:\n${techDesc.trim()}\n\nBitte in der App unter Techniker > Störungen nachverfolgen.`
    );

    setTechName(""); setTechDesc(""); setTechLocation(""); setTechPhoto(null); setTechCategory(TECH_CATEGORIES[0]); setTechPriority(1);
    setTechSubmitting(false);
    showToast("✅ Störung gemeldet & E-Mail versendet!");
  }

  async function closeTechTicket(id) {
    const updated = techTickets.map(t=>t.id===id?{...t,status:"erledigt",closedAt:nowStr()}:t);
    setTechTickets(updated); await saveData("tg4-tickets", updated);
    showToast("✅ Ticket als erledigt markiert");
  }

  // Derived
  const todayInspections = inspections.filter(i=>i.date===todayStr());
  const completedIds     = new Set(todayInspections.map(i=>i.zone));
  const unread           = alerts.filter(a=>!a.read).length;
  const openTickets      = techTickets.filter(t=>t.status==="offen").length;
  const floors           = ["all",...Array.from(new Set(todayZones.map(z=>z.floor)))];
  const visZones         = floorFilter==="all"?todayZones:todayZones.filter(z=>z.floor===floorFilter);
  const visTickets       = techFilter==="all"?techTickets:techTickets.filter(t=>t.status===techFilter);

  // ── Styles ────────────────────────────────────────────────────────────────
  const C = {
    app:{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#06090f",minHeight:"100vh",color:"#dde4ef",maxWidth:500,margin:"0 auto",paddingBottom:90},
    hdr:{background:"#08111d",padding:"13px 16px 10px",borderBottom:"1px solid #111e2e",position:"sticky",top:0,zIndex:100},
    card:{background:"#0c1625",borderRadius:14,padding:14,marginBottom:10,border:"1px solid #111e2e"},
    inp:{background:"#06090f",border:"1px solid #111e2e",borderRadius:10,padding:"9px 12px",color:"#dde4ef",fontSize:13,width:"100%",boxSizing:"border-box"},
    pill:(a,c="#22c55e")=>({padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:a?c:"#111e2e",color:a?"#06090f":"#64748b",transition:"all 0.15s"}),
    btn:(c="#22c55e")=>({background:c,color:c==="#22c55e"?"#06090f":"#fff",border:"none",borderRadius:12,padding:"12px 0",fontWeight:800,fontSize:15,cursor:"pointer",width:"100%",marginTop:8}),
    nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:"#06090f",borderTop:"1px solid #111e2e",display:"flex",padding:"7px 0 13px",zIndex:200},
    navBtn:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:a?"#22c55e":"#3d4f63",fontSize:9,fontWeight:700}),
    label:{fontSize:11,color:"#3d5166",marginBottom:5,letterSpacing:0.8,textTransform:"uppercase",display:"block"},
  };

  // ── PIN Screen ────────────────────────────────────────────────────────────
  function PinView() {
    return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"70vh",padding:24}}>
      <div style={{fontSize:32,marginBottom:8}}>🔒</div>
      <div style={{fontWeight:800,fontSize:18,marginBottom:4}}>Manager-Bereich</div>
      <div style={{fontSize:12,color:"#3d5166",marginBottom:28}}>Bitte PIN eingeben</div>
      <div style={{display:"flex",gap:14,marginBottom:pinError?8:28}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:18,height:18,borderRadius:"50%",background:pinError?"#ef4444":i<pinInput.length?"#22c55e":"#111e2e",border:`2px solid ${pinError?"#ef4444":i<pinInput.length?"#22c55e":"#1e2e3e"}`,transition:"all 0.15s"}}/>
        ))}
      </div>
      {pinError&&<div style={{fontSize:12,color:"#ef4444",marginBottom:16}}>Falscher PIN</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:220}}>
        {[1,2,3,4,5,6,7,8,9].map(d=>(
          <button key={d} onClick={()=>handlePin(String(d))} style={{height:58,borderRadius:14,border:"1px solid #111e2e",background:"#0c1625",color:"#dde4ef",fontSize:22,fontWeight:700,cursor:"pointer"}}>{d}</button>
        ))}
        <div/>
        <button onClick={()=>handlePin("0")} style={{height:58,borderRadius:14,border:"1px solid #111e2e",background:"#0c1625",color:"#dde4ef",fontSize:22,fontWeight:700,cursor:"pointer"}}>0</button>
        <button onClick={()=>setPinInput(p=>p.slice(0,-1))} style={{height:58,borderRadius:14,border:"1px solid #111e2e",background:"#0c1625",color:"#94a3b8",fontSize:20,cursor:"pointer"}}>⌫</button>
      </div>
    </div>;
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  function HomeView() {
    return <div style={{padding:16}}>
      <div style={{...C.card,background:"linear-gradient(135deg,#04150a,#06101e)",border:"1px solid #0e2615"}}>
        <div style={{fontSize:11,color:"#3d5166",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>{DAY_NAMES[todayDI]} · {todayStr()}</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[{l:"Zonen",v:`${completedIds.size}/${todayZones.length}`},{l:"Rundgänge",v:todayInspections.length},{l:"Störungen offen",v:openTickets}].map(s=>(
            <div key={s.l} style={{flex:1,background:"#08111d",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"1px solid #111e2e"}}>
              <div style={{fontSize:20,fontWeight:800,color:"#22c55e"}}>{s.v}</div>
              <div style={{fontSize:10,color:"#3d5166",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {todayZones.map(z=><div key={z.id} title={z.label} style={{flex:"1 0 12px",height:5,borderRadius:3,background:completedIds.has(z.id)?z.color:"#111e2e",minWidth:10,maxWidth:26}}/>)}
        </div>
      </div>

      {(unread>0||openTickets>0)&&<div style={{display:"flex",gap:8,marginBottom:10}}>
        {unread>0&&<div style={{...C.card,flex:1,border:"1px solid #ef444430",background:"#120609",display:"flex",alignItems:"center",gap:10,cursor:"pointer",margin:0}} onClick={()=>setView("dashboard")}>
          <span style={{fontSize:20}}>🚨</span>
          <div><div style={{fontWeight:700,color:"#ef4444",fontSize:13}}>{unread} Mängel</div><div style={{fontSize:10,color:"#94a3b8"}}>Dashboard</div></div>
        </div>}
        {openTickets>0&&<div style={{...C.card,flex:1,border:"1px solid #f59e0b30",background:"#120e04",display:"flex",alignItems:"center",gap:10,cursor:"pointer",margin:0}} onClick={()=>setView("techniker")}>
          <span style={{fontSize:20}}>🔧</span>
          <div><div style={{fontWeight:700,color:"#f59e0b",fontSize:13}}>{openTickets} Störungen</div><div style={{fontSize:10,color:"#94a3b8"}}>Techniker</div></div>
        </div>}
      </div>}

      <div style={C.card}>
        <span style={C.label}>Mitarbeiter Name</span>
        <input value={staffName} onChange={e=>setStaffName(e.target.value)} placeholder="Vor- und Nachname eingeben..." style={C.inp}/>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {floors.map(f=><button key={f} style={C.pill(floorFilter===f)} onClick={()=>setFloorFilter(f)}>{f==="all"?"Alle":f}</button>)}
      </div>

      <span style={{...C.label,display:"block",marginBottom:8}}>Zone auswählen</span>
      {visZones.map(z=>{
        const done=completedIds.has(z.id);
        const res=todayInspections.find(i=>i.zone===z.id);
        return <div key={z.id} onClick={()=>startInspection(z.id)} style={{background:"#0c1625",borderRadius:13,padding:12,marginBottom:8,border:`1px solid ${done?z.color+"44":"#111e2e"}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:11,background:z.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{z.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13}}>{z.label}</div>
            <div style={{fontSize:11,color:"#3d5166",marginTop:2}}>{z.floor} · {z.items.length} Punkte
              {done&&<span style={{marginLeft:6,color:res?.status==="Mängel"?"#ef4444":"#22c55e"}}>{res?.status==="Mängel"?"⚠️ Mängel":"✓ OK"}</span>}
            </div>
          </div>
          <span style={{color:"#1e2e3e",fontSize:18}}>›</span>
        </div>;
      })}
    </div>;
  }

  // ── INSPECT ───────────────────────────────────────────────────────────────
  function InspectView() {
    const zone=todayZones.find(z=>z.id===activeZoneId);
    if(!zone)return null;
    const sn=staffName.trim()||"Unbekannt";
    const progress=zone.items.filter((_,idx)=>checks[`${zone.id}-${idx}`]).length;
    return <div style={{padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <button onClick={()=>setView("home")} style={{background:"#111e2e",border:"none",borderRadius:10,padding:"8px 13px",color:"#94a3b8",cursor:"pointer",fontSize:16}}>‹</button>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:16}}>{zone.icon} {zone.label}</div>
          <div style={{fontSize:11,color:"#3d5166"}}>{sn} · {zone.floor} · {progress}/{zone.items.length}</div>
        </div>
      </div>
      <div style={{...C.card,display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:10}}>
        <span>📍</span>
        <div style={{fontSize:11,color:gpsStatus==="ok"?"#22c55e":gpsStatus==="error"?"#ef4444":"#3d5166",flex:1}}>
          {gpsStatus==="ok"?`${gpsCoords.lat}, ${gpsCoords.lng}`:gpsStatus==="loading"?"GPS wird ermittelt...":"GPS nicht verfügbar"}
        </div>
        {gpsStatus!=="ok"&&<button onClick={getGPS} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"1px solid #111e2e",background:"transparent",color:"#64748b",cursor:"pointer"}}>↻</button>}
      </div>
      <div style={{height:4,background:"#111e2e",borderRadius:4,marginBottom:14}}>
        <div style={{height:"100%",borderRadius:4,background:zone.color,width:`${(progress/zone.items.length)*100}%`,transition:"width 0.3s"}}/>
      </div>
      {zone.items.map((item,idx)=>{
        const key=`${zone.id}-${idx}`;
        const status=checks[key];
        return <div key={idx} style={{...C.card,marginBottom:10}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10,lineHeight:1.4,color:"#c8d4e3"}}>{item.text}</div>
          <div style={{display:"flex",gap:8}}>
            {["ok","mangel"].map(s=>(
              <button key={s} onClick={()=>setChecks(p=>({...p,[key]:status===s?null:s}))} style={{
                flex:1,padding:"9px 0",borderRadius:10,border:`2px solid ${status===s?statusColor(s):"#111e2e"}`,
                background:status===s?statusColor(s)+"20":"transparent",color:status===s?statusColor(s):"#3d5166",
                fontWeight:700,fontSize:12,cursor:"pointer",
              }}>{s==="ok"?"✓ OK":"✗ Mangel"}</button>
            ))}
          </div>
          {status==="mangel"&&<div style={{marginTop:10}}>
            <textarea placeholder="Beschreibung des Mangels..." value={notes[key]||""} onChange={e=>setNotes(p=>({...p,[key]:e.target.value}))}
              style={{...C.inp,minHeight:52,resize:"vertical",fontSize:12,marginBottom:6}}/>
            <PhotoCapture photo={photos[key]} onPhoto={v=>setPhotos(p=>({...p,[key]:v}))}/>
          </div>}
        </div>;
      })}
      <button style={C.btn()} onClick={submitInspection} disabled={saving}>
        {saving?"Wird gespeichert...":"✓ Rundgang abschließen"}
      </button>
      <div style={{height:16}}/>
    </div>;
  }

  // ── TECHNIKER ─────────────────────────────────────────────────────────────
  function TechnikerView() {
    const [subView, setSubView] = useState("neu"); // neu | liste
    return <div style={{padding:16}}>
      <div style={{fontWeight:800,fontSize:18,marginBottom:14}}>🔧 Techniker</div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button style={C.pill(subView==="neu")} onClick={()=>setSubView("neu")}>+ Neue Meldung</button>
        <button style={{...C.pill(subView==="liste"),position:"relative"}} onClick={()=>setSubView("liste")}>
          Störungen {openTickets>0&&<span style={{marginLeft:4,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:800}}>{openTickets}</span>}
        </button>
      </div>

      {subView==="neu"&&<div>
        <div style={C.card}>
          <span style={C.label}>Dein Name *</span>
          <input value={techName} onChange={e=>setTechName(e.target.value)} placeholder="Vor- und Nachname" style={{...C.inp,marginBottom:12}}/>

          <span style={C.label}>Kategorie</span>
          <select value={techCategory} onChange={e=>setTechCategory(e.target.value)} style={{...C.inp,marginBottom:12}}>
            {TECH_CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>

          <span style={C.label}>Priorität</span>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {PRIORITY_LEVELS.map((p,i)=>(
              <button key={i} onClick={()=>setTechPriority(i)} style={{
                flex:1,padding:"8px 0",borderRadius:10,border:`2px solid ${techPriority===i?p.color:"#111e2e"}`,
                background:techPriority===i?p.color+"22":"transparent",color:techPriority===i?p.color:"#3d5166",
                fontWeight:700,fontSize:12,cursor:"pointer",
              }}>{p.icon} {p.label}</button>
            ))}
          </div>

          <span style={C.label}>Ort / Zone *</span>
          <input value={techLocation} onChange={e=>setTechLocation(e.target.value)} placeholder="z.B. Tee Line 2. OG, Bay 12" style={{...C.inp,marginBottom:12}}/>

          <span style={C.label}>Beschreibung der Störung *</span>
          <textarea value={techDesc} onChange={e=>setTechDesc(e.target.value)} placeholder="Was ist defekt? Was wurde beobachtet? Seit wann?" rows={4}
            style={{...C.inp,resize:"vertical",marginBottom:12}}/>

          <span style={C.label}>Foto (optional)</span>
          <PhotoCapture photo={techPhoto} onPhoto={setTechPhoto}/>
        </div>

        <button style={C.btn()} onClick={submitTechTicket} disabled={techSubmitting}>
          {techSubmitting?"Wird gesendet...":"📤 Störung melden & E-Mail senden"}
        </button>
      </div>}

      {subView==="liste"&&<div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[{k:"all",l:"Alle"},{k:"offen",l:"Offen"},{k:"erledigt",l:"Erledigt"}].map(f=>(
            <button key={f.k} style={C.pill(techFilter===f.k)} onClick={()=>setTechFilter(f.k)}>{f.l}</button>
          ))}
        </div>
        {visTickets.length===0&&<div style={{color:"#3d5166",textAlign:"center",padding:32}}>Keine Einträge</div>}
        {visTickets.map(t=>{
          const prio=PRIORITY_LEVELS[t.priority];
          return <div key={t.id} style={{...C.card,borderLeft:`3px solid ${t.status==="erledigt"?"#22c55e":prio.color}`}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:prio.color+"22",color:prio.color,fontWeight:700}}>{prio.icon} {prio.label}</span>
                  <span style={{fontSize:11,color:"#3d5166"}}>{t.category}</span>
                </div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{t.location}</div>
                <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.4,marginBottom:6}}>{t.description}</div>
                <div style={{fontSize:10,color:"#3d5166"}}>{t.name} · {t.timestamp}</div>
                {t.status==="erledigt"&&<div style={{fontSize:10,color:"#22c55e",marginTop:2}}>✓ Erledigt: {t.closedAt}</div>}
                {t.photo&&<img src={t.photo} alt="" style={{marginTop:8,width:70,height:52,objectFit:"cover",borderRadius:8}}/>}
              </div>
              {t.status==="offen"&&<button onClick={()=>closeTechTicket(t.id)} style={{background:"#0f2a0f",border:"1px solid #22c55e44",color:"#22c55e",borderRadius:10,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>✓ Erledigt</button>}
            </div>
          </div>;
        })}
      </div>}
    </div>;
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  function DashboardView() {
    const totalMangel=inspections.flatMap(i=>i.items).filter(i=>i.status==="mangel").length;
    const totalTickets=techTickets.length;
    async function markRead(){const u=alerts.map(a=>({...a,read:true}));setAlerts(u);await saveData("tg4-alerts",u);}

    // Täglicher Bericht manuell
    async function sendDailyReport() {
      const todayMangel = todayInspections.flatMap(i=>i.items.filter(it=>it.status==="mangel").map(it=>({...it,zone:i.zoneLabel,staff:i.staff})));
      const todayTicketList = techTickets.filter(t=>t.date===todayStr());
      let body = `Topgolf Wien – Tagesbericht ${todayStr()}\n\n`;
      body += `📋 RUNDGÄNGE HEUTE: ${todayInspections.length}\n`;
      body += `Abgeschlossene Zonen: ${completedIds.size}/${todayZones.length}\n\n`;
      if(todayMangel.length>0){
        body += `🔴 MÄNGEL HEUTE (${todayMangel.length}):\n`;
        todayMangel.forEach(m=>{body+=`• ${m.zone}: ${m.item}${m.note?" – "+m.note:""} (${m.staff})\n`;});
      } else { body+="✅ Keine Mängel heute.\n"; }
      body+="\n";
      if(todayTicketList.length>0){
        body+=`🔧 TECHNIKER-MELDUNGEN HEUTE (${todayTicketList.length}):\n`;
        todayTicketList.forEach(t=>{body+=`• [${t.priorityLabel}] ${t.category} – ${t.location}: ${t.description} (${t.name})\n`;});
      } else { body+="🔧 Keine Techniker-Meldungen heute.\n"; }
      const ok = await sendEmail(`📊 Tagesbericht Topgolf Wien – ${todayStr()}`, body);
      showToast(ok?"📧 Tagesbericht versendet!":"❌ E-Mail fehlgeschlagen – EmailJS prüfen", ok?"#22c55e":"#ef4444");
    }

    return <div style={{padding:16}}>
      <div style={{fontWeight:800,fontSize:18,marginBottom:14}}>Manager Dashboard</div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{l:"Rundgänge",v:inspections.length,c:"#22c55e"},{l:"Mängel",v:totalMangel,c:"#ef4444"},{l:"Störungen",v:totalTickets,c:"#f59e0b"}].map(s=>(
          <div key={s.l} style={{flex:1,background:"#0c1625",borderRadius:12,padding:"10px 6px",textAlign:"center",border:`1px solid ${s.c}22`}}>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:"#3d5166"}}>{s.l}</div>
          </div>
        ))}
      </div>

      <button onClick={sendDailyReport} style={{...C.btn("#0c2a3a"),border:"1px solid #38bdf844",color:"#38bdf8",marginBottom:14}}>
        📧 Tagesbericht jetzt senden
      </button>

      {/* Zone coverage */}
      <div style={C.card}>
        <span style={C.label}>Zonen heute ({DAY_NAMES[todayDI]})</span>
        {todayZones.map(z=>{
          const res=todayInspections.find(i=>i.zone===z.id);
          return <div key={z.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <span style={{fontSize:14,width:20}}>{z.icon}</span>
            <div style={{flex:1,fontSize:12,fontWeight:600}}>{z.label}</div>
            <span style={{fontSize:10,color:"#3d5166"}}>{z.floor}</span>
            <span style={{fontSize:13}}>{!res?"⬜":res.status==="Mängel"?"🔴":"✅"}</span>
          </div>;
        })}
      </div>

      {/* Open alerts */}
      {unread>0&&<div style={{...C.card,border:"1px solid #ef444422"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{...C.label,color:"#ef4444",margin:0}}>🚨 Offene Mängel ({unread})</span>
          <button onClick={markRead} style={{fontSize:11,padding:"3px 9px",borderRadius:6,border:"1px solid #111e2e",background:"transparent",color:"#64748b",cursor:"pointer"}}>Alle gelesen</button>
        </div>
        {alerts.filter(a=>!a.read).map(a=>(
          <div key={a.id} style={{background:"#120808",borderRadius:10,padding:"9px 11px",marginBottom:7,borderLeft:"3px solid #ef4444"}}>
            <div style={{fontWeight:600,fontSize:12}}>{a.item}</div>
            <div style={{fontSize:11,color:"#3d5166",marginTop:3}}>{a.zone} · {a.staff} · {a.timestamp}</div>
          </div>
        ))}
      </div>}

      {/* Open tickets */}
      {openTickets>0&&<div style={{...C.card,border:"1px solid #f59e0b22"}}>
        <span style={{...C.label,color:"#f59e0b",margin:0,marginBottom:10,display:"block"}}>🔧 Offene Störungen ({openTickets})</span>
        {techTickets.filter(t=>t.status==="offen").slice(0,5).map(t=>{
          const p=PRIORITY_LEVELS[t.priority];
          return <div key={t.id} style={{background:"#120e04",borderRadius:10,padding:"9px 11px",marginBottom:7,borderLeft:`3px solid ${p.color}`}}>
            <div style={{fontWeight:600,fontSize:12}}>{t.location} – {t.category}</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{t.description.slice(0,80)}{t.description.length>80?"...":""}</div>
            <div style={{fontSize:10,color:"#3d5166",marginTop:3}}>{p.icon} {p.label} · {t.name} · {t.timestamp}</div>
          </div>;
        })}
      </div>}

      {/* Recent inspections */}
      <span style={{...C.label,display:"block",marginBottom:8}}>Letzte Rundgänge</span>
      {inspections.slice(0,15).map(i=>(
        <div key={i.id} style={{...C.card,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>{i.zoneIcon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13}}>{i.zoneLabel}</div>
              <div style={{fontSize:11,color:"#3d5166"}}>{i.dayName||""} · {i.staff} · {i.timestamp}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:i.status==="Bestanden"?"#22c55e":i.status==="Mängel"?"#ef4444":"#f59e0b"}}>{i.status}</span>
          </div>
        </div>
      ))}
      {inspections.length===0&&<div style={{color:"#3d5166",textAlign:"center",padding:24}}>Noch keine Rundgänge</div>}
    </div>;
  }

  // ── HISTORY ───────────────────────────────────────────────────────────────
  function HistoryView() {
    return <div style={{padding:16}}>
      <div style={{fontWeight:800,fontSize:18,marginBottom:14}}>Verlauf</div>
      {inspections.map(i=>(
        <div key={i.id} style={{...C.card,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setHistExp(histExp===i.id?null:i.id)}>
            <span style={{fontSize:18}}>{i.zoneIcon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13}}>{i.zoneLabel}</div>
              <div style={{fontSize:11,color:"#3d5166"}}>{i.dayName||""} · {i.staff} · {i.timestamp}</div>
              {i.gps&&<div style={{fontSize:10,color:"#334155"}}>📍 {i.gps.lat}, {i.gps.lng}</div>}
            </div>
            <span style={{fontSize:11,fontWeight:700,color:i.status==="Bestanden"?"#22c55e":i.status==="Mängel"?"#ef4444":"#f59e0b"}}>{i.status}</span>
          </div>
          {histExp===i.id&&<div style={{marginTop:10,borderTop:"1px solid #111e2e",paddingTop:10}}>
            {i.items.map((it,idx)=>(
              <div key={idx} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                <span style={{fontSize:12,marginTop:1}}>{it.status==="ok"?"✅":it.status==="mangel"?"🔴":"⬜"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#b0bec5"}}>{it.item}</div>
                  {it.note&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{it.note}</div>}
                  {it.photo&&<img src={it.photo} alt="" style={{marginTop:4,width:60,height:45,objectFit:"cover",borderRadius:6}}/>}
                </div>
              </div>
            ))}
          </div>}
        </div>
      ))}
      {inspections.length===0&&<div style={{color:"#3d5166",textAlign:"center",padding:32}}>Noch keine Einträge</div>}
    </div>;
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  const NAV = [
    {id:"home",   icon:"🏠", l:"Rundgang"},
    {id:"techniker",icon:"🔧",l:"Techniker"},
    {id:"dashboard",icon:"📊",l:"Dashboard"},
    {id:"history",icon:"📋",l:"Verlauf"},
  ];

  return <div style={C.app}>
    <div style={C.hdr}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:28,height:28,borderRadius:8,background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⛳</div>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"#fff",letterSpacing:-0.3}}>Topgolf Inspect</div>
          <div style={{fontSize:9,color:"#1e3a28",letterSpacing:1.2,textTransform:"uppercase"}}>Greenreb · Facility Management</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          {unread>0&&<div style={{background:"#ef4444",color:"#fff",borderRadius:10,padding:"2px 7px",fontSize:10,fontWeight:800}}>{unread} Mängel</div>}
          {openTickets>0&&<div style={{background:"#f59e0b",color:"#06090f",borderRadius:10,padding:"2px 7px",fontSize:10,fontWeight:800}}>{openTickets} Störungen</div>}
          {adminUnlocked&&<button onClick={()=>setAdminUnlocked(false)} style={{fontSize:10,padding:"3px 8px",borderRadius:7,border:"1px solid #1e2e3e",background:"transparent",color:"#3d5166",cursor:"pointer"}}>🔓</button>}
        </div>
      </div>
    </div>

    {view==="home"      && <HomeView/>}
    {view==="inspect"   && <InspectView/>}
    {view==="techniker" && <TechnikerView/>}
    {view==="dashboard" && (adminUnlocked ? <DashboardView/> : <PinView/>)}
    {view==="history"   && (adminUnlocked ? <HistoryView/>   : <PinView/>)}

    {view!=="inspect"&&<nav style={C.nav}>
      {NAV.map(n=>(
        <button key={n.id} style={C.navBtn(view===n.id)} onClick={()=>setView(n.id)}>
          <span style={{fontSize:19}}>{n.icon}</span>{n.l}
        </button>
      ))}
    </nav>}

    {toast&&<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#0c1625",color:"#dde4ef",border:`1px solid ${toast.color}55`,padding:"11px 18px",borderRadius:12,fontWeight:700,fontSize:13,zIndex:300,whiteSpace:"nowrap",boxShadow:"0 8px 24px rgba(0,0,0,0.6)"}}>
      {toast.msg}
    </div>}
  </div>;
}
