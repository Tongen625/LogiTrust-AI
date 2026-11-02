# LogiTrust AI — Responsive Public Demo Version

## What changed
- Mobile QR visitors now land on a dedicated **Choose Experience** screen instead of the desktop Control Tower.
- Mobile visitors can open:
  - Driver App
  - Transport Coordinator App
  - Security Officer App
  - Hub Operator App
  - Admin / Manager App
- Added mobile hamburger navigation and a Home button to return to the QR landing screen.
- Desktop layout remains available and is unchanged in purpose.
- When a phone user explicitly opens the full web console, the desktop console keeps a readable desktop width and becomes horizontally scrollable rather than being squeezed into the phone width.
- Merged the four role-specific mobile app views into this final project.

## Run locally
```bash
npm install
npm run dev
```

If npm reports a peer-dependency resolution conflict on an older environment, use:
```bash
npm install --legacy-peer-deps
npm run dev
```

## Vercel
Framework: Vite
Build command: npm run build
Output directory: dist
Root directory: ./

## URL behavior
- Normal phone QR visit: public mobile landing screen
- Force full console on phone: add `?console=1`
- Force public landing: add `?landing=1`

Example:
`https://your-project.vercel.app/?landing=1`
