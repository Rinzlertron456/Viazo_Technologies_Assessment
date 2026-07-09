Found the root cause. Both **Button.tsx** and **Navbar.tsx** use **Tailwind CSS class names** but Tailwind was uninstalled and removed from `index.css`.

### The Problem:
- **Button.tsx** uses: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0066cc]` etc. — ALL Tailwind
- **Navbar.tsx** uses: `bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm flex items-center` etc. — ALL Tailwind
- These classes **don't exist** in the current `index.css` (which was simplified to just base reset styles)
- Login page works because it uses **CSS modules** (`Auth.module.css`) — not Tailwind

### The Fix Options:

**Quick fix** — Rewrite `Button.tsx` to use CSS modules (already have `Button.css` pattern available) and `Navbar.tsx` to use CSS modules.

Button.tsx currently:
```tsx
className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold ...`}
```

Needs to be:
```tsx
import styles from './Button.module.css';
// then use styles.button, styles.primary, etc.
```

Navbar.tsx currently:
```tsx
className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm"
```

Needs to use either CSS modules or inline styles with the actual CSS properties.

**Toggle to Act Mode** and I'll fix both files — convert Button.tsx to use its CSS module properly (create `Button.module.css` with professional styling), and convert Navbar.tsx to use CSS modules for all styling. This takes ~15 minutes.