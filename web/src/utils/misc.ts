const FALLBACK_RESOURCE_NAME = "bentheborg-ui";

// Will return whether the current environment is in a regular browser
// and not CEF
export const isEnvBrowser = (): boolean => !(window as any).invokeNative;

// Basic no operation function
export const noop = () => {};

export const GetParentResourceName = (): string => {
    if ((window as any).GetParentResourceName) {
        return (window as any).GetParentResourceName();
    }
    return FALLBACK_RESOURCE_NAME;
}