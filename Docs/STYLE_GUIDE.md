# GiddyUp Rides — Style Guide

> **Version 1.0** | Audience: Elderly riders (65+) | Accessibility: WCAG AAA target throughout
>
> GiddyUp Rides is a ride and delivery service for seniors. Western-branded, modern app. Accessibility is always first — every decision must be evaluated for legibility, tap-ability, and clarity for older eyes and hands.

---

## 1. Brand Identity

### Personality
- **Western heritage** — warm, trustworthy, rooted in the community (Montana-based)
- **Modern simplicity** — clean UI, no clutter, no confusion
- **Warm authority** — like a knowledgeable neighbor who makes things easy

### Logo
- Primary logo: Horse + car icon with "GiddyUp Rides" wordmark
- Tagline: *"Saddle Up For Rides and Deliveries!"*
- Logo always appears on Navy (`#1B2A4A`) or White (`#FFFFFF`) backgrounds only
- Never place logo on Gold — insufficient contrast for the wordmark
- Minimum logo width: **120px** (mobile), **180px** (tablet/web)
- Clear space: equal to the height of the "G" in the wordmark on all sides
- Never rotate, recolor, stretch, or apply drop shadows to the logo

### Western + Modern Balance
- Western: use the horse/car motif, warm gold tones, badge-style UI elements, friendly serif for display text
- Modern: clean grid layouts, generous whitespace, flat icons, standard iOS/Android interaction patterns
- Do NOT use: saloon fonts, excessive decorative borders, barn textures, or anything that reads as "costume western"

---

## 2. Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **GiddyUp Gold** | `#C9A84C` | Primary actions, highlights, CTAs |
| **GiddyUp Navy** | `#1B2A4A` | Backgrounds, headers, navigation |
| **Pure White** | `#FFFFFF` | Screen backgrounds, text on Navy |

### Accessible Variants

| Name | Hex | Notes |
|------|-----|-------|
| **Deep Gold** | `#A6852A` | Gold text on White — passes WCAG AAA (7:1+) |
| **Pale Gold Tint** | `#FDF3DC` | Subtle gold backgrounds (never use for text) |
| **Light Navy** | `#2E4270` | Secondary navy for cards/dividers |
| **Off-White** | `#F8F6F0` | Warm screen background (less harsh than pure white) |
| **Dark Text** | `#1A1A1A` | Body text on white/off-white backgrounds |
| **Error Red** | `#C0392B` | Errors only — never decorative |
| **Success Green** | `#1E7A3C` | Confirmations only — never decorative |

### Contrast Ratios (WCAG)

| Combination | Ratio | Rating |
|-------------|-------|--------|
| White `#FFFFFF` on Navy `#1B2A4A` | **12.6:1** | ✅ AAA |
| Navy `#1B2A4A` on White `#FFFFFF` | **12.6:1** | ✅ AAA |
| Navy `#1B2A4A` on Gold `#C9A84C` | **5.8:1** | ✅ AA (large text AAA) |
| Deep Gold `#A6852A` on White `#FFFFFF` | **7.2:1** | ✅ AAA |
| White `#FFFFFF` on Deep Gold `#A6852A` | **7.2:1** | ✅ AAA |
| Dark Text `#1A1A1A` on Off-White `#F8F6F0` | **18.1:1** | ✅ AAA |

> ⚠️ **Gold `#C9A84C` on White fails WCAG AA** (2.9:1) — never use Gold as text color on light backgrounds. Use Deep Gold `#A6852A` instead.

### Color Rules
- **Never use color as the only indicator** — always pair with text, icon, or shape
- **Never use green/red as the only status signal** — add text labels ("Confirmed", "Cancelled")
- **Never use light gray text** — minimum `#767676` on white for AA; prefer `#1A1A1A` for AAA

---

## 3. Typography

### Typefaces
- **Display / Headers:** SF Pro Display (iOS) / Roboto (Android) — Bold or Heavy weight only
- **Body:** SF Pro Text (iOS) / Roboto (Android) — Regular or Medium weight only
- **No thin, light, or ultra-light weights anywhere in the app**

### Scale

| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Screen Title | 28sp | Bold | 1.2 | Page headers |
| Section Header | 22sp | Bold | 1.3 | Card titles, section labels |
| Body Large | 18sp | Regular | 1.5 | Primary reading text |
| Body | 16sp | Regular | 1.5 | Secondary content |
| Button Label | 18sp | Bold | 1.0 | All buttons |
| Caption | 14sp | Medium | 1.4 | **Minimum size** — use sparingly |

> **Minimum body text: 18sp.** Do not use text smaller than 14sp anywhere. Prefer 18sp+ for anything users need to read and act on.

