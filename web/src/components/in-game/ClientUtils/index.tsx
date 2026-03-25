import React, { useState } from "react";
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";
import { debugData } from "@/utils/debugData";
import { useNuiEvent } from "@/hooks/useNuiEvent";

declare global {
    interface Window {
        invokeNative: (command: string, ...args: any[]) => void;
    }
}

debugData("ClientUtils", [{ action: "copyToClipboard", data: { text: "HELLO I WORK" }, timer: 1000 }]);

const ClientUtils_Comp: React.FC = () => {
    const { visible } = useVisibility();

    useNuiEvent("copyToClipboard", (data: { text: string }) => {
        const copyFrom = document.createElement("textarea");
        copyFrom.value = data.text;
        document.body.appendChild(copyFrom);
        copyFrom.select();
        document.execCommand("copy");
        document.body.removeChild(copyFrom);
        console.log("Text copied to clipboard:", data.text);
    });

    useNuiEvent("openExternalLink", (link: string) => {
        window.invokeNative("openUrl", link);
    });

    if (!visible) return null;
    return <></>;
};

export const ClientUtils: React.FC = () => (
    <VisibilityProvider componentName="ClientUtils" autoEnabled={true} isHideable={false}>
        <ClientUtils_Comp />
    </VisibilityProvider>
);