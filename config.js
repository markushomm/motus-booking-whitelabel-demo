/**
 * TENANT CONFIGURATION - Demo White-Label Instance
 *
 * Beispiel: "Salsa Studio Berlin"
 * Diese Demo zeigt wie die App mit anderem Branding aussieht.
 */

const CONFIG = {
    // === BRANDING ===
    name: "Salsa Studio",
    tagline: "booking",

    // === FARBEN (Blau-Theme) ===
    colors: {
        accent: "#3b82f6",      // Blau statt Gold
        accentLight: "#60a5fa", // Helleres Blau
        accentDark: "#2563eb",  // Dunkleres Blau
        bg: "#0a0a12",          // Leicht bläulicher Hintergrund
        surface: "#12121a",     // Cards/Oberflächen
        surfaceLight: "#1a1a24" // Leichtere Oberflächen
    },

    // === SUPABASE (Demo - nutzt ?demo Modus) ===
    // Für echte Kunden: Eigenes Supabase-Projekt erstellen
    supabase: {
        url: "https://demo.supabase.co/rest/v1",
        key: "demo-key"
    },

    // === EMAILJS (Demo - deaktiviert) ===
    emailjs: {
        publicKey: "demo",
        serviceId: "demo",
        templateId: "demo"
    },

    // === FEATURES ===
    features: {
        flightTracking: true,
        chat: true,
        campMode: true,
        guestTrainers: true
    },

    // === DEMO MODE ===
    forceDemo: true  // Diese Instanz läuft immer im Demo-Modus
};

/**
 * CSS-Variablen aus Config setzen
 */
function applyConfigColors() {
    const root = document.documentElement;
    const c = CONFIG.colors;

    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--accent-rgb', hexToRgb(c.accent));
    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--surface-light', c.surfaceLight);

    // Meta Theme Color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = c.bg;

    // Gradient-Elemente mit neuer Farbe aktualisieren
    updateGradients();
}

/**
 * Gradients dynamisch aktualisieren
 */
function updateGradients() {
    const style = document.createElement('style');
    const c = CONFIG.colors;
    style.textContent = `
        .nav-toggle { background: linear-gradient(145deg, ${c.accentLight}, ${c.accent}) !important; }
        .stats-toggle-btn.active { background: linear-gradient(145deg, ${c.accentLight}, ${c.accent}) !important; }
        .trainer-btn.active { background: linear-gradient(135deg, ${c.accent}, ${c.accentLight}) !important; }
        .lang-btn.active { background: linear-gradient(135deg, ${c.accent}, ${c.accentLight}) !important; }
        .submit-btn-v2 { background: linear-gradient(135deg, ${c.accent}, ${c.accentDark}) !important; }
        .submenu-add-btn { background: linear-gradient(135deg, ${c.accent}, ${c.accentDark}) !important; }
        .member-badge { background: linear-gradient(135deg, ${c.accentLight}, ${c.accent}, ${c.accentDark}) !important; }
        .member-crown { background: linear-gradient(135deg, ${c.accentLight}, ${c.accent}) !important; }
        .invoice-header { background: linear-gradient(135deg, ${c.accent}, ${c.accentDark}) !important; }
        .invoice-header::after { background: linear-gradient(135deg, ${c.accent}, ${c.accentDark}) !important; }
    `;
    document.head.appendChild(style);
}

/**
 * Hex zu RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "59,130,246";
    return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// Farben beim Laden anwenden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyConfigColors);
} else {
    applyConfigColors();
}
