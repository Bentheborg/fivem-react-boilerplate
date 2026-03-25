/**
 * Simple wrapper around fetch API tailored for CEF/NUI use. This abstraction
 * can be extended to include AbortController if needed or if the response isn"t
 * JSON. Tailor it to your needs.
 *
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 *
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */

import { isWebDevEnv } from "./debugData";
import { GetParentResourceName } from "./misc";

export async function fetchNui<T = unknown>(eventName: string, data?: unknown): Promise<T & { success?: boolean; error?: string }> {
    if (isWebDevEnv()) {
        console.log(`fetchNui: Sending event "${eventName}" with data:`, data);
        return { success: true } as T & { success?: boolean; error?: string };
    }
    const options = {
        method: "post",
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(data),
    };

    const resp = await fetch(`https://${GetParentResourceName()}/${eventName}`, options);

    try {
        const respFormatted = await resp.json();
        if (respFormatted.error) {
            console.error(`fetchNui: Received error from event "${eventName}":`, respFormatted.error);
            console.error("With data:", JSON.stringify(data, null, 2));
        }
        return respFormatted;
    } catch (error) {
        return { error: "Invalid JSON response" } as T & { success?: boolean; error?: string };
    }
}
