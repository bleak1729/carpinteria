import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Users, Folder, FileText,
  Plus, Search, Edit2, Trash2, X, Menu, ChevronRight,
  Check, AlertTriangle, Download, Hammer, Coffee, Fuel,
  ChevronDown, ChevronUp, RefreshCw, Building2, LogOut,
  LogIn, Upload, Eye, EyeOff, Save
} from "lucide-react";

// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SB_URL || "https://xrgxeepcdbobtswndppi.supabase.co";
const SB_KEY = import.meta.env.VITE_SB_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZ3hlZXBjZGJvYnRzd25kcHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjgyOTcsImV4cCI6MjA5MTA0NDI5N30.jrUAE1T-GpVDZ1aW3TasMXOWrPYeF4fdtyO-VIwDK7E";

// ─── SUPABASE CLIENT ───────────────────────────────────────────────────────────
const sb = {
  _token: null,
  get headers() {
    const auth = this._token || SB_KEY;
    return { "apikey": SB_KEY, "Authorization": "Bearer " + auth, "Content-Type": "application/json", "Prefer": "return=representation" };
  },
  setToken(t) { this._token = t; },
  clearToken() { this._token = null; },

  async get(table, order = "created_at") {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?order=${order}.asc`, { headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async getOne(table) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?limit=1`, { headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    return d[0] || null;
  },
  async insert(table, data) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: this.headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    const res = await r.json();
    return Array.isArray(res) ? res[0] : res;
  },
  async update(table, id, data) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: this.headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    const res = await r.json();
    return Array.isArray(res) ? res[0] : res;
  },
  async updateWhere(table, data) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "PATCH", headers: { ...this.headers, "Prefer": "return=representation" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
  },

  // ─── AUTH ────────────────────────────────────────────────────────────────────
  async signIn(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.msg || "Credenciales incorrectas");
    return data;
  },
  async signOut(token) {
    await fetch(`${SB_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + token }
    });
  },
  async uploadLogo(file, token) {
    const ext = file.name.split(".").pop();
    const path = `logo/empresa.${ext}`;
    const r = await fetch(`${SB_URL}/storage/v1/object/empresa-assets/${path}`, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + token, "Content-Type": file.type, "x-upsert": "true" },
      body: file
    });
    if (!r.ok) throw new Error("Error subiendo logo");
    return `${SB_URL}/storage/v1/object/public/empresa-assets/${path}?t=${Date.now()}`;
  }
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const fmt    = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const genId  = () => Math.random().toString(36).slice(2, 10);
const today  = () => new Date().toISOString().split("T")[0];

function useMedia() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const fn = () => setW(window.innerWidth); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  return { mobile: w < 640, tablet: w < 1024 };
}

// ─── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg:"#f5f0e8", white:"#ffffff", card:"#ffffff", cardAlt:"#fdf8f2",
  border:"#e2d9cc", borderDk:"#c8bfb0",
  amber:"#b5600a", amberBg:"#fef3e2", amberMid:"#e8a045",
  text:"#2c2018", sub:"#6b5a48", muted:"#9c8e80",
  green:"#2d7a3a", greenBg:"#edf7ef",
  red:"#c0392b",   redBg:"#fdf0ee",
  blue:"#1a5fa8",  blueBg:"#edf4fd",
  orange:"#c05c00",orangeBg:"#fef0e6",
};
const ESTADOS = {
  pendiente:   { label:"Pendiente",   color:T.orange, bg:T.orangeBg },
  en_progreso: { label:"En Progreso", color:T.blue,   bg:T.blueBg   },
  completado:  { label:"Completado",  color:T.green,  bg:T.greenBg  },
  cancelado:   { label:"Cancelado",   color:T.red,    bg:T.redBg    },
};
const BESTADOS = {
  borrador:  { label:"Borrador",  color:T.muted, bg:"#f4f0ec" },
  enviado:   { label:"Enviado",   color:T.blue,  bg:T.blueBg  },
  aprobado:  { label:"Aprobado",  color:T.green, bg:T.greenBg },
  rechazado: { label:"Rechazado", color:T.red,   bg:T.redBg   },
};
const TIPOS = { ml:"Metro Lineal", m2:"Metro Cuadrado", unidad:"Unidad" };

// ─── BASE STYLES ───────────────────────────────────────────────────────────────
const SI  = { width:"100%", padding:"10px 12px", borderRadius:8, background:T.white, border:"1.5px solid "+T.border, color:T.text, fontSize:15, fontFamily:"inherit" };
const BP  = { padding:"10px 18px", borderRadius:9, border:"none", cursor:"pointer", background:T.amber, color:"#fff", fontWeight:700, fontSize:14, fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:6 };
const BG  = { padding:"8px 12px", borderRadius:9, border:"1.5px solid "+T.border, cursor:"pointer", background:T.white, color:T.sub, fontSize:13, fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:5 };
const BSM = { ...BG, padding:"6px 9px", fontSize:12 };

// ─── ATOMS ─────────────────────────────────────────────────────────────────────
const Card  = ({ children, style }) => <div style={{ background:T.card, border:"1px solid "+T.border, borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(44,32,24,0.07)", ...style }}>{children}</div>;
const Badge = ({ label, color, bg }) => <span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600, color, background:bg, border:"1px solid "+color+"30", whiteSpace:"nowrap" }}>{label}</span>;
const Field = ({ label, children, style }) => <div style={{ marginBottom:13, ...style }}><label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:0.9 }}>{label}</label>{children}</div>;
const Row   = ({ children, cols, gap, style }) => <div style={{ display:"grid", gridTemplateColumns:cols||"1fr 1fr", gap:gap||12, ...style }}>{children}</div>;

function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type==="error" ? T.redBg : T.greenBg;
  const color = type==="error" ? T.red : T.green;
  return <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:bg, color, border:"1px solid "+color+"40", borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:600, zIndex:500, boxShadow:"0 4px 12px rgba(0,0,0,0.12)", whiteSpace:"nowrap" }}>{msg}</div>;
}

// ─── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, wide }) {
  const { mobile } = useMedia();
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(44,32,24,0.4)", display:"flex", alignItems:mobile?"flex-end":"center", justifyContent:"center", zIndex:400, padding:mobile?0:16, backdropFilter:"blur(2px)" }}>
      <div style={{ background:T.card, border:"1px solid "+T.border, borderRadius:mobile?"20px 20px 0 0":"16px", width:"100%", maxWidth:mobile?"100%":wide?860:540, maxHeight:"94vh", overflow:"auto", display:"flex", flexDirection:"column", boxShadow:"0 8px 32px rgba(44,32,24,0.15)" }}>
        {children}
      </div>
    </div>
  );
}
const MHead = ({ title, onClose }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid "+T.border, flexShrink:0 }}>
    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:19, color:T.text }}>{title}</span>
    <button onClick={onClose} style={{ background:"none", border:"1px solid "+T.border, borderRadius:7, cursor:"pointer", color:T.muted, padding:"4px 5px", display:"flex" }}><X size={16}/></button>
  </div>
);

function Section({ icon:Icon, color, bg, title, children, collapsible }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:bg||T.cardAlt, border:"1.5px solid "+color+"30", borderRadius:12, marginBottom:16 }}>
      <div onClick={collapsible?()=>setOpen(o=>!o):undefined} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", cursor:collapsible?"pointer":"default", borderBottom:open?"1px solid "+color+"20":"none", borderRadius:open?"12px 12px 0 0":"12px" }}>
        <div style={{ width:28, height:28, borderRadius:7, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={14} color={color}/></div>
        <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:15, color:T.text, flex:1 }}>{title}</span>
        {collapsible && (open ? <ChevronUp size={14} color={T.muted}/> : <ChevronDown size={14} color={T.muted}/>)}
      </div>
      {open && <div style={{ padding:"12px 14px" }}>{children}</div>}
    </div>
  );
}

// ─── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]   = useState("");
  const [pass,  setPass]    = useState("");
  const [show,  setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !pass) return;
    setLoading(true); setError("");
    try {
      const data = await sb.signIn(email, pass);
      onLogin(data);
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:56, height:56, background:T.amber, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 4px 12px rgba(181,96,10,0.3)" }}>
            <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, color:"#fff" }}>C</span>
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:26, color:T.text, margin:0 }}>Carpintería</h1>
          <p style={{ color:T.muted, fontSize:13, marginTop:4 }}>Gestión de Proyectos</p>
        </div>

        <Card style={{ padding:28 }}>
          <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, color:T.text, marginBottom:20, fontWeight:400 }}>Iniciar sesión</h2>
          <form onSubmit={submit}>
            <Field label="Email">
              <input style={SI} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@carpinteria.cl" autoComplete="email"/>
            </Field>
            <Field label="Contraseña">
              <div style={{ position:"relative" }}>
                <input style={{ ...SI, paddingRight:44 }} type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password"/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", padding:0 }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
            {error && <div style={{ padding:"9px 12px", borderRadius:8, background:T.redBg, color:T.red, fontSize:13, marginBottom:14, border:"1px solid "+T.red+"30" }}>{error}</div>}
            <button type="submit" style={{ ...BP, width:"100%", justifyContent:"center", opacity:loading?0.7:1 }} disabled={loading}>
              <LogIn size={15}/>{loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </Card>

        <p style={{ textAlign:"center", color:T.muted, fontSize:12, marginTop:16 }}>
          Solo usuarios registrados pueden acceder
        </p>
      </div>
    </div>
  );
}

// ─── EMPRESA VIEW ──────────────────────────────────────────────────────────────
function EmpresaView({ empresa, onUpdate, session }) {
  const { mobile } = useMedia();
  const [f, setF]         = useState(empresa || {});
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const up = (k,v) => setF(p=>({...p,[k]:v}));

  useEffect(() => { setF(empresa || {}); }, [empresa]);

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        nombre:      f.nombre      || "",
        descripcion: f.descripcion || "",
        email:       f.email       || "",
        telefono:    f.telefono    || "",
        direccion:   f.direccion   || "",
        sitio_web:   f.sitio_web   || "",
        rut:         f.rut         || "",
        color:       f.color       || "#b5600a",
        updated_at:  new Date().toISOString(),
      };
      await sb.update("empresa", f.id, data);
      onUpdate({ ...f, ...data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) { alert("Error al guardar: " + e.message); }
    setSaving(false);
  };

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("El logo debe ser menor a 2MB"); return; }
    setUploading(true);
    try {
      const url = await sb.uploadLogo(file, session.access_token);
      up("logo_url", url);
    } catch(err) {
      // Si falla storage, guardamos base64 local como fallback
      const reader = new FileReader();
      reader.onload = (ev) => up("logo_url", ev.target.result);
      reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, gap:10, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:mobile?24:30, color:T.text, lineHeight:1 }}>Mi Empresa</h1>
          <p style={{ color:T.muted, fontSize:13, marginTop:4 }}>Esta información aparece en los presupuestos PDF</p>
        </div>
        <button style={{ ...BP, opacity:saving?0.6:1 }} onClick={save} disabled={saving}>
          {saved ? <><Check size={15}/>Guardado</> : <><Save size={15}/>{saving?"Guardando...":"Guardar cambios"}</>}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":tablet?"1fr":"1.2fr 1fr", gap:20 }}>

        {/* LEFT: formulario */}
        <div>
          <Card style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:17, color:T.text, fontWeight:400, marginBottom:16 }}>Información general</h3>
            <Field label="Nombre de la empresa">
              <input style={SI} value={f.nombre||""} onChange={e=>up("nombre",e.target.value)} placeholder="ej: Carpintería San José"/>
            </Field>
            <Field label="RUT">
              <input style={SI} value={f.rut||""} onChange={e=>up("rut",e.target.value)} placeholder="ej: 76.123.456-7"/>
            </Field>
            <Field label="Descripción / Slogan">
              <textarea style={{ ...SI, height:72, resize:"none" }} value={f.descripcion||""} onChange={e=>up("descripcion",e.target.value)} placeholder="ej: Muebles a medida con calidad artesanal"/>
            </Field>
          </Card>

          <Card style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:17, color:T.text, fontWeight:400, marginBottom:16 }}>Contacto</h3>
            <Row cols={mobile?"1fr":"1fr 1fr"}>
              <Field label="Email">
                <input style={SI} type="email" value={f.email||""} onChange={e=>up("email",e.target.value)} placeholder="contacto@empresa.cl"/>
              </Field>
              <Field label="Teléfono">
                <input style={SI} value={f.telefono||""} onChange={e=>up("telefono",e.target.value)} placeholder="+56 9 XXXX XXXX"/>
              </Field>
            </Row>
            <Field label="Dirección">
              <input style={SI} value={f.direccion||""} onChange={e=>up("direccion",e.target.value)} placeholder="Calle, número, ciudad"/>
            </Field>
            <Field label="Sitio web">
              <input style={SI} value={f.sitio_web||""} onChange={e=>up("sitio_web",e.target.value)} placeholder="www.micarpinteria.cl"/>
            </Field>
          </Card>

          <Card>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:17, color:T.text, fontWeight:400, marginBottom:16 }}>Color de marca</h3>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <input type="color" value={f.color||"#b5600a"} onChange={e=>up("color",e.target.value)}
                style={{ width:48, height:48, borderRadius:10, border:"1.5px solid "+T.border, cursor:"pointer", padding:3, background:"none" }}/>
              <div>
                <div style={{ fontSize:14, color:T.text, fontWeight:600 }}>{f.color||"#b5600a"}</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>Se usa en PDFs y encabezados</div>
              </div>
              <div style={{ marginLeft:"auto", width:80, height:36, borderRadius:8, background:f.color||"#b5600a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:11, color:"#fff", fontWeight:700 }}>PREVIEW</span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: logo + preview */}
        <div>
          <Card style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:17, color:T.text, fontWeight:400, marginBottom:16 }}>Logo</h3>

            {/* Logo preview */}
            <div style={{ width:"100%", height:160, borderRadius:10, border:"2px dashed "+T.border, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginBottom:14, background:T.bg, overflow:"hidden", position:"relative" }}>
              {f.logo_url ? (
                <>
                  <img src={f.logo_url} alt="Logo" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", padding:12 }}/>
                  <button onClick={()=>up("logo_url","")} style={{ position:"absolute", top:8, right:8, background:T.redBg, border:"1px solid "+T.red+"40", borderRadius:6, cursor:"pointer", color:T.red, padding:"3px 6px", fontSize:11, display:"flex", alignItems:"center", gap:4 }}><X size={11}/>Quitar</button>
                </>
              ) : (
                <>
                  <Upload size={28} color={T.muted} style={{ marginBottom:8 }}/>
                  <span style={{ fontSize:13, color:T.muted }}>Sin logo cargado</span>
                </>
              )}
            </div>

            <label style={{ ...BP, width:"100%", justifyContent:"center", cursor:"pointer", opacity:uploading?0.6:1 }}>
              <Upload size={14}/>{uploading?"Subiendo...":"Subir logo"}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogo} style={{ display:"none" }} disabled={uploading}/>
            </label>
            <p style={{ fontSize:11, color:T.muted, textAlign:"center", marginTop:8 }}>PNG, JPG o SVG · máx 2MB</p>
          </Card>

          {/* Preview tarjeta empresa */}
          <Card style={{ background:T.amberBg, border:"1px solid "+T.amberMid+"40" }}>
            <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:15, color:T.text, fontWeight:400, marginBottom:14 }}>Vista previa en PDF</h3>
            <div style={{ background:T.white, borderRadius:10, overflow:"hidden", border:"1px solid "+T.border }}>
              <div style={{ background:f.color||T.amber, height:6 }}/>
              <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                {f.logo_url
                  ? <img src={f.logo_url} alt="logo" style={{ width:44, height:44, objectFit:"contain", borderRadius:6, border:"1px solid "+T.border, background:"#fff" }}/>
                  : <div style={{ width:44, height:44, borderRadius:10, background:f.color||T.amber, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, color:"#fff" }}>{(f.nombre||"C").charAt(0)}</span>
                    </div>
                }
                <div>
                  <div style={{ fontWeight:700, color:T.text, fontSize:15 }}>{f.nombre||"Mi Carpintería"}</div>
                  {f.descripcion && <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{f.descripcion}</div>}
                  {f.rut         && <div style={{ fontSize:11, color:T.muted }}>RUT: {f.rut}</div>}
                </div>
              </div>
              <div style={{ padding:"0 16px 12px", display:"flex", flexDirection:"column", gap:3 }}>
                {f.email    && <div style={{ fontSize:11, color:T.sub }}>✉ {f.email}</div>}
                {f.telefono && <div style={{ fontSize:11, color:T.sub }}>📞 {f.telefono}</div>}
                {f.direccion&& <div style={{ fontSize:11, color:T.sub }}>📍 {f.direccion}</div>}
                {f.sitio_web&& <div style={{ fontSize:11, color:T.blue }}>{f.sitio_web}</div>}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ view, setView }) {
  const items = [
    { id:"dashboard", Icon:LayoutDashboard, label:"Inicio"     },
    { id:"projects",  Icon:Folder,          label:"Proyectos"  },
    { id:"budgets",   Icon:FileText,        label:"Presupuest."},
    { id:"materials", Icon:Package,         label:"Materiales" },
    { id:"clients",   Icon:Users,           label:"Clientes"   },
  ];
  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:T.white, borderTop:"1px solid "+T.border, display:"flex", zIndex:200, boxShadow:"0 -2px 10px rgba(44,32,24,0.08)" }}>
      {items.map(({ id, Icon, label }) => {
        const on = view===id;
        return <button key={id} onClick={()=>setView(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"9px 2px 8px", border:"none", background:"none", cursor:"pointer", color:on?T.amber:T.muted, fontFamily:"inherit", fontSize:9, fontWeight:on?700:400 }}><Icon size={19} strokeWidth={on?2.2:1.8}/>{label}</button>;
      })}
    </nav>
  );
}

// ─── PDF EXPORT ────────────────────────────────────────────────────────────────
let _pdfLoaded = false;
function loadJsPDF() {
  return new Promise((resolve) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    if (_pdfLoaded) { const t = setInterval(() => { if (window.jspdf) { clearInterval(t); resolve(window.jspdf.jsPDF); } }, 60); return; }
    _pdfLoaded = true;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    document.head.appendChild(s);
  });
}

async function exportPDF(budget, project, client, empresa) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit:"mm", format:"a4" });
  const W=210, M=16, CW=W-M*2;
  const accentColor = empresa?.color || "#b5600a";
  const rgb = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const fc=h=>{const[r,g,b]=rgb(h);doc.setFillColor(r,g,b);};
  const sc=h=>{const[r,g,b]=rgb(h);doc.setDrawColor(r,g,b);};
  const tc=h=>{const[r,g,b]=rgb(h);doc.setTextColor(r,g,b);};
  let y=0;

  // Header con color de empresa
  fc(accentColor); doc.rect(0,0,W,36,"F");
  fc("#ffffff"); doc.rect(5,0,W-5,36,"F");
  fc(accentColor); doc.rect(M,10,3,16,"F");

  // Logo o inicial
  if (empresa?.logo_url && empresa.logo_url.startsWith("data:image")) {
    try { doc.addImage(empresa.logo_url, "PNG", M+7, 8, 20, 20); } catch {}
  }
  const nameX = empresa?.logo_url ? M+32 : M+9;
  doc.setFont("helvetica","bold"); doc.setFontSize(18); tc("#2c2018");
  doc.text(empresa?.nombre||"CARPINTERÍA", nameX, 20);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); tc("#9c8e80");
  if (empresa?.descripcion) doc.text(empresa.descripcion, nameX, 28);
  doc.text("Fecha: "+(budget.fecha||today()), W-M, 18, {align:"right"});
  doc.text("N° "+(budget.id||"").slice(0,8).toUpperCase(), W-M, 26, {align:"right"});
  y=44;

  // Empresa info bar
  if (empresa?.email || empresa?.telefono || empresa?.rut) {
    fc("#fdf8f2"); doc.rect(M,y,CW,10,"F");
    sc("#e2d9cc"); doc.setLineWidth(0.2); doc.rect(M,y,CW,10);
    let infoX=M+4; doc.setFontSize(7); tc("#6b5a48");
    if (empresa?.rut)     { doc.text("RUT: "+empresa.rut,     infoX, y+6.5); infoX+=50; }
    if (empresa?.email)   { doc.text("✉ "+empresa.email,      infoX, y+6.5); infoX+=65; }
    if (empresa?.telefono){ doc.text("✆ "+empresa.telefono,   infoX, y+6.5); infoX+=45; }
    if (empresa?.sitio_web){ doc.text(empresa.sitio_web,      infoX, y+6.5); }
    y+=14;
  }

  // Project/client block
  fc("#fdf8f2"); doc.rect(M,y,CW,28,"F");
  sc("#e2d9cc"); doc.setLineWidth(0.3); doc.rect(M,y,CW,28);
  doc.setFont("helvetica","bold"); doc.setFontSize(8); tc("#9c8e80");
  doc.text("PROYECTO", M+5, y+8);
  doc.setFontSize(13); tc("#2c2018");
  doc.text(project?.nombre||"—", M+5, y+18);
  tc("#9c8e80"); doc.text("CLIENTE", M+90, y+8);
  doc.setFont("helvetica","normal"); doc.setFontSize(10); tc("#2c2018");
  doc.text(client?.nombre||"—", M+90, y+18);
  if(client?.tel){ doc.setFontSize(8); tc("#9c8e80"); doc.text(client.tel, M+90, y+24); }
  const bcfg=BESTADOS[budget.estado]||BESTADOS.borrador;
  fc("#f5f0e8"); doc.rect(W-M-30,y+7,28,12,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(8); tc(bcfg.color);
  doc.text((bcfg.label||"").toUpperCase(), W-M-16, y+15, {align:"center"});
  y+=36;

  const tbl=(headers,rows,widths,ttl,ac)=>{
    if(!rows.length)return;
    doc.setFont("helvetica","bold"); doc.setFontSize(9);
    const[r,g,b]=rgb(ac); doc.setTextColor(r,g,b);
    doc.text(ttl,M,y+4); y+=9;
    fc("#f5f0e8"); doc.rect(M,y,CW,8,"F");
    sc("#e2d9cc"); doc.setLineWidth(0.2); doc.rect(M,y,CW,8);
    let x=M; doc.setFontSize(7); tc("#9c8e80");
    headers.forEach((h,i)=>{doc.text(h,i===headers.length-1?x+widths[i]-2:x+3,y+5.5,i===headers.length-1?{align:"right"}:{});x+=widths[i];});
    y+=8;
    rows.forEach((row,ri)=>{
      const rh=8;
      if(y+rh>272){doc.addPage();y=18;}
      if(ri%2===0){fc("#fdf8f2");doc.rect(M,y,CW,rh,"F");}
      sc("#e2d9cc");doc.setLineWidth(0.15);doc.line(M,y+rh,M+CW,y+rh);
      let rx=M;
      row.forEach((cell,ci)=>{
        const last=ci===row.length-1;
        doc.setFont("helvetica",last?"bold":"normal");doc.setFontSize(8);
        tc(last?ac:"#2c2018");
        doc.text(String(cell),last?rx+widths[ci]-2:rx+3,y+5.5,last?{align:"right"}:{});
        rx+=widths[ci];
      });
      y+=rh;
    });
    y+=5;
  };

  const items=budget.items||[],mo=budget.mano_obra||[],col=budget.colaciones||[],ge=budget.gastos_extra||[];
  if(items.length) tbl(["DESCRIPCION","MATERIAL","MEDIDA","P.UNIT.","SUBTOTAL"],items.map(it=>[it.desc||"",it.matNombre||"",it.tipo==="m2"?`${Number(it.ancho).toFixed(2)}x${Number(it.largo).toFixed(2)}m`:it.tipo==="ml"?`${Number(it.cant).toFixed(2)}ml`:`${it.cant}u`,`${fmt(it.precio)}/${it.unidad}`,fmt(it.sub)]),[46,42,28,28,34],"MATERIALES",accentColor);
  if(mo.length)    tbl(["DESCRIPCION","DETALLE","TOTAL"],mo.map(m=>[m.desc||"",m.tipo==="hora"?`${m.cant}h x ${fmt(m.vhora)}/h`:"Monto fijo",fmt(m.sub)]),[78,70,30],"MANO DE OBRA","#1a5fa8");
  if(col.length)   tbl(["DESCRIPCION","DETALLE","TOTAL"],col.map(c=>[c.desc||"",`${c.dias}d x ${c.personas}p x ${fmt(c.mdia)}/d`,fmt(c.sub)]),[78,70,30],"COLACIONES","#2d7a3a");
  if(ge.length)    tbl(["DESCRIPCION","CATEGORIA","MONTO"],ge.map(g=>[g.desc||"",g.cat||"—",fmt(g.monto)]),[78,70,30],"GASTOS ADICIONALES","#c05c00");

  if(y+70>272){doc.addPage();y=18;}
  const tX=W-M-90,tW=90;
  const sm=items.reduce((a,i)=>a+i.sub,0),smo=mo.reduce((a,i)=>a+i.sub,0),sc2=col.reduce((a,i)=>a+i.sub,0),sge=ge.reduce((a,g)=>a+g.monto,0);
  const stot=sm+smo+sc2+sge,mar=stot*(Number(budget.margen||0)/100),tot=stot+mar;

  [["Materiales",fmt(sm),accentColor,sm===0],["Mano de obra",fmt(smo),"#1a5fa8",smo===0],["Colaciones",fmt(sc2),"#2d7a3a",sc2===0],["Gastos adicionales",fmt(sge),"#c05c00",sge===0],["Subtotal",fmt(stot),"#2c2018",false],[`Margen (${budget.margen||0}%)`,`+ ${fmt(mar)}`,accentColor,false]]
    .filter(([,,,s])=>!s).forEach(([lbl,val,clr])=>{
      doc.setFont("helvetica","normal");doc.setFontSize(9);tc("#9c8e80");doc.text(lbl,tX+3,y+5);
      doc.setFont("helvetica","bold");tc(clr);doc.text(val,tX+tW-3,y+5,{align:"right"});
      sc("#e2d9cc");doc.setLineWidth(0.2);doc.line(tX,y+7,tX+tW,y+7);y+=9;
    });

  fc("#fef3e2");doc.rect(tX,y,tW,16,"F");sc(accentColor);doc.setLineWidth(0.5);doc.rect(tX,y,tW,16);fc(accentColor);doc.rect(tX,y,4,16,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(8);tc("#9c8e80");doc.text("TOTAL PROYECTO",tX+8,y+6);
  doc.setFontSize(15);tc(accentColor);doc.text(fmt(tot),tX+tW-3,y+12,{align:"right"});y+=22;

  if(budget.notas){doc.setFont("helvetica","bold");doc.setFontSize(8);tc("#9c8e80");doc.text("NOTAS",M,y);y+=5;doc.setFont("helvetica","normal");doc.setFontSize(8);tc("#6b5a48");const ls=doc.splitTextToSize(budget.notas,CW);doc.text(ls,M,y);}

  const pg=doc.internal.getNumberOfPages();
  for(let i=1;i<=pg;i++){
    doc.setPage(i);
    sc("#e2d9cc");doc.setLineWidth(0.3);doc.line(M,284,W-M,284);
    doc.setFont("helvetica","normal");doc.setFontSize(7);tc("#9c8e80");
    doc.text((empresa?.nombre||"Carpintería")+" · "+today(),M,289);
    if(empresa?.email) doc.text(empresa.email,W/2,289,{align:"center"});
    doc.text(`Pág. ${i}/${pg}`,W-M,289,{align:"right"});
  }
  doc.save(`presupuesto-${(project?.nombre||"proyecto").replace(/\s+/g,"-")}-${today()}.pdf`);
}

// ─── FORMS ─────────────────────────────────────────────────────────────────────
function MatForm({ item, onSave, onClose }) {
  const { mobile } = useMedia();
  const ed=!!item?.id;
  const [f,setF]=useState(item?{nombre:item.nombre,tipo:item.tipo,precio:item.precio,desc:item.descripcion,stock:item.stock}:{nombre:"",tipo:"m2",precio:"",desc:"",stock:""});
  const [saving,setSaving]=useState(false);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const save=async()=>{if(!f.nombre||!f.precio)return;setSaving(true);try{const data={nombre:f.nombre,tipo:f.tipo,precio:Number(f.precio),descripcion:f.desc,stock:Number(f.stock||0)};const result=ed?await sb.update("materiales",item.id,data):await sb.insert("materiales",data);onSave(result);}catch(e){alert("Error: "+e.message);}setSaving(false);};
  return (<><MHead title={ed?"Editar Material":"Nuevo Material"} onClose={onClose}/>
    <div style={{padding:20}}>
      <Field label="Nombre"><input style={SI} value={f.nombre} onChange={e=>up("nombre",e.target.value)} placeholder="ej: MDF 18mm"/></Field>
      <Row cols={mobile?"1fr":"1fr 1fr"}>
        <Field label="Tipo"><select style={SI} value={f.tipo} onChange={e=>up("tipo",e.target.value)}><option value="ml">Metro Lineal (ml)</option><option value="m2">Metro Cuadrado (m2)</option><option value="unidad">Unidad</option></select></Field>
        <Field label={`Precio por ${f.tipo==="ml"?"ml":f.tipo==="m2"?"m2":"unidad"}`}><input style={SI} type="number" value={f.precio} onChange={e=>up("precio",e.target.value)} placeholder="0"/></Field>
      </Row>
      <Field label="Stock"><input style={SI} type="number" value={f.stock} onChange={e=>up("stock",e.target.value)} placeholder="0"/></Field>
      <Field label="Descripción"><textarea style={{...SI,height:68,resize:"none"}} value={f.desc} onChange={e=>up("desc",e.target.value)}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}><button style={BG} onClick={onClose}>Cancelar</button><button style={{...BP,opacity:saving?0.6:1}} onClick={save} disabled={saving}><Check size={14}/>{saving?"Guardando...":ed?"Guardar":"Agregar"}</button></div>
    </div>
  </>);
}

function CliForm({ item, onSave, onClose }) {
  const { mobile } = useMedia();
  const ed=!!item?.id;
  const [f,setF]=useState(item?{nombre:item.nombre,tel:item.tel,email:item.email,dir:item.dir}:{nombre:"",tel:"",email:"",dir:""});
  const [saving,setSaving]=useState(false);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const save=async()=>{if(!f.nombre)return;setSaving(true);try{const result=ed?await sb.update("clientes",item.id,f):await sb.insert("clientes",f);onSave(result);}catch(e){alert("Error: "+e.message);}setSaving(false);};
  return (<><MHead title={ed?"Editar Cliente":"Nuevo Cliente"} onClose={onClose}/>
    <div style={{padding:20}}>
      <Field label="Nombre"><input style={SI} value={f.nombre} onChange={e=>up("nombre",e.target.value)} placeholder="ej: Juan Pérez"/></Field>
      <Row cols={mobile?"1fr":"1fr 1fr"}>
        <Field label="Teléfono"><input style={SI} value={f.tel} onChange={e=>up("tel",e.target.value)} placeholder="+56 9 XXXX XXXX"/></Field>
        <Field label="Email"><input style={SI} value={f.email} onChange={e=>up("email",e.target.value)} placeholder="correo@email.com"/></Field>
      </Row>
      <Field label="Dirección"><input style={SI} value={f.dir} onChange={e=>up("dir",e.target.value)}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}><button style={BG} onClick={onClose}>Cancelar</button><button style={{...BP,opacity:saving?0.6:1}} onClick={save} disabled={saving}><Check size={14}/>{saving?"Guardando...":ed?"Guardar":"Agregar"}</button></div>
    </div>
  </>);
}

function ProjForm({ item, clients, onSave, onClose }) {
  const { mobile } = useMedia();
  const ed=!!item?.id;
  const [f,setF]=useState(item?{nombre:item.nombre,cliente_id:item.cliente_id||"",estado:item.estado,desc:item.descripcion,inicio:item.inicio||today(),entrega:item.entrega||"",notas:item.notas||""}:{nombre:"",cliente_id:"",estado:"pendiente",desc:"",inicio:today(),entrega:"",notas:""});
  const [saving,setSaving]=useState(false);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const save=async()=>{if(!f.nombre||!f.cliente_id)return;setSaving(true);try{const data={nombre:f.nombre,cliente_id:f.cliente_id,estado:f.estado,descripcion:f.desc,inicio:f.inicio||null,entrega:f.entrega||null,notas:f.notas};const result=ed?await sb.update("proyectos",item.id,data):await sb.insert("proyectos",data);onSave(result);}catch(e){alert("Error: "+e.message);}setSaving(false);};
  return (<><MHead title={ed?"Editar Proyecto":"Nuevo Proyecto"} onClose={onClose}/>
    <div style={{padding:20}}>
      <Field label="Nombre"><input style={SI} value={f.nombre} onChange={e=>up("nombre",e.target.value)} placeholder="ej: Cocina Integral"/></Field>
      <Row cols={mobile?"1fr":"1fr 1fr"}>
        <Field label="Cliente"><select style={SI} value={f.cliente_id} onChange={e=>up("cliente_id",e.target.value)}><option value="">— Seleccionar —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
        <Field label="Estado"><select style={SI} value={f.estado} onChange={e=>up("estado",e.target.value)}>{Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
      </Row>
      <Row cols={mobile?"1fr":"1fr 1fr"}>
        <Field label="Fecha inicio"><input style={SI} type="date" value={f.inicio} onChange={e=>up("inicio",e.target.value)}/></Field>
        <Field label="Fecha entrega"><input style={SI} type="date" value={f.entrega} onChange={e=>up("entrega",e.target.value)}/></Field>
      </Row>
      <Field label="Descripción"><textarea style={{...SI,height:68,resize:"none"}} value={f.desc} onChange={e=>up("desc",e.target.value)}/></Field>
      <Field label="Notas"><textarea style={{...SI,height:52,resize:"none"}} value={f.notas} onChange={e=>up("notas",e.target.value)}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}><button style={BG} onClick={onClose}>Cancelar</button><button style={{...BP,opacity:saving?0.6:1}} onClick={save} disabled={saving}><Check size={14}/>{saving?"Guardando...":ed?"Guardar":"Crear proyecto"}</button></div>
    </div>
  </>);
}

function BudgetForm({ item, projects, materials, clients, onSave, onClose }) {
  const { mobile } = useMedia();
  const ed=!!item?.id;
  const [f,setF]=useState(item||{proyecto_id:"",estado:"borrador",margen:20,items:[],mano_obra:[],colaciones:[],gastos_extra:[],notas:"",fecha:today()});
  const [cm,setCm]=useState({matId:"",desc:"",largo:"",ancho:"",cant:""});
  const [cmo,setCmo]=useState({desc:"",tipo:"hora",cant:"",vhora:"",fijo:""});
  const [cc,setCc]=useState({desc:"Colación diaria",dias:"",personas:"1",mdia:""});
  const [cg,setCg]=useState({desc:"",cat:"Bencina",monto:""});
  const [saving,setSaving]=useState(false);

  const ff=(k,v)=>setF(p=>({...p,[k]:v}));
  const mat=materials.find(m=>m.id===cm.matId);
  const subM=()=>{if(!mat)return 0;if(mat.tipo==="ml")return(Number(cm.largo)||0)*mat.precio;if(mat.tipo==="m2")return(Number(cm.ancho)||0)*(Number(cm.largo)||0)*mat.precio;return(Number(cm.cant)||0)*mat.precio;};
  const subMO=()=>cmo.tipo==="hora"?(Number(cmo.cant)||0)*(Number(cmo.vhora)||0):Number(cmo.fijo)||0;
  const subC=()=>(Number(cc.dias)||0)*(Number(cc.personas)||1)*(Number(cc.mdia)||0);
  const sm=subM(),smo=subMO(),sc=subC();

  const addMat=()=>{if(!mat||sm===0)return;let cant,unidad;if(mat.tipo==="ml"){cant=Number(cm.largo);unidad="ml";}else if(mat.tipo==="m2"){cant=Number(cm.ancho)*Number(cm.largo);unidad="m2";}else{cant=Number(cm.cant);unidad="u";}ff("items",[...f.items,{id:Date.now(),matId:mat.id,matNombre:mat.nombre,desc:cm.desc||mat.nombre,tipo:mat.tipo,cant,unidad,ancho:cm.ancho,largo:cm.largo,precio:mat.precio,sub:sm}]);setCm({matId:"",desc:"",largo:"",ancho:"",cant:""});};
  const addMO=()=>{if(!cmo.desc||smo===0)return;ff("mano_obra",[...f.mano_obra,{id:Date.now(),desc:cmo.desc,tipo:cmo.tipo,cant:Number(cmo.cant),vhora:Number(cmo.vhora),fijo:Number(cmo.fijo),sub:smo}]);setCmo({desc:"",tipo:"hora",cant:"",vhora:"",fijo:""});};
  const addC=()=>{if(!cc.desc||sc===0)return;ff("colaciones",[...f.colaciones,{id:Date.now(),desc:cc.desc,dias:Number(cc.dias),personas:Number(cc.personas)||1,mdia:Number(cc.mdia),sub:sc}]);setCc({desc:"Colación diaria",dias:"",personas:"1",mdia:""});};
  const addG=()=>{if(!cg.desc||!cg.monto)return;ff("gastos_extra",[...f.gastos_extra,{id:Date.now(),desc:cg.desc,cat:cg.cat,monto:Number(cg.monto)}]);setCg({desc:"",cat:"Bencina",monto:""});};

  const totalMat=f.items.reduce((a,i)=>a+i.sub,0),totalMO=f.mano_obra.reduce((a,i)=>a+i.sub,0),totalCol=f.colaciones.reduce((a,i)=>a+i.sub,0),totalGE=f.gastos_extra.reduce((a,i)=>a+i.monto,0);
  const subtotal=totalMat+totalMO+totalCol+totalGE,margen=subtotal*(Number(f.margen)/100),total=subtotal+margen;

  const save=async()=>{if(!f.proyecto_id)return;setSaving(true);try{const data={proyecto_id:f.proyecto_id,estado:f.estado,margen:Number(f.margen),subtotal,total,items:f.items,mano_obra:f.mano_obra,colaciones:f.colaciones,gastos_extra:f.gastos_extra,notas:f.notas,fecha:f.fecha};const result=ed?await sb.update("presupuestos",item.id,data):await sb.insert("presupuestos",data);onSave(result);}catch(e){alert("Error: "+e.message);}setSaving(false);};

  const proj=projects.find(p=>p.id===f.proyecto_id),cli=proj?clients.find(c=>c.id===proj.cliente_id):null;

  const IRow=({label,det,val,onDel})=>(<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:8,background:T.cardAlt,border:"1px solid "+T.border,marginBottom:5}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div><div style={{fontSize:11,color:T.muted}}>{det}</div></div><div style={{fontWeight:700,color:T.text,fontSize:14,flexShrink:0}}>{val}</div><button onClick={onDel} style={{background:"none",border:"1px solid "+T.border,borderRadius:5,cursor:"pointer",color:T.muted,padding:"3px 4px",display:"flex",flexShrink:0}}><Trash2 size={12}/></button></div>);
  const Prev=({val,lbl})=>val>0?(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:T.amberBg,border:"1.5px solid "+T.amberMid+"50",marginBottom:10,gap:8,flexWrap:"wrap"}}><span style={{fontSize:12,color:T.sub}}>{lbl}</span><span style={{fontWeight:700,color:T.amber,fontSize:16}}>{fmt(val)}</span></div>):null;

  return (<><MHead title={ed?"Editar Presupuesto":"Nuevo Presupuesto"} onClose={onClose}/>
    <div style={{padding:20,overflowY:"auto"}}>
      <Row cols={mobile?"1fr":"1fr 1fr"} style={{marginBottom:4}}>
        <Field label="Proyecto"><select style={SI} value={f.proyecto_id} onChange={e=>ff("proyecto_id",e.target.value)}><option value="">— Seleccionar proyecto —</option>{projects.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>
        <Field label="Estado"><select style={SI} value={f.estado} onChange={e=>ff("estado",e.target.value)}>{Object.entries(BESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
      </Row>
      {cli&&<div style={{marginBottom:14,padding:"9px 14px",borderRadius:8,background:T.amberBg,border:"1px solid "+T.amberMid+"40",fontSize:13,color:T.sub}}>Cliente: <strong style={{color:T.text}}>{cli.nombre}</strong> · {cli.tel}</div>}

      <Section icon={Package} color={T.amber} bg={T.amberBg} title="Materiales">
        <Field label="Material"><select style={SI} value={cm.matId} onChange={e=>setCm(p=>({...p,matId:e.target.value}))}><option value="">— Seleccionar —</option>{materials.map(m=><option key={m.id} value={m.id}>{m.nombre} ({TIPOS[m.tipo]})</option>)}</select></Field>
        {mat&&<><div style={{marginBottom:10,padding:"7px 11px",borderRadius:7,background:T.amberBg,border:"1px solid "+T.amberMid+"50",fontSize:13,color:T.sub}}>Precio: <strong style={{color:T.amber}}>{fmt(mat.precio)}</strong>/{mat.tipo==="ml"?"ml":mat.tipo==="m2"?"m2":"u"}</div>
          <Row cols={mobile?mat.tipo==="m2"?"1fr 1fr":"1fr":mat.tipo==="m2"?"1fr 1fr 1fr":"1fr 1fr"} style={{marginBottom:8}}>
            {mat.tipo==="ml"&&<Field label="Largo (m)"><input style={SI} type="number" step="0.01" value={cm.largo} onChange={e=>setCm(p=>({...p,largo:e.target.value}))} placeholder="2.40"/></Field>}
            {mat.tipo==="m2"&&<><Field label="Ancho (m)"><input style={SI} type="number" step="0.01" value={cm.ancho} onChange={e=>setCm(p=>({...p,ancho:e.target.value}))} placeholder="1.20"/></Field><Field label="Largo (m)"><input style={SI} type="number" step="0.01" value={cm.largo} onChange={e=>setCm(p=>({...p,largo:e.target.value}))} placeholder="2.44"/></Field></>}
            {mat.tipo==="unidad"&&<Field label="Cantidad"><input style={SI} type="number" value={cm.cant} onChange={e=>setCm(p=>({...p,cant:e.target.value}))} placeholder="8"/></Field>}
            <Field label="Descripción"><input style={SI} value={cm.desc} onChange={e=>setCm(p=>({...p,desc:e.target.value}))} placeholder="ej: Panel lateral"/></Field>
          </Row>
          <Prev val={sm} lbl={mat.tipo==="ml"?`${cm.largo}ml × ${fmt(mat.precio)}/ml`:mat.tipo==="m2"?`${cm.ancho}m × ${cm.largo}m = ${((Number(cm.ancho)||0)*(Number(cm.largo)||0)).toFixed(2)}m2 × ${fmt(mat.precio)}/m2`:`${cm.cant}u × ${fmt(mat.precio)}/u`}/>
          <button style={{...BP,opacity:sm===0?0.4:1,width:mobile?"100%":"auto",justifyContent:"center"}} onClick={addMat} disabled={sm===0}><Plus size={13}/>Agregar material</button>
        </>}
        {f.items.length>0&&<div style={{marginTop:12}}>{f.items.map(it=><IRow key={it.id} label={it.desc} det={it.tipo==="m2"?`${it.ancho}×${it.largo}m=${Number(it.cant).toFixed(2)}m2`:it.tipo==="ml"?`${it.cant}ml`:`${it.cant}u`} val={fmt(it.sub)} onDel={()=>ff("items",f.items.filter(x=>x.id!==it.id))}/>)}<div style={{textAlign:"right",fontSize:13,color:T.muted}}>Subtotal: <strong style={{color:T.text}}>{fmt(totalMat)}</strong></div></div>}
      </Section>

      <Section icon={Hammer} color={T.blue} bg={T.blueBg} title="Mano de Obra" collapsible>
        <Row cols={mobile?"1fr":"2fr 1fr"} style={{marginBottom:8}}>
          <Field label="Descripción"><input style={SI} value={cmo.desc} onChange={e=>setCmo(p=>({...p,desc:e.target.value}))} placeholder="ej: Instalación, Pintura..."/></Field>
          <Field label="Tipo"><select style={SI} value={cmo.tipo} onChange={e=>setCmo(p=>({...p,tipo:e.target.value}))}><option value="hora">Por hora</option><option value="fijo">Monto fijo</option></select></Field>
        </Row>
        {cmo.tipo==="hora"?<Row style={{marginBottom:8}}><Field label="Horas"><input style={SI} type="number" step="0.5" value={cmo.cant} onChange={e=>setCmo(p=>({...p,cant:e.target.value}))} placeholder="8"/></Field><Field label="Valor/hora ($)"><input style={SI} type="number" value={cmo.vhora} onChange={e=>setCmo(p=>({...p,vhora:e.target.value}))} placeholder="5000"/></Field></Row>:<Field label="Monto fijo ($)" style={{marginBottom:8}}><input style={SI} type="number" value={cmo.fijo} onChange={e=>setCmo(p=>({...p,fijo:e.target.value}))} placeholder="80000"/></Field>}
        <Prev val={smo} lbl={cmo.tipo==="hora"?`${cmo.cant}h × ${fmt(cmo.vhora)}/h`:"Monto fijo"}/>
        <button style={{...BP,opacity:smo===0||!cmo.desc?0.4:1,background:T.blue,width:mobile?"100%":"auto",justifyContent:"center"}} onClick={addMO} disabled={smo===0||!cmo.desc}><Plus size={13}/>Agregar</button>
        {f.mano_obra.length>0&&<div style={{marginTop:12}}>{f.mano_obra.map(m=><IRow key={m.id} label={m.desc} det={m.tipo==="hora"?`${m.cant}h × ${fmt(m.vhora)}/h`:"Monto fijo"} val={fmt(m.sub)} onDel={()=>ff("mano_obra",f.mano_obra.filter(x=>x.id!==m.id))}/>)}<div style={{textAlign:"right",fontSize:13,color:T.muted}}>Subtotal: <strong style={{color:T.text}}>{fmt(totalMO)}</strong></div></div>}
      </Section>

      <Section icon={Coffee} color={T.green} bg={T.greenBg} title="Colaciones" collapsible>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:10,marginBottom:8}}>
          <Field label="Descripción" style={{gridColumn:mobile?"1/-1":undefined}}><input style={SI} value={cc.desc} onChange={e=>setCc(p=>({...p,desc:e.target.value}))} placeholder="Colación diaria"/></Field>
          <Field label="Días"><input style={SI} type="number" value={cc.dias} onChange={e=>setCc(p=>({...p,dias:e.target.value}))} placeholder="5"/></Field>
          <Field label="Personas"><input style={SI} type="number" value={cc.personas} onChange={e=>setCc(p=>({...p,personas:e.target.value}))} placeholder="2"/></Field>
          <Field label="$/día"><input style={SI} type="number" value={cc.mdia} onChange={e=>setCc(p=>({...p,mdia:e.target.value}))} placeholder="3500"/></Field>
        </div>
        <Prev val={sc} lbl={`${cc.dias}d × ${cc.personas||1}p × ${fmt(cc.mdia)}/día`}/>
        <button style={{...BP,opacity:sc===0?0.4:1,background:T.green,width:mobile?"100%":"auto",justifyContent:"center"}} onClick={addC} disabled={sc===0}><Plus size={13}/>Agregar</button>
        {f.colaciones.length>0&&<div style={{marginTop:12}}>{f.colaciones.map(c=><IRow key={c.id} label={c.desc} det={`${c.dias}d × ${c.personas}p × ${fmt(c.mdia)}/día`} val={fmt(c.sub)} onDel={()=>ff("colaciones",f.colaciones.filter(x=>x.id!==c.id))}/>)}<div style={{textAlign:"right",fontSize:13,color:T.muted}}>Subtotal: <strong style={{color:T.text}}>{fmt(totalCol)}</strong></div></div>}
      </Section>

      <Section icon={Fuel} color={T.orange} bg={T.orangeBg} title="Gastos Adicionales" collapsible>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"2fr 1fr 1fr",gap:10,marginBottom:8}}>
          <Field label="Descripción" style={{gridColumn:mobile?"1/-1":undefined}}><input style={SI} value={cg.desc} onChange={e=>setCg(p=>({...p,desc:e.target.value}))} placeholder="ej: Bencina, Peaje..."/></Field>
          <Field label="Categoría"><select style={SI} value={cg.cat} onChange={e=>setCg(p=>({...p,cat:e.target.value}))}>{["Bencina","Peaje","Estacionamiento","Herramientas","Otros"].map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="Monto ($)"><input style={SI} type="number" value={cg.monto} onChange={e=>setCg(p=>({...p,monto:e.target.value}))} placeholder="0"/></Field>
        </div>
        <button style={{...BP,opacity:!cg.desc||!cg.monto?0.4:1,background:T.orange,width:mobile?"100%":"auto",justifyContent:"center"}} onClick={addG} disabled={!cg.desc||!cg.monto}><Plus size={13}/>Agregar</button>
        {f.gastos_extra.length>0&&<div style={{marginTop:12}}>{f.gastos_extra.map(g=><IRow key={g.id} label={g.desc} det={g.cat} val={fmt(g.monto)} onDel={()=>ff("gastos_extra",f.gastos_extra.filter(x=>x.id!==g.id))}/>)}<div style={{textAlign:"right",fontSize:13,color:T.muted}}>Subtotal: <strong style={{color:T.text}}>{fmt(totalGE)}</strong></div></div>}
      </Section>

      {subtotal>0&&<div style={{background:T.amberBg,border:"1.5px solid "+T.amberMid+"50",borderRadius:12,padding:16,marginBottom:16}}>
        <Field label="Margen de ganancia (%)"><input style={{...SI,maxWidth:150}} type="number" min={0} max={200} value={f.margen} onChange={e=>ff("margen",e.target.value)}/></Field>
        <div style={{borderTop:"1px solid "+T.borderDk,paddingTop:12}}>
          {[[totalMat,"Materiales",T.amber],[totalMO,"Mano de obra",T.blue],[totalCol,"Colaciones",T.green],[totalGE,"Gastos adic.",T.orange]].filter(([v])=>v>0).map(([v,l,c])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:14}}><span style={{color:T.sub}}>{l}</span><span style={{color:c,fontWeight:600}}>{fmt(v)}</span></div>))}
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:14,borderTop:"1px solid "+T.border,paddingTop:8}}><span style={{color:T.sub,fontWeight:600}}>Subtotal</span><span style={{color:T.text,fontWeight:700}}>{fmt(subtotal)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:14}}><span style={{color:T.sub}}>Margen ({f.margen}%)</span><span style={{color:T.amber,fontWeight:600}}>+ {fmt(margen)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"2px solid "+T.borderDk,paddingTop:12,gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:20,color:T.text}}>Total del Proyecto</span>
            <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:26,color:T.amber}}>{fmt(total)}</span>
          </div>
        </div>
      </div>}
      <Field label="Notas"><textarea style={{...SI,height:60,resize:"none"}} value={f.notas} onChange={e=>ff("notas",e.target.value)} placeholder="Condiciones de pago, garantías..."/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6,flexDirection:mobile?"column-reverse":"row"}}>
        <button style={{...BG,justifyContent:"center"}} onClick={onClose}>Cancelar</button>
        <button style={{...BP,opacity:(!f.proyecto_id||saving)?0.4:1,justifyContent:"center",flex:mobile?1:"auto"}} onClick={save} disabled={!f.proyecto_id||saving}><Check size={14}/>{saving?"Guardando...":ed?"Guardar cambios":"Crear presupuesto"}</button>
      </div>
    </div>
  </>);
}

// ─── VIEWS (Dashboard, Materials, Clients, Projects, Budgets) ──────────────────
function Dashboard({ mats,clis,projs,buds,empresa,setView,setModal }) {
  const { mobile,tablet } = useMedia();
  const activos=projs.filter(p=>p.estado==="en_progreso").length,totalPres=buds.reduce((a,b)=>a+(b.total||0),0),stockBajo=mats.filter(m=>m.stock<5).length;
  return (<div>
    <div style={{marginBottom:20}}>
      <h1 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?26:32,color:T.text,lineHeight:1.1}}>{empresa?.nombre||"Panel General"}</h1>
      <p style={{color:T.muted,fontSize:13,marginTop:4}}>{new Date().toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":tablet?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {[{l:"Proyectos activos",v:activos,Icon:Folder,c:T.blue,bg:T.blueBg},{l:"Valor presupuestos",v:fmt(totalPres),Icon:FileText,c:T.amber,bg:T.amberBg},{l:"Clientes",v:clis.length,Icon:Users,c:T.green,bg:T.greenBg},{l:"Stock OK / Total",v:`${mats.length-stockBajo}/${mats.length}`,Icon:Package,c:T.orange,bg:T.orangeBg}]
        .map(({l,v,Icon,c,bg})=>(<Card key={l} style={{display:"flex",alignItems:"center",gap:12,padding:14}}><div style={{width:42,height:42,borderRadius:10,background:bg,border:"1px solid "+c+"25",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={20} color={c}/></div><div style={{minWidth:0}}><div style={{fontSize:mobile?19:23,fontWeight:700,color:T.text,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:T.muted,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l}</div></div></Card>))}
    </div>
    {stockBajo>0&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:T.redBg,border:"1px solid "+T.red+"30",marginBottom:16,fontSize:13,color:T.red}}><AlertTriangle size={16}/>{stockBajo} material{stockBajo>1?"es":""} con stock bajo</div>}
    <div style={{display:"grid",gridTemplateColumns:tablet?"1fr":"1.3fr 1fr",gap:16}}>
      <Card>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:17,color:T.text,fontWeight:400}}>Proyectos recientes</h3>
          <button onClick={()=>setView("projects")} style={{...BSM,color:T.amber,border:"1px solid "+T.amber+"40"}}>Ver todos <ChevronRight size={11}/></button>
        </div>
        {projs.length===0?<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"16px 0"}}>No hay proyectos</p>
        :projs.slice(0,5).map(p=>{const cli=clis.find(c=>c.id===p.cliente_id),est=ESTADOS[p.estado];return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid "+T.border}}><div style={{width:7,height:7,borderRadius:4,background:est.color,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</div><div style={{fontSize:11,color:T.muted}}>{cli?.nombre||"—"}</div></div><Badge label={est.label} color={est.color} bg={est.bg}/></div>);})}
      </Card>
      <Card>
        <h3 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:17,color:T.text,fontWeight:400,marginBottom:12}}>Acciones rápidas</h3>
        {[{l:"Nuevo proyecto",I:Folder,a:()=>setModal({t:"proj",d:null})},{l:"Nuevo presupuesto",I:FileText,a:()=>setModal({t:"bud",d:null})},{l:"Agregar material",I:Package,a:()=>setModal({t:"mat",d:null})},{l:"Nuevo cliente",I:Users,a:()=>setModal({t:"cli",d:null})}]
          .map(({l,I,a})=>(<button key={l} onClick={a} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:"1px solid "+T.border,background:T.bg,color:T.text,cursor:"pointer",fontSize:14,fontFamily:"inherit",width:"100%",marginBottom:7}}><div style={{width:30,height:30,borderRadius:7,background:T.amberBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I size={14} color={T.amber}/></div>{l}<ChevronRight size={13} style={{marginLeft:"auto",color:T.muted}}/></button>))}
      </Card>
    </div>
  </div>);
}

function Materials({ mats,reload,setModal }) {
  const { mobile } = useMedia();
  const [q,setQ]=useState(""), [ft,setFt]=useState("all");
  const list=mats.filter(m=>m.nombre.toLowerCase().includes(q.toLowerCase())&&(ft==="all"||m.tipo===ft));
  const del=async id=>{if(!confirm("¿Eliminar?"))return;try{await sb.delete("materiales",id);reload();}catch(e){alert(e.message);}};
  return (<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:10}}>
      <h1 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?24:30,color:T.text,lineHeight:1}}>Materiales</h1>
      <button style={BP} onClick={()=>setModal({t:"mat",d:null})}><Plus size={14}/>{!mobile&&" Nuevo"}</button>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:160,position:"relative"}}><Search size={14} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:T.muted}}/><input style={{...SI,paddingLeft:34,fontSize:14}} placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)}/></div>
      <div style={{display:"flex",gap:5}}>{[["all","Todos"],["ml","ml"],["m2","m2"],["unidad","Unid."]].map(([v,l])=><button key={v} onClick={()=>setFt(v)} style={{...BSM,background:ft===v?T.amberBg:T.white,color:ft===v?T.amber:T.muted,border:"1.5px solid "+(ft===v?T.amberMid+"60":T.border)}}>{l}</button>)}</div>
    </div>
    {mobile?(<div style={{display:"flex",flexDirection:"column",gap:10}}>{list.map(m=><Card key={m.id} style={{padding:14}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:T.text,fontSize:15,marginBottom:5}}>{m.nombre}</div><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:4}}><span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,background:T.amberBg,color:T.amber,border:"1px solid "+T.amberMid+"40"}}>{TIPOS[m.tipo]}</span><span style={{fontSize:14,fontWeight:700,color:T.amber}}>{fmt(m.precio)}<span style={{color:T.muted,fontWeight:400,fontSize:11}}>/{m.tipo==="ml"?"ml":m.tipo==="m2"?"m2":"u"}</span></span></div><span style={{color:m.stock<5?T.red:m.stock<10?T.orange:T.green,fontWeight:600,fontSize:13}}>Stock: {m.stock}</span></div><div style={{display:"flex",flexDirection:"column",gap:5}}><button onClick={()=>setModal({t:"mat",d:m})} style={BSM}><Edit2 size={12}/></button><button onClick={()=>del(m.id)} style={{...BSM,color:T.red,border:"1px solid "+T.red+"30",background:T.redBg}}><Trash2 size={12}/></button></div></div></Card>)}</div>)
    :(<Card style={{padding:0,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}><thead><tr style={{background:T.bg}}>{["Nombre","Tipo","Precio","Stock","Descripción",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>{h}</th>)}</tr></thead><tbody>{list.map((m,ri)=><tr key={m.id} style={{borderBottom:"1px solid "+T.border,background:ri%2===0?T.card:T.cardAlt}}><td style={{padding:"10px 14px",fontWeight:600,color:T.text,fontSize:14}}>{m.nombre}</td><td style={{padding:"10px 14px"}}><span style={{padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:T.amberBg,color:T.amber,border:"1px solid "+T.amberMid+"40"}}>{TIPOS[m.tipo]}</span></td><td style={{padding:"10px 14px",fontWeight:700,color:T.amber,fontSize:14}}>{fmt(m.precio)}<span style={{color:T.muted,fontWeight:400,fontSize:11}}>/{m.tipo==="ml"?"ml":m.tipo==="m2"?"m2":"u"}</span></td><td style={{padding:"10px 14px",fontSize:14,fontWeight:700,color:m.stock<5?T.red:m.stock<10?T.orange:T.green}}>{m.stock}</td><td style={{padding:"10px 14px",color:T.muted,fontSize:13,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.descripcion}</td><td style={{padding:"10px 14px"}}><div style={{display:"flex",gap:5}}><button onClick={()=>setModal({t:"mat",d:m})} style={BSM}><Edit2 size={12}/></button><button onClick={()=>del(m.id)} style={{...BSM,color:T.red,border:"1px solid "+T.red+"30",background:T.redBg}}><Trash2 size={12}/></button></div></td></tr>)}</tbody></table></div>{list.length===0&&<p style={{padding:40,textAlign:"center",color:T.muted}}>No se encontraron materiales</p>}</Card>)}
  </div>);
}

function Clients({ clis,projs,reload,setModal }) {
  const { mobile } = useMedia();
  const [q,setQ]=useState("");
  const list=clis.filter(c=>c.nombre.toLowerCase().includes(q.toLowerCase())||c.email?.toLowerCase().includes(q.toLowerCase()));
  const del=async id=>{if(!confirm("¿Eliminar?"))return;try{await sb.delete("clientes",id);reload();}catch(e){alert(e.message);}};
  const COLS=["#b5600a","#1a5fa8","#2d7a3a","#c05c00","#8a4a2a","#1a7a6a"];
  return (<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:10}}>
      <h1 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?24:30,color:T.text,lineHeight:1}}>Clientes</h1>
      <button style={BP} onClick={()=>setModal({t:"cli",d:null})}><Plus size={14}/>{!mobile&&" Nuevo"}</button>
    </div>
    <div style={{marginBottom:14,position:"relative"}}><Search size={14} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:T.muted}}/><input style={{...SI,paddingLeft:34}} placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(275px,1fr))",gap:14}}>
      {list.map((c,ci)=>{const cp=projs.filter(p=>p.cliente_id===c.id),act=cp.filter(p=>p.estado==="en_progreso").length,ac=COLS[ci%COLS.length];return(<Card key={c.id} style={{padding:14}}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:42,height:42,borderRadius:21,background:ac+"18",border:"2px solid "+ac+"35",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:ac,fontSize:19,flexShrink:0}}>{c.nombre.charAt(0).toUpperCase()}</div><div><div style={{fontWeight:700,color:T.text,fontSize:15}}>{c.nombre}</div><div style={{fontSize:12,color:T.muted}}>{cp.length} proyecto{cp.length!==1?"s":""}</div></div></div><div style={{display:"flex",gap:4}}><button onClick={()=>setModal({t:"cli",d:c})} style={BSM}><Edit2 size={12}/></button><button onClick={()=>del(c.id)} style={{...BSM,color:T.red,border:"1px solid "+T.red+"30",background:T.redBg}}><Trash2 size={12}/></button></div></div><div style={{display:"flex",flexDirection:"column",gap:5}}>{c.tel&&<div style={{fontSize:13,color:T.sub}}>📞 {c.tel}</div>}{c.email&&<div style={{fontSize:13,color:T.sub}}>✉ {c.email}</div>}{c.dir&&<div style={{fontSize:13,color:T.sub}}>📍 {c.dir}</div>}</div>{act>0&&<div style={{marginTop:10,padding:"5px 10px",borderRadius:6,background:T.blueBg,border:"1px solid "+T.blue+"30",fontSize:12,color:T.blue}}>{act} proyecto{act!==1?"s":""} en progreso</div>}</Card>);})}
    </div>
    {list.length===0&&<p style={{textAlign:"center",color:T.muted,padding:40}}>No se encontraron clientes</p>}
  </div>);
}

function Projects({ projs,clis,buds,reload,setModal }) {
  const { mobile } = useMedia();
  const [ft,setFt]=useState("all");
  const list=ft==="all"?projs:projs.filter(p=>p.estado===ft);
  const del=async id=>{if(!confirm("¿Eliminar?"))return;try{await sb.delete("proyectos",id);reload();}catch(e){alert(e.message);}};
  return (<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:10}}>
      <h1 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?24:30,color:T.text,lineHeight:1}}>Proyectos</h1>
      <button style={BP} onClick={()=>setModal({t:"proj",d:null})}><Plus size={14}/>{!mobile&&" Nuevo"}</button>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {[["all","Todos",null],...Object.entries(ESTADOS).map(([k,v])=>[k,v.label,v.color])].map(([v,l,dot])=>(<button key={v} onClick={()=>setFt(v)} style={{...BSM,background:ft===v?T.amberBg:T.white,color:ft===v?T.amber:T.muted,border:"1.5px solid "+(ft===v?T.amberMid+"60":T.border)}}>{dot&&<span style={{width:7,height:7,borderRadius:4,background:dot,display:"inline-block"}}/>}{l}</button>))}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {list.map(p=>{const cli=clis.find(c=>c.id===p.cliente_id),bud=buds.find(b=>b.proyecto_id===p.id),est=ESTADOS[p.estado];return(<Card key={p.id} style={{padding:14}}><div style={{display:"flex",gap:12}}><div style={{width:4,alignSelf:"stretch",borderRadius:2,background:est.color,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:mobile?"flex-start":"center",gap:8,marginBottom:5,flexDirection:mobile?"column":"row"}}><span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:18,color:T.text}}>{p.nombre}</span><Badge label={est.label} color={est.color} bg={est.bg}/></div><div style={{fontSize:13,color:T.muted,marginBottom:3}}><strong style={{color:T.sub}}>{cli?.nombre||"—"}</strong>{p.entrega&&` · Entrega: ${p.entrega}`}</div>{p.descripcion&&<div style={{fontSize:13,color:T.muted,marginBottom:3}}>{p.descripcion}</div>}{bud&&<div style={{marginTop:8,display:"inline-flex",gap:10,fontSize:12,padding:"5px 10px",background:T.amberBg,borderRadius:7,border:"1px solid "+T.amberMid+"40",flexWrap:"wrap"}}><span style={{color:T.sub}}>Presupuesto: <strong style={{color:T.amber}}>{fmt(bud.total)}</strong></span><Badge label={BESTADOS[bud.estado]?.label||bud.estado} color={BESTADOS[bud.estado]?.color} bg={BESTADOS[bud.estado]?.bg}/></div>}</div><div style={{display:"flex",flexDirection:mobile?"column":"row",gap:5,flexShrink:0}}><button onClick={()=>setModal({t:"proj",d:p})} style={BSM}><Edit2 size={12}/></button><button onClick={()=>del(p.id)} style={{...BSM,color:T.red,border:"1px solid "+T.red+"30",background:T.redBg}}><Trash2 size={12}/></button></div></div></Card>);})}
    </div>
    {list.length===0&&<p style={{textAlign:"center",color:T.muted,padding:40}}>No hay proyectos</p>}
  </div>);
}

function Budgets({ buds,projs,clis,mats,empresa,reload,setModal }) {
  const { mobile } = useMedia();
  const [exp,setExp]=useState(null);
  const del=async id=>{if(!confirm("¿Eliminar?"))return;try{await sb.delete("presupuestos",id);reload();}catch(e){alert(e.message);}};
  const doExport=async b=>{setExp(b.id);try{const pj=projs.find(p=>p.id===b.proyecto_id),cl=pj?clis.find(c=>c.id===pj.cliente_id):null;await exportPDF(b,pj,cl,empresa);}catch(e){alert("Error PDF: "+e.message);}setExp(null);};
  if(buds.length===0)return(<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:10}}><h1 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?24:30,color:T.text,lineHeight:1}}>Presupuestos</h1><button style={BP} onClick={()=>setModal({t:"bud",d:null})}><Plus size={14}/>{!mobile&&" Nuevo"}</button></div><Card style={{textAlign:"center",padding:50}}><div style={{width:60,height:60,borderRadius:30,background:T.amberBg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><FileText size={26} color={T.amber}/></div><p style={{color:T.muted,fontSize:15,marginBottom:18}}>Aún no hay presupuestos</p><button style={{...BP,margin:"0 auto"}} onClick={()=>setModal({t:"bud",d:null})}><Plus size={14}/>Crear presupuesto</button></Card></div>);
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:10}}>
      <h1 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?24:30,color:T.text,lineHeight:1}}>Presupuestos</h1>
      <button style={BP} onClick={()=>setModal({t:"bud",d:null})}><Plus size={14}/>{!mobile&&" Nuevo"}</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {buds.map(b=>{const pj=projs.find(p=>p.id===b.proyecto_id),cl=pj?clis.find(c=>c.id===pj.cliente_id):null,cfg=BESTADOS[b.estado]||BESTADOS.borrador;const sm=(b.items||[]).reduce((a,i)=>a+i.sub,0),smo=(b.mano_obra||[]).reduce((a,i)=>a+i.sub,0),sc=(b.colaciones||[]).reduce((a,i)=>a+i.sub,0),sg=(b.gastos_extra||[]).reduce((a,g)=>a+g.monto,0);return(<Card key={b.id} style={{padding:14}}><div style={{display:"flex",flexDirection:mobile?"column":"row",gap:12}}><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}><span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:18,color:T.text}}>{pj?.nombre||"Proyecto eliminado"}</span><Badge label={cfg.label} color={cfg.color} bg={cfg.bg}/></div><div style={{fontSize:13,color:T.muted,marginBottom:8}}>{cl?.nombre||"—"} · {b.fecha}</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[[sm,"Materiales",T.amber,T.amberBg],[smo,"M.O.",T.blue,T.blueBg],[sc,"Colac.",T.green,T.greenBg],[sg,"Gastos",T.orange,T.orangeBg]].filter(([v])=>v>0).map(([v,l,c,bg])=>(<span key={l} style={{fontSize:12,padding:"3px 9px",borderRadius:20,background:bg,color:c,fontWeight:600,border:"1px solid "+c+"25"}}>{l}: {fmt(v)}</span>))}</div></div><div style={{display:"flex",flexDirection:mobile?"row":"column",alignItems:mobile?"center":"flex-end",justifyContent:"space-between",gap:8,flexShrink:0}}><div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:mobile?22:26,color:T.amber}}>{fmt(b.total||0)}</div><div style={{display:"flex",gap:6}}><button onClick={()=>doExport(b)} disabled={!!exp} style={{...BP,padding:"7px 12px",fontSize:12,opacity:exp===b.id?0.6:1,background:T.green}}>{exp===b.id?"...":(<><Download size={12}/>{!mobile&&" PDF"}</>)}</button><button onClick={()=>setModal({t:"bud",d:b})} style={BSM}><Edit2 size={12}/></button><button onClick={()=>del(b.id)} style={{...BSM,color:T.red,border:"1px solid "+T.red+"30",background:T.redBg}}><Trash2 size={12}/></button></div></div></div></Card>);})}
  </div>);
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,    setView]    = useState("dashboard");
  const [session, setSession] = useState(null);
  const [mats,    setMats]    = useState([]);
  const [clis,    setClis]    = useState([]);
  const [projs,   setProjs]   = useState([]);
  const [buds,    setBuds]    = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [sidebar, setSidebar] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [toast,   setToast]   = useState(null);
  const { mobile, tablet }    = useMedia();

  useEffect(() => { if(tablet) setSidebar(false); else setSidebar(true); }, [tablet]);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sb_session");
    if (stored) {
      try {
        const s = JSON.parse(stored);
        if (s.access_token && s.expires_at > Date.now()/1000) {
          sb.setToken(s.access_token);
          setSession(s);
        } else {
          localStorage.removeItem("sb_session");
        }
      } catch {}
    }
    loadAll();
    loadJsPDF();
  }, []);

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null), 2500); };

  const loadAll = async () => {
    setLoading(true); setError(null);
    try {
      const [m,c,p,b,e] = await Promise.all([
        sb.get("materiales","nombre"),
        sb.get("clientes","nombre"),
        sb.get("proyectos","created_at"),
        sb.get("presupuestos","created_at"),
        sb.getOne("empresa"),
      ]);
      setMats(m); setClis(c); setProjs(p); setBuds(b); setEmpresa(e);
    } catch(e) {
      setError("No se pudo conectar con la base de datos.");
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogin = (data) => {
    sb.setToken(data.access_token);
    setSession(data);
    localStorage.setItem("sb_session", JSON.stringify({ access_token: data.access_token, expires_at: data.expires_at }));
    showToast("Sesión iniciada correctamente");
  };

  const handleLogout = async () => {
    if (session) { try { await sb.signOut(session.access_token); } catch {} }
    sb.clearToken();
    setSession(null);
    localStorage.removeItem("sb_session");
    showToast("Sesión cerrada");
  };

  const NAV = [
    { id:"dashboard", Icon:LayoutDashboard, label:"Panel General"  },
    { id:"projects",  Icon:Folder,          label:"Proyectos"      },
    { id:"budgets",   Icon:FileText,        label:"Presupuestos"   },
    { id:"materials", Icon:Package,         label:"Materiales"     },
    { id:"clients",   Icon:Users,           label:"Clientes"       },
    ...(session ? [{ id:"empresa", Icon:Building2, label:"Mi Empresa" }] : []),
  ];

  if (loading) return (
    <div style={{ background:T.bg, height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", gap:12 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={28} color={T.amber} style={{ animation:"spin 1s linear infinite" }}/>
      <p style={{ color:T.muted, fontSize:14 }}>Conectando...</p>
    </div>
  );

  if (error) return (
    <div style={{ background:T.bg, height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:24, gap:16 }}>
      <AlertTriangle size={32} color={T.red}/>
      <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, color:T.text }}>Error de conexión</h2>
      <p style={{ color:T.muted, fontSize:14, textAlign:"center", maxWidth:400 }}>{error}</p>
      <button style={BP} onClick={loadAll}><RefreshCw size={14}/>Reintentar</button>
    </div>
  );

  // Show login only if trying to access empresa section
  if (view === "empresa" && !session) {
    return <LoginScreen onLogin={handleLogin}/>;
  }

  const ctx = { mats, clis, projs, buds, empresa, reload:loadAll, setModal, setView };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f0ebe0}
        ::-webkit-scrollbar-thumb{background:#c8bfb0;border-radius:3px}
        input,textarea,select{outline:none;font-family:inherit}
        input:focus,textarea:focus,select:focus{border-color:#e8a045!important;box-shadow:0 0 0 3px rgba(232,160,69,0.13)}
        button{transition:opacity 0.12s}
        button:hover{opacity:0.85}
        button:active{opacity:0.7}
      `}</style>

      <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, overflow:"hidden" }}>

        {/* Sidebar */}
        {!mobile && (
          <aside style={{ width:sidebar?224:62, background:T.white, borderRight:"1px solid "+T.border, display:"flex", flexDirection:"column", transition:"width 0.2s", overflow:"hidden", flexShrink:0, boxShadow:"1px 0 4px rgba(44,32,24,0.05)" }}>
            {/* Logo */}
            <div style={{ padding:"15px 13px", borderBottom:"1px solid "+T.border, display:"flex", alignItems:"center", gap:10 }}>
              {empresa?.logo_url
                ? <img src={empresa.logo_url} alt="logo" style={{ width:34, height:34, objectFit:"contain", borderRadius:8, flexShrink:0, border:"1px solid "+T.border }}/>
                : <div style={{ width:34, height:34, background:empresa?.color||T.amber, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:18, color:"#fff" }}>{(empresa?.nombre||"C").charAt(0)}</span>
                  </div>
              }
              {sidebar && <div>
                <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:14, color:T.text, lineHeight:1 }}>{empresa?.nombre||"Carpintería"}</div>
                <div style={{ fontSize:9, color:T.muted, letterSpacing:0.5, marginTop:2 }}>{session?"● ADMINISTRADOR":"● SOLO LECTURA"}</div>
              </div>}
            </div>

            {/* Nav */}
            <nav style={{ flex:1, padding:"10px 7px" }}>
              {NAV.map(({ id,Icon,label }) => {
                const on=view===id;
                return <button key={id} onClick={()=>setView(id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:9, border:"none", cursor:"pointer", background:on?T.amberBg:"transparent", color:on?T.amber:T.sub, marginBottom:3, textAlign:"left", fontFamily:"inherit", fontSize:14, fontWeight:on?600:400, borderLeft:on?"3px solid "+T.amber:"3px solid transparent" }}><Icon size={17} style={{ flexShrink:0 }}/>{sidebar&&<span>{label}</span>}</button>;
              })}
            </nav>

            {/* Session button */}
            <div style={{ padding:"8px 8px 12px" }}>
              {session
                ? <button onClick={handleLogout} style={{ ...BG, width:"100%", justifyContent:sidebar?"flex-start":"center", color:T.red, border:"1px solid "+T.red+"30", background:T.redBg }}>
                    <LogOut size={14}/>{sidebar&&"Cerrar sesión"}
                  </button>
                : <button onClick={()=>setView("empresa")} style={{ ...BG, width:"100%", justifyContent:sidebar?"flex-start":"center" }}>
                    <LogIn size={14}/>{sidebar&&"Admin"}
                  </button>
              }
            </div>

            <button onClick={()=>setSidebar(s=>!s)} style={{ margin:"0 8px 10px", padding:8, borderRadius:8, border:"1px solid "+T.border, cursor:"pointer", background:T.bg, color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Menu size={15}/>
            </button>
          </aside>
        )}

        {/* Main */}
        <main style={{ flex:1, overflow:"auto", padding:mobile?"14px 14px 80px":"28px 36px", background:T.bg }}>
          {mobile && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {empresa?.logo_url
                  ? <img src={empresa.logo_url} alt="logo" style={{ width:30, height:30, objectFit:"contain", borderRadius:7, border:"1px solid "+T.border }}/>
                  : <div style={{ width:30, height:30, background:empresa?.color||T.amber, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:16, color:"#fff" }}>{(empresa?.nombre||"C").charAt(0)}</span></div>
                }
                <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:15, color:T.text }}>{empresa?.nombre||"Carpintería"}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {session && <button onClick={()=>setView("empresa")} style={{ ...BSM, color:T.amber, border:"1px solid "+T.amber+"40" }}><Building2 size={13}/></button>}
                {session
                  ? <button onClick={handleLogout} style={{ ...BSM, color:T.red, border:"1px solid "+T.red+"30", background:T.redBg }}><LogOut size={13}/></button>
                  : <button onClick={()=>setView("empresa")} style={BSM}><LogIn size={13}/></button>
                }
              </div>
            </div>
          )}

          {view==="dashboard" && <Dashboard {...ctx}/>}
          {view==="materials" && <Materials mats={mats} reload={loadAll} setModal={setModal}/>}
          {view==="clients"   && <Clients   clis={clis} projs={projs} reload={loadAll} setModal={setModal}/>}
          {view==="projects"  && <Projects  projs={projs} clis={clis} buds={buds} reload={loadAll} setModal={setModal}/>}
          {view==="budgets"   && <Budgets   buds={buds} projs={projs} clis={clis} mats={mats} empresa={empresa} reload={loadAll} setModal={setModal}/>}
          {view==="empresa"   && !session && <LoginScreen onLogin={handleLogin}/>}
          {view==="empresa"   && session  && <EmpresaView empresa={empresa} onUpdate={e=>{setEmpresa(e);showToast("Empresa actualizada ✓");}} session={session}/>}
        </main>
      </div>

      {mobile && <BottomNav view={view} setView={setView}/>}
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      {modal && (
        <Modal onClose={()=>setModal(null)} wide={modal.t==="bud"}>
          {modal.t==="mat"  && <MatForm    item={modal.d} onSave={async()=>{await loadAll();setModal(null);showToast("Material guardado ✓");}}  onClose={()=>setModal(null)}/>}
          {modal.t==="cli"  && <CliForm    item={modal.d} onSave={async()=>{await loadAll();setModal(null);showToast("Cliente guardado ✓");}}    onClose={()=>setModal(null)}/>}
          {modal.t==="proj" && <ProjForm   item={modal.d} clients={clis} onSave={async()=>{await loadAll();setModal(null);showToast("Proyecto guardado ✓");}} onClose={()=>setModal(null)}/>}
          {modal.t==="bud"  && <BudgetForm item={modal.d} projects={projs} materials={mats} clients={clis} onSave={async()=>{await loadAll();setModal(null);showToast("Presupuesto guardado ✓");}} onClose={()=>setModal(null)}/>}
        </Modal>
      )}
    </>
  );
}
