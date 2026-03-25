import React, { useEffect, useState } from "react";
import { useNuiEvent } from "@/hooks/useNuiEvent";
import "./index.css";
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";
import { debugData } from "@/utils/debugData";

interface DuiConfig {
    label?: string;
    name?: string;
    pre?: string;
    key?: string;
    post?: string;
}

debugData<DuiConfig>("DuiItem", [
    { 
        action: "init3dText",
        data: { 
            pre: "Example Pre",
            key: "Example Key",
            post: "Example Post"
        },
        timer: 1000
    },
    {
        action: "update3dText",
        data: {
            pre: "Updated Pre",
            key: "Updated Key",
            post: "Updated Post"
        },
        timer: 5000
    }
]);


const DuiItem_Comp: React.FC<{ isFromDui?: boolean }> = ({ isFromDui = false }) => {
    const { visible, setVisible } = useVisibility();
    
    const [config, setConfig] = useState<DuiConfig>(null);

    useNuiEvent<DuiConfig>("init3dText", (data) => {
        setConfig(data);
    });

    useNuiEvent<Partial<DuiConfig>>("update3dText", (data) => {
        setConfig((prev) => (prev ? { ...prev, ...data } : null));
    });

    useNuiEvent("reset3dText", () => {
        setConfig(null);
    });

    useEffect(() => {
        if (isFromDui) setVisible(true);
    }, [isFromDui, setVisible]);

    if (!visible || !config) return null;

    return (
        <div className="dui-item-frame">
            <div className="dui-text-bar">
                <span className="dui-text-label">{config.pre}</span>
                <span className="dui-text-key">{config.key}</span>
                <span className="dui-text-label">{config.post}</span>
            </div>
        </div>
    );
};

export const DuiItem: React.FC<{ isFromDui?: boolean }> = ({ isFromDui = false }) => (
    <VisibilityProvider componentName="DuiItem" isHideable={false}>
        <DuiItem_Comp isFromDui={isFromDui} />
    </VisibilityProvider>
);