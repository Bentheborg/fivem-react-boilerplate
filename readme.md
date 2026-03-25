# React Validation & Component Boilerplate

This project is designed as a standalone resource that contains only NUI frontend code and assets. It is meant to be used alongside your main game logic script resources via exports/imports (e.g., `exports["your-nui-resource"]:sendMessage(...)`, `setComponentVisible`, and `setFocus`).

A comprehensive, multi-entry React boilerplate for creating in-game overlays, loading screens, and 3D DUI items. Built with Vite, React 18, and TypeScript.

## 🌟 Features

This boilerplate supports three distinct entry points that are handled by the same build process:

- **In-Game Main UI**: Your core NUI for menus, huds, and overlays that interact directly with client scripts.
- **Loading Screen**: A dedicated build target (`loadingscreen.html`) for your server loading screen. It operates entirely independently of the main NUI while sharing the same component ecosystem.
- **3D DUI Items**: A built-in configuration for rendering immersive 3D-DUI elements within the game world. *(Repo includes only the NUI side; Lua world-side implementation is not included and must be handled in your game script.)*

## 🚀 Getting Started

1. Build the UI:
   ```bash
   cd web
   npm install
   npm run build
   ```
2. Move the generated `dist/` folder and remaining resource files to your FiveM resource directory.
3. Add to `server.cfg`:
   ```cfg
   ensure your-resource-name
   ```
4. In `client.lua`, run a test command:
   ```lua
   exports["your-resource-name"]:sendMessage("set-Example-visible", true)
   ```

> Note: this repo is UI-only; you still need a Lua/FiveM client script to call `sendMessage` and handle callbacks.

1. Navigate to the web directory (local development only):
   ```bash
   cd web
   ```
2. Install dependencies (local development only):
   ```bash
   npm install
   ```
3. Start the development server (local development only):
   ```bash
   npm run dev
   ```
   *(Alternatively, run `dev.bat` inside `web`)*

### Displaying Components in Dev Mode
To view and interact with your UI components while designing in the browser, edit `web/src/config.ts` and add the component names to `enabledDebugComps`.

This project provides only the NUI/React frontend. You will need a Lua client script to dispatch `sendMessage` calls and handle NUI callbacks.

### Minimal `client.lua`

```lua
RegisterCommand("testui", function()
    exports["your-resource-name"]:sendMessage("set-example-title", {
        title = "Hello from Lua!"
    })
end)

RegisterNUICallback("someAction", function(data, cb)
    print(json.encode(data))
    cb({ success = true })
end)
```

- `set-example-title` maps to your UI action names (see component event listeners in `src/components`).
- `RegisterNUICallback` lets the NUI frontend call back into Lua with the `fetchNui(...)` hook.

---

### Displaying Components in Dev Mode
To view and interact with your UI components while designing in the browser, edit `web/src/config.ts` and add the component names to the `enabledDebugComps` array.

---

## 📁 Project Structure

The workspace cleanly splits the client/server setup from the web build environment:

```text
web/                   # Root of the Vite/React application
├── dist/              # Production web build (created via build scripts)
├── public/            # Static assets like sounds and images
├── src/
│   ├── components/ 
│   │   ├── 3d-dui/        # Elements designed for 3D DUI rendering
│   │   ├── in-game/       # Overlays, HUDs, menus for standard client interactions
│   │   └── loading-screen/# Everything specific to your server's loading screen
│   ├── hooks/             # Custom NUI hooks (useNuiEvent, useNuiCallBack, useCountdown)
│   ├── providers/         # Global component wrappers (VisibilityProvider, ErrorBoundary)
│   ├── utils/             # Helpers for Fetch NUI & Mock Debug Data
│   ├── index.tsx          # Main entry file (Primary NUI)
│   ├── loadingscreen.tsx  # Main entry file (Loading Screen)
│   └── 3d-dui.tsx         # Main entry file (DUI interface)
├── vite.config.ts     # Bundling configuration
└── package.json       # Project dependencies & scripts
```

---

## 📜 Available Scripts

Inside the `web` directory, you have access to the following build scripts:

- `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles and minifies the project for production, generating files into the `dist` folder.
- `npm run build:obfuscate`: Runs a production build while obfuscating the compiled JavaScript.
- `npm run build:dev`: Runs an unminified build for development, making it easier to debug inside FiveM.

---

## 🛠️ Components & NUI Architecture

We utilize a highly structured standard for building UI that seamlessly communicates with the game.

### VisibilityProvider
Wrap any toggleable major UI component in the `VisibilityProvider`. This provider strictly manages your component's mount/unmount and display states natively, connecting it to our mock debug system.
You can access the display state from within using the provided hook:
```tsx
const { visible, setVisible } = useVisibility();
```

### useNuiEvent
This hook acts as your dedicated event listener for Lua's `SendNUIMessage` calls.

```tsx
import { useNuiEvent } from "@/hooks/useNuiEvent";

