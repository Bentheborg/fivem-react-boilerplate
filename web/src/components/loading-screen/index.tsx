import React, { useState, useEffect } from "react";
import { isWebDevEnv } from "@/utils/debugData";
import { sendNuiMessage } from "@/hooks/useNuiEvent";
import './index.css';
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";

interface LoadingscreenProps {
    isLoadingScreen?: boolean;
}

interface UserData {
    username?: string;
    user_id?: string;
}

interface NuiHandoverData {
    username?: string;
    user_id?: string;
}

const Loadingscreen_Comp: React.FC<LoadingscreenProps> = ({ isLoadingScreen = false }) => {
    const { visible, setVisible } = useVisibility();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [userData, setUserData] = useState<UserData>({});
    const [musicPaused, setMusicPaused] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState("Initializing...");

    // Loading status messages for different progress ranges
    const getLoadingStatus = (progress: number): string => {
        if (progress < 10) return "Initializing...";
        if (progress < 25) return "Loading game files...";
        if (progress < 50) return "Loading world data...";
        if (progress < 75) return "Loading player data...";
        if (progress < 90) return "Loading resources...";
        if (progress < 100) return "Almost ready...";
        return "Complete!";
    };

    useEffect(() => {
        if (!isLoadingScreen && !isWebDevEnv()) return;
        if (visible) {
            // Stop any existing loadingscreen audio first
            sendNuiMessage("stop-sound", "loadingscreen");

            // Use our internal sound system to play a loading sound when the loading screen is shown
            sendNuiMessage("play-sound", "loadingscreen");
        }

        // Clean up audio when component unmounts or visible changes
        return () => {
            sendNuiMessage("stop-sound", "loadingscreen");
        };
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        // Get user data from FiveM handover data
        const nuiData = (window as any).nuiHandoverData as NuiHandoverData;
        if (nuiData) {
            setUserData({
                username: nuiData.username || "Unknown Player",
                user_id: nuiData.user_id || "000000"
            });
        }

        // Listen for FiveM loading progress events
        const handleMessage = (event: MessageEvent) => {
            if (event.data.eventName === 'loadProgress') {
                const progress = Math.min(Math.floor(event.data.loadFraction * 100), 100);
                setLoadingProgress(progress);
                setLoadingStatus(getLoadingStatus(progress));
            }
        };

        window.addEventListener('message', handleMessage);

        // Simulate loading progress in development environment
        if (isWebDevEnv()) {
            setUserData({
                username: "DevUser",
                user_id: "123456"
            });

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 3; // Random increment for realistic feel
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                setLoadingProgress(Math.floor(progress));
                setLoadingStatus(getLoadingStatus(Math.floor(progress)));
            }, 100);

            return () => {
                clearInterval(interval);
            };
        }

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [visible]);

    // Handle space key for pause/resume music
    useEffect(() => {
        if (!visible) return;

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.key === " ") {
                e.preventDefault(); // Prevent scrolling
                setMusicPaused((prev) => {
                    const newPaused = !prev;
                    if (newPaused) {
                        sendNuiMessage("pause-sound", "loadingscreen");
                    } else {
                        sendNuiMessage("resume-sound", "loadingscreen");
                    }
                    return newPaused;
                });
            }
        };

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [visible]);

    useEffect(() => {
        if (isLoadingScreen) setVisible(true);
    }, [isLoadingScreen, setVisible]);

    if (!visible) return null;

    return (
        <div className="loadingscreen-container">
            <div className="loadingscreen-overlay" />
            <div className="loadingscreen-content">
                <div className="loadingscreen-branding">
                    <div className="loadingscreen-logo">LOGO</div>
                    <div className="loadingscreen-subtitle">Roleplay Loading</div>
                </div>

                <div className="loadingscreen-player-info">
                    <div className="loadingscreen-player-line">
                        <span>Player:</span>
                        <strong>{userData.username || 'Unknown Player'}</strong>
                    </div>
                    <div className="loadingscreen-player-line">
                        <span>Player ID:</span>
                        <strong>{userData.user_id || '000000'}</strong>
                    </div>
                </div>

                <div className="loadingscreen-progress-container">
                    <div className="loadingscreen-progress-label">
                        <span>{loadingStatus}</span>
                        <span className="loadingscreen-progress-percentage">{loadingProgress}%</span>
                    </div>
                    <div className="loadingscreen-progress-bar">
                        <div
                            className="loadingscreen-progress-fill"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>

                    <div className="loadingscreen-details">
                        <div className="loadingscreen-detail-item">
                            <span>Network:</span>
                            <strong>{loadingProgress < 100 ? 'Connecting...' : 'Connected'}</strong>
                        </div>
                        <div className="loadingscreen-detail-item">
                            <span>Resource load:</span>
                            <strong>{Math.round(loadingProgress * 1.3)} / 130</strong>
                        </div>
                    </div>
                </div>

                <div className="loadingscreen-footer">
                    Press <strong>SPACE</strong> to {musicPaused ? 'resume' : 'pause'} music
                </div>
            </div>
        </div>
    );
};

export const Loadingscreen: React.FC<LoadingscreenProps> = ({ isLoadingScreen }) => (
    <VisibilityProvider componentName="Loadingscreen" isHideable={false}>
        <Loadingscreen_Comp isLoadingScreen={isLoadingScreen} />
    </VisibilityProvider>
);