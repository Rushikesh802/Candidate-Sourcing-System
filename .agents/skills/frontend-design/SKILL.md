---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Use when creating frontends, designing web apps, UI components, landing pages, or crafting production-grade interfaces that avoid generic AI aesthetics.
---

# Frontend Design

Approach this as the design lead at a specialized studio known for giving every project a visual identity that could not be mistaken for anyone else's. The goal is to make deliberate, opinionated choices about palette, typography, layout, and interaction that are specific to the brief, taking justified aesthetic risks.

---

## 1. Ground It in the Subject

* **Pin the Purpose**: Before writing UI code, define one concrete subject, the primary audience, and the page/component's single job.
* **Authentic Material**: Draw aesthetic inspiration from the subject's world—its tools, materials, history, and terminology—rather than generic software patterns.
* **Content First**: Build with real, domain-specific content and copy whenever possible. Avoid filler phrases and placeholder clichés.

---

## 2. Core Design Principles

### Hero as Thesis
* For web applications and landing pages, the hero or primary viewport must present the core thesis immediately.
* Use whatever medium best expresses the subject: a bold headline, interactive demo, live component preview, or custom visual composition.
* Avoid default templates (e.g., standard "huge number + small label + generic purple gradient" unless justified by the brief).

### Typography Carries Personality
* **Intentional Pairings**: Select distinct display and body typefaces suited to the subject (e.g., editorial serifs, technical grotesques, geometric sans, or mono utilities) instead of defaulting to generic system fonts.
* **Type Hierarchy**: Establish an intentional scale with purposeful line-heights, letter-spacing, and weight contrasts.

### Structure & Layout
* **Semantic Devices**: Dividers, numbers, tags, and badges should encode real structural meaning (e.g., numbered steps only when ordering is sequential).
* **Asymmetry & Composition**: Break rigid card-grid monotony where appropriate with varied density, staggered elements, or full-bleed focal points.

### Deliberate Color Systems
* **Tokenized Palette**: Define CSS variables / theme tokens (4–6 cohesive colors: background, foreground, primary surface, secondary surface, border, and 1–2 high-intent accent colors).
* **High-Intent Accents**: Use accent colors with clear functional or emotional intention.

### Motion & Micro-interactions
* **Orchestrated Motion**: Prioritize subtle, choreographed moments (e.g., smooth state transitions, hover feedback, gentle reveals) over gratuitous animations.
* **Performance & Accessibility**: Respect `prefers-reduced-motion` and ensure interaction latency remains low.

---

## 3. Calibrating Away from AI Aesthetics ("AI Slop")

Be mindful of and avoid unintentional default patterns that AI models commonly gravitate toward:
1. **The Warm Cream Default**: Background `#F4F1EA` + high-contrast serif + terracotta accent.
2. **The Generic Dark Mode**: Pure black `#000000` + neon acid-green or bright vermilion accent.
3. **The Sterile Broadsheet**: Heavy hairline borders, zero border-radius, and dense column dumps without visual hierarchy.

*Note: Any aesthetic is valid if explicitly chosen and fitting for the brief, but avoid using them as unthinking defaults.*

---

## 4. Design Workflow

```text
[ Brainstorm & Explore ] -> [ Design Plan & Tokens ] -> [ Critique Plan ] -> [ Build UI ] -> [ Polish & Review ]
```

### Step 1: Design Plan (Pre-Code)
Before writing frontend code, establish:
* **Palette**: Hex values & CSS variables for light/dark themes.
* **Type Hierarchy**: Display font, body font, code/mono font.
* **Layout Structure**: Wireframe/composition of key views and components.
* **Signature Element**: 1 memorable visual or interactive detail that defines the experience.

### Step 2: Critique
* Does this look like a generic template or a tailored interface?
* Are the spacing, contrast, and hierarchy crisp and legible?
* Does it adapt cleanly across mobile, tablet, and desktop breakpoints?

### Step 3: Build & Polish
* Implement using clean, modular code (React, Vue, Svelte, Tailwind, or modern CSS).
* Ensure full accessibility (semantic HTML, proper ARIA attributes, keyboard navigability, color contrast compliance).
* Validate responsive behavior and interactive edge cases (loading states, empty states, error states).
