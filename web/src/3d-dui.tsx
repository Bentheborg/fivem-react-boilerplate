import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { isWebDevEnv } from "./utils/debugData";

import { DuiItem } from "@/components/3d-dui/DuiItem";

if (!isWebDevEnv()) (document.querySelector(":root") as HTMLElement).style.setProperty("--main-bg", "none");

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <DuiItem isFromDui={true} />
    </React.StrictMode>
);