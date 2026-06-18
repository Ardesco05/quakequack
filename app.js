/**
 * app.js - Logika WebGIS QuakeQuake (QQ)
 * Bertindak sebagai inti logika aplikasi visualisasi gempa, evakuasi, dan rute logistik Lampung-Selat Sunda.
 */

// --- KONFIGURASI KOORDINAT DEFAULT & LAYER DATA ---
const LAMPUNG_CENTER = [-5.4, 105.2];
const MAP_ZOOM_DEFAULT = 9;

// Titik Posko Alat Berat (Depot Logistik) - Awal Routing
const poskoAlatBerat = [
    { id: 'posko-bdl', nama: 'Posko Utama Bandar Lampung (Pusat)', koordinat: [-5.4292, 105.2611], deskripsi: 'Pusat Alat Berat Utama (Excavator, Buldozer, Truk Logistik)' },
    { id: 'posko-kalianda', nama: 'Posko Pembantu Kalianda (Lamsel)', koordinat: [-5.7231, 105.5894], deskripsi: 'Posko Siaga Selat Sunda (Loader, Truk Dumper)' },
    { id: 'posko-agung', nama: 'Posko Pembantu Kota Agung (Tanggamus)', koordinat: [-5.4988, 104.7892], deskripsi: 'Posko Wilayah Barat (Excavator Kecil, Tenda Darurat)' }
];

// Titik Kumpul Evakuasi Aman (Dataran Tinggi - Hijau)
const shelterEvakuasi = [
    { nama: 'Shelter Kalianda (Kaki Gunung Rajabasa)', koordinat: [-5.7483, 105.6136], elevasi: '250m dpl', kapasitas: '500 Jiwa' },
    { nama: 'Shelter Rajabasa (Ketinggian)', koordinat: [-5.7850, 105.6250], elevasi: '180m dpl', kapasitas: '300 Jiwa' },
    { nama: 'Shelter Tanggamus (Kaki Gunung Tanggamus)', koordinat: [-5.4650, 104.7650], elevasi: '450m dpl', kapasitas: '600 Jiwa' },
    { nama: 'Shelter Pesawaran (Ketinggian Padang Cermin)', koordinat: [-5.5850, 105.1500], elevasi: '310m dpl', kapasitas: '400 Jiwa' },
    { nama: 'Shelter Pesisir Barat (Ketinggian Liwa)', koordinat: [-5.0350, 104.0900], elevasi: '800m dpl', kapasitas: '1000 Jiwa' }
];

// Zona Pesisir Rawan (Tsunami & Gempa - Titik Awal Evakuasi)
const pesisirRawan = [
    { nama: 'Pesisir Kalianda (Pantai Ketang)', koordinat: [-5.7312, 105.5750], risiko: 'Tinggi (Tsunami & Gempa)' },
    { nama: 'Pesisir Rajabasa (Pantai Canti)', koordinat: [-5.8122, 105.5990], risiko: 'Sangat Tinggi (Tsunami Krakatau)' },
    { nama: 'Pesisir Tanggamus (Kota Agung Barat)', koordinat: [-5.5080, 104.7750], risiko: 'Tinggi (Sesar Semangko)' },
    { nama: 'Pesisir Pesawaran (Pantai Mutun)', koordinat: [-5.5680, 105.2550], risiko: 'Sedang (Gempa Bumi & Genangan)' },
    { nama: 'Pesisir Barat (Pantai Krui)', koordinat: [-5.1910, 103.9370], risiko: 'Sangat Tinggi (Subduksi Megathrust)' }
];

