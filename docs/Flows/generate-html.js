const fs = require('fs');
const path = require('path');

// Read SVG data
const svgData = JSON.parse(fs.readFileSync('/tmp/svg-data.json', 'utf8'));

// Categories with descriptions
const categories = [
  {
    id: 'cat-1', title: '1. Ügyfél Felvétel és Bérlés',
    desc: 'Az ügyfél regisztrációtól a bérleti szerződés kiállításáig tartó teljes folyamat.',
    diagrams: [
      { key: '1-ugyfelfelvitel-folyamat', title: 'Folyamatábra', desc: 'Teljes ügyfél felvétel folyamata.', details: ['📋 Belépés → Adatrögzítés → Bérlés → Szerződés', '👤 Igazolványszám kötelező bérléshez', '🏢 Adószám NAV ellenőrzéssel', '📝 Kaució készpénzben, cetlire'] },
      { key: '1-ugyfelfelvitel-dontesi-fa', title: 'Döntési Fa', desc: 'Magánszemély vs. céges döntési pontok.', details: ['🔀 Magánszemély vagy Cég?', '👤 Egyszerűsített regisztráció', '🏢 NAV validáció'] },
      { key: '1-ugyfelfelvitel-dfd', title: 'Adatfolyam (DFD)', desc: 'Adatok mozgása a rendszerben.', details: ['📥 Bemenetek: ügyfél adatok', '📤 Kimenetek: rekordok, PDF', '🔄 NAV, nyomtató integráció'] },
      { key: '1-ugyfelfelvitel-erd', title: 'ERD v2.0', desc: 'Partner, Cég, Bérlés entitások.', details: ['🏢 tenant_id minden entitásban', '📶 offline_sync támogatás', '🔐 RBAC szerepkörök'] },
      { key: '1-ugyfelfelvitel-rendszer', title: 'Rendszer Kontextus', desc: 'Külső rendszerek integrációja.', details: ['🌐 NAV Online', '🖨️ Nyomtató', '📱 Vonalkód olvasó'] }
    ]
  },
  {
    id: 'cat-2', title: '2. Értékesítés és Készlet',
    desc: 'Termék értékesítés, készletnyilvántartás, bevételezés.',
    diagrams: [
      { key: '2-ertekesites-folyamat', title: 'Értékesítés Folyamat', desc: 'Cikkszám beolvasástól számláig.', details: ['📦 Vonalkód scan', '💰 Árrés alapú ár', '�� Fizetési módok'] },
      { key: '2-ertekesites-erd', title: 'ERD v2.0', desc: 'Cikk, Bevételezés entitások.', details: ['📦 CIKK: tenant_id, árrés_kategória', '📥 BEVÉTELEZÉS: e-számla integráció'] },
      { key: '2-ertekesites-keszlet', title: 'Készletkezelés', desc: 'Raktárkészlet és leltár.', details: ['📊 Valós idejű készlet', '⚠️ Minimum készlet figyelmeztetés'] }
    ]
  },
  {
    id: 'cat-3', title: '3. Bérgép Kezelés',
    desc: 'Bérlésre szánt gépek kiadása és visszavétele.',
    diagrams: [
      { key: '3-bergep-folyamat', title: 'Bérgép Folyamat v2.0', desc: 'Gép felvétel, kiadás, visszavétel.', details: ['📤 Vonalkód scan kiadásnál', '📥 Késés ellenőrzés visszavételkor', '📶 PWA offline támogatás'] }
    ]
  },
  {
    id: 'cat-4', title: '4. Szerviz Folyamatok',
    desc: 'Gépjavítás teljes életciklusa.',
    diagrams: [
      { key: '4-szerviz-folyamat', title: 'Szerviz Folyamat v2.0', desc: 'Beérkezéstől kiadásig.', details: ['📥 Gép beérkezés, hibaleírás', '🔧 Javítás, alkatrész felhasználás', '📤 Kiadás, értesítés'] },
      { key: '4-szerviz-erd', title: 'ERD v2.0', desc: 'Munkalap, Alkatrész kapcsolatok.', details: ['📋 MUNKALAP: tenant_id, státusz', '🔧 ALKATRÉSZ_FELHASZNÁLÁS'] },
      { key: '4-szerviz-munkalap', title: 'Munkalap Életciklus', desc: 'Státuszok és átmenetek.', details: ['🆕 Felvétel → ⏳ Folyamatban → ✅ Kész → 📤 Kiadva'] }
    ]
  },
  {
    id: 'cat-5', title: '5. Pénzügy',
    desc: 'Befizetések, NAV jelentések, havi zárások.',
    diagrams: [
      { key: '5-penzugy-folyamat', title: 'Pénzügyi Folyamat v2.0', desc: 'Teljesítések és zárások.', details: ['💳 Bankszámlakivonat feldolgozás', '📊 Havi zárás, Excel export'] },
      { key: '5-penzugy-archivalas', title: 'Számla Archiválás', desc: 'Dokumentum tárolás.', details: ['📁 /szamlak/, /arajanaltok/', '📄 PDF, NAV XML tárolás'] }
    ]
  },
  {
    id: 'cat-6', title: '6. Egyéb Funkciók',
    desc: 'Rendelés kezelés, felhasználó adminisztráció.',
    diagrams: [
      { key: '6-egyeb-rendeles', title: 'Rendelés Folyamat', desc: 'Megrendelés és sztornó.', details: ['📝 Rendelés felvétel', '📦 Beérkezés értesítés', '❌ Sztornó kezelés'] },
      { key: '6-egyeb-felhasznalo', title: 'Felhasználó Kezelés', desc: 'Jogosultságok.', details: ['🔐 6 RBAC szerepkör', '🏢 Multi-tenant hozzárendelés'] }
    ]
  },
  {
    id: 'cat-7', title: '7. Új Funkciók (2025)',
    desc: 'Automatikus értesítések, fizetési fegyelem, e-számla, árazás.',
    diagrams: [
      { key: '7-ertesitesek-folyamat', title: 'Automatikus Értesítések', desc: 'SMS/Email küldés.', details: ['📧 SMS + Email csatornák', '📦 Rendelés beérkezés értesítés', '⏰ Lejárat emlékeztető', '💰 Tartozás figyelmeztetés'] },
      { key: '7-fizetesi-fegyelem', title: 'Fizetési Fegyelem', desc: 'Tartozás blokkolás.', details: ['🚫 Lejárt tartozással blokkolás', '👤 Vezetői feloldás naplózva', '🏛️ NAV adószám ellenőrzés'] },
      { key: '7-e-szamla-folyamat', title: 'E-számla Feldolgozás', desc: 'Automatikus bevételezés.', details: ['📧 Dedikált email cím', '📄 NAV XML / PDF OCR parsing', '📥 Előzetes bevételezés', '💰 Auto árazás trigger'] },
      { key: '7-arrazas-automatizalas', title: 'Automatikus Árazás', desc: 'Árrés kategóriák.', details: ['📊 Alkatrész 35%, Kisgép 25%', '🧮 Auto eladási ár számítás', '⚠️ >20% eltérés: jóváhagyás'] },
      { key: '7-erd-uj-entitasok', title: 'ERD - Új Entitások', desc: '5 új entitás.', details: ['📧 ÉRTESÍTÉS: típus, csatorna', '🔧 MUNKA_GÉP: munkaalapú keresés', '💰 ÁRRÉS_KATEGÓRIA: min/max %'] }
    ]
  }
];

