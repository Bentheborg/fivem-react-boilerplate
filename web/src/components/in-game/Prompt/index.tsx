import React, { useState, useEffect, useRef } from "react";
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";
import { debugData } from "@/utils/debugData";
import "./index.css";
import { useNuiCallBack } from "@/hooks/useNuiCallBack";

debugData("Prompt", [
    { action: "prompt", data: { title: "Add Note", placeholder: "Enter note text...", minCharCount: 5, maxCharCount: 13, timeout: 20000 }, timer: 1000 },
    { action: "prompt", data: { title: "Second Note", placeholder: "Enter note text...", minCharCount: 3, maxCharCount: 20, timeout: 30000, defaultValue: "Default text here" }, timer: 3000 },
    { action: "prompt", data: { title: "Third Note", placeholder: "Enter note text...", minCharCount: 0, maxCharCount: 50, timeout: 20000 }, timer: 5000 },
]);

type QueuedPrompt = {
    data: { title: string; placeholder?: string; minCharCount?: number; maxCharCount?: number; timeout?: number; defaultValue?: string };
    resolve: (value: string | null) => void;
};

const Prompt_Comp: React.FC = () => {
    const { visible: globalVisible } = useVisibility();
    const [isPromptActive, setIsPromptActive] = useState(false);
    const [title, setTitle] = useState("");
    const [placeholder, setPlaceholder] = useState("Enter text...");
    const [minCharCount, setMinCharCount] = useState(0);
    const [maxCharCount, setMaxCharCount] = useState(500);
    const [charCount, setCharCount] = useState(0); // Track character count
    const [defaultValue, setDefaultValue] = useState("");
    const [promptQueue, setPromptQueue] = useState<QueuedPrompt[]>([]);
    const [promptKey, setPromptKey] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const resolveRef = useRef<((value: string | null) => void) | null>(null);
    const isResolvedRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentTimeout, setCurrentTimeout] = useState<number>(60000);

    const resolveCurrent = (value: string | null) => {
        if (!isResolvedRef.current && resolveRef.current) {
            resolveRef.current(value);
            isResolvedRef.current = true;
        }
    };

    const processNextPrompt = () => {
        setPromptQueue((prev) => {
            const next = prev[0];
            isResolvedRef.current = false;
            if (next) {
                setTitle(next.data.title);
                setPlaceholder(next.data.placeholder || "Enter text...");
                setMinCharCount(next.data.minCharCount || 0);
                setMaxCharCount(next.data.maxCharCount || 500);
                setDefaultValue(next.data.defaultValue || "");
                resolveRef.current = next.resolve;
                setPromptKey((prevKey) => prevKey + 1);
                setCurrentTimeout(next.data.timeout || 60000);
                return prev.slice(1);
            } else {
                setIsPromptActive(false);
                setTitle("");
                setPlaceholder("Enter text...");
                setMinCharCount(0);
                setMaxCharCount(500);
                setCharCount(0);
                setDefaultValue("");
                resolveRef.current = null;
                timeoutRef.current = null;
                return prev;
            }
        });
    };

    useNuiCallBack("prompt", async (data: { title: string; placeholder?: string; defaultValue?: string; minCharCount?: number; maxCharCount?: number; timeout?: number }) => {
        return new Promise<string | null>((resolve) => {
            const queued: QueuedPrompt = { data, resolve };
            if (isPromptActive) {
                setPromptQueue((prev) => [...prev, queued]);
            } else {
                setIsPromptActive(true);
                isResolvedRef.current = false;
                setTitle(data.title);
                setPlaceholder(data.placeholder || "Enter text...");
                setMinCharCount(data.minCharCount || 0);
                setMaxCharCount(data.maxCharCount || 500);
                setDefaultValue(data.defaultValue || "");
                resolveRef.current = resolve;
                setCurrentTimeout(data.timeout || 60000);
            }
        });
    });

    useEffect(() => {
        if (isPromptActive && textareaRef.current) {
            const textareaElement = textareaRef.current;

            // Force focus and clear value
            setTimeout(() => {
                textareaElement.focus();
                textareaElement.value = defaultValue;
                setCharCount(defaultValue.length);
            }, 100);

            if (!timeoutRef.current) {
                timeoutRef.current = setTimeout(() => {
                    resolveCurrent(null);
                    timeoutRef.current = null;
                    processNextPrompt();
                }, currentTimeout);
            }

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Tab" || e.key === "Escape" || (e.ctrlKey && e.key === "a")) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    if (e.ctrlKey && e.key === "a") {
                        textareaElement.select();
                        return;
                    }

                    if (e.key === "Tab") {
                        const value = textareaElement.value;
                        if (value.length < minCharCount) {
                            // Not enough characters yet; keep the prompt active
                            return;
                        }
                        resolveCurrent(value);
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                            timeoutRef.current = null;
                        }
                        processNextPrompt();
                    } else if (e.key === "Escape") {
                        resolveCurrent(null);
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                            timeoutRef.current = null;
                        }
                        processNextPrompt();
                    }
                }
            };

            const handleKeyPress = (e: KeyboardEvent) => {
                e.stopPropagation();
            };

            const handleInput = () => {
                let value = textareaElement.value;
                if (value.length > maxCharCount) {
                    value = value.substring(0, maxCharCount);
                    textareaElement.value = value;
                }
                setCharCount(value.length);
            };

            const handleBlur = () => {
                if (isPromptActive) {
                    textareaElement.focus();
                }
            };

            document.addEventListener("keydown", handleKeyDown, true);
            textareaElement.addEventListener("keypress", handleKeyPress, true);
            textareaElement.addEventListener("input", handleInput);
            textareaElement.addEventListener("blur", handleBlur);

            return () => {
                document.removeEventListener("keydown", handleKeyDown, true);
                textareaElement.removeEventListener("keypress", handleKeyPress, true);
                textareaElement.removeEventListener("input", handleInput);
                textareaElement.removeEventListener("blur", handleBlur);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                // Ensure resolution on unmount or visibility change
                resolveCurrent(null);
            };
        }
    }, [isPromptActive, promptKey]);

    if (!isPromptActive || !globalVisible) return null;

    // Determine character counter color
    const charCounterColor = charCount < minCharCount || charCount > maxCharCount ? "#ff6b6b" : "#7cfc00";

    return (
        <div className="prompt-container">
            <div className="prompt-top-bar">{title}</div>
            <div className="textarea-wrapper">
                <textarea
                    key={promptKey}
                    ref={textareaRef}
                    className="prompt-textarea"
                    placeholder={placeholder}
                    disabled={false}
                    readOnly={false}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus={true}
                    onInput={(e) => {
                        const value = (e.target as HTMLTextAreaElement).value;
                        setCharCount(value.length);
                    }}
                />
                <div className="char-counter" style={{ color: charCounterColor }}>
                    {charCount}/{maxCharCount}
                </div>
            </div>
            <div className="prompt-bottom-bar">
                <span>TAB to confirm</span>
                <span>ESC to exit</span>
            </div>
        </div>
    );
};

export const Prompt: React.FC = () => (
    <VisibilityProvider componentName="Prompt" autoEnabled={true} isHideable={false}>
        <Prompt_Comp />
    </VisibilityProvider>
);
