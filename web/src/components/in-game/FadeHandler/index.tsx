import React, { useState, useRef, useEffect } from "react";
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";
import { debugData } from "@/utils/debugData";
import { useNuiEvent } from "@/hooks/useNuiEvent";
import "./index.css";

debugData("FadeHandler", [
    { action: "fade-in", data: { duration: 1000 }, timer: 2000 },
    { action: "fade-out", data: { duration: 1000 }, timer: 8000 },
]);

const FadeHandler_Comp: React.FC = () => {
    const { visible } = useVisibility();
    const [fadeType, setFadeType] = useState<"inactive" | "in" | "out" | null>("inactive");
    const [duration, setDuration] = useState<number>(1);
    const [showSolidOverlay, setShowSolidOverlay] = useState<boolean>(false);
    const fadeRef = useRef<HTMLDivElement>(null);

    useNuiEvent("fade-in", ({ duration }: { duration: number }) => {
        const durationInSeconds = duration / 1000;
        setDuration(durationInSeconds);
        setFadeType("in");
        setTimeout(() => {
            setShowSolidOverlay(true);
        }, duration);
    });

    useNuiEvent("fade-out", (data: any) => {
        const durationInSeconds = data.duration / 1000;
        setDuration(durationInSeconds);
        setFadeType("out");
        setShowSolidOverlay(false); // Hide solid overlay immediately when fade-out starts
    });

    useEffect(() => {
        const handleAnimationEnd = (e: AnimationEvent) => {
            if (e.animationName === "fadeOut") {
                setFadeType("inactive");
                setShowSolidOverlay(false); // Ensure overlay is hidden
            }
        };

        const fadeElement = fadeRef.current;
        if (fadeElement) {
            fadeElement.addEventListener("animationend", handleAnimationEnd);
            return () => {
                fadeElement.removeEventListener("animationend", handleAnimationEnd);
            };
        }
    }, []);

    if (!visible || fadeType === "inactive") return null;

    return (
        <>
            {/* Solid overlay to ensure full coverage */}
            {showSolidOverlay && <div className="fade-handler-solid-overlay"></div>}
            {/* Animated fade overlay */}
            <div ref={fadeRef} className={`fade-handler ${fadeType}`} style={{ "--fade-duration": `${duration}s` } as React.CSSProperties}></div>
        </>
    );
};

export const FadeHandler: React.FC = () => (
    <VisibilityProvider componentName="FadeHandler" autoEnabled={true} isHideable={false}>
        <FadeHandler_Comp />
    </VisibilityProvider>
);