const totalDiagrams = categories.reduce((sum, cat) => sum + cat.diagrams.length, 0);
const allKeys = categories.flatMap(c => c.diagrams.map(d => d.key));

// Build HTML
let html = `<!DOCTYPE html>
<html lang="hu" x-data="appData()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v2.0 - Rendszer Diagramok</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>tailwind.config = { darkMode: 'class' }</script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .dark { background-color: rgb(17 24 39); color: rgb(243 244 246); }
        .sticky-sidebar { position: sticky; top: 1.5rem; max-height: calc(100vh - 3rem); overflow-y: auto; }
        .diagram-container { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; }
        .dark .diagram-container { background: rgb(31 41 55); border-color: rgb(55 65 81); }
        .diagram-wrapper { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; overflow: auto; }
        .dark .diagram-wrapper { background: #2d3748; }
        .diagram-wrapper svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }
        .dark .diagram-container svg { filter: invert(0.9) hue-rotate(180deg); }
        .explanation-box { background: linear-gradient(to right, #eff6ff, #dbeafe); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 8px; }
        .dark .explanation-box { background: linear-gradient(to right, rgb(30 58 138), rgb(29 78 216)); }
        .details-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; }
        .dark .details-box { background: rgb(20 83 45); }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h1 class="text-3xl font-bold">KGC ERP v2.0 - Rendszer Diagramok</h1>
                    <p class="mt-1">Multi-tenant | PWA Offline | RBAC</p>
                    <p class="text-sm opacity-90">📊 ${totalDiagrams} diagram | 🗂️ ${categories.length} kategória</p>
                </div>
                <div class="flex space-x-3">
                    <button @click="darkMode = !darkMode" class="p-3 bg-white/20 rounded-lg" title="Sötét/Világos">🌙</button>
                    <button @click="exportNotes()" class="px-4 py-2 bg-white/20 rounded-lg">📥 CSV Export</button>
                    <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-white/20 rounded-lg">📤 CSV Import</button>
                    <input type="file" x-ref="fileInput" @change="importNotes($event)" accept=".csv" class="hidden">
                </div>
            </div>
        </div>
    </header>

    <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-12 gap-6">
            <aside class="col-span-12 lg:col-span-3 no-print">
                <div class="sticky-sidebar bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h2 class="text-lg font-bold mb-4">📋 Kategóriák</h2>
                    <div class="space-y-2">`;

// Category tabs
categories.forEach(cat => {
  html += `
                        <button @click="activeTab = '${cat.id}'" :class="activeTab === '${cat.id}' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="w-full text-left px-3 py-2 rounded-lg text-sm">
                            ${cat.title} <span class="float-right opacity-70">${cat.diagrams.length}</span>
                        </button>`;
});

