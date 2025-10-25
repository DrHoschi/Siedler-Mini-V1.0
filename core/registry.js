/* ============================================================================
 * Datei   : core/registry.js
 * Projekt : Neue Siedler (Minimal-Basis)
 * Version : v25.10.25-min
 * Zweck   : Zentrale Registry (Single Source of Truth) für IDs/Kategorien/Icons.
 *           – Lädt minimale Daten (resources.json, buildings.json)
 *           – Sendet cb:registry:ready, sobald Daten im Speicher sind
 *           – Liest nur (künftig) aus asset.js, hier: einfacher Fetch (minimal)
 * Struktur: Imports → Konstanten → Helpers → Klasse → Hauptlogik → Exports
 * ============================================================================
 */

/* ============================= [Imports / Polyfills] ====================== */
// (keine externen Imports in der Minimal-Variante)
// Erwartet: core/cblog.polyfill.js & core/eventbus.js sind bereits geladen.

/* ============================ [Konstanten / Meta] ======================== */
const REGISTRY_VERSION = "v25.10.25-min";
const REGISTRY_PATHS = {
  resources: "data/resources.json",
  buildings: "data/buildings.json",
};

/* ============================== [Hilfsfunktionen] ======================== */
const __logOK   = (msg, ...a) => (window.CBLog?.ok    || console.log)(`[registry] ${msg}`, ...a);
const __logInfo = (msg, ...a) => (window.CBLog?.info  || console.info)(`[registry] ${msg}`, ...a);
const __logWarn = (msg, ...a) => (window.CBLog?.warn  || console.warn)(`[registry] ${msg}`, ...a);
const __logErr  = (msg, ...a) => (window.CBLog?.error || console.error)(`[registry] ${msg}`, ...a);
const __emit    = (name, detail={}) => window.dispatchEvent(new CustomEvent(name, { detail }));

async function __loadJSON(url){
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}

/* ================================= [Klasse] ============================== */
class RegistryCore {
  constructor(){
    /** @type {Record<string, any>} */
    this.db = {
      resources: {}, // by id
      buildings: {}, // by id
      meta: {
        version: REGISTRY_VERSION,
        ready: false,
      }
    };
  }

  /**
   * Initialisiert die Registry, lädt Minimal-Daten und prüft einfache Konsistenz.
   */
  async init(){
    __logInfo(`init() – Version ${REGISTRY_VERSION}`);

    // Minimaldaten laden
    const [resources, buildings] = await Promise.all([
      __loadJSON(REGISTRY_PATHS.resources).catch((e)=>{ __logErr("resources.json fehlt", e); return []; }),
      __loadJSON(REGISTRY_PATHS.buildings).catch((e)=>{ __logErr("buildings.json fehlt", e); return []; }),
    ]);

    // In Maps eintragen
    for(const r of resources){
      if(!r?.id){ __logWarn("Resource ohne id:", r); continue; }
      if(this.db.resources[r.id]) { __logWarn("Resource doppelt:", r.id); }
      this.db.resources[r.id] = r;
    }
    for(const b of buildings){
      if(!b?.id){ __logWarn("Building ohne id:", b); continue; }
      if(this.db.buildings[b.id]) { __logWarn("Building doppelt:", b.id); }
      this.db.buildings[b.id] = b;
    }

    // Einfache Cross-Checks (Minimal)
    for(const [bid, b] of Object.entries(this.db.buildings)){
      if(b.cost){
        for(const [rid] of Object.entries(b.cost)){
          if(!this.db.resources[rid]){
            __logWarn(`Building ${bid} referenziert unbekannte Ressource: ${rid}`);
          }
        }
      }
    }

    this.db.meta.ready = true;
    __logOK("bereit ✓");
    __emit("cb:registry:ready", { version: REGISTRY_VERSION, counts: {
      resources: Object.keys(this.db.resources).length,
      buildings: Object.keys(this.db.buildings).length
    }});
  }

  /** Liefert ein Objekt einer Kategorie (z. B. "resources"|"buildings") nach ID. */
  get(type, id){ return this.db?.[type]?.[id] ?? null; }

  /** Listet alle Einträge einer Kategorie. */
  list(type){ return Object.values(this.db?.[type] ?? {}); }
}

/* ================================ [Hauptlogik] =========================== */
(function main(){
  const reg = new RegistryCore();
  // Exponieren:
  window.Registry = reg;

  // Standard-Flow: nach Assets ready, oder spätestens nach Window-Load
  let started = false;
  function kickoff(){
    if(started) return;
    started = true;
    reg.init().catch(err => __logErr("init() failed", err));
  }

  // Falls deine asset.js cb:assets-ready feuert → danach initialisieren
  window.addEventListener("cb:assets-ready", () => kickoff(), { once: true });

  // Fallback: spätestens nach DOM/Window Start
  if (document.readyState === "complete") {
    setTimeout(kickoff, 100);
  } else {
    window.addEventListener("load", () => setTimeout(kickoff, 100), { once: true });
  }
})();

/* ================================= [Exports] ============================= */
// (keine ES-Module-Exports; globale window.Registry API:
//   - Registry.get(type, id)
//   - Registry.list(type)
//   - Event: cb:registry:ready
// )
