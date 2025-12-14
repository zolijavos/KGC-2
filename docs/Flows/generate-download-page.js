const fs = require('fs');
const path = require('path');

// Read all excalidraw files
const diagramsDir = path.join(__dirname, 'diagrams');
const files = fs.readdirSync(diagramsDir).filter(f => f.endsWith('.excalidraw'));

const diagrams = {};
files.forEach(file => {
    const filePath = path.join(diagramsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const key = file.replace('.excalidraw', '');
    diagrams[key] = JSON.parse(content);
});

const html = `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP - Excalidraw Diagramok Letöltése</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script>
    <style>
        .download-card {
            transition: all 0.3s ease;
        }
        .download-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
        .category-header {
            background: linear-gradient(135deg, var(--from) 0%, var(--to) 100%);
        }
        .downloading {
            opacity: 0.5;
            pointer-events: none;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <header class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-4xl font-bold text-center">KGC ERP - Excalidraw Diagramok</h1>
            <p class="text-xl text-center mt-2 opacity-90">Letölthető .excalidraw fájlok</p>
            <div class="flex justify-center gap-8 mt-6">
                <div class="text-center">
                    <div class="text-3xl font-bold">16</div>
                    <div class="text-sm opacity-80">Diagram</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">6</div>
                    <div class="text-sm opacity-80">Kategória</div>
                </div>
            </div>
            <div class="text-center mt-6">
                <button id="downloadAllBtn" onclick="downloadAll()" class="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-all">
                    📦 Összes Letöltése (ZIP)
                </button>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        <!-- 1. Ügyfél Felvétel és Bérlés -->
        <section class="mb-10">
            <div class="category-header rounded-t-xl px-6 py-4 text-white" style="--from: #3b82f6; --to: #1d4ed8;">
                <h2 class="text-2xl font-bold">👤 1. Ügyfél Felvétel és Bérlés</h2>
                <p class="opacity-90">5 diagram</p>
            </div>
            <div class="bg-white rounded-b-xl shadow-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-blue-500" onclick="downloadDiagram('1-ugyfelfelvitel-folyamat')">
                    <div class="text-3xl mb-2">📊</div>
                    <h3 class="font-semibold">Ügyfél Felvétel Folyamat</h3>
                    <p class="text-sm text-gray-500 mt-1">Teljes bérlési folyamat</p>
                    <div class="mt-3 text-blue-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-blue-500" onclick="downloadDiagram('1-ugyfelfelvitel-dontesi-fa')">
                    <div class="text-3xl mb-2">🔀</div>
                    <h3 class="font-semibold">Döntési Fa</h3>
                    <p class="text-sm text-gray-500 mt-1">Új/meglévő ügyfél, kaució típusok</p>
                    <div class="mt-3 text-blue-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-blue-500" onclick="downloadDiagram('1-ugyfelfelvitel-dfd')">
                    <div class="text-3xl mb-2">🔄</div>
                    <h3 class="font-semibold">Adatfolyam (DFD)</h3>
                    <p class="text-sm text-gray-500 mt-1">Adatok áramlása a rendszerben</p>
                    <div class="mt-3 text-blue-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-blue-500" onclick="downloadDiagram('1-ugyfelfelvitel-erd')">
                    <div class="text-3xl mb-2">🗃️</div>
                    <h3 class="font-semibold">Entitás Kapcsolatok (ERD)</h3>
                    <p class="text-sm text-gray-500 mt-1">Partner, Szerződés, Bérlés entitások</p>
                    <div class="mt-3 text-blue-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-blue-500" onclick="downloadDiagram('1-ugyfelfelvitel-rendszer')">
                    <div class="text-3xl mb-2">🖥️</div>
                    <h3 class="font-semibold">Rendszer Diagram</h3>
                    <p class="text-sm text-gray-500 mt-1">Modulok és integrációk</p>
                    <div class="mt-3 text-blue-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
            </div>
        </section>

        <!-- 2. Értékesítés -->
        <section class="mb-10">
            <div class="category-header rounded-t-xl px-6 py-4 text-white" style="--from: #22c55e; --to: #16a34a;">
                <h2 class="text-2xl font-bold">🛒 2. Értékesítés</h2>
                <p class="opacity-90">3 diagram</p>
            </div>
            <div class="bg-white rounded-b-xl shadow-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-green-500" onclick="downloadDiagram('2-ertekesites-folyamat')">
                    <div class="text-3xl mb-2">📊</div>
                    <h3 class="font-semibold">Értékesítési Folyamat</h3>
                    <p class="text-sm text-gray-500 mt-1">Cikk felvételtől az eladásig</p>
                    <div class="mt-3 text-green-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-green-500" onclick="downloadDiagram('2-ertekesites-erd')">
                    <div class="text-3xl mb-2">🗃️</div>
                    <h3 class="font-semibold">Entitás Kapcsolatok (ERD)</h3>
                    <p class="text-sm text-gray-500 mt-1">Cikk, Bevételezés, Készlet</p>
                    <div class="mt-3 text-green-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-green-500" onclick="downloadDiagram('2-ertekesites-keszlet')">
                    <div class="text-3xl mb-2">📦</div>
                    <h3 class="font-semibold">Készletmozgás</h3>
                    <p class="text-sm text-gray-500 mt-1">Bevételezés, átcsoportosítás, eladás</p>
                    <div class="mt-3 text-green-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
            </div>
        </section>

        <!-- 3. Bérgép Készlet -->
        <section class="mb-10">
            <div class="category-header rounded-t-xl px-6 py-4 text-white" style="--from: #f97316; --to: #ea580c;">
                <h2 class="text-2xl font-bold">🔧 3. Bérgép Készlet</h2>
                <p class="opacity-90">1 diagram</p>
            </div>
            <div class="bg-white rounded-b-xl shadow-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-orange-500" onclick="downloadDiagram('3-bergep-folyamat')">
                    <div class="text-3xl mb-2">🔧</div>
                    <h3 class="font-semibold">Bérgép Kezelés Folyamat</h3>
                    <p class="text-sm text-gray-500 mt-1">Életciklus és állapotok</p>
                    <div class="mt-3 text-orange-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
            </div>
        </section>

        <!-- 4. Szerviz -->
        <section class="mb-10">
            <div class="category-header rounded-t-xl px-6 py-4 text-white" style="--from: #ef4444; --to: #dc2626;">
                <h2 class="text-2xl font-bold">🔨 4. Szerviz</h2>
                <p class="opacity-90">3 diagram</p>
            </div>
            <div class="bg-white rounded-b-xl shadow-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-red-500" onclick="downloadDiagram('4-szerviz-folyamat')">
                    <div class="text-3xl mb-2">📊</div>
                    <h3 class="font-semibold">Szerviz Folyamat</h3>
                    <p class="text-sm text-gray-500 mt-1">Normál és nagy céges számlázás</p>
                    <div class="mt-3 text-red-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-red-500" onclick="downloadDiagram('4-szerviz-erd')">
                    <div class="text-3xl mb-2">🗃️</div>
                    <h3 class="font-semibold">Entitás Kapcsolatok (ERD)</h3>
                    <p class="text-sm text-gray-500 mt-1">Munkalap, Árajánlat entitások</p>
                    <div class="mt-3 text-red-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-red-500" onclick="downloadDiagram('4-szerviz-munkalap')">
                    <div class="text-3xl mb-2">📋</div>
                    <h3 class="font-semibold">Munkalap Életciklus</h3>
                    <p class="text-sm text-gray-500 mt-1">Státuszok és átmenetek</p>
                    <div class="mt-3 text-red-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
            </div>
        </section>

        <!-- 5. Pénzügy -->
        <section class="mb-10">
            <div class="category-header rounded-t-xl px-6 py-4 text-white" style="--from: #a855f7; --to: #9333ea;">
                <h2 class="text-2xl font-bold">💰 5. Pénzügy</h2>
                <p class="opacity-90">2 diagram</p>
            </div>
            <div class="bg-white rounded-b-xl shadow-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-purple-500" onclick="downloadDiagram('5-penzugy-folyamat')">
                    <div class="text-3xl mb-2">💰</div>
                    <h3 class="font-semibold">Pénzügyi Folyamatok</h3>
                    <p class="text-sm text-gray-500 mt-1">Napi, havi, éves műveletek</p>
                    <div class="mt-3 text-purple-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-purple-500" onclick="downloadDiagram('5-penzugy-archivalas')">
                    <div class="text-3xl mb-2">📁</div>
                    <h3 class="font-semibold">Archiválás Struktúra</h3>
                    <p class="text-sm text-gray-500 mt-1">Szerver mappaszerkezet</p>
                    <div class="mt-3 text-purple-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
            </div>
        </section>

        <!-- 6. Egyéb -->
        <section class="mb-10">
            <div class="category-header rounded-t-xl px-6 py-4 text-white" style="--from: #6b7280; --to: #4b5563;">
                <h2 class="text-2xl font-bold">⚙️ 6. Egyéb Funkciók</h2>
                <p class="opacity-90">2 diagram</p>
            </div>
            <div class="bg-white rounded-b-xl shadow-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-gray-500" onclick="downloadDiagram('6-egyeb-rendeles')">
                    <div class="text-3xl mb-2">📝</div>
                    <h3 class="font-semibold">Megrendelés Folyamat</h3>
                    <p class="text-sm text-gray-500 mt-1">Rendelés felvétel és beérkezés</p>
                    <div class="mt-3 text-gray-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
                <div class="download-card border rounded-lg p-4 cursor-pointer hover:border-gray-500" onclick="downloadDiagram('6-egyeb-felhasznalo')">
                    <div class="text-3xl mb-2">👥</div>
                    <h3 class="font-semibold">Felhasználók és Jogosultságok</h3>
                    <p class="text-sm text-gray-500 mt-1">Hozzáférés kezelés</p>
                    <div class="mt-3 text-gray-600 text-sm font-medium">⬇️ Letöltés</div>
                </div>
            </div>
        </section>
    </main>

    <footer class="bg-gray-800 text-white py-6 text-center">
        <p>KGC ERP Workflow Dokumentáció - 2025</p>
        <p class="text-sm mt-1 opacity-70">A .excalidraw fájlok megnyithatók: <a href="https://excalidraw.com" target="_blank" class="underline">excalidraw.com</a></p>
    </footer>

    <script>
    // Beágyazott Excalidraw fájlok
    const diagrams = ${JSON.stringify(diagrams, null, 2)};

    function downloadDiagram(name) {
        const data = diagrams[name];
        if (!data) {
            alert('Diagram nem található: ' + name);
            return;
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = name + '.excalidraw';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function downloadAll() {
        const btn = document.getElementById('downloadAllBtn');
        btn.textContent = '⏳ ZIP készítése...';
        btn.classList.add('downloading');

        try {
            const zip = new JSZip();
            const folder = zip.folder('KGC-ERP-Diagramok');

            for (const [name, data] of Object.entries(diagrams)) {
                const json = JSON.stringify(data, null, 2);
                folder.file(name + '.excalidraw', json);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'KGC-ERP-Diagramok.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Hiba történt: ' + err.message);
        }

        btn.textContent = '📦 Összes Letöltése (ZIP)';
        btn.classList.remove('downloading');
    }
    <\/script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'KGC-ERP-Diagramok-Letoltes.html'), html);
console.log('Generated: KGC-ERP-Diagramok-Letoltes.html');
console.log('Embedded diagrams: ' + Object.keys(diagrams).length);
