# ServiceHub Design Guidelines

## Design Approach: Reference-Based (Marketplace Hybrid)
Drawing inspiration from **Airbnb's card aesthetics**, **Swiggy's service differentiation**, and **Uber's clear CTAs**, creating a vibrant multi-service marketplace that balances visual appeal with functional clarity.

## Core Design Principles
- **Service Identity**: Each service has distinct color personality while maintaining cohesive brand
- **Visual Hierarchy**: Hero imagery → Service cards → Clear actions
- **Breathing Room**: Generous spacing between service categories
- **Progressive Discovery**: Guide users from browsing to booking

## Color System

**Brand Colors (Dark Mode Primary)**
- Primary: 220 70% 50% (Trustworthy blue)
- Background: 222 84% 5% (Deep slate)
- Surface: 217 33% 12% (Elevated cards)
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%

**Service Color Identifiers** (Use as accent borders/badges on cards):
- Electrician: 45 93% 58% (Electric yellow)
- Plumber: 200 85% 55% (Water blue)
- Beauty Parlor: 330 75% 65% (Rose pink)
- Cake Shops: 340 82% 60% (Sweet coral)
- GMart: 142 71% 45% (Fresh green)
- Rentals: 280 60% 55% (Property purple)
- Street Food: 25 95% 53% (Spicy orange)
- Restaurants: 15 85% 50% (Warm amber)

## Typography
**Fonts**: Inter (primary), Outfit (headings) via Google Fonts
- Hero: text-5xl/text-6xl font-bold tracking-tight
- Section Headers: text-3xl/text-4xl font-semibold
- Service Titles: text-xl font-semibold
- Body: text-base/text-lg
- CTAs: text-base font-medium

## Layout System
**Spacing Units**: Consistent use of 4, 6, 8, 12, 16, 20, 24 (tailwind units)
- Section padding: py-16/py-20 (mobile/desktop)
- Card gaps: gap-6/gap-8
- Container: max-w-7xl mx-auto px-4/px-6

## Component Library

### Homepage Hero
- **Full-width image backdrop** (h-[600px]) with dark gradient overlay
- Centered content: Large headline + search bar + service quick-links
- Search bar: Elevated card with location + service selector + CTA
- Variant="outline" buttons with backdrop-blur-lg bg-white/10

### Service Category Grid
- 4-column grid (lg:grid-cols-4 md:grid-cols-2 grid-cols-1)
- Cards: Rounded-2xl, hover:scale-105 transition, image top + content below
- Each card: Service icon/image, title, brief description, color-coded left border (4px)
- "Explore" button with service-specific accent color

### Individual Service Pages
**Hero Section**: Service-specific full-width image (h-96) with overlay, breadcrumb nav, service name
**Listings Grid**: 3-column card layout (lg:grid-cols-3)
- Provider cards: Image, name, rating (stars), price range, "Book Now" CTA
- Badges: "Top Rated", "Fast Response" with subtle backgrounds

### Navigation
- Sticky header: Logo left, service dropdown center, location + profile right
- Mobile: Hamburger menu revealing full-screen overlay with service categories

### Forms & Inputs
- Rounded-xl inputs with focus:ring-2 in service accent colors
- Dark backgrounds (bg-surface) with light text
- Labels: text-sm text-secondary mb-2

### Cards (Universal Pattern)
- Background: Surface color with border border-white/10
- Padding: p-6
- Shadow: shadow-lg shadow-black/20
- Hover state: transform scale-105, transition-transform duration-200

### CTAs
- Primary: Service accent color bg, white text, px-6 py-3, rounded-lg
- Secondary: Outlined variant with hover:bg-accent/10
- Ghost: Text-only with hover:bg-white/5

## Images Strategy

**Homepage**:
- **Large Hero Image**: Full-width lifestyle shot showing diverse services in action (collage style or split-screen) - 1920x600px
- Service category cards: 8 representative images (400x300px each) - electrician with tools, plumber at work, beauty salon interior, decorated cakes, grocery aisles, modern apartment, street food stall, restaurant ambiance

**Service Pages**:
- Service-specific hero: Contextual imagery (electrician: modern electrical panel, plumber: clean bathroom fixtures, etc.)
- Provider profile images: Square headshots or service photos (200x200px)
- Gallery images: Work samples/menu items as needed (variable sizes in masonry/grid)

**Quality**: High-resolution, professional photography with consistent color grading (slightly warm tones, good contrast)

## Responsive Behavior
- Desktop: Multi-column grids, side-by-side layouts
- Tablet: 2-column grids, stacked hero content
- Mobile: Single column, bottom sheet filters, sticky CTAs

## Unique Features
- **Service Switcher**: Floating bottom-right button (mobile) to quick-switch between services
- **Location Banner**: Subtle top banner showing current service area with change option
- **Unified Search**: Global search bar supporting "Electrician near me" or "Cake shops in [area]"
- **Cross-Service Suggestions**: "People also booked" cards showing complementary services

**Accessibility**: WCAG AA contrast ratios maintained, all interactive elements keyboard navigable, service colors tested for colorblind users