# Floorplain

A simple web tool to check whether **furniture fits** on a floorplan image. Typical uses: you are **looking at a new rental** and the listing includes a floorplan—you can see how pieces you already own (bed, desk, sofa, etc.) might fit before you move. Or you have a plan of **your current home** and want to **rearrange** furniture; you can lay out rectangles on the plan and move them around instead of only guessing.

**Note:** Results depend on the plan being a fair representation of real dimensions. It does **not** work well when the floorplan is **not drawn to scale**, heavily **stylized**, or **distorted** (e.g. perspective or warped scans).

Everything runs in the browser; projects can be saved locally and exported/imported as JSON.

## How to use

1. **Upload a floorplan** and crop to the area you care about.
2. **Calibrate scale:** pick two points on the plan and enter the real distance between them (easiest: use a simple rectangular room whose dimensions you know from the listing or a tape measure).
3. **Add furniture** as simple measured rectangles—bed, desk, sofa, wardrobe, and so on.
4. **Place** them on the floorplan, **drag** to move, **rotate**, and see how everything fits.

## Tech stack

| Area | Choice |
|------|--------|
| UI | React 19, TypeScript, Tailwind CSS |
| Build | Vite |
| Canvas / stage | Konva, react-konva |
| State | Zustand |
| Local persistence | Dexie (IndexedDB) |
| Cropping UI | react-image-crop |
| Icons | lucide-react |

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # eslint
```

## Requirements

- Node.js with npm (or compatible package manager)
