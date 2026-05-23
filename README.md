# FindIt 🚽

> A personal hackathon project that solves a real-world problem: finding the nearest public toilets when you need them most.

## The Story: How This Started

### The Problem
During a weekend in Singapore, I faced an urgent situation—I desperately needed to find a public toilet nearby with no idea where to look. I could use Google Maps for restaurants, ATMs, or hospitals, but there was no easy way to search for public restrooms with specific amenities (free, wheelchair accessible, etc.). 

**Thought Process**: If something this common is hard to find, maybe others face the same problem. What if I could build a tool that combines real-time geolocation with AI to make toilet discovery effortless?

### Building It
Instead of another feature request, I decided to solve it myself. This hackathon project reverse-engineered the problem and built a working solution in a single sprint.

---

## What FindIt Does

An AI-powered web app that:
- 📍 Locates nearby public toilets using your current position
- 🤖 Understands natural language queries ("find a wheelchair-accessible toilet near me")
- 🗺️ Displays results on an interactive map
- 🔍 Filters by amenities: free access, wheelchair accessibility, diaper changing facilities
- 🏗️ Reverse-engineers toilet locations from OpenStreetMap data

**Live Demo**: [FindIt on GitHub Pages](https://mandlcho.github.io/findit/)

---

## Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- A browser with geolocation support

### Installation

```bash
git clone https://github.com/mandlcho/findit.git
cd findit
npm install
```

### Development

```bash
npm run dev
```

Opens http://localhost:5173 with hot reload.

### Build & Deploy

```bash
npm run build        # Create production bundle in dist/
npm run preview      # Test the production build locally
```

To deploy to GitHub Pages:

```bash
./scripts/run-pages-workflow.sh
```

---

## Future Roadmap

- [ ] **Planned Toilet Visits**: Save and plan trips to verified restrooms
- [ ] **Offline Mode**: Cache nearby toilet data for offline access
- [ ] **Real-time Updates**: Show occupancy status / average wait times (via OpenStreetMap community)
- [ ] **Smart Suggestions**: ML model trained on visit patterns to suggest best toilets
- [ ] **Mobile App**: React Native version for iOS/Android
- [ ] **Payment Integration**: Partner with public restroom providers for premium facilities
- [ ] **Accessibility Metrics**: Detailed accessibility info beyond wheelchair access
- [ ] **Environmental Impact**: Track carbon saved by using public restrooms vs. searching inefficiently
- [ ] **Internationalization**: Support for 20+ languages and regional toilet terminology

---

## Contributing

Found a bug? Have a feature idea? Contributions are welcome!

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make changes, commit, push
git push origin feature/your-feature

# Open a pull request
```

---

## License

MIT © 2025

---

## Acknowledgments

- **OpenStreetMap** for toilet location data
- **Leaflet** for lightweight, beautiful maps
- **Vite** for blazing-fast builds
- **Singapore's public restroom network** for existing, though hard-to-find, infrastructure

---

**Made with 🚽 during a weekend hackathon.**
