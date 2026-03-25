import { RefObject, useEffect, useRef } from "react";
import { noop } from "../utils/misc";

interface NuiMessageData<T = unknown> {
    action: string;
    data: T;
}

type NuiHandlerSignature<T> = (data: T) => void;

/**
 * A hook that manage events listeners for receiving data from the client scripts
 * @param action The specific `action` that should be listened for.
 * @param handler The callback function that will handle data relayed by this hook
 *
 * @example
 * useNuiEvent<{visibility: true, wasVisible: 'something'}>('setVisible', (data) => {
 *   // whatever logic you want
 * })
 *
 **/

export const useNuiEvent = <T = any>(action: string, handler: (data: T) => void) => {
    const savedHandler = useRef<NuiHandlerSignature<T>>(noop);

    // Make sure we handle for a reactive handler
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const eventListener = (event: MessageEvent<NuiMessageData<T>>) => {
            const { action: eventAction, data } = event.data;

            if (savedHandler.current) {
                if (eventAction === action) {
                    savedHandler.current(data);
                }
            }
        };

        window.addEventListener("message", eventListener);
        // Remove Event Listener on component cleanup
        return () => window.removeEventListener("message", eventListener);
    }, [action]);
};

/** * A utility function to send messages to the NUI (client scripts)
 * @param action The specific `action` that the client script should handle
 * @param data The data to be sent along with the action
 */
export const sendNuiMessage = <T = any>(action: string, data?: T) => {
    window.dispatchEvent(
        new MessageEvent<NuiMessageData<T>>("message", {
            data: { action, data: data ?? ({} as T) },
        })
    );
};
