# Button Dashboard

Small single-page app to create and manage customizable buttons that link to URLs or show QR codes.

Quick start

1. Install (optional dependencies):

```bash
npm install
```

2. Start development server (Live Server recommended):

```bash
npx live-server
```

Features

- Add unlimited buttons with title, URL/text, icon, background (color/gradient/image), opacity, tags
- Drag & drop reordering
- QR code generation (uses QRCode.js)
- Export/Import JSON
- Auto-save to `localStorage`
- Dark/Light theme, keyboard shortcuts (Ctrl+S save, Ctrl+Z undo, Ctrl+Y redo)
- PWA manifest and service worker (basic)

Deployment

This is a static site. Deploy to GitHub Pages, Netlify, or Vercel by pushing the folder and pointing to `index.html`.

User manual

- Click `Add Button` to create a new button.
- Use `Open` to follow the URL or `QR` to view the QR code.
- Use `Export` to download JSON, and `Import` to load it back.
- Search filters by title or tags.

Notes

- Data is stored in `localStorage` under key `my-website-buttons-v1`.
- Shareable links are supported by encoding state in the URL hash.
