export interface DebugLog {
    callingComponent: string;
    message: string;
    data?: any;
    level?: "info" | "warn" | "error" | "debug";
}

export const debugLog = ({ callingComponent, message, data, level = "info" }: DebugLog): void => {
    const logMessage = `[Debug][${callingComponent}] ${message}`;
    switch (level) {
        case "warn":
            console.warn(logMessage, data || "");
        case "error":
            console.error(logMessage, data || "");
        case "debug":
            console.debug(logMessage, data || "");
        default:
            console.log(logMessage, data || "");
    }
};