html += `
                    </div>
                    <p class="mt-4 text-xs text-gray-500">💡 Megjegyzések localStorage-ban mentődnek</p>
                </div>
            </aside>

            <main class="col-span-12 lg:col-span-9">`;

// Category content
categories.forEach(cat => {
  html += `
                <div x-show="activeTab === '${cat.id}'" class="space-y-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                        <h2 class="text-2xl font-bold">${cat.title}</h2>
                        <p class="text-gray-600 dark:text-gray-400 mt-2">${cat.desc}</p>
                    </div>`;

  cat.diagrams.forEach(diag => {
    const svg = svgData[diag.key] || '<svg><text x="10" y="30">Not found</text></svg>';
    const detailsHtml = diag.details.map(d => `<li class="text-sm">${d}</li>`).join('');

    html += `
                    <div class="diagram-container" id="${diag.key}">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-semibold">${diag.title}</h3>
                            <button @click="expanded['${diag.key}'] = !expanded['${diag.key}']" class="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                                <span x-text="expanded['${diag.key}'] ? 'Bezár' : 'Megnyit'"></span>
                            </button>
                        </div>
                        <div class="explanation-box mb-3">
                            <p class="text-sm"><strong>📋</strong> ${diag.desc}</p>
                        </div>
                        <div class="details-box mb-3">
                            <ul class="space-y-1">${detailsHtml}</ul>
                        </div>
                        <div x-show="expanded['${diag.key}']" x-collapse>
                            <div class="diagram-wrapper mb-4">${svg}</div>
                        </div>
                        <div class="border-t pt-4 mt-4">
                            <label class="text-sm font-semibold">💬 Megjegyzések:</label>
                            <textarea x-model="notes['${diag.key}']" @input="saveNotes()" rows="2" class="w-full mt-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Írj ide megjegyzést..."></textarea>
                        </div>
                    </div>`;
  });

  html += `
                </div>`;
});

// Generate expanded object
const expandedInit = allKeys.map(k => `"${k}": false`).join(', ');

html += `
            </main>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-4 mt-12 no-print text-center text-sm">
        KGC ERP v2.0 | Multi-tenant (ADR-001) | PWA Offline (ADR-002) | White Label (ADR-003)
    </footer>

    <script>
        function appData() {
            return {
                darkMode: localStorage.getItem('darkMode') === 'true',
                activeTab: 'cat-1',
                notes: JSON.parse(localStorage.getItem('kgc-notes') || '{}'),
                expanded: { ${expandedInit} },

                init() {
                    this.$watch('darkMode', v => localStorage.setItem('darkMode', v));
                },

                saveNotes() {
                    localStorage.setItem('kgc-notes', JSON.stringify(this.notes));
                },

                exportNotes() {
                    const rows = [['Diagram ID', 'Megjegyzés', 'Dátum']];
                    const now = new Date().toISOString();
                    Object.entries(this.notes).forEach(([id, note]) => {
                        if (note && note.trim()) {
                            rows.push([id, note.replace(/"/g, '""'), now]);
                        }
                    });
                    if (rows.length === 1) { alert('Nincs megjegyzés!'); return; }
                    const csv = rows.map(r => r.map(c => '"' + c + '"').join(',')).join('\\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'kgc-notes-' + Date.now() + '.csv';
                    link.click();
                    alert('✅ ' + (rows.length - 1) + ' megjegyzés exportálva!');
                },

                importNotes(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const lines = e.target.result.split('\\n');
                            let added = 0;
                            for (let i = 1; i < lines.length; i++) {
                                const line = lines[i].trim();
                                if (!line) continue;
                                const match = line.match(/^"([^"]+)","(.*?)"/);
                                if (match) {
                                    const [, id, note] = match;
                                    const clean = note.replace(/""/g, '"');
                                    // APPEND ONLY - never delete
                                    if (this.notes[id]) {
                                        if (!this.notes[id].includes(clean)) {
                                            this.notes[id] += '\\n---\\n[Import] ' + clean;
                                            added++;
                                        }
                                    } else {
                                        this.notes[id] = '[Import] ' + clean;
                                        added++;
                                    }
                                }
                            }
                            this.saveNotes();
                            alert('✅ ' + added + ' megjegyzés HOZZÁADVA! (Meglévők megmaradtak)');
                        } catch (err) {
                            alert('❌ Hiba: ' + err.message);
                        }
                    };
                    reader.readAsText(file);
                    event.target.value = '';
                }
            };
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'KGC-ERP-v2-Diagramok.html'), html);
const size = fs.statSync(path.join(__dirname, 'KGC-ERP-v2-Diagramok.html')).size;
console.log('✅ HTML generálva: KGC-ERP-v2-Diagramok.html');
console.log('📊 ' + totalDiagrams + ' diagram, ' + categories.length + ' kategória');
console.log('📦 Méret: ' + (size / 1024).toFixed(1) + ' KB');
