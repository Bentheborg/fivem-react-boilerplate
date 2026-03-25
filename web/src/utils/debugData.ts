import { enabledDebugComps } from "../config";
import { isEnvBrowser } from "./misc";

export const isWebDevEnv = (): boolean => {
    return process.env.NODE_ENV === "development" && isEnvBrowser();
};

interface DebugEvent<T = any> {
    action: string;
    data: T;
    timer?: number;
    repeat?: {
        times: number;
        interval: number;
    };
}

/**
 * Emulates dispatching events using SendNuiMessage in the lua scripts.
 * This is used when developing in browser
 *
 * @param component - The debug component this event belongs to
 * @param events - Array of events with their timing
 */
export const debugData = <T = any>(component: string, events: DebugEvent<T>[]): void => {
    if (isWebDevEnv() && (component == "*" || enabledDebugComps.includes(component))) {
        events.forEach((event) => {
            for (let i = 0; i < (event.repeat?.times || 1); i++) {
                setTimeout(
                    () => {
                        console.log("Debug Event:", event);
                        window.dispatchEvent(
                            new MessageEvent("message", {
                                data: {
                                    action: event.action,
                                    data: event.data,
                                },
                            })
                        );
                    },
                    i * (event.repeat?.interval || 0) + (event.timer || 100)
                );
            }
        });
    }
};
