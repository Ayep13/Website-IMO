Script Hub - INTERGRASI_MEDAN_OPERASI://
📋 Overview
A dynamic operations dashboard for managing tactical buttons, QR codes, and operational links. Built for the Kursus PJK siri 17 2026 at Cawangan Pengurusan Kejuruteraan dan Ketenteraan.

Live Demo: GitHub Pages URL

🚀 Features
Core Functionality
Button Management: Create, edit, delete, and reorder buttons with drag & drop

Dual Mode: Each button can be a URL link or QR code generator

Rich Customization: Background colors, gradients, images, opacity, icons

QR Generation: Built-in QR code generator using QRCode.js

Search & Filter: Quick search by title or tags

Statistics Dashboard: Real-time counts of total buttons, URLs, and QR codes

Data Management
Local Storage: Auto-saves to browser localStorage

Export/Import: JSON export/import for backup and sharing

Undo/Redo: Full undo/redo support (Ctrl+Z / Ctrl+Y)

Save Shortcut: Ctrl+S to manually save state

UI/UX
Dark Theme: Tactical dark interface with cyan accent (#00ffc8)

Responsive: Works on desktop, tablet, and mobile

Keyboard Shortcuts: Full keyboard navigation support

Toast Notifications: Real-time feedback for all actions

📦 Installation
Option 1: GitHub Pages (Recommended)
Fork this repository

Enable GitHub Pages in repository settings

Access via https://yourusername.github.io/script-hub/

Option 2: Local Development
bash
# Clone the repository
git clone https://github.com/yourusername/script-hub.git

# Navigate to directory
cd script-hub

# Install dependencies (optional)
npm install

# Start live server
npx live-server
Option 3: Google Apps Script Deployment
Create a new Google Apps Script project

Deploy as a web app

Copy all HTML/CSS/JS into the script editor

🛠️ Technology Stack
Technology	Purpose
HTML5	Structure
CSS3 + Tailwind	Styling
Vanilla JS (ES Modules)	Logic
QRCode.js	QR generation
Lucide Icons	Icon library
Google Fonts (Fira Sans, Space Mono)	Typography
LocalStorage API	Data persistence
📁 File Structure
text
script-hub/
├── index.html          # Main application
├── qr-generator.js     # QR code module
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline
├── package.json        # NPM dependencies
├── README.md           # This file
└── assets/             # Images and icons
    ├── images/
    │   ├── icon-192.png
    │   └── icon-512.png
    └── ...
🎮 Usage Guide
Adding a Button
Click "+ Add Button"

Fill in:

Title: Display name

URL/Text: Link or QR content

Mode: URL or QR

Icon: Emoji (optional)

Background: Color, gradient, or image

Opacity: 0.2 - 1.0

Tags: Search keywords

Click "Save"

Managing Buttons
Open: Click to open URL or display QR

Edit: Modify button properties

Delete: Remove button (with confirmation)

Drag & Drop: Reorder by dragging cards

Keyboard Shortcuts
Shortcut	Action
Ctrl+S	Save state
Ctrl+Z	Undo
Ctrl+Y	Redo
Esc	Close modal
Data Operations
Export: Downloads buttons-YYYY-MM-DD.json

Import: Upload previously exported JSON

Search: Filters by title or tags

🔧 Configuration
Changing Colors
Edit CSS variables in index.html:

css
:root {
  --border: #00ffc8;     /* Accent color */
  --bg: #0a0f1a;         /* Background */
  --card: #1a1f2e;       /* Card background */
  --text: #e2e8f0;       /* Text color */
  --muted: #94a3b8;      /* Muted text */
}
Storage Key
Data stored in localStorage under:

javascript
const STORAGE_KEY = 'my-website-buttons-v1';
📱 Mobile Support
Fully responsive grid layout

Touch-friendly drag & drop

Optimized form inputs for mobile

Adaptive toolbar layout

🚦 Deployment
GitHub Pages
bash
# Push to main branch
git push origin main

# Enable Pages in Settings > Pages
# Select "main" branch and "/" root
Netlify/Vercel
Connect repository

Auto-deploy on push

Custom domain support

Google Apps Script
Open script.google.com

Create new project

Paste HTML as Index.html

Deploy as web app

Set access to "Anyone" or "Organization"

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/amazing)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing)

Open Pull Request

📄 License
MIT License - Free for personal and commercial use.

🙏 Credits
Design: Kursus PJK siri 17 2026, Cawangan Pengurusan Kejuruteraan dan Ketenteraan

Images: Pexels (stock photos)

Icons: Lucide

QR Library: QRCode.js

🐛 Troubleshooting
Buttons not saving?
Check browser localStorage permissions

Try Ctrl+S to force save

Check console for errors

QR Code not displaying?
Ensure QRCode.js loads correctly

Check URL/text is valid

Try using https:// protocol

Drag & Drop not working?
Disable browser extensions

Try desktop browser

Check touch support on mobile

📊 API Reference
State Object
javascript
{
  items: [
    {
      id: "unique-id",
      title: "Button Title",
      url: "https://example.com",
      mode: "url", // or "qr"
      icon: "⚡",
      bgType: "color", // "gradient" | "image"
      color: "#1a1f2e",
      gradient: "linear-gradient(...)",
      bgImage: "https://...",
      opacity: 1,
      tags: "work, tactical"
    }
  ]
}
Functions
javascript
// Create button
addButton(itemData)

// Update button
updateButton(id, updatedData)

// Delete button
deleteButton(id)

// Export data
exportData()

// Import data
importData(jsonData)
🔜 Roadmap
Firebase/Cloud sync

User authentication

Multiple workspaces

QR code scanning

Analytics dashboard

Export to PDF/CSV

Custom themes

Chrome extension

📧 Support
Issues: GitHub Issues

Email: support@script-hub.com

Documentation: Wiki

Made with ❤️ for the Kursus PJK siri 17 2026
