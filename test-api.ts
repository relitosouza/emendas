const { POST } = require("./app/api/financial/import/route.ts");

async function run() {
    const formData = new FormData();
    const blob = new Blob(["amendmentId,empenhado\n123,456\n"], { type: 'text/csv' });
    // Add file object
    const file = new File([blob], "test.csv", { type: "text/csv" });
    formData.append("file", file);

    const req = new Request("http://localhost:3000/api/financial/import", {
        method: "POST",
        body: formData,
        // Mocking authentication as bypassed or using an invalid token which we bypass
    });

    // Mock isAuthenticated from lib/auth
    const auth = require("./lib/auth.ts");
    auth.isAuthenticated = async () => true;

    try {
        const res = await POST(req);
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Unhandled Error:", e);
    }
}

run();
