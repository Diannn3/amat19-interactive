# Dependency ledger — Pass 1

Only dependencies with concrete Pass 1 use are included.

| Package | Role | Pass 1 decision |
|---|---|---|
| Astro 7.2.6 | static app shell/content | Adopt |
| @astrojs/react 6.0.4 | one React root per lab | Adopt |
| React / React DOM 19.2.8 | lab runtime | Adopt |
| Tailwind CSS 4.3.3 + @tailwindcss/vite 4.3.3 | CSS-first utility/design-token pipeline | Adopt |
| @radix-ui/react-tabs | accessible Explore/Practice/Argument mode tabs | Adopt, intentionally Radix |
| lucide-react | one icon family | Adopt |
| Fontsource Inter Variable + Sora Variable | self-hosted body/display typography | Adopt; OFL-1.1 font licensing |
| Dexie | IndexedDB persistence adapter | Adopt behind port |
| TypeScript 6.0.3 | strict TS baseline compatible with current Astro checker line | Adopt |
| Vitest | workspace unit/property runner after install | Adopt |
| fast-check | mathematical properties beyond examples | Adopt |
| Playwright | E2E/multi-viewport QA | Adopt |
| @axe-core/playwright | automated a11y checks | Adopt |

Deferred until a module proves need: MathLive, Fraction.js, Decimal.js, Mafs, Cytoscape.js, LP solver/WASM, Nano Stores, React Bits. This keeps Pass 1 dependency pressure aligned with actual shipped behavior rather than speculative architecture.
