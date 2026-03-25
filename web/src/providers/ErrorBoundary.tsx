import { isWebDevEnv } from "@/utils/debugData";
import { fetchNui } from "@/utils/fetchNui";
import * as React from "react";

interface ErrorBoundaryProps {
    componentName: string;
    children?: React.ReactNode;
    onError?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error for component:", this.props.componentName, error, JSON.stringify(info));
        fetchNui("errorBoundary", {
            component: this.props.componentName,
            error: error instanceof Error ? error.message : String(error),
            componentStack: info.componentStack,
            stack: (error as Error)?.stack || null,
        });

        // Notify parent component about the error
        if (this.props.onError) {
            this.props.onError();
        }

        setTimeout(() => this.setState({ hasError: false }), 3000);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        position: "fixed",
                        top: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(4, 4, 4, 0.85)",
                        border: "2px solid rgba(220, 38, 38, 0.9)",
                        borderRadius: "0px",
                        padding: "16px 32px",
                        fontFamily: "'Rajdhani', sans-serif",
                        color: "#dfe9f2",
                        textAlign: "center",
                        zIndex: 99999,
                        pointerEvents: "none",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                        maxWidth: "600px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: "800",
                            color: "#dc2626",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "8px",
                        }}
                    >
                        Component Error
                    </div>
                    <div
                        style={{
                            fontSize: "1rem",
                            fontWeight: "600",
                            opacity: "0.9",
                            letterSpacing: "0.04em",
                            wordBreak: "break-word",
                        }}
                    >
                        {this.props.componentName || "Unknown component"} failed to render
                    </div>
                    <div
                        style={{
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            opacity: "0.7",
                            marginTop: "8px",
                            fontStyle: "italic",
                        }}
                    >
                        Reloading component...
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
