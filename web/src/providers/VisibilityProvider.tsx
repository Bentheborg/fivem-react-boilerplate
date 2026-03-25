import React, { Context, createContext, useContext, useEffect, useState } from "react";
import { useNuiEvent } from "../hooks/useNuiEvent";
import { fetchNui } from "../utils/fetchNui";
import { enabledDebugComps } from "../config";
import { isWebDevEnv } from "@/utils/debugData";
import ErrorBoundary from "./ErrorBoundary";

const VisibilityCtx = createContext<VisibilityProviderValue | null>(null);

interface VisibilityProviderProps {
    children: React.ReactNode;
    componentName: string;
    autoEnabled?: boolean;
    isHideable?: boolean;
    closeKeys?: string[];
}

interface VisibilityProviderValue {
    setVisible: (visible: boolean) => void;
    visible: boolean;
}

export const VisibilityProvider: React.FC<VisibilityProviderProps> = ({ children, componentName, autoEnabled = false, isHideable = true, closeKeys }) => {
    if (isWebDevEnv() && enabledDebugComps.includes(componentName) && !autoEnabled) {
        autoEnabled = true;
    }
    if (autoEnabled && isWebDevEnv() && !enabledDebugComps.includes(componentName)) {
        autoEnabled = false;
    }
    const [visible, setVisible] = useState(isWebDevEnv() ? autoEnabled : false);
    const [displayVisible, setDisplayVisible] = useState(isWebDevEnv() ? autoEnabled : false);
    const [wasGloballyHidden, setWasGloballyHidden] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorKey, setErrorKey] = useState(0);

    useEffect(() => {
        setDisplayVisible(visible);
    }, [visible]);

    useNuiEvent<boolean>(`set-${componentName}-visible`, (value) => {
        const show = value === true;
        setVisible(show);
        setWasGloballyHidden(false);
    });
    useNuiEvent<boolean>(`reset-ui-state`, () => setVisible(autoEnabled));
    useNuiEvent<boolean>(`hide-nui`, () => {
        if (isHideable && visible && displayVisible && !hasError) {
            setWasGloballyHidden(true);
            setVisible(false);
        }
    });
    useNuiEvent<boolean>(`show-nui`, () => {
        if (isHideable && wasGloballyHidden) {
            setVisible(true);
            setWasGloballyHidden(false);
        }
    });

    useEffect(() => {
        if (!visible || !closeKeys || closeKeys.length === 0 || hasError) return;

        const keyHandler = (e: KeyboardEvent) => {
            if (closeKeys.includes(e.code)) {
                fetchNui(`hide${componentName}`);
                setVisible(false);
            }
        };

        window.addEventListener("keydown", keyHandler);

        return () => window.removeEventListener("keydown", keyHandler);
    }, [visible, closeKeys, componentName, hasError]);

    useEffect(() => {
        if (hasError) {
            setVisible(true);
            const timeout = setTimeout(() => {
                setHasError(false);
                setErrorKey((prev) => prev + 1);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [hasError]);

    return (
        <VisibilityCtx.Provider
            value={{
                visible: displayVisible,
                setVisible,
            }}
        >
            <div
                style={{
                    opacity: visible ? 1 : 0,
                    height: "100%",
                    pointerEvents: visible ? "auto" : "none",
                }}
            >
                <ErrorBoundary key={errorKey} componentName={componentName} onError={() => setHasError(true)}>
                    {children}
                </ErrorBoundary>
            </div>
        </VisibilityCtx.Provider>
    );
};

export const useVisibility = () => {
    const context = useContext<VisibilityProviderValue>(VisibilityCtx as Context<VisibilityProviderValue>);
    if (!context) {
        throw new Error("useVisibility must be used within a VisibilityProvider");
    }
    return context;
};
