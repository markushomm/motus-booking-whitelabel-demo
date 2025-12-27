# Salsa Studio Booking - White-Label Demo

This is a **white-label demo instance** of the mōtus Booking App, showcasing how the app can be customized for different dance studios.

**Live Demo:** https://motus-booking-whitelabel-demo.pages.dev

## Features

- **Custom Branding** - Studio name, colors, logo
- **Booking Management** - Private lessons & group classes
- **Client Database** - Member status, booking history
- **Revenue Statistics** - Weekly, monthly, yearly analytics
- **Camp & Trip Management** - Multi-day events with participants
- **Guest Trainer Accounting** - Separate revenue tracking
- **English Onboarding** - 4-slide intro for new users

## Configuration

All customization happens in `config.js`:

```javascript
const CONFIG = {
    name: "Salsa Studio",        // Studio name
    tagline: "booking",          // Tagline

    colors: {
        accent: "#3b82f6",       // Primary color (blue)
        accentLight: "#60a5fa",  // Lighter variant
        accentDark: "#2563eb",   // Darker variant
        bg: "#0a0a12",           // Background
        surface: "#12121a",      // Card surfaces
    },

    supabase: {
        url: "https://your-project.supabase.co/rest/v1",
        key: "your-anon-key"
    },

    features: {
        flightTracking: true,
        chat: true,
        campMode: true,
        guestTrainers: true
    },

    onboarding: {
        enabled: true,
        slides: [...]           // Customizable onboarding slides
    }
};
```

## Onboarding System

The demo includes an English onboarding flow:

1. **Smart Booking** - Manage classes and lessons
2. **Client Management** - Track students and packages
3. **Revenue Analytics** - Understand your business
4. **Your Brand** - Fully customizable white-label

Onboarding shows once per device (stored in localStorage). To reset:
```javascript
localStorage.removeItem('onboarding_seen');
```

## Deployment

### Cloudflare Pages (Recommended)

```bash
npx wrangler pages deploy . --project-name=your-studio-name
```

### Manual Setup

1. Copy all files to your hosting
2. Edit `config.js` with your settings
3. Create Supabase project and update credentials
4. Update `manifest.json` with studio name/icons

## Security

- **API Keys**: Google Maps API key is restricted to specific domains
- **Supabase**: Use Row Level Security (RLS) policies
- **Demo Mode**: `forceDemo: true` uses mock data

## File Structure

```
├── index.html          # Main app
├── config.js           # Tenant configuration
├── app.js              # Application logic
├── styles.css          # Styling with CSS variables
├── manifest.json       # PWA manifest
├── icon-*.png          # App icons
└── README.md           # This file
```

## Creating a New White-Label Instance

1. Fork/copy this repository
2. Update `config.js`:
   - Change `name` and `tagline`
   - Set your brand `colors`
   - Add your Supabase credentials
   - Customize `onboarding` slides
3. Update `manifest.json` with your studio name
4. Replace icon files with your logo
5. Deploy to Cloudflare Pages

## Original Project

Based on **mōtus Booking App**: https://motus-booking.pages.dev

---

*White-Label solution by mōtus studio*
