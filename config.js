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
    forceDemo: true,  // Diese Instanz läuft immer im Demo-Modus

    // === ONBOARDING (English for demos) ===
    onboarding: {
        enabled: true,
        slides: [
            {
                icon: "📅",
                title: "Smart Booking",
                desc: "Manage all your dance classes and private lessons in one place. Book, reschedule, and track instantly."
            },
            {
                icon: "👥",
                title: "Client Management",
                desc: "Keep track of your students, their packages, and booking history. Identify your most loyal members."
            },
            {
                icon: "📊",
                title: "Revenue Analytics",
                desc: "See your earnings at a glance. Weekly, monthly, or yearly - understand your business better."
            },
            {
                icon: "🎨",
                title: "Your Brand",
                desc: "Fully customizable colors, logo, and name. This is YOUR booking app - white-labeled for your studio."
            }
        ]
    }
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

/**
 * Onboarding System (English Demo)
 */
let onboardingSlide = 0;

function initOnboarding() {
    if (!CONFIG.onboarding?.enabled) return;

    // Check if already seen
    if (localStorage.getItem('onboarding_seen')) return;

    const overlay = document.getElementById('onboardingOverlay');
    const slidesContainer = document.getElementById('onboardingSlides');
    const dotsContainer = document.getElementById('onboardingDots');
    const nextBtn = document.getElementById('onboardingNext');
    const skipBtn = document.getElementById('onboardingSkip');

    if (!overlay || !slidesContainer) return;

    // Build slides
    const slides = CONFIG.onboarding.slides;
    slidesContainer.innerHTML = slides.map((slide, i) => `
        <div class="onboarding-slide ${i === 0 ? 'active' : ''}">
            <div class="onboarding-icon">${slide.icon}</div>
            <div class="onboarding-title">${slide.title}</div>
            <div class="onboarding-desc">${slide.desc}</div>
        </div>
    `).join('');

    // Build dots
    dotsContainer.innerHTML = slides.map((_, i) => `
        <div class="onboarding-dot ${i === 0 ? 'active' : ''}"></div>
    `).join('');

    // Show overlay
    overlay.classList.remove('hide');

    // Next button
    nextBtn.onclick = () => {
        if (onboardingSlide < slides.length - 1) {
            goToSlide(onboardingSlide + 1);
        } else {
            finishOnboarding();
        }
    };

    // Skip button
    skipBtn.onclick = finishOnboarding;

    // Touch swipe support
    let touchStartX = 0;
    overlay.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
    overlay.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && onboardingSlide < slides.length - 1) goToSlide(onboardingSlide + 1);
            else if (diff < 0 && onboardingSlide > 0) goToSlide(onboardingSlide - 1);
        }
    });
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.onboarding-dot');
    const nextBtn = document.getElementById('onboardingNext');

    slides.forEach((s, i) => {
        s.classList.remove('active', 'prev');
        if (i < index) s.classList.add('prev');
        if (i === index) s.classList.add('active');
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    onboardingSlide = index;
    nextBtn.textContent = index === slides.length - 1 ? 'Get Started' : 'Next';
}

function finishOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.classList.add('hide');
        overlay.style.opacity = '';
    }, 300);
    localStorage.setItem('onboarding_seen', '1');
}

// Init onboarding after splash
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initOnboarding, 1500));
} else {
    setTimeout(initOnboarding, 1500);
}