useNuiEvent("updateCharacterData", (data: UserData) => {
    setUserData(data);
});
```

*(Tip: Combine `useNuiEvent` with our built-in `debugData` utility to easily mock Lua payloads during browser development!)*

---

## 🐛 Debug Data Examples (Dev-Only)

`debugData` is a small helper used by the boilerplate components to dispatch fake NUI events when running in browser development mode (`NODE_ENV=development` and no CEF). This allows you to test both event handling and UI flows without needing a running FiveM client.

### How it works

- Called from inside a component file (e.g. `Example/index.tsx`, `Prompt/index.tsx`, `Sounds/index.tsx`).
- Adds items to a queue and emits `window` `message` events.
- This is filtered using `enabledDebugComps` in `src/config.ts` so you only simulate what you need.

### Example (from `Prompt/index.tsx`)

```ts
debugData("Prompt", [
  {
    action: "prompt",
    data: {
      title: "Add Note",
      placeholder: "Enter note text...",
      minCharCount: 5,
      maxCharCount: 13,
      timeout: 20000,
    },
    timer: 1000,
  },
  {
    action: "prompt",
    data: { title: "Second Note", minCharCount: 3, maxCharCount: 20, timeout: 30000, defaultValue: "Default text here" },
    timer: 3000,
  },
]);
```

In this scenario, each event is fired after the given `timer` delay and the prompt component reacts as if it received a real NUI callback from Lua.

### Example (from `Example/index.tsx`)

```ts
debugData("Example", [
  { action: "set-example-title", data: { title: "Debug: Welcome message" }, timer: 1000 },
  { action: "set-example-title", data: { title: "Debug: Data updated" }, timer: 3000 },
  { action: "set-example-title", data: { title: "Debug: Ready to interact" }, timer: 6000 },
]);
```

Then the `Example` component has a `useNuiEvent("set-example-title", ...)` listener that updates UI live.

## 🧠 Dev vs In-Game Behaviour

This section highlights the key differences between local browser development and running inside FiveM/Cfx.re.

| Feature              | Browser Dev | FiveM Runtime |
|---------------------|-------------|---------------|
| `debugData`         | ✅           | ❌            |
| `window.invokeNative` | ❌        | ✅            |
| `useNuiEvent`       | ✅           | ✅            |
| `sendNuiMessage` | ✅ | ✅ |
| `NUICallback` / `postMessage` | ✅ | ✅ |

> Note: `window.invokeNative` is only available in the CFX runtime, while `debugData` is a local helper used for quick browser prototyping.

### Local development config

In `web/src/config.ts`, set:

```ts
export const enabledDebugComps: string[] = [
    // "ClientUtils",
    // "Sounds",
    "Example",
    // "Prompt",
]
```

Only the uncommented debug actions you intend to edit. *(Note: You probably don't want to have more than one enabled at a time to avoid UI chaos, unless if they are meant to interact with each other.)*

---

## 🎨 Unlimited Customization

Because this boilerplate utilizes standard React & Vite patterns, your customization limits are entirely boundless:

- **Styling Choices**: Easily install and initialize **Tailwind CSS**, styled-components, Sass, CSS Modules, or import comprehensive UI libraries like Radix, Shadcn UI, or Material UI.
- **Icons & Assets**: `react-icons` is pre-installed! Add as many icon packs or custom SVGs as you require.
- **NPM Ecosystem**: Require global state management for complex logic? Drop in `Zustand` or `Redux`. Need advanced animations? Bring in `Framer Motion`. If it functions in standard React, it will work here.

---

## 🏷️ Acknowledgements

- [React](https://reactjs.org/) - core UI library used for creating all components and interaction flows.
- [Vite](https://vitejs.dev/) - build tooling and development server with fast hot module replacement (HMR).
- [FiveM](https://fivem.net/) - the runtime platform for NUI integration in GTA V/RDR3.
- [react-icons](https://react-icons.github.io/react-icons/) - the icon library included by default for UI graphics.
- [cfx.re forum 3D Waypoints](https://forum.cfx.re/t/3d-waypoints/5375949) - 3D DUI waypoint reference.
- [TypeScript](https://www.typescriptlang.org/) - static typing and developer tooling support.
- [project-error/fivem-react-boilerplate-lua](https://github.com/project-error/fivem-react-boilerplate-lua) - heavy conceptual inspiration and implementation patterns for NUI, event handling, and scripting flow.
- Additional FiveM React boilerplates and community contributions (other GitHub repos, examples, and tutorials) provided design inspiration and practical patterns even though this project is a custom combination and not a direct fork.

Thank you to the open source community for the projects above and all the example code that made this boilerplate possible.