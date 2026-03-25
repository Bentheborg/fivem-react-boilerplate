import { SoundConfig, SoundConfigEntry } from "./sound-config";

export interface Sound3DData {
    soundName: string;
    position: { x: number; y: number; z: number };
    listenerPosition: { x: number; y: number; z: number };
    listenerForward: { x: number; y: number; z: number };
    listenerUp: { x: number; y: number; z: number };
    isObstructed?: boolean;
    maxDistance?: number;
    rolloffFactor?: number;
    refDistance?: number;
    volumeOverride?: number;
    startOffsetOverride?: number;
    minVolume?: number;
}

export interface ActiveSound {
    audio: AudioBufferSourceNode;
    gainNode: GainNode;
    pannerNode: PannerNode | null;
    filterNode: BiquadFilterNode | null;
    minVolumeGainNode: GainNode | null;
    startTime: number;
    config: SoundConfigEntry;
    soundName: string;
    isObstructed: boolean;
    minVolume?: number;
    position?: { x: number; y: number; z: number };
    listenerPosition?: { x: number; y: number; z: number };
}

export class Audio3DManager {
    private audioContext: AudioContext | null = null;
    private activeSounds: Map<string, ActiveSound> = new Map();
    private audioBuffers: Map<string, AudioBuffer> = new Map();
    private masterGain: GainNode | null = null;

    constructor() {
        this.initAudioContext();
    }

    private calculateDistanceAttenuation(distance: number, refDistance: number, maxDistance: number, rolloffFactor: number): number {
        if (distance <= refDistance) return 1.0;
        if (distance >= maxDistance) return 0.0;
        return refDistance / (refDistance + rolloffFactor * (distance - refDistance));
    }