### Typography Rules
- Left-align body text (never justify)
- Center-align only for single-line labels, button text, and short display headings
- Line length: 45–65 characters per line (avoid full-width text on large screens)
- Always support Dynamic Type / font scaling — test at 200% scale
- Never truncate critical information with ellipsis — wrap or expand the container

### Text Size Floor
**Text Size Floor**: All user-facing text must render at a minimum of the user's selected text size. No hardcoded `fontSize` values may produce text smaller than the user's chosen scale. Always use `sf(FontSize.x)` (or the project's equivalent scaling helper) instead of raw pixel values.

---

## 4. Buttons

### Sizes

| Type | Min Height | Min Width | Corner Radius |
|------|-----------|-----------|--------------|
| Primary CTA | **56px** | Full-width | 12px |
| Secondary | **52px** | Full-width | 12px |
| Icon button | **44px × 44px** | — | 8px |

> 56px minimum height for all tappable buttons. Elderly users have reduced fine motor precision — larger is always better.

### Button Styles

**Primary Button** — Gold on Navy
```
Background: #1B2A4A (Navy)
Text: #FFFFFF (White)
Font: 18sp Bold
Border: none
Tap state: #2E4270 (Light Navy)
```

**Secondary Button** — Navy outline
```
Background: #FFFFFF
Text: #1B2A4A (Navy)
Border: 2px solid #1B2A4A
Font: 18sp Bold
Tap state: #F0F2F7
```

**Accent Button** — White on Gold (use sparingly)
```
Background: #A6852A (Deep Gold — not standard Gold, for contrast)
Text: #FFFFFF
Font: 18sp Bold
Tap state: #8A6E22
```

**Destructive Button** — Red
```
Background: #C0392B
Text: #FFFFFF
Font: 18sp Bold
Use only for: Cancel ride, Delete account
```

### Button Rules
- Every button must have a visible text label — no icon-only primary actions
- Disabled buttons: 40% opacity — still must show text, never completely hidden
- Always show loading state (spinner + "Please wait…") for async actions
- Never place two primary buttons side by side — stack vertically with 12px gap
- Touch target extends 8px beyond visible button edge (use padding, not size)

---

## 5. Icons & Graphics

### Icon Principles
- **Always pair icons with text labels** — no icon-only navigation or actions
- Minimum icon size: **28px** (inline), **36px** (standalone/navigation)
- Use filled icons (not outline) for active/selected states — higher contrast
- Use outline icons for inactive states

### Icon Style
- Rounded, friendly shapes — no sharp angular icons
- Stroke weight: 2px minimum at 24px, 2.5px at 36px+
- Western motifs (horse, horseshoe, hat) only for decorative/branding elements — never for functional icons

### Approved Icon Set
| Action | Icon | Label Required |
|--------|------|----------------|
| Request ride | Car fill | "Request Ride" |
| Track driver | Map pin fill | "Track Driver" |
| Call driver | Phone fill | "Call Driver" |
| Cancel | X circle fill | "Cancel" |
| Home | House fill | "Home" |
| Profile | Person circle fill | "My Account" |
| Help | Question circle fill | "Help" |
| SOS / Emergency | Exclamation triangle fill | "Emergency" |

### Graphics & Illustrations
- Photography: warm tones, real elderly people using the service with dignity — no stock "happy senior" clichés
- Illustrations: flat, simple, gold/navy palette
- Loading states: GiddyUp horse animation (subtle, gold on navy)
- Empty states: illustrated, always include a clear action button

---

## 6. Maps

### Map Style
- Base map: muted/greyed-down style (reduce visual noise for elderly users)
- Route line: **4px minimum**, Navy `#1B2A4A` with Gold `#C9A84C` active highlight
- Never use light gray route lines — too low contrast

### Markers
- Driver marker: large filled circle (minimum **44px tap target**), Gold fill, Navy border (3px), white car icon inside
- Pickup marker: Navy fill, white house icon, "Your Location" label always visible
- Dropoff marker: Navy fill, white flag icon, destination name always visible
- Labels: 14sp Bold minimum, Navy text, white background pill — always on by default

### Map Accessibility
- Never rely on map alone to convey status — always show text status above the map ("Driver is 3 minutes away")
- All map controls (zoom +/−, my location) minimum **44px × 44px**
- Satellite/terrain toggle: off by default — standard map is clearest for this audience
- High contrast mode: invert map tiles to dark background when system high-contrast is on

---

## 7. Spacing & Layout

### Grid
- Base unit: **8px**
- Screen margins: **20px** horizontal
- Section spacing: **24px** between major sections
- Card padding: **20px** internal

### Layout Rules
- **One primary action per screen** — no decision paralysis
- Maximum 3 options on any single screen before breaking into a new screen
- Cards: white, 12px radius, `1px solid #E0E0E0` border, subtle shadow (`0 2px 8px rgba(0,0,0,0.08)`)
- Avoid multi-column layouts on phone — single column only
- Sticky bottom CTAs: primary action always docked to bottom safe area

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon/text gaps |
| sm | 8px | Internal element gaps |
| md | 16px | Component padding |
| lg | 20px | Screen margins |
| xl | 24px | Section spacing |
| 2xl | 40px | Major section breaks |

---

## 8. Accessibility Rules

### Non-Negotiables
These rules apply to every screen, every component, always:

1. **Contrast** — All text/background combinations must meet WCAG AA minimum (4.5:1 normal text, 3:1 large text). Target AAA (7:1) wherever possible.
2. **Touch targets** — Minimum **44×44px** for any interactive element. Prefer 56px for primary actions.
3. **Font scaling** — All text must scale with system font size settings. Test at 100%, 150%, and 200%. No layout must break or truncate critical content.
4. **No color-only cues** — Every color-coded status must also use text, icon, or pattern.
5. **Labels** — Every interactive element must have an accessibility label (screen reader support).
6. **Error messages** — Must state what went wrong AND what to do next, in plain language.
7. **Focus order** — Logical top-to-bottom, left-to-right keyboard/switch access order.

### Elderly-Specific Requirements
- **No time-limited actions** — do not auto-dismiss alerts, auto-advance screens, or expire sessions mid-task without a clear warning and extension option
- **Confirmation dialogs** for all destructive/irreversible actions (cancel ride, log out)
- **No small checkboxes** — use full-row toggle rows (min 52px height) with label
- **Haptic feedback** for all button taps (medium impact)
- **No gestures as the only way** to access a feature — all swipe/pinch gestures must have a visible button alternative
- **Simple language** — Grade 6 reading level maximum for all UI copy

### Testing Checklist
- [ ] VoiceOver / TalkBack: all elements announced correctly with role + label
- [ ] Large text (200%): no overlap, truncation, or broken layouts
- [ ] Bold text mode: no illegibility
- [ ] High contrast mode: all content remains visible
- [ ] Reduce motion: no essential animations, no spinning/flashing
- [ ] Color blind simulation (Deuteranopia): all status information legible without color

---

## 9. Voice & Tone

### Personality
GiddyUp Rides speaks like a **warm, reliable neighbor** — not a corporate app, not a chatbot.

| ✅ Do | ❌ Don't |
|-------|---------|
| Friendly and direct | Formal or robotic |
| Plain English | Jargon or tech terms |
| Specific and actionable | Vague or ambiguous |
| Encouraging | Condescending |
| Brief | Wordy |

### Writing Rules
- **Use the active voice** — "Your driver is arriving" not "Arrival is being processed"
- **Use plain numbers** — "3 minutes away" not "ETA: 00:03:00"
- **Name actions clearly** — "Request a Ride" not "Initiate Service" or "Get Started"
- **Acknowledge the user** — "We've got your ride" not "Booking confirmed (ID: 84729)"
- **Error messages: explain + instruct** — "We couldn't reach the driver. Tap below to try again." not "Error 503"
- **No exclamation mark overuse** — one per screen maximum, only for genuine celebration (ride arrived, first ride complete)

### Sample Copy

| Context | ✅ Use | ❌ Avoid |
|---------|-------|---------|
| Ride confirmed | "You're all set! Your driver is on the way." | "Booking confirmed. Driver dispatched." |
| Driver arriving | "Almost here — 2 minutes away." | "ETA: 2 min. Driver en route." |
| Cancellation | "Your ride has been cancelled. No charge." | "Cancellation processed successfully." |
| Error | "Something went wrong. Please try again or call us at (406) 493-7779." | "An error occurred (code 422)." |
| Empty state | "No rides yet. Ready when you are!" | "No data available." |

### Phone Number
Always display support number as: **(406) 493-7779**
Include on error screens and help screens. Elderly users prefer calling — make the number tappable (tel: link) and large (22sp minimum).

---

## Appendix: Quick Reference Card

| Element | Spec |
|---------|------|
| Primary button height | 56px min |
| Touch target minimum | 44×44px |
| Body text minimum | 18sp |
| Caption minimum | 14sp (use sparingly) |
| Font weights | Regular, Medium, Bold, Heavy only |
| Primary CTA color | White on Navy `#1B2A4A` |
| Primary text on white | `#1A1A1A` |
| Gold text on white | Deep Gold `#A6852A` only |
| Screen margin | 20px |
| Card radius | 12px |
| WCAG target | AAA (7:1+) wherever possible |
| Minimum WCAG | AA (4.5:1 normal, 3:1 large) |

---

*GiddyUp Rides Style Guide v1.0 — Questions? Contact the design team or reference the brand flyer in `/Docs/GiddyUpRides.png`.*