// --- MOCK DATA (FALLBACK) JIKA API REAL-TIME BMKG MENGALAMI CORS / OFFLINE ---
const mockGempaBMKG = [
    {
        Tanggal: "18 Jun 2026", Jam: "21:14:32 WIB", DateTime: "2026-06-18T14:14:32+00:00",
        Coordinates: "-5.85,105.42", Lintang: "5.85 LS", Bujur: "105.42 BT",
        Magnitude: "5.4", Kedalaman: "15 km", Wilayah: "42 km Tenggara Kalianda, Lampung (Selat Sunda)",
        Dirasakan: "III-IV MMI Kalianda, II-III MMI Bandar Lampung", Potensi: "Tidak berpotensi TSUNAMI"
    },
    {
        Tanggal: "15 Jun 2026", Jam: "03:45:12 WIB", DateTime: "2026-06-14T20:45:12+00:00",
        Coordinates: "-5.55,104.62", Lintang: "5.55 LS", Bujur: "104.62 BT",
        Magnitude: "4.9", Kedalaman: "22 km", Wilayah: "25 km Barat Daya Kota Agung, Tanggamus, Lampung",
        Dirasakan: "III MMI Tanggamus, II MMI Pringsewu", Potensi: "Tidak berpotensi TSUNAMI"
    },
    {
        Tanggal: "12 Jun 2026", Jam: "12:30:05 WIB", DateTime: "2026-06-12T05:30:05+00:00",
        Coordinates: "-5.08,103.98", Lintang: "5.08 LS", Bujur: "103.98 BT",
        Magnitude: "5.1", Kedalaman: "30 km", Wilayah: "12 km Barat Daya Liwa, Lampung Barat",
        Dirasakan: "IV MMI Liwa, II-III MMI Krui", Potensi: "Tidak berpotensi TSUNAMI"
    },
    {
        Tanggal: "09 Jun 2026", Jam: "01:12:44 WIB", DateTime: "2026-06-08T18:12:44+00:00",
        Coordinates: "-6.12,105.20", Lintang: "6.12 LS", Bujur: "105.20 BT",
        Magnitude: "4.2", Kedalaman: "10 km", Wilayah: "Sekitar Gunung Anak Krakatau, Selat Sunda",
        Dirasakan: "II MMI Kalianda, II MMI Anyer", Potensi: "Tidak berpotensi TSUNAMI"
    },
    {
        Tanggal: "05 Jun 2026", Jam: "18:05:19 WIB", DateTime: "2026-06-05T11:05:19+00:00",
        Coordinates: "-5.62,105.18", Lintang: "5.62 LS", Bujur: "105.18 BT",
        Magnitude: "3.8", Kedalaman: "8 km", Wilayah: "Teluk Lampung, Pesawaran, Lampung",
        Dirasakan: "II-III MMI Padang Cermin, II MMI Bandar Lampung", Potensi: "Tidak berpotensi TSUNAMI"
    }
];

// --- VARIABEL GLOBAL PETA & LAYER ---
let map;
let baseLayer;
let liveQuakeLayerGroup;
let heatmapLayer;
let shelterLayerGroup;
let evacuationLayerGroup;
let routingControl = null;
let currentRoutePolyline = null; // Fallback line jika OSRM mati
let allQuakesData = [];

// --- INISIALISASI PETA ---
function initMap() {
    // Buat peta
    map = L.map('map', {
        zoomControl: false // Kita taruh zoom control di kanan atas secara manual
    }).setView(LAMPUNG_CENTER, MAP_ZOOM_DEFAULT);

    // Zoom control custom posisinya
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Gunakan CartoDB Dark Matter (Sangat elegan untuk visualisasi modern dark mode)
    baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Inisialisasi Layer Group
    liveQuakeLayerGroup = L.layerGroup().addTo(map);
    shelterLayerGroup = L.layerGroup().addTo(map);
    evacuationLayerGroup = L.layerGroup().addTo(map);

    // Pasang Legenda di Peta
    addMapLegend();

    // Plot Titik Kumpul & Posko Utama
    plotSheltersAndPosko();

    // Load Data Real-time / Fallback
    loadEarthquakeData();
    loadUSGSHeatmap();

    // Daftarkan aksi UI
    registerUIEvents();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// --- JAM & TANGGAL DIGITAL ---
function updateDateTime() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = new Date().toLocaleDateString('id-ID', options);
    document.getElementById('live-clock').innerText = dateStr;
}

// --- RENDER LEGENDA MAP ---
function addMapLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info-legend');
        div.innerHTML = `
            <h4 class="font-semibold text-xs mb-2 border-b border-slate-700 pb-1 text-slate-300">Magnitudo Gempa</h4>
            <div class="flex flex-col gap-1">
                <div><i style="background: #ef4444"></i> &ge; 5.0 (Kuat / Merah)</div>
                <div><i style="background: #f59e0b"></i> 4.0 - 4.9 (Sedang / Jingga)</div>
                <div><i style="background: #eab308"></i> &lt; 4.0 (Ringan / Kuning)</div>
                <div class="border-t border-slate-700 my-1 pt-1"></div>
                <h4 class="font-semibold text-xs mb-1 text-slate-300">Simbol Peta</h4>
                <div class="flex items-center gap-1.5 mt-1">
                    <span class="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    <span>Shelter Evakuasi</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                    <span>Posko Alat Berat</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                    <span>Zona Pesisir Rawan</span>
                </div>
            </div>
        `;
        return div;
    };
    legend.addTo(map);
}

