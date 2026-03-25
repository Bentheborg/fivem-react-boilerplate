import { RefObject, useEffect, useRef } from "react";
import { noop } from "../utils/misc";
import { fetchNui } from "../utils/fetchNui";

interface NuiMessageData<T = unknown> {
    action: string;
    data: T;
}

type NuiHandlerSignature<T> = (data: T) => void;

/**
 * Hook to manage NUI event listeners and callback requests.
 * @param action - The specific `action` that should be listened for.
 * @param handler - The callback function to handle incoming data.
 *
 *
 * @example
 *	useNuiCallBack("requestAccountInfo", async (data) => {
 *		return "test";
 *	});
 */

export const useNuiCallBack = <T = any>(action: string, handler: (data: T) => void) => {
    const savedHandler = useRef<NuiHandlerSignature<T>>(noop);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const eventListener = async (event: MessageEvent<NuiMessageData<T>>) => {
            const { action: eventAction, data } = event.data;

            if (eventAction === action && savedHandler.current) {
                await fetchNui(`${action}_response`, await savedHandler.current(data));
            }
        };

        window.addEventListener("message", eventListener);
        return () => window.removeEventListener("message", eventListener);
    }, [action]);
};
