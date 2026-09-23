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
        iAmHeadedHomeBtn: "Headed Home (ETA)",
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
        etaModalTitle: "Resident Departure / Headed Home",
        etaModalDesc: "Notify the neighbor currently using your spot with your live ETA.",
        etaMinutesLabel: "Estimated Arrival Time",
        broadcastEtaBtn: "Broadcast Live Departure Alert",
        etaActiveAlertTitle: "🚨 SPOT OWNER IS RETURNING HOME",
        etaBufferCountdown: "Departure Buffer Remaining",
        viewAlternativesBtn: "View Alternative Spots",
        releaseSpotNowBtn: "Release Spot & Vacate",
        suggestedAlternativeTitle: "Nearby Free Alternative Spots",
        alertDismissed: "ETA alert acknowledged.",
        etaHeadedDesc: "left for home. Please vacate the spot.",
        plateLabel: "Plate",
        arrivedLabel: "Arrived",
        swapHereBtn: "Switch here",
        enterPlate: "Please enter a license plate.",
        errorPrefix: "Error",
        hours2: "2 Hours",
        hours4: "4 Hours",
        hours8: "8 Hours (Full Shift)",
        hours24: "24 Hours (Full Day)",
        guestNotePh: "Visitor or courier note…",
        secondCarNotePh: "Second car…",
        yourSpotLabel: "Your assigned spot",
        securitySearchHint: "Type the vehicle plate at the gate for an instant permit check.",
        alternativesHint: "You can move the vehicle to a nearby free neighbor spot right away.",
        etaMin15: "15 minutes (nearby)",
        etaMin20: "20 minutes (typical commute)",
        etaMin30: "30 minutes (traffic)",
        etaMin45: "45 minutes (longer trip)",
        parkAt: "Park at",
        hostedBy: "Hosted by Flat",
        permitCodeShort: "Permit",
        noActiveSession: "No active session found.",
        evWallbox: "EV Wallbox",
        residentShort: "Resident",
        blockFlat: "Block",
        flatShort: "Flat",
        nestspotPermit: "NESTSPOT PERMIT",
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
        iAmHeadedHomeBtn: "Eve Dönüyorum (ETA)",
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
        etaModalTitle: "İşten Çıkış / Eve Dönüş Bildirimi",
        etaModalDesc: "Park yerinizi kullanan komşunuza nazikçe yer açması için tahmini varış sürenizi iletin.",
        etaMinutesLabel: "Tahmini Varış Süresi",
        broadcastEtaBtn: "Canlı Bildirimi Başlat",
        etaActiveAlertTitle: "🚨 EV SAHİBİ DÖNÜŞ YOLUNDA",
        etaBufferCountdown: "Kalan Boşaltma Süresi",
        viewAlternativesBtn: "Alternatif Boş Yerleri Gör",
        releaseSpotNowBtn: "Yeri Boşalt & Çıkış Yap",
        suggestedAlternativeTitle: "Önerilen Alternatif Boş Yerler",
        alertDismissed: "Bildirim onaylandı.",
        etaHeadedDesc: "eve doğru yola çıktı. Lütfen park yerini boşaltın.",
        plateLabel: "Plaka",
        arrivedLabel: "Varıldı",
        swapHereBtn: "Bu yere geç",
        enterPlate: "Lütfen plaka girin.",
        errorPrefix: "Hata",
        hours2: "2 Saat",
        hours4: "4 Saat",
        hours8: "8 Saat (Tam Vardiya)",
        hours24: "24 Saat (Tam Gün)",
        guestNotePh: "Ziyaretçi veya kurye notu…",
        secondCarNotePh: "İkinci araç…",
        yourSpotLabel: "Sizin park yeriniz",
        securitySearchHint: "Girişteki araç plakasını yazarak anında izin kontrolü yapın.",
        alternativesHint: "Aracınızı hemen şu an müsait olan komşu yerlerine çekebilirsiniz.",
        etaMin15: "15 dakika (yakın mesafe)",
        etaMin20: "20 dakika (standart dönüş)",
        etaMin30: "30 dakika (trafik var)",
        etaMin45: "45 dakika (uzak mesafe)",
        parkAt: "Park yeri",
        hostedBy: "Ev sahibi daire",
        permitCodeShort: "İzin kodu",
        noActiveSession: "Aktif oturum bulunamadı.",
        evWallbox: "EV Wallbox",
        residentShort: "Sakin",
        blockFlat: "Blok",
        flatShort: "Daire",
        nestspotPermit: "NESTSPOT İZİN KARTI",
    }
};

let currentLang = localStorage.getItem("nestspot_lang") || "tr";

function setLanguage(lang) {
    if (lang !== "en" && lang !== "tr") return;
    currentLang = lang;
    localStorage.setItem("nestspot_lang", lang);
    document.documentElement.lang = lang;
    applyTranslations();
}

function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || key;
}

function applyTranslations() {
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

    if (typeof fetchComplexStats === "function") fetchComplexStats();
    if (typeof fetchSpots === "function") fetchSpots();
    if (typeof fetchActiveAlerts === "function") fetchActiveAlerts();
}