// --- PLOT SHELTER & POSKO ALAT BERAT ---
function plotSheltersAndPosko() {
    // 1. Plot Shelter Evakuasi (Marker Hijau Pulse)
    shelterEvakuasi.forEach(s => {
        const markerIcon = L.divIcon({
            className: 'pulse-marker-green',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const popupContent = `
            <div class="p-1">
                <span class="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800">SHELTER EVAKUASI</span>
                <h3 class="font-bold text-sm text-slate-100">${s.nama}</h3>
                <div class="text-xs text-slate-300 mt-2 space-y-1">
                    <p>⚡ <strong>Elevasi:</strong> ${s.elevasi} (Dataran Tinggi)</p>
                    <p>👥 <strong>Kapasitas:</strong> ${s.kapasitas}</p>
                </div>
            </div>
        `;

        L.marker(s.koordinat, { icon: markerIcon })
            .bindPopup(popupContent)
            .addTo(shelterLayerGroup);
    });

    // 2. Plot Posko Alat Berat (Marker Cyan Pulse)
    poskoAlatBerat.forEach(p => {
        const markerIcon = L.divIcon({
            className: 'pulse-marker-cyan',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const popupContent = `
            <div class="p-1">
                <span class="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 rounded-full border border-cyan-800">POSKO LOGISTIK & ALAT BERAT</span>
                <h3 class="font-bold text-sm text-slate-100">${p.nama}</h3>
                <p class="text-xs text-slate-300 mt-1.5">${p.deskripsi}</p>
            </div>
        `;

        L.marker(p.koordinat, { icon: markerIcon })
            .bindPopup(popupContent)
            .addTo(shelterLayerGroup);
        
        // Tambahkan ke dropdown asal routing alat berat
        const opt = document.createElement('option');
        opt.value = p.koordinat.join(',');
        opt.text = p.nama;
        document.getElementById('route-start').appendChild(opt);
    });

    // 3. Plot Zona Pesisir Rawan (Marker Merah Denyut Ringan & Dropdown Evakuasi)
    pesisirRawan.forEach((pr, idx) => {
        const markerIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [20, 32],
            iconAnchor: [10, 32],
            popupAnchor: [1, -34],
            shadowSize: [32, 32]
        });

        const popupContent = `
            <div class="p-1">
                <span class="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold bg-red-950 text-red-400 rounded-full border border-red-800">ZONA PESISIR RAWAN TSUNAMI</span>
                <h3 class="font-bold text-sm text-slate-100">${pr.nama}</h3>
                <p class="text-xs text-slate-300 mt-1">⚠️ <strong>Tingkat Bahaya:</strong> ${pr.risiko}</p>
                <button onclick="hitungJalurEvakuasiDariPoin(${idx})" class="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1 px-2 rounded text-[11px] transition duration-200">
                    Cari Jalur Evakuasi Terdekat
                </button>
            </div>
        `;

        L.marker(pr.koordinat, { icon: markerIcon })
            .bindPopup(popupContent)
            .addTo(shelterLayerGroup);

        // Tambah ke dropdown evakuasi pesisir
        const opt = document.createElement('option');
        opt.value = idx;
        opt.text = pr.nama;
        document.getElementById('evac-start').appendChild(opt);

        // Tambahkan juga ke target lokasi bencana di panel routing alat berat
        const optRoute = document.createElement('option');
        optRoute.value = pr.koordinat.join(',');
        optRoute.text = pr.nama;
        document.getElementById('route-end').appendChild(optRoute);
    });
}

// --- FETCH & FILTER DATA GEMPA BMKG ---
async function loadEarthquakeData() {
    const statusEl = document.getElementById('api-status-bmkg');
    statusEl.innerHTML = '<span class="animate-pulse inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2"></span>Menghubungkan BMKG...';
    
    // Keywords filter Lampung & Selat Sunda
    const filterKeywords = ["Lampung", "Selat Sunda", "Tanggamus", "Pesawaran", "Pesisir Barat", "Liwa", "Kalianda", "Lampung Selatan", "Lampung Barat", "Lampung Timur", "Pesisir", "Sunda"];

    try {
        let dataDirasakan = { Infogempa: { gempa: [] } };
        let dataTerkini = { Infogempa: { gempa: [] } };

        // 1. Coba ambil data gempa dirasakan
        try {
            const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');
            if (response.ok) {
                dataDirasakan = await response.json();
            } else {
                throw new Error("Direct fetch gempadirasakan gagal");
            }
        } catch (e) {
            console.log("Direct fetch gempadirasakan diblokir CORS. Mencoba via Proxy...");
            const responseProxy = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'));
            if (responseProxy.ok) {
                dataDirasakan = await responseProxy.json();
            } else {
                throw new Error("Gagal mengambil data gempadirasakan via Proxy");
            }
        }

        // 2. Coba ambil data gempa terkini M5+
        try {
            const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
            if (response.ok) {
                dataTerkini = await response.json();
            } else {
                throw new Error("Direct fetch gempaterkini gagal");
            }
        } catch (e) {
            console.log("Direct fetch gempaterkini diblokir CORS. Mencoba via Proxy...");
            try {
                const responseProxy = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json'));
                if (responseProxy.ok) {
                    dataTerkini = await responseProxy.json();
                }
            } catch (proxyErr) {
                console.warn("Proxy gagal memuat data gempaterkini", proxyErr);
            }
        }

        // Gabungkan data
        const gabunganGempa = [
            ...(dataDirasakan.Infogempa?.gempa || []),
            ...(dataTerkini.Infogempa?.gempa || [])
        ];

        // Hapus duplikasi berdasarkan DateTime/Waktu
        const uniqueGempa = [];
        const seenDates = new Set();
        gabunganGempa.forEach(g => {
            if (g && !seenDates.has(g.DateTime || g.Tanggal + g.Jam)) {
                seenDates.add(g.DateTime || g.Tanggal + g.Jam);
                uniqueGempa.push(g);
            }
        });

        // Filter otomatis khusus wilayah Lampung dan Selat Sunda
        const filteredQuakes = uniqueGempa.filter(gempa => {
            const wilayahStr = (gempa.Wilayah || "").toLowerCase();
            return filterKeywords.some(keyword => wilayahStr.includes(keyword.toLowerCase()));
        });

        if (filteredQuakes.length === 0) {
            // Jika tidak ada gempa terbaru di area ini dari feed 20 terakhir, masukkan mock data sebagai pelengkap agar peta tidak kosong
            console.log("Tidak ada gempa Lampung saat ini di feed BMKG, memuat mock data historis.");
            allQuakesData = mockGempaBMKG;
            statusEl.innerHTML = '<span class="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>BMKG Terhubung (Mode Hibrid)';
        } else {
            allQuakesData = filteredQuakes;
            statusEl.innerHTML = '<span class="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>BMKG Terkoneksi Real-time';
        }

    } catch (error) {
        console.warn("API BMKG diblokir CORS / offline. Mengaktifkan Mode Simulasi Data Lokal.", error);
        allQuakesData = mockGempaBMKG;
        statusEl.innerHTML = '<span class="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></span>Mode Simulasi (CORS Restricted)';
        showNotification("CORS / Jaringan Terhambat. Mengaktifkan data simulasi gempa Lampung.", "warning");
    }

    // Render data gempa ke sidebar dan peta
    renderEarthquakes();
}

// --- RENDER MARKER GEMPA DAN SIDEBAR ---
function renderEarthquakes() {
    liveQuakeLayerGroup.clearLayers();
    const listContainer = document.getElementById('quake-list');
    listContainer.innerHTML = '';

    const tickerContent = document.getElementById('ticker-content');
    tickerContent.innerHTML = '';

    if (allQuakesData.length === 0) {
        listContainer.innerHTML = '<p class="text-slate-400 text-sm p-4 text-center">Tidak ada data gempa terdeteksi di Lampung.</p>';
        return;
    }

    // Urutkan data berdasarkan waktu terbaru
    allQuakesData.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));

    // Isi Ticker Berjalan dengan gempa terkuat/terbaru
    const latestQ = allQuakesData[0];
    tickerContent.innerHTML = `<span class="text-red-400 font-bold">GEMPA TERAKHIR:</span> M ${latestQ.Magnitude} - ${latestQ.Wilayah} (${latestQ.Tanggal} - ${latestQ.Jam}) - Kedalaman: ${latestQ.Kedalaman}. ${latestQ.Potensi || ''}`;

    allQuakesData.forEach((gempa, index) => {
        // Parsing koordinat "Lat,Lng" atau dari properti Lintang/Bujur
        let lat, lng;
        if (gempa.Coordinates) {
            const parts = gempa.Coordinates.split(',');
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
        } else if (gempa.Lintang && gempa.Bujur) {
            // Ubah Lintang Selatan/Bujur Timur ke desimal
            lat = parseFloat(gempa.Lintang.replace('LS', '').trim());
            if (gempa.Lintang.includes('LS')) lat = -lat;
            lng = parseFloat(gempa.Bujur.replace('BT', '').trim());
        }

        if (isNaN(lat) || isNaN(lng)) return;

        const mag = parseFloat(gempa.Magnitude);
        const kedalaman = gempa.Kedalaman;
        
        // Tentukan warna marker gempa berdasarkan Magnitudo
        let markerColor = '#eab308'; // Kuning (Kecil, < 4.0)
        let alertBg = 'bg-yellow-950/40 border-yellow-800 text-yellow-400';
        if (mag >= 5.0) {
            markerColor = '#ef4444'; // Merah (Kuat)
            alertBg = 'bg-red-950/40 border-red-800 text-red-400';
        } else if (mag >= 4.0) {
            markerColor = '#f59e0b'; // Jingga (Sedang)
            alertBg = 'bg-amber-950/40 border-amber-800 text-amber-400';
        }

        // Custom Marker Gempa dengan Animasi Pulse Kustom
        const pulseClass = mag >= 5.0 ? 'pulse-marker-red' : 'pulse-marker-cyan'; // Cyan pulse untuk kecil, merah untuk besar
        const customMarkerIcon = L.divIcon({
            className: pulseClass,
            html: `<div style="background-color: ${markerColor}; width: 100%; height: 100%; border-radius: 50%; border: 1px solid white;"></div>`,
            iconSize: [mag * 3.5, mag * 3.5], // Ukuran berdasarkan magnitudo
            iconAnchor: [(mag * 3.5)/2, (mag * 3.5)/2]
        });

        // Popup Peta
        const popupContent = `
            <div class="p-1">
                <span class="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold ${alertBg} rounded-full border">MAGNITUDO M ${mag}</span>
                <h3 class="font-bold text-sm text-slate-100">${gempa.Wilayah}</h3>
                <div class="text-xs text-slate-300 mt-2 space-y-1">
                    <p>🕒 <strong>Waktu:</strong> ${gempa.Tanggal} - ${gempa.Jam}</p>
                    <p>🌊 <strong>Kedalaman:</strong> ${kedalaman}</p>
                    <p>🚨 <strong>Intensitas (MMI):</strong> ${gempa.Dirasakan || 'Tidak dirasakan'}</p>
                    <p>📢 <strong>Status:</strong> ${gempa.Potensi || 'Tidak berpotensi tsunami'}</p>
                </div>
            </div>
        `;

        const marker = L.marker([lat, lng], { icon: customMarkerIcon })
            .bindPopup(popupContent)
            .addTo(liveQuakeLayerGroup);

        // Sidebar Card
        const card = document.createElement('div');
        card.className = `glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800 cursor-pointer flex flex-col gap-2 relative overflow-hidden transition-all duration-300 ${index === 0 ? 'border-l-4 border-l-red-500' : ''}`;
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="px-2.5 py-0.5 rounded text-xs font-bold ${alertBg} border">M ${mag}</span>
                <span class="text-[10px] text-slate-400">${gempa.Jam}</span>
            </div>
            <h4 class="font-semibold text-sm text-slate-200 line-clamp-2">${gempa.Wilayah}</h4>
            <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 mt-1">
                <div>Kedalaman: <span class="text-slate-300">${kedalaman}</span></div>
                <div>Potensi: <span class="text-slate-300 font-medium">${gempa.Potensi ? gempa.Potensi.split(' ')[0] : 'Aman'}</span></div>
            </div>
            <div class="text-[10px] text-slate-500 mt-1">Dirasakan: ${gempa.Dirasakan || 'Hanya sensor'}</div>
        `;

        // Klik kartu sidebar fokus ke peta (flyTo)
        card.addEventListener('click', () => {
            map.flyTo([lat, lng], 11, { animate: true, duration: 1.5 });
            marker.openPopup();
        });

        listContainer.appendChild(card);
    });
}

// --- FETCH & RENDER HEATMAP HISTORI USGS ---
async function loadUSGSHeatmap() {
    const statusEl = document.getElementById('api-status-usgs');
    statusEl.innerHTML = '<span class="animate-pulse inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2"></span>Menghubungkan USGS...';

    // Query USGS untuk gempa Lampung-Selat Sunda semenjak 2020
    const usgsUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2020-01-01&minlatitude=-7.0&maxlatitude=-3.5&minlongitude=103.5&maxlongitude=106.0';

    try {
        const response = await fetch(usgsUrl);
        if (!response.ok) throw new Error("Gagal mengambil data USGS");
        const geojson = await response.json();

        const heatPoints = [];
        geojson.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const mag = feature.properties.mag;
            const lat = coords[1];
            const lng = coords[0];
            
            // Intensitas panas berdasarkan kekuatan magnitudo
            const intensity = (mag - 2.0) / 4.0; // Normalisasi ke rentang 0-1
            if (intensity > 0) {
                heatPoints.push([lat, lng, intensity]);
            }
        });

        // Hapus layer heatmap lama jika ada
        if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
        }

        // Inisialisasi Heatmap
        heatmapLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(map);

        statusEl.innerHTML = '<span class="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>USGS Heatmap Aktif';

    } catch (error) {
        console.error("Gagal memuat Heatmap dari USGS:", error);
        statusEl.innerHTML = '<span class="inline-block w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>Gagal memuat USGS';
        
        // Buat data heatmap simulasi jika gagal (agar peta tetap terisi heatmap kerawanan)
        const mockHeatPoints = [
            [-5.5, 104.6, 0.9], [-5.8, 105.4, 0.85], [-5.1, 104.0, 0.8], 
            [-6.1, 105.4, 0.95], [-5.7, 105.6, 0.75], [-5.4, 104.8, 0.8],
            [-5.9, 105.1, 0.65], [-5.3, 105.3, 0.5], [-5.6, 105.0, 0.7]
        ];
        heatmapLayer = L.heatLayer(mockHeatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(map);
    }
}

// --- PERHITUNGAN JALUR EVAKUASI TERDEKAT (HAVERSINE & SHIELD LINE) ---
function hitungJalurEvakuasiDariPoin(coastalIndex) {
    const startPoint = pesisirRawan[coastalIndex];
    const startCoords = startPoint.koordinat;

    let closestShelter = null;
    let minDistance = Infinity;

    // Cari shelter dengan jarak terdekat menggunakan rumus Haversine
    shelterEvakuasi.forEach(shelter => {
        const dist = haversineDistance(startCoords, shelter.koordinat);
        if (dist < minDistance) {
            minDistance = dist;
            closestShelter = shelter;
        }
    });

    if (!closestShelter) return;

    // Bersihkan jalur evakuasi lama
    evacuationLayerGroup.clearLayers();

    // Gambar garis evakuasi hijau menyala
    const evacLine = L.polyline([startCoords, closestShelter.koordinat], {
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
        dashArray: '10, 10',
        lineCap: 'round'
    }).addTo(evacuationLayerGroup);

    // Zoom agar pas dengan rute
    const bounds = L.latLngBounds([startCoords, closestShelter.koordinat]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Tambah popup info di tengah garis
    const midpoint = [
        (startCoords[0] + closestShelter.koordinat[0]) / 2,
        (startCoords[1] + closestShelter.koordinat[1]) / 2
    ];

    const popupContent = `
        <div class="p-1 text-center">
            <span class="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800">RUTE EVAKUASI REKOMENDASI</span>
            <p class="text-xs text-slate-200 mt-1"><strong>Jarak Aman Terdekat:</strong> ${minDistance.toFixed(2)} km</p>
            <p class="text-[10px] text-slate-400">Ke: ${closestShelter.nama}</p>
        </div>
    `;

    L.popup()
        .setLatLng(midpoint)
        .setContent(popupContent)
        .openOn(map);

    // Update Detail Evakuasi di Sidebar
    const detailPanel = document.getElementById('evac-details');
    detailPanel.innerHTML = `
        <div class="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 space-y-3">
            <h4 class="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <span class="animate-ping inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                Analisis Jalur Sukses
            </h4>
            <div class="space-y-2 text-xs">
                <p class="text-slate-300"><strong>Titik Bahaya:</strong> <span class="text-slate-100">${startPoint.nama}</span></p>
                <p class="text-slate-300"><strong>Shelter Terdekat:</strong> <span class="text-slate-100">${closestShelter.nama}</span></p>
                <p class="text-slate-300"><strong>Ketinggian Lokasi:</strong> <span class="text-slate-100 font-semibold text-emerald-400">${closestShelter.elevasi}</span></p>
                <p class="text-slate-300"><strong>Jarak Garis Lurus:</strong> <span class="text-slate-100 font-bold">${minDistance.toFixed(2)} km</span></p>
                <p class="text-slate-300"><strong>Kapasitas Tersedia:</strong> <span class="text-slate-100">${closestShelter.kapasitas}</span></p>
            </div>
            <div class="border-t border-emerald-900/60 pt-2 text-[10px] text-slate-400 space-y-1.5">
                <p class="text-emerald-400 font-medium">💡 ARAHAN BPBD:</p>
                <p>1. Segera tinggalkan wilayah pantai saat sirine tsunami berbunyi/setelah gempa besar.</p>
                <p>2. Lari menuju shelter aman di kaki gunung via jalan utama, hindari jembatan sungai besar.</p>
                <p>3. Prioritaskan lansia, anak-anak, dan ibu hamil.</p>
            </div>
        </div>
    `;

    // Pastikan tab evakuasi yang aktif di sidebar
    document.getElementById('tab-evacuation').click();
    document.getElementById('evac-start').value = coastalIndex;
}

// Rumus Haversine untuk jarak koordinat bola dunia (km)
function haversineDistance(coords1, coords2) {
    const R = 6371; // Radius bumi dalam km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLng = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- FITUR AKSES ALAT BERAT & LOGISTIK (ROUTING DISASTER) ---
function hitungRuteAlatBerat() {
    const startVal = document.getElementById('route-start').value;
    const endVal = document.getElementById('route-end').value;

    if (!startVal || !endVal) {
        showNotification("Silakan tentukan Posko Asal dan Lokasi Bencana terlebih dahulu.", "info");
        return;
    }

    const startCoords = startVal.split(',').map(Number);
    const endCoords = endVal.split(',').map(Number);

    const detailPanel = document.getElementById('routing-details');
    detailPanel.innerHTML = `
        <div class="flex items-center justify-center p-6">
            <span class="animate-spin inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3"></span>
            <span class="text-sm text-slate-300">Menghitung rute logistik tercepat...</span>
        </div>
    `;

    // Hapus rute lama jika ada
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    if (currentRoutePolyline) {
        map.removeLayer(currentRoutePolyline);
        currentRoutePolyline = null;
    }

    // Buat ikon kustom untuk rute
    const startIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [20, 32],
        iconAnchor: [10, 32],
        shadowSize: [32, 32]
    });

    const endIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [20, 32],
        iconAnchor: [10, 32],
        shadowSize: [32, 32]
    });

    // Inisialisasi Leaflet Routing Machine
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(endCoords[0], endCoords[1])
        ],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'car' // OSRM default car profile
        }),
        lineOptions: {
            styles: [{ color: '#06b6d4', opacity: 0.85, weight: 6 }]
        },
        createMarker: function(i, waypoint, n) {
            const icon = i === 0 ? startIcon : endIcon;
            const title = i === 0 ? "Titik Asal Alat Berat" : "Titik Lokasi Bencana";
            return L.marker(waypoint.latLng, {
                draggable: false,
                icon: icon,
                title: title
            });
        },
        show: false, // Sembunyikan panel bawaan Leaflet Routing Machine yang mengganggu estetika
        fitSelectedRoutes: true
    }).addTo(map);

    // Event handler saat rute sukses dihitung
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const distance = summary.totalDistance / 1000; // km
        const time = summary.totalTime / 3600; // Jam

        // Dapatkan nama lokasi
        const startText = document.getElementById('route-start').options[document.getElementById('route-start').selectedIndex].text;
        const endText = document.getElementById('route-end').options[document.getElementById('route-end').selectedIndex].text;

        detailPanel.innerHTML = `
            <div class="bg-cyan-950/30 border border-cyan-800 rounded-xl p-4 space-y-3">
                <h4 class="font-bold text-sm text-cyan-400 flex items-center gap-2">
                    🚚 Rute Logistik Sukses
                </h4>
                <div class="space-y-1.5 text-xs">
                    <p class="text-slate-300"><strong>Asal Depot:</strong> <span class="text-slate-100">${startText.split('(')[0]}</span></p>
                    <p class="text-slate-300"><strong>Tujuan:</strong> <span class="text-slate-100">${endText.split('(')[0]}</span></p>
                    <div class="grid grid-cols-2 gap-2 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-cyan-900/40">
                        <div>
                            <span class="text-[10px] text-slate-400 block uppercase">Jarak Tempuh</span>
                            <span class="text-sm font-bold text-cyan-400">${distance.toFixed(1)} km</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-400 block uppercase">Waktu Tempuh</span>
                            <span class="text-sm font-bold text-cyan-400">${formatWaktu(time)}</span>
                        </div>
                    </div>
                </div>
                <div class="border-t border-cyan-900/60 pt-2 text-[10px] text-slate-400 space-y-1">
                    <p class="text-cyan-400 font-medium">⚠️ REKOMENDASI ALAT BERAT:</p>
                    <p>• Prioritaskan <strong>Jalan Lintas Sumatera (Jalinsum)</strong> dan <strong>Jalan Tol Trans Sumatera</strong>.</p>
                    <p>• Hindari rute pedesaan via pegunungan curam/jalan sempit jika membawa tronton.</p>
                    <p>• Koordinasikan dengan patroli BPBD & Kepolisian untuk pengawalan ekskavator.</p>
                </div>
            </div>
        `;
    });

    // Menangani error jika server OSRM mati / memblokir
    routingControl.on('routingerror', function(e) {
        console.warn("Kesalahan server routing OSRM. Mengaktifkan visualisasi simulasi udara.", e);
        drawFallbackRouting(startCoords, endCoords, detailPanel);
    });
}

// Fallback jika OSRM down/lambat
function drawFallbackRouting(startCoords, endCoords, detailPanel) {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    // Gambar jalur lurus putus-putus sebagai representasi
    currentRoutePolyline = L.polyline([startCoords, endCoords], {
        color: '#06b6d4',
        weight: 5,
        opacity: 0.8,
        dashArray: '5, 15',
        lineCap: 'round'
    }).addTo(map);

    const bounds = L.latLngBounds([startCoords, endCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });

    const dist = haversineDistance(startCoords, endCoords);
    // Estimasi waktu berdasarkan kecepatan logistik rata-rata alat berat 50 km/jam
    const estTime = dist / 50; 

    const startText = document.getElementById('route-start').options[document.getElementById('route-start').selectedIndex].text;
    const endText = document.getElementById('route-end').options[document.getElementById('route-end').selectedIndex].text;

    detailPanel.innerHTML = `
        <div class="bg-amber-950/20 border border-amber-800 rounded-xl p-4 space-y-3">
            <h4 class="font-bold text-sm text-amber-400 flex items-center gap-2">
                ⚠️ Mode Rute Simulasi (OSRM Sibuk)
            </h4>
            <p class="text-xs text-slate-400">Server routing umum saat ini tidak merespons, menampilkan rute garis udara direct arteri utama.</p>
            <div class="space-y-1.5 text-xs border-t border-slate-800/80 pt-2">
                <p class="text-slate-300"><strong>Asal Depot:</strong> <span class="text-slate-100">${startText.split('(')[0]}</span></p>
                <p class="text-slate-300"><strong>Tujuan:</strong> <span class="text-slate-100">${endText.split('(')[0]}</span></p>
                <div class="grid grid-cols-2 gap-2 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-amber-900/40">
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Jarak Est. Jalan</span>
                        <span class="text-sm font-bold text-amber-400">${(dist * 1.25).toFixed(1)} km</span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Waktu Est. Alat</span>
                        <span class="text-sm font-bold text-amber-400">${formatWaktu(estTime * 1.25)}</span>
                    </div>
                </div>
            </div>
            <div class="text-[10px] text-slate-500">Jarak lurus radial: ${dist.toFixed(1)} km (Faktor deviasi jalan darat: +25%).</div>
        </div>
    `;
}

// Bersihkan pencarian rute logistik
function resetRuteAlatBerat() {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    if (currentRoutePolyline) {
        map.removeLayer(currentRoutePolyline);
        currentRoutePolyline = null;
    }
    document.getElementById('route-start').selectedIndex = 0;
    document.getElementById('route-end').selectedIndex = 0;
    document.getElementById('routing-details').innerHTML = `
        <div class="text-center p-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Tentukan Posko dan Klik 'Hitung Rute Logistik' untuk memulai analisis.
        </div>
    `;
    map.flyTo(LAMPUNG_CENTER, MAP_ZOOM_DEFAULT, { animate: true, duration: 1 });
}

// --- HELPER UTILITY ---
function formatWaktu(desimalJam) {
    const jam = Math.floor(desimalJam);
    const menit = Math.round((desimalJam - jam) * 60);
    if (jam === 0) return `${menit} Menit`;
    return `${jam} Jam ${menit} Menit`;
}

function showNotification(msg, type = "info") {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-4 z-[9999] px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border transition-all duration-300 transform translate-y-10 opacity-0`;
    
    let colors = 'bg-slate-900 text-slate-200 border-slate-700';
    if (type === "warning") colors = 'bg-red-950 text-red-300 border-red-800';
    if (type === "success") colors = 'bg-emerald-950 text-emerald-300 border-emerald-800';
    
    toast.className += ' ' + colors;
    toast.innerText = msg;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- REGISTRASI EVENT DAN SWITCHER UI ---
function registerUIEvents() {
    // 1. Sidebar Tab Switcher
    const tabs = document.querySelectorAll('[data-tab-target]');
    const contents = document.querySelectorAll('.tab-content-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = document.querySelector(tab.dataset.tabTarget);

            // Deactivate all tabs & contents
            tabs.forEach(t => {
                t.classList.remove('border-cyan-500', 'text-cyan-400');
                t.classList.add('border-transparent', 'text-slate-400');
            });
            contents.forEach(c => c.classList.add('hidden'));

            // Activate current tab
            tab.classList.add('border-cyan-500', 'text-cyan-400');
            tab.classList.remove('border-transparent', 'text-slate-400');
            target.classList.remove('hidden');
        });
    });

    // 2. Layer Map Toggles (Checkbox di Header/Map Controls)
    document.getElementById('layer-quakes').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(liveQuakeLayerGroup);
        } else {
            map.removeLayer(liveQuakeLayerGroup);
        }
    });

    document.getElementById('layer-heatmap').addEventListener('change', function(e) {
        if (e.target.checked) {
            if (heatmapLayer) map.addLayer(heatmapLayer);
        } else {
            if (heatmapLayer) map.removeLayer(heatmapLayer);
        }
    });

    document.getElementById('layer-shelter').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(shelterLayerGroup);
        } else {
            map.removeLayer(shelterLayerGroup);
        }
    });

    // 3. Tombol Eksekusi
    document.getElementById('btn-calculate-route').addEventListener('click', hitungRuteAlatBerat);
    document.getElementById('btn-reset-route').addEventListener('click', resetRuteAlatBerat);

    document.getElementById('btn-calculate-evac').addEventListener('click', () => {
        const val = document.getElementById('evac-start').value;
        if (val === "") {
            showNotification("Silakan tentukan pantai pesisir awal evakuasi.", "info");
            return;
        }
        hitungJalurEvakuasiDariPoin(parseInt(val));
    });

    document.getElementById('btn-reset-evac').addEventListener('click', () => {
        evacuationLayerGroup.clearLayers();
        document.getElementById('evac-start').selectedIndex = 0;
        document.getElementById('evac-details').innerHTML = `
            <div class="text-center p-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Pilih zona pesisir rawan dan Klik 'Cari Jalur Evakuasi' untuk melihat rute aman terdekat.
            </div>
        `;
        map.flyTo(LAMPUNG_CENTER, MAP_ZOOM_DEFAULT, { animate: true, duration: 1 });
    });

    // Refreshes data BMKG
    document.getElementById('btn-refresh-bmkg').addEventListener('click', () => {
        loadEarthquakeData();
        showNotification("Memperbarui feed gempa BMKG...", "success");
    });
}

// Panggil inisialisasi peta ketika window termuat
window.onload = initMap;
