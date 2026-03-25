import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { isWebDevEnv } from "./utils/debugData";

// UI Components
import { Example } from "@/components/in-game/Example";
import { Prompt } from "@/components/in-game/Prompt";

// External Components
import { Loadingscreen } from "@/components/loading-screen";
import { DuiItem } from "@/components/3d-dui/DuiItem";


// Misc Components
import { FadeHandler } from "@/components/in-game/FadeHandler";
import { Sounds } from "@/components/in-game/Sounds";
import { ClientUtils } from "@/components/in-game/ClientUtils";

if (!isWebDevEnv()) (document.querySelector(":root") as HTMLElement).style.setProperty("--main-bg", "none");

const container = document.getElementById("root");

const root = createRoot(container!);

// DO NOT FUCKING COMMENT THESE OUT USE `./config.ts` TO DISABLE/ENABLE COMPONENTS
root.render(
    <React.StrictMode>
        <Example />
        <Prompt />
        
        <Loadingscreen />
        <DuiItem />
        
        <FadeHandler />
        <Sounds />
        <ClientUtils />
    </React.StrictMode>
);