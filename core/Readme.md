Welche core/-Dateien JETZT wirklich nötig sind (Start + Canvas + Events):

Bitte nur diese erstmal hochladen (der Rest kann später nachrücken):
	•	core/cblog.polyfill.js
	•	core/eventbus.js
	•	core/core.env.js
	•	core/asset.js
	•	core/boot.js
	•	core/registry.js  ← (auch wenn leer, anlegen: später befüllen)
	•	core/game.js
	•	core/core.map.js
	•	core/core.render.js
	•	core/camera.js
	•	core/zoom.js
	•	core/core.input.js
	•	core/core.entities.js
	•	core/core.pfglue.js
	•	core/carrier.js
	•	core/overlay-hooks.js
	•	core/path-overlay.js
	•	core/unit-overlay.js

Warum genau diese?
Damit lädt dein Canvas, das Startpanel reagiert, Events fließen, und wir haben schon Map/Render/Inputs „unter Strom“. Alles andere (HUD, BuildDock usw.) kommt stückweise dazu – ohne die Index umzubauen.
