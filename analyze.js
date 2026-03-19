const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

function readJsonTryCatch(file) {
    try {
        const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

const main = readJsonTryCatch("amendments.json");
const ext = readJsonTryCatch("emendas-externas.json");

const resultMap = new Map();

for (const a of ext) {
    if (a.id) resultMap.set(a.id, a);
}
for (const a of main) {
    if (a.id) resultMap.set(a.id, a);
}

const all = Array.from(resultMap.values());
console.log(`Total emendas (unique by ID): ${all.length}`);

let categorizedCount = 0;
let missing = [];

for (const a of all) {
    let catNum = a.categoria;
    if (typeof catNum === "string" && catNum.includes(" - ")) {
        catNum = catNum.split(" - ")[0].trim();
    }

    // In page.tsx: cat = catNum ? (categoryMap[catNum] || `Categoria ${catNum}`) : "Sem Categoria";
    // We count it as categorized if "catNum" is truthy.
    // wait, page.tsx does:
    // a.categoria && a.categoria !== "Sem Categoria"

    if (a.categoria && a.categoria !== "Sem Categoria") {
        categorizedCount++;
    } else {
        missing.push({ id: a.id, numeroEmenda: a.numeroEmenda, objeto: a.objeto, autor: a.autor });
    }
}

console.log(`Categorizadas: ${categorizedCount}`);
console.log(`Sem categoria ou não preenchidas: ${missing.length}`);
console.log("Details of missing categories:");
console.dir(missing, { depth: null });