    private calculateDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            // Resume AudioContext if it's suspended (required by some browsers)
            if (this.audioContext.state === "suspended") {
                this.audioContext.resume().catch(console.error);
            }
        } catch (error) {
            console.error("Failed to initialize AudioContext:", error);
        }
    }

    private async loadAudioBuffer(soundName: string): Promise<AudioBuffer | null> {
        if (!this.audioContext) {
            console.error("AudioContext not initialized");
            return null;
        }

        if (this.audioBuffers.has(soundName)) {
            return this.audioBuffers.get(soundName)!;
        }

        const config = SoundConfig[soundName];
        if (!config) {
            console.warn(`Sound "${soundName}" not found in SoundConfig`);
            return null;
        }

        try {
            const encodedFile = encodeURIComponent(config.file);
            console.log(`Loading audio file: ./sounds/${encodedFile}`);

            // Use Audio element to load the file, then convert to AudioBuffer
            const audio = new Audio();
            audio.src = `./sounds/${encodedFile}`;
            audio.crossOrigin = "anonymous";

            return new Promise((resolve, reject) => {
                audio.addEventListener("canplaythrough", async () => {
                    try {
                        // Create a MediaElementSourceNode from the audio element
                        const source = this.audioContext!.createMediaElementSource(audio);
                        // We can't directly get AudioBuffer from MediaElementSource, so we need to fetch the data
                        const response = await fetch(audio.src);
                        if (!response.ok) {
                            console.error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
                            resolve(null);
                            return;
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        console.log(`Decoding audio buffer for ${soundName}, size: ${arrayBuffer.byteLength} bytes`);
                        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
                        this.audioBuffers.set(soundName, audioBuffer);
                        console.log(`Successfully loaded audio buffer for ${soundName}`);
                        resolve(audioBuffer);
                    } catch (error) {
                        console.error(`Failed to load audio buffer for ${soundName}:`, error);
                        resolve(null);
                    }
                });

                audio.addEventListener("error", (e) => {
                    console.error(`Failed to load audio element for ${soundName}:`, e);
                    // Fallback to direct fetch
                    this.loadAudioBufferDirect(soundName)
                        .then(resolve)
                        .catch(() => resolve(null));
                });

                audio.load();
            });
        } catch (error) {
            console.error(`Failed to load audio buffer for ${soundName}:`, error);
            return null;
        }
    }

    private async loadAudioBufferDirect(soundName: string): Promise<AudioBuffer | null> {
        const config = SoundConfig[soundName];
        if (!config) return null;

        try {
            const encodedFile = encodeURIComponent(config.file);
            const response = await fetch(`./sounds/${encodedFile}`);
            if (!response.ok) {
                console.error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(soundName, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load audio buffer for ${soundName}:`, error);
            return null;
        }
    }

    async play3DSound(data: Sound3DData, volumeMultiplier: number = 1.0) {
        if (!this.audioContext || !this.masterGain) {
            console.error("AudioContext not initialized");
            return;
        }

        // Resume AudioContext if suspended (required for browsers)
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume().catch(console.error);
        }

        this.stop(data.soundName);

        const audioBuffer = await this.loadAudioBuffer(data.soundName);
        if (!audioBuffer) return;

        const config = SoundConfig[data.soundName];
        if (!config) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = this.audioContext.createGain();
        const baseVolume = data.volumeOverride ?? config.volume ?? 1.0;
        gainNode.gain.value = baseVolume * volumeMultiplier;

        let pannerNode: PannerNode | null = null;
        let filterNode: BiquadFilterNode | null = null;

        pannerNode = this.audioContext.createPanner();
        pannerNode.panningModel = "HRTF";
        pannerNode.distanceModel = "inverse";
        pannerNode.refDistance = data.refDistance ?? 1;
        pannerNode.maxDistance = data.maxDistance ?? 50;
        pannerNode.rolloffFactor = data.rolloffFactor ?? 1;
        pannerNode.coneInnerAngle = 360;
        pannerNode.coneOuterAngle = 360;
        pannerNode.coneOuterGain = 1;

        pannerNode.setPosition(data.position.x, data.position.y, data.position.z);

        this.audioContext.listener.setPosition(data.listenerPosition.x, data.listenerPosition.y, data.listenerPosition.z);
        this.audioContext.listener.setOrientation(data.listenerForward.x, data.listenerForward.y, data.listenerForward.z, data.listenerUp.x, data.listenerUp.y, data.listenerUp.z);

        if (data.isObstructed) {
            filterNode = this.audioContext.createBiquadFilter();
            filterNode.type = "lowpass";
            filterNode.frequency.value = 800;
            filterNode.Q.value = 1;
            gainNode.gain.value *= 0.5;
        }

        let minVolumeGainNode: GainNode | null = null;
        if (data.minVolume && data.minVolume > 0) {
            minVolumeGainNode = this.audioContext.createGain();
            minVolumeGainNode.gain.value = 1.0;
        }

        source.connect(gainNode);
        if (filterNode) {
            gainNode.connect(filterNode);
            if (pannerNode) {
                filterNode.connect(pannerNode);
                if (minVolumeGainNode) {
                    pannerNode.connect(minVolumeGainNode);
                    minVolumeGainNode.connect(this.masterGain);
                } else {
                    pannerNode.connect(this.masterGain);
                }
            } else {
                filterNode.connect(this.masterGain);
            }
        } else if (pannerNode) {
            gainNode.connect(pannerNode);
            if (minVolumeGainNode) {
                pannerNode.connect(minVolumeGainNode);
                minVolumeGainNode.connect(this.masterGain);
            } else {
                pannerNode.connect(this.masterGain);
            }
        } else {
            gainNode.connect(this.masterGain);
        }

        const startOffset = data.startOffsetOverride ?? config.start_offset ?? 0;
        source.start(0, startOffset);

        const activeSound: ActiveSound = {
            audio: source,
            gainNode,
            pannerNode,
            filterNode,
            minVolumeGainNode,
            startTime: this.audioContext.currentTime,
            config,
            soundName: data.soundName,
            isObstructed: data.isObstructed ?? false,
            minVolume: data.minVolume,
        };

        this.activeSounds.set(data.soundName, activeSound);

        if (minVolumeGainNode && pannerNode) {
            const distance = this.calculateDistance(data.position, data.listenerPosition);
            const attenuation = this.calculateDistanceAttenuation(distance, pannerNode.refDistance, pannerNode.maxDistance, pannerNode.rolloffFactor);
            const obstructionMultiplier = data.isObstructed ? 0.5 : 1.0;
            const effectiveVolume = baseVolume * volumeMultiplier * attenuation * obstructionMultiplier;

            if (distance >= pannerNode.maxDistance) {
                minVolumeGainNode.gain.value = 0;
            } else if (effectiveVolume < data.minVolume! && attenuation > 0.001) {
                const boost = data.minVolume! / Math.max(effectiveVolume, 0.001);
                minVolumeGainNode.gain.value = Math.min(boost, 100.0);
            } else {
                minVolumeGainNode.gain.value = 1.0;
            }
        }

        source.onended = () => {
            this.activeSounds.delete(data.soundName);
        };
    }

    updateSound3DPosition(data: Sound3DData) {
        const activeSound = this.activeSounds.get(data.soundName);
        if (!activeSound || !this.audioContext) return;

        if (activeSound.pannerNode) {
            activeSound.pannerNode.setPosition(data.position.x, data.position.y, data.position.z);

            this.audioContext.listener.setPosition(data.listenerPosition.x, data.listenerPosition.y, data.listenerPosition.z);
            this.audioContext.listener.setOrientation(data.listenerForward.x, data.listenerForward.y, data.listenerForward.z, data.listenerUp.x, data.listenerUp.y, data.listenerUp.z);

            if (activeSound.minVolumeGainNode && activeSound.minVolume && activeSound.minVolume > 0) {
                const distance = this.calculateDistance(data.position, data.listenerPosition);
                const attenuation = this.calculateDistanceAttenuation(distance, activeSound.pannerNode.refDistance, activeSound.pannerNode.maxDistance, activeSound.pannerNode.rolloffFactor);
                const baseVolume = activeSound.config.volume ?? 1.0;
                const obstructionMultiplier = activeSound.isObstructed ? 0.5 : 1.0;
                const effectiveVolume = baseVolume * attenuation * obstructionMultiplier;

                if (distance >= activeSound.pannerNode.maxDistance) {
                    activeSound.minVolumeGainNode.gain.value = 0;
                } else if (effectiveVolume < activeSound.minVolume && attenuation > 0.001) {
                    const boost = activeSound.minVolume / Math.max(effectiveVolume, 0.001);
                    activeSound.minVolumeGainNode.gain.value = Math.min(boost, 100.0);
                } else {
                    activeSound.minVolumeGainNode.gain.value = 1.0;
                }
            }
        }

        if (data.isObstructed !== activeSound.isObstructed) {
            activeSound.isObstructed = data.isObstructed ?? false;

            if (data.isObstructed && !activeSound.filterNode && this.audioContext) {
                const filterNode = this.audioContext.createBiquadFilter();
                filterNode.type = "lowpass";
                filterNode.frequency.value = 800;
                filterNode.Q.value = 1;

                activeSound.gainNode.disconnect();
                activeSound.gainNode.connect(filterNode);
                if (activeSound.pannerNode) {
                    filterNode.connect(activeSound.pannerNode);
                } else {
                    filterNode.connect(this.masterGain!);
                }
                activeSound.filterNode = filterNode;
                activeSound.gainNode.gain.value *= 0.5;
            } else if (!data.isObstructed && activeSound.filterNode) {
                activeSound.gainNode.disconnect();
                if (activeSound.pannerNode) {
                    activeSound.gainNode.connect(activeSound.pannerNode);
                } else {
                    activeSound.gainNode.connect(this.masterGain!);
                }
                activeSound.filterNode = null;
                activeSound.gainNode.gain.value /= 0.5;
            }

            if (activeSound.minVolumeGainNode && activeSound.minVolume && activeSound.minVolume > 0 && activeSound.pannerNode) {
                const distance = this.calculateDistance(data.position, data.listenerPosition);
                const attenuation = this.calculateDistanceAttenuation(distance, activeSound.pannerNode.refDistance, activeSound.pannerNode.maxDistance, activeSound.pannerNode.rolloffFactor);
                const baseVolume = activeSound.config.volume ?? 1.0;
                const obstructionMultiplier = activeSound.isObstructed ? 0.5 : 1.0;
                const effectiveVolume = baseVolume * attenuation * obstructionMultiplier;

                if (distance >= activeSound.pannerNode.maxDistance) {
                    activeSound.minVolumeGainNode.gain.value = 0;
                } else if (effectiveVolume < activeSound.minVolume && attenuation > 0.001) {
                    const boost = activeSound.minVolume / Math.max(effectiveVolume, 0.001);
                    activeSound.minVolumeGainNode.gain.value = Math.min(boost, 100.0);
                } else {
                    activeSound.minVolumeGainNode.gain.value = 1.0;
                }
            }
        }
    }

    stop(soundName: string) {
        const activeSound = this.activeSounds.get(soundName);
        if (activeSound) {
            try {
                activeSound.audio.stop();
            } catch (e) {
                // Already stopped
            }
            this.activeSounds.delete(soundName);
        }
    }

    stopAll() {
        this.activeSounds.forEach((activeSound, soundName) => {
            try {
                activeSound.audio.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.activeSounds.clear();
    }

    pause(soundName: string) {
        const activeSound = this.activeSounds.get(soundName);
        if (activeSound && this.audioContext) {
            activeSound.gainNode.gain.value = 0;
        }
    }

    resume(soundName: string, volumeMultiplier: number = 1.0) {
        const activeSound = this.activeSounds.get(soundName);
        if (activeSound) {
            const baseVolume = activeSound.config.volume ?? 1.0;
            const obstructionMultiplier = activeSound.isObstructed ? 0.5 : 1.0;
            activeSound.gainNode.gain.value = baseVolume * volumeMultiplier * obstructionMultiplier;
        }
    }

    setMasterVolume(volume: number) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}
