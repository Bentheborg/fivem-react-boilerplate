export interface SoundConfigEntry {
    file: string;
    volume: number; // 0.0 to 1.0
    start_offset?: number; // in seconds, optional
}

export const SoundConfig: Record<string, SoundConfigEntry> = {
    "csgo_death": { file: "csgo_death.webm", volume: 1.0 },
    "loadingscreen": { file: "loadingscreen.mp3", volume: 0.2 },
};
