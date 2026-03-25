import React, { useState, useRef, useEffect } from "react";
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";
import { debugData } from "@/utils/debugData";
import { useNuiEvent } from "@/hooks/useNuiEvent";

import { SoundConfig } from "./sound-config";
import { Audio3DManager, Sound3DData } from "./audio-3d-manager";

debugData<string>("Sounds", [{ action: "play-sound", data: "csgo_death", timer: 1000 }]);

debugData<Sound3DData>("Sounds", [
    {
        action: "play-sound-3d",
        data: {
            soundName: "csgo_death",
            position: { x: 10, y: 0, z: 0 },
            listenerPosition: { x: 0, y: 0, z: 0 },
            listenerForward: { x: 0, y: 1, z: 0 },
            listenerUp: { x: 0, y: 0, z: 1 },
            isObstructed: false,
        },
        timer: 3000,
    },
]);

const Sounds_Comp: React.FC = () => {
    const activeAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const audio3DManagerRef = useRef<Audio3DManager | null>(null);

    useEffect(() => {
        audio3DManagerRef.current = new Audio3DManager();
        return () => {
            // Cleanup on unmount
            if (audio3DManagerRef.current) {
                audio3DManagerRef.current = null;
            }
        };
    }, []);

    useNuiEvent("play-sound", (soundName: string) => {
        if (!SoundConfig[soundName]) {
            console.warn(`Sound "${soundName}" not found in SoundConfig.`);
            return;
        }

        // Stop any existing instance of this sound
        const existingAudio = activeAudioRef.current.get(soundName);
        if (existingAudio) {
            existingAudio.pause();
            existingAudio.currentTime = 0;
            activeAudioRef.current.delete(soundName);
        }

        console.log(`Playing sound: ${soundName}`);
        const audio = new Audio(`./sounds/${SoundConfig[soundName].file}`);
        audio.currentTime = SoundConfig[soundName].start_offset || 0;
        // apply base config volume and audio provider multipliers
        const baseVol = SoundConfig[soundName].volume ?? 1.0;
        // Determine if this is a music track (contains "jam_track" or "music" in the name) or sfx
        const isMusicTrack = soundName.includes("jam_track") || soundName.includes("music");
        const category = isMusicTrack ? "music" : "sfx";
        audio.volume = baseVol;

        // Store reference to active audio
        activeAudioRef.current.set(soundName, audio);

        // Clean up reference when audio ends
        audio.addEventListener("ended", () => {
            activeAudioRef.current.delete(soundName);
        });

        audio.play();
    });

    useNuiEvent<Sound3DData>("play-sound-3d", (data: Sound3DData) => {
        if (!SoundConfig[data.soundName]) {
            console.warn(`Sound "${data.soundName}" not found in SoundConfig.`);
            return;
        }

        if (!audio3DManagerRef.current) {
            console.error("Audio3DManager not initialized");
            return;
        }

        console.log(`Playing 3D sound: ${data.soundName}`, data);
        const volumeMultiplier = 1.0;
        audio3DManagerRef.current.play3DSound(data, volumeMultiplier);
    });

    useNuiEvent<Sound3DData>("update-sound-3d", (data: Sound3DData) => {
        if (!audio3DManagerRef.current) {
            console.error("Audio3DManager not initialized");
            return;
        }

        audio3DManagerRef.current.updateSound3DPosition(data);
    });

    useNuiEvent("stop-sound", (soundName: string) => {
        // Stop 2D sound
        const audio = activeAudioRef.current.get(soundName);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            activeAudioRef.current.delete(soundName);
        }

        // Stop 3D sound
        if (audio3DManagerRef.current) {
            audio3DManagerRef.current.stop(soundName);
        }
    });

    useNuiEvent("stop-all-sounds", () => {
        // Stop all 2D sounds
        activeAudioRef.current.forEach((audio, soundName) => {
            audio.pause();
            audio.currentTime = 0;
            activeAudioRef.current.delete(soundName);
        });
        // Stop all 3D sounds
        if (audio3DManagerRef.current) {
            audio3DManagerRef.current.stopAll();
        }
    });

    useNuiEvent("pause-sound", (soundName: string) => {
        // Pause 2D sound
        const audio = activeAudioRef.current.get(soundName);
        if (audio && !audio.paused) {
            audio.pause();
            console.log(`Paused sound: ${soundName}`);
        }

        // Pause 3D sound
        if (audio3DManagerRef.current) {
            audio3DManagerRef.current.pause(soundName);
        }
    });

    useNuiEvent("resume-sound", (soundName: string) => {
        // Resume 2D sound
        const audio = activeAudioRef.current.get(soundName);
        if (audio && audio.paused) {
            audio.play();
            console.log(`Resumed sound: ${soundName}`);
        }

        // Resume 3D sound
        if (audio3DManagerRef.current) {
            const volumeMultiplier = 1.0;
            audio3DManagerRef.current.resume(soundName, volumeMultiplier);
        }
    });

    return null;
};

export const Sounds: React.FC = () => (
    <VisibilityProvider componentName="Sounds" autoEnabled={true} isHideable={false}>
        <Sounds_Comp />
    </VisibilityProvider>
);
