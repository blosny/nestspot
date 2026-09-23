/**
 * NestSpot - Internationalization (i18n) Engine (TR / EN)
 */

const TRANSLATIONS = {
    en: {
        brandSubtitle: "Aura Park Residence",
        searchPlaceholder: "Search flat, owner or plate (e.g. A-01, Ahmet, 34)...",
        spotsFreeSuffix: "spots free",
        ofTotal: "of",
        userProfile: "Ahmet Y. (A-1)",
        allBlocks: "All Blocks",
        blockA: "Block A",
        blockB: "Block B",
        allSpots: "All",
        freeNow: "Free Now",
        evChargers: "EV Chargers",
        vacationFilter: "Vacation",
        legendAvailable: "Available",
        legendOwner: "Owner",
        legendNeighbor: "Neighbor",
        legendGuest: "Guest",
        flatsRange: "Flats 1 – 12",
        drivewayAisle: "DRIVEWAY & ENTRY AISLE",
        securityGateBtn: "Security Gate Lookup",
        myActiveBookings: "Active Passes",
        spotTitle: "Spot",
        residentOwner: "Resident Owner",
        statusLabel: "Status",
        awaySchedule: "Away Hours Schedule",
        noSchedule: "No fixed recurring schedule set.",
        parkSecondCarBtn: "Park Second Car",
        guestPassBtn: "Generate Guest Pass",
        closeBtn: "Close",
        cancelBtn: "Cancel",
        confirmBtn: "Confirm & Reserve",
        releaseBtn: "Release Spot",
        vehiclePlate: "Vehicle License Plate",
        driverName: "Driver / Guest Full Name",
        driverPhone: "Phone Number",
        durationHours: "Duration (Hours)",
        notesOptional: "Notes for Security / Host (Optional)",
        bookingSuccess: "Spot reserved successfully!",
        spotReleased: "Parking spot released.",
        guestPassTitle: "Digital Guest Permit",
        permitCode: "Permit Code",
        validUntil: "Valid Until",
        gateVerified: "AUTHORIZED BY RESIDENT",
        securitySearchTitle: "Security Gate Plate Verification",
        securitySearchPlaceholder: "Enter vehicle plate (e.g. 34 ABC 123)...",
        securityVerifyBtn: "Check Permit",
        authorized: "ACCESS GRANTED",
        unauthorized: "NO PERMIT FOUND",
        activePermitsTitle: "Active Bookings & Guest Permits",
        noActivePermits: "No active parking permits currently.",
        statusFree: "Free",
        statusOwner: "Owner Parked",
        statusNeighbor: "Neighbor Parked",
        statusGuest: "Guest Permit",
        statusVacation: "Vacation (Free)",
        noMatchingSpots: "No matching spots found.",
    },
    tr: {
        brandSubtitle: "Aura Park Evleri",
        searchPlaceholder: "Daire, sakin veya plaka ara (örn. A-01, Ahmet, 34)...",
        spotsFreeSuffix: "yer boş",
        ofTotal: "/",
        userProfile: "Ahmet Y. (A-1)",
        allBlocks: "Tüm Bloklar",
        blockA: "A Blok",
        blockB: "B Blok",
        allSpots: "Tümü",
        freeNow: "Şu An Boş",
        evChargers: "EV Şarj İstasyonları",
        vacationFilter: "Tatilde Olanlar",
        legendAvailable: "Boş",
        legendOwner: "Ev Sahibi",
        legendNeighbor: "Komşu (2. Araç)",
        legendGuest: "Misafir İzni",
        flatsRange: "Daireler 1 – 12",
        drivewayAisle: "GİRİŞ & ANA OTOPARK YOLU",
        securityGateBtn: "Güvenlik Plaka Sorgu",
        myActiveBookings: "Aktif İzinler",
        spotTitle: "Park Alanı",
        residentOwner: "Daire Sakini",
        statusLabel: "Durum",
        awaySchedule: "İş / Boşluk Saatleri",
        noSchedule: "Sabit bir takvim girilmemiş.",
        parkSecondCarBtn: "2. Aracımı Park Et",
        guestPassBtn: "Misafir İzin Kartı Oluştur",
        closeBtn: "Kapat",
        cancelBtn: "İptal",
        confirmBtn: "Onayla & Rezerve Et",
        releaseBtn: "Park Yerini Boşalt",
        vehiclePlate: "Araç Plakası",
        driverName: "Sürücü / Misafir Adı Soyadı",
        driverPhone: "İletişim Telefonu",
        durationHours: "Kullanım Süresi (Saat)",
        notesOptional: "Güvenlik / Ev Sahibi Notu (Opsiyonel)",
        bookingSuccess: "Park yeri başarıyla rezerve edildi!",
        spotReleased: "Park yeri boşaltıldı.",
        guestPassTitle: "Dijital Misafir Giriş Kartı",
        permitCode: "İzin Kodu",
        validUntil: "Geçerlilik Bitiş",
        gateVerified: "SİTE SAKİNİ ONAYLI",
        securitySearchTitle: "Site Güvenliği Plaka Doğrulama",
        securitySearchPlaceholder: "Araç plakasını girin (örn. 34 ABC 123)...",
        securityVerifyBtn: "İzni Sorgula",
        authorized: "GİRİŞ İZNİ ONAYLANDI",
        unauthorized: "KAYITLI İZİN BULUNAMADI",
        activePermitsTitle: "Aktif Rezervasyonlar ve Misafir Kartları",
        noActivePermits: "Şu anda aktif park izni bulunmuyor.",
        statusFree: "Boş",
        statusOwner: "Ev Sahibi Park Etti",
        statusNeighbor: "Komşu Park Etti",
        statusGuest: "Misafir İzni",
        statusVacation: "Tatilde (Boş)",
        noMatchingSpots: "Eşleşen park yeri bulunamadı.",
    }
};

let currentLang = localStorage.getItem("nestspot_lang") || "tr";

function setLanguage(lang) {
    if (lang !== "en" && lang !== "tr") return;
    currentLang = lang;
    localStorage.setItem("nestspot_lang", lang);
    applyTranslations();
}

function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || key;
}

function applyTranslations() {
    // Update language switch button states
    const trBtn = document.getElementById("langTrBtn");
    const enBtn = document.getElementById("langEnBtn");
    if (trBtn && enBtn) {
        if (currentLang === "tr") {
            trBtn.classList.add("active");
            enBtn.classList.remove("active");
        } else {
            enBtn.classList.add("active");
            trBtn.classList.remove("active");
        }
    }

    // Static page elements
    const elementsWithI18n = document.querySelectorAll("[data-i18n]");
    elementsWithI18n.forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (key && TRANSLATIONS[currentLang][key]) {
            el.textContent = TRANSLATIONS[currentLang][key];
        }
    });

    const inputsWithI18n = document.querySelectorAll("[data-i18n-placeholder]");
    inputsWithI18n.forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (key && TRANSLATIONS[currentLang][key]) {
            el.placeholder = TRANSLATIONS[currentLang][key];
        }
    });

    // Re-render UI components if data is loaded
    if (typeof fetchComplexStats === "function") fetchComplexStats();
    if (typeof fetchSpots === "function") fetchSpots();
}
