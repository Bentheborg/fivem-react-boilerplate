import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { isWebDevEnv } from "./utils/debugData";

import { Loadingscreen } from "@/components/loading-screen";
import { Sounds } from "@/components/in-game/Sounds";

if (!isWebDevEnv()) (document.querySelector(":root") as HTMLElement).style.setProperty("--main-bg", "none");

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <Sounds />
        <Loadingscreen isLoadingScreen={true} />
    </React.StrictMode>
);