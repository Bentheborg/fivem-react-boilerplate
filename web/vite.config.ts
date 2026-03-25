import { defineConfig } from "vite";
import type { ConfigEnv, Plugin, ViteDevServer, IndexHtmlTransformContext } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import pkg from "javascript-obfuscator";
const { obfuscate } = pkg;

// Custom plugin to move extra files and delete static folder after build
function moveExtraFilesPlugin(outDirName = "dist") {
    return {
        name: "move-extra-files",
        closeBundle() {
            const buildDir = path.resolve(__dirname, outDirName);
            const extraDir = path.join(buildDir, "extra");
            const staticDir = path.join(buildDir, "static");

            if (!fs.existsSync(extraDir)) {
                fs.mkdirSync(extraDir, { recursive: true });
            }

            const extraFiles = ["asset-manifest.json", "main.js.LICENSE.txt", "loadingscreen.js.LICENSE.txt", "3d-dui.js.LICENSE.txt"];
            extraFiles.forEach((file) => {
                const filePath = path.join(buildDir, file);
                if (fs.existsSync(filePath)) {
                    fs.renameSync(filePath, path.join(extraDir, file));
                }
            });

            // Move all .map files
            fs.readdirSync(buildDir).forEach((file) => {
                if (file.endsWith(".map")) {
                    fs.renameSync(path.join(buildDir, file), path.join(extraDir, file));
                }
            });

            // Delete the static folder if it exists
            if (fs.existsSync(staticDir)) {
                fs.rmSync(staticDir, { recursive: true, force: true });
            }
        },
    };
}

export default defineConfig(({ command, mode }: ConfigEnv) => {
    const outDir = "dist";
    const isBuild = command === "build";

    return {
        server: {
            host: "::",
            port: 8080,
            hmr: {
                overlay: true, // Ensure error overlay is enabled in dev
            },
        },
        base: "./",
        // Enable faster transpilation
        esbuild: {
            target: "es2020",
            drop: isBuild && mode !== "development" ? ["debugger"] : [],
        },
        plugins: [
            react(),
            {
                name: "log-info",
                config() {
                    console.log(`Vite running in ${command} mode (${mode})`);
                },
            },
            // imageOptimizationPlugin(),
            mode === "obfuscate" &&
                ((): Plugin => {
                    const processedFiles = new Set<string>();
                    return {
                        name: "custom-obfuscator",
                        transformIndexHtml: {
                            order: "post",
                            transform(html: string, ctx: IndexHtmlTransformContext) {
                                if (!ctx.bundle) return html;
                                console.log("\nObfuscate files");
                                const options = {
                                    stringArray: true,
                                    sourceMap: false,
                                    controlFlowFlattening: false,
                                    controlFlowFlatteningThreshold: 0,
                                    splitStringsChunkLength: 5,
                                    numbersToExpressions: false,
                                    selfDefending: false,
                                    simplify: true,
                                    compact: true,
                                    stringArrayShuffle: false,
                                    splitStrings: false,
                                    stringArrayThreshold: 0.5,
                                    identifiersPrefix: "boolean_ui_" + Math.random().toString(36).substring(7),
                                };
                                const excludePatterns = [/node_modules/, /vendor-/, /index-/];
                                for (const [fileName, chunk] of Object.entries(ctx.bundle as Record<string, any>)) {
                                    if ((chunk as any).code && fileName.endsWith(".js")) {
                                        if (processedFiles.has(fileName)) {
                                            console.log(`Skipping ${fileName} (already obfuscated)`);
                                            continue;
                                        }
                                        const shouldExclude = excludePatterns.some((pattern) => pattern.test(fileName));
                                        if (!shouldExclude) {
                                            console.log(`Obfuscating ${fileName}...`);
                                            (chunk as any).code = obfuscate((chunk as any).code, options).getObfuscatedCode();
                                            processedFiles.add(fileName);
                                        } else {
                                            console.log(`Skipping ${fileName} (excluded)`);
                                        }
                                    }
                                }
                                console.log("Obfuscate done\n");
                                return html;
                            },
                        },
                    };
                })(),
            isBuild && moveExtraFilesPlugin(outDir),
        ].filter(Boolean),
        build: {
            outDir: outDir,
            assetsDir: "",
            // Optimize build performance
            target: "es2020",
            minify: "esbuild", // Faster than terser
            chunkSizeWarningLimit: 1000,
            sourcemap: mode === "development", // Only generate sourcemaps in dev
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, "index.html"),
                    loadingscreen: path.resolve(__dirname, "loadingscreen.html"),
                    dui: path.resolve(__dirname, "3d-dui.html"),
                },
                output: {
                    entryFileNames: (chunkInfo) => {
                        return chunkInfo.name === "loadingscreen" ? "loadingscreen.js" : chunkInfo.name === "dui" ? "3d-dui.js" : "main.js";
                    },
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                            return "main.css";
                        }
                        if (assetInfo.name && assetInfo.name.endsWith(".map")) {
                            return "extra/[name][extname]";
                        }
                        return "[name][extname]";
                    },
                    // Optimize chunking for better caching
                    manualChunks: {
                        vendor: ["react", "react-dom"],
                    },
                },
            },
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
