"use client";

import { useEffect } from "react";

export default function VLibras() {
    useEffect(() => {
        let script = document.getElementById("vlibras-script") as HTMLScriptElement;
        if (!script) {
            script = document.createElement("script");
            script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
            script.id = "vlibras-script";
            script.async = true;
            script.onload = () => {
                // @ts-ignore
                if (window.VLibras) {
                    // @ts-ignore
                    new window.VLibras.Widget("https://vlibras.gov.br/app");
                }
            };
            document.body.appendChild(script);
        }
    }, []);

    return (
        // @ts-ignore
        <div vw="true" className="enabled">
            {/* @ts-ignore */}
            <div vw-access-button="true" className="active"></div>
            {/* @ts-ignore */}
            <div vw-plugin-wrapper="true">
                <div className="vw-plugin-top-wrapper"></div>
            </div>
        </div>
    );
}
