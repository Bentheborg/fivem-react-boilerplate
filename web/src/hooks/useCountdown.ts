import React, { useState, useEffect, useCallback } from "react";

export function useCountdown(initialSeconds: number) {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        setSeconds(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        if (seconds <= 0) return;

        const interval = setInterval(() => {
            setSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [seconds]);

    const reset = useCallback((newSeconds: number) => {
        setSeconds(newSeconds);
    }, []);

    const formatted = useCallback((totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
    }, []);

    return {
        value: seconds,
        formatted: formatted(seconds),
        reset,
    };
}
