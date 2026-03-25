import React, { useState } from "react";
import { useVisibility, VisibilityProvider } from "@/providers/VisibilityProvider";
import "./index.css";
import { debugData } from "@/utils/debugData";
import { useNuiEvent, sendNuiMessage } from "@/hooks/useNuiEvent";

debugData("Example", [
    { action: "set-example-title", data: { title: "Debug: Welcome message" }, timer: 1000 },
    { action: "set-example-title", data: { title: "Debug: Data updated" }, timer: 3000 },
    { action: "set-example-title", data: { title: "Debug: Ready to interact" }, timer: 6000 },
]);

const sections = [
    {
        id: "overview",
        title: "Overview",
        content: (
            <div className="example-content">
                <h2>Welcome to NUI Boilerplate</h2>
                <p>This boilerplate provides a solid foundation for building FiveM NUI interfaces using React, TypeScript, and Vite.</p>
                <div className="example-grid">
                    <div className="example-card">
                        <h3>Vite + React</h3>
                        <p>Lightning-fast HMR and optimized builds for production.</p>
                    </div>
                    <div className="example-card">
                        <h3>TypeScript</h3>
                        <p>Fully typed for better developer experience and reliability.</p>
                    </div>
                    <div className="example-card">
                        <h3>VisibilityProvider</h3>
                        <p>Global state management for showing and hiding individual UI components.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "hooks",
        title: "NUI Hooks",
        content: (
            <div className="example-content">
                <h2>Custom NUI Hooks</h2>
                <p>Easily handle communication between your Lua client scripts and React UI.</p>
                <div className="code-block">
                    <code>
                        <span className="keyword">import</span> {'{'} useNuiEvent {'}'} <span className="keyword">from</span> <span className="string">"@/hooks/useNuiEvent"</span>;
                        <br /><br />
                        <span className="keyword">useNuiEvent</span>&lt;<span className="type">UserData</span>&gt;(<span className="string">"updateUser"</span>, (data) ={'>'} {'{'}
                        <br />
                        &nbsp;&nbsp;console.log(data);
                        <br />
                        {'}'});
                    </code>
                </div>
                <div className="example-grid">
                    <div className="example-card">
                        <h3>useNuiEvent</h3>
                        <p>Listen to events sent from client Lua scripts to the UI.</p>
                    </div>
                    <div className="example-card">
                        <h3>useNuiCallBack</h3>
                        <p>Listen to requests from Lua and return a response back directly.</p>
                    </div>
                    <div className="example-card">
                        <h3>fetchNui</h3>
                        <p>Send data from the React UI to the client Lua callbacks.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "tools",
        title: "Built-in Tools",
        content: (
            <div className="example-content">
                <h2>Pre-Built Utilities</h2>
                <p>The boilerplate includes various pre-built components that handle common FiveM tasks.</p>
                
                <div className="tools-list">
                    <div className="tool-item">
                        <div className="tool-header">
                            <h3>FadeHandler</h3>
                            <button className="example-button small" onClick={() => {sendNuiMessage("set-FadeHandler-visible", true); sendNuiMessage("fade-in", { duration: 1000 }); setTimeout(() => sendNuiMessage("fade-out", { duration: 1000 }), 2000);}}>Test Fade In then Out</button>
                        </div>
                        <p>Smooth screen transitions to black. Call <code>fade-in</code> or <code>fade-out</code> events.</p>
                    </div>
                    <div className="tool-item">
                        <div className="tool-header">
                            <h3>Prompt Modal</h3>
                            <button className="example-button small" onClick={() => {sendNuiMessage("set-Prompt-visible", true); sendNuiMessage("prompt", { title: "Example Prompt", placeholder: "Type here...", minCharCount: 5, maxCharCount: 100, timeout: 20000 })}}>Test Prompt</button>
                        </div>
                        <p>A globally available input modal for gathering text from the player.</p>
                    </div>
                    <div className="tool-item">
                        <div className="tool-header">
                            <h3>Sounds Manager</h3>
                        </div>
                        <p>Play 2D and 3D positional sounds using native HTML5 Audio you can control from your Lua Script</p>
                    </div>
                    <div className="tool-item">
                        <div className="tool-header">
                            <h3>3D DUI Integration</h3>
                        </div>
                        <p>Render specialized React components onto in-game 3D world targets effortlessly.</p>
                    </div>
                </div>
            </div>
        )
    }
];

const Example_Comp: React.FC = () => {
    const { visible } = useVisibility();
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [dynamicTitle, setDynamicTitle] = useState("NUI Boilerplate");

    useNuiEvent<{ title: string }>("set-example-title", (payload) => {
        if (payload?.title) {
            setDynamicTitle(payload.title);
        }
    });

    if (!visible) return null;

    const currentSection = sections.find(s => s.id === activeSection);

    return (
        <section className="example-shell">
            <div className="example-sidebar">
                <div className="example-logo">
                    <h2>NUI Boilerplate</h2>
                    <span>v1.0 Boilerplate</span>
                </div>
                <nav className="example-nav">
                    {sections.map(section => (
                        <button 
                            key={section.id}
                            className={`nav-btn ${activeSection === section.id ? "active" : ""}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.title}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="example-main">
                <div className="example-dynamic-title">
                    <h1>{dynamicTitle}</h1>
                    <button
                        className="example-button small"
                        onClick={() => sendNuiMessage("set-example-title", { title: "Manual title set at " + new Date().toLocaleTimeString() })}
                    >
                        Manual Title Update
                    </button>
                </div>
                {currentSection?.content}
            </div>
            
            <button className="btn-close" onClick={() => sendNuiMessage("hide-nui", true)}>✕</button>
        </section>
    );
};

export const Example: React.FC = () => (
    <VisibilityProvider componentName="Example" autoEnabled={true}>
        <Example_Comp />
    </VisibilityProvider>
);
