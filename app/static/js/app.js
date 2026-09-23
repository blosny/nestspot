/**
 * NestSpot - Main Client Logic with Booking, Security Gate, and Live ETA Departure System
 */

let allSpots = [];
let activeBookings = [];
let activeAlerts = [];
let currentBlock = "ALL";
let currentFilter = "ALL";
let currentSearch = "";
let etaTimerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    initEventListeners();
    fetchComplexStats();
    fetchSpots();
    fetchActiveBookings();
    fetchActiveAlerts();

    // Periodic live sync for ETA alerts & bookings every 4 seconds
    setInterval(() => {
        fetchActiveAlerts();
        fetchActiveBookings();
    }, 4000);
});

function initEventListeners() {
    // Block Switcher
    const segmentBtns = document.querySelectorAll(".segment-btn");
    segmentBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            segmentBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentBlock = btn.dataset.block;
            renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
        });
    });

    // Filter Buttons
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
        });
    });

    // Search Box
    const searchInput = document.getElementById("spotSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value;
            renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
        });
    }

    // Modal Closes
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalBackdrop = document.getElementById("spotModalBackdrop");
    if (closeModalBtn && modalBackdrop) {
        closeModalBtn.addEventListener("click", () => modalBackdrop.classList.remove("active"));
        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) modalBackdrop.classList.remove("active");
        });
    }

    // ETA Modal Listeners
    const headedHomeBtn = document.getElementById("headedHomeBtn");
    const etaModalBackdrop = document.getElementById("etaModalBackdrop");
    const closeEtaModalBtn = document.getElementById("closeEtaModalBtn");
    if (headedHomeBtn && etaModalBackdrop) {
        headedHomeBtn.addEventListener("click", () => {
            etaModalBackdrop.classList.add("active");
        });
        if (closeEtaModalBtn) {
            closeEtaModalBtn.addEventListener("click", () => etaModalBackdrop.classList.remove("active"));
        }
        etaModalBackdrop.addEventListener("click", (e) => {
            if (e.target === etaModalBackdrop) etaModalBackdrop.classList.remove("active");
        });
    }

    // Security Gate Modal
    const securityGateBtn = document.getElementById("securityGateBtn");
    const securityModalBackdrop = document.getElementById("securityModalBackdrop");
    const closeSecurityModalBtn = document.getElementById("closeSecurityModalBtn");
    const verifyPlateBtn = document.getElementById("verifyPlateBtn");
    const gatePlateInput = document.getElementById("gatePlateInput");

    if (securityGateBtn && securityModalBackdrop) {
        securityGateBtn.addEventListener("click", () => {
            securityModalBackdrop.classList.add("active");
            document.getElementById("securityVerificationResult").innerHTML = "";
            if (gatePlateInput) gatePlateInput.focus();
        });
        if (closeSecurityModalBtn) {
            closeSecurityModalBtn.addEventListener("click", () => securityModalBackdrop.classList.remove("active"));
        }
        securityModalBackdrop.addEventListener("click", (e) => {
            if (e.target === securityModalBackdrop) securityModalBackdrop.classList.remove("active");
        });
    }

    if (verifyPlateBtn && gatePlateInput) {
        verifyPlateBtn.addEventListener("click", () => handleSecurityPlateLookup(gatePlateInput.value));
        gatePlateInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSecurityPlateLookup(gatePlateInput.value);
        });
    }

    // Active Passes Modal
    const activePassesBtn = document.getElementById("activePassesBtn");
    const activePermitsModalBackdrop = document.getElementById("activePermitsModalBackdrop");
    const closeActivePermitsModalBtn = document.getElementById("closeActivePermitsModalBtn");

    if (activePassesBtn && activePermitsModalBackdrop) {
        activePassesBtn.addEventListener("click", () => {
            renderActivePermitsModal();
            activePermitsModalBackdrop.classList.add("active");
        });
        if (closeActivePermitsModalBtn) {
            closeActivePermitsModalBtn.addEventListener("click", () => activePermitsModalBackdrop.classList.remove("active"));
        }
        activePermitsModalBackdrop.addEventListener("click", (e) => {
            if (e.target === activePermitsModalBackdrop) activePermitsModalBackdrop.classList.remove("active");
        });
    }

    // Alternatives Modal
    const closeAlternativesModalBtn = document.getElementById("closeAlternativesModalBtn");
    const alternativesModalBackdrop = document.getElementById("alternativesModalBackdrop");
    if (closeAlternativesModalBtn && alternativesModalBackdrop) {
        closeAlternativesModalBtn.addEventListener("click", () => alternativesModalBackdrop.classList.remove("active"));
        alternativesModalBackdrop.addEventListener("click", (e) => {
            if (e.target === alternativesModalBackdrop) alternativesModalBackdrop.classList.remove("active");
        });
    }
}

async function fetchComplexStats() {
    try {
        const res = await fetch("/api/spots/summary/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const stats = await res.json();
        
        const summaryBadge = document.getElementById("spotsAvailableSummary");
        if (summaryBadge) {
            summaryBadge.textContent = `${stats.available_now} ${t("ofTotal")} ${stats.total_spots} ${t("spotsFreeSuffix")}`;
        }

        const countAvail = document.getElementById("countAvailable");
        if (countAvail) countAvail.textContent = stats.available_now;

        const countEv = document.getElementById("countEv");
        if (countEv) countEv.textContent = stats.ev_spots_count;

        const countVac = document.getElementById("countVacation");
        if (countVac) countVac.textContent = stats.vacation_spots_count;
    } catch (err) {
        console.error("Error fetching stats:", err);
    }
}

async function fetchSpots() {
    try {
        const res = await fetch("/api/spots");
        if (!res.ok) throw new Error("Failed to fetch spots");
        allSpots = await res.json();
        renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
    } catch (err) {
        console.error("Error fetching spots:", err);
    }
}

async function fetchActiveBookings() {
    try {
        const res = await fetch("/api/bookings?status=active");
        if (!res.ok) throw new Error("Failed to fetch bookings");
        activeBookings = await res.json();
    } catch (err) {
        console.error("Error fetching active bookings:", err);
    }
}

async function fetchActiveAlerts() {
    try {
        const res = await fetch("/api/eta/active");
        if (!res.ok) throw new Error("Failed to fetch active ETA alerts");
        activeAlerts = await res.json();
        renderEtaAlertBanner();
    } catch (err) {
        console.error("Error fetching ETA alerts:", err);
    }
}

function renderEtaAlertBanner() {
    const bannerContainer = document.getElementById("liveEtaAlertContainer");
    if (!bannerContainer) return;

    if (activeAlerts.length === 0) {
        bannerContainer.innerHTML = "";
        if (etaTimerInterval) clearInterval(etaTimerInterval);
        return;
    }

    const alert = activeAlerts[0]; // Active departure alert
    const targetInfo = alert.target_vehicle_plate ? `(Plaka: ${alert.target_vehicle_plate})` : "";

    bannerContainer.innerHTML = `
        <div class="eta-live-alert-banner">
            <div class="eta-alert-left">
                <div class="eta-alert-icon">
                    <i data-lucide="bell-ring"></i>
                </div>
                <div>
                    <div class="eta-alert-title">${t("etaActiveAlertTitle")} · Spot ${alert.spot_number}</div>
                    <div class="eta-alert-desc">
                        ${alert.host_name} (Daire ${alert.host_flat_number}) yola çıktı! Lütfen park yerini boşaltın. ${targetInfo}
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <div style="text-align: right;">
                    <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 600;">${t("etaBufferCountdown")}</div>
                    <div class="eta-countdown-badge" id="etaCountdownTimer">--:--</div>
                </div>

                ${alert.alternative_suggestions && alert.alternative_suggestions.length > 0 ? `
                    <button class="filter-btn" style="background: #3b82f6; border: none; color: #fff; font-weight: 600;" onclick="window.showAlternativeSpotsModal('${alert.id}')">
                        ${t("viewAlternativesBtn")}
                    </button>
                ` : ''}

                <button class="filter-btn active" style="background: #10b981; border: none; color: #fff; font-weight: 600;" onclick="window.handleAcknowledgeAndRelease('${alert.id}', '${alert.spot_id}')">
                    ${t("releaseSpotNowBtn")}
                </button>
            </div>
        </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons();
    }

    startCountdownTimer(new Date(alert.expected_arrival));
}

function startCountdownTimer(targetTime) {
    if (etaTimerInterval) clearInterval(etaTimerInterval);

    function update() {
        const timerEl = document.getElementById("etaCountdownTimer");
        if (!timerEl) return;

        const now = new Date().getTime();
        const distance = targetTime.getTime() - now;

        if (distance <= 0) {
            timerEl.textContent = "00:00 (Varıldı)";
            timerEl.style.color = "#f43f5e";
            clearInterval(etaTimerInterval);
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    update();
    etaTimerInterval = setInterval(update, 1000);
}

window.submitEtaBroadcast = async function(e) {
    e.preventDefault();
    const minutes = parseInt(document.getElementById("etaMinutesInput").value, 10);

    try {
        const res = await fetch("/api/eta/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                spot_id: "spot-a-01", // Ahmet Yılmaz's assigned spot
                minutes_remaining: minutes,
                host_name: "Ahmet Yılmaz",
                note: "İşten çıktım, eve doğru geliyorum."
            })
        });

        if (!res.ok) throw new Error("ETA bildirimi başlatılamadı.");

        document.getElementById("etaModalBackdrop").classList.remove("active");
        await fetchActiveAlerts();
    } catch (err) {
        alert(err.message);
    }
};

window.handleAcknowledgeAndRelease = async function(alertId, spotId) {
    try {
        // Resolve ETA alert
        await fetch(`/api/eta/${alertId}/resolve`, { method: "POST" });
        
        // Find if there is an active booking on this spot and complete it
        const booking = activeBookings.find(b => b.spot_id === spotId);
        if (booking) {
            await fetch(`/api/bookings/${booking.id}/complete`, { method: "POST" });
        }

        await fetchSpots();
        await fetchComplexStats();
        await fetchActiveBookings();
        await fetchActiveAlerts();
    } catch (err) {
        alert(err.message);
    }
};

window.showAlternativeSpotsModal = function(alertId) {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert || !alert.alternative_suggestions) return;

    const listEl = document.getElementById("alternativesList");
    const modalBackdrop = document.getElementById("alternativesModalBackdrop");

    listEl.innerHTML = alert.alternative_suggestions.map(s => `
        <div style="background:#0b0f17; border:1px solid #232f48; border-radius:8px; padding:0.85rem; margin-bottom:0.6rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:700; color:#fff; font-size:0.9rem;">
                    Spot ${s.spot_number} (${s.block} Blok · Daire ${s.flat_number})
                </div>
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.2rem;">
                    Sakin: <strong style="color:#e2e8f0;">${s.owner_name}</strong> ${s.has_ev_charger ? '· ⚡ EV Wallbox Var' : ''}
                </div>
            </div>
            <button class="filter-btn active" style="background:#10b981; border:none; color:#fff; font-size:0.75rem; font-weight:600;" onclick="window.swapToAlternativeSpot('${s.spot_id}', '${alert.id}')">
                Bu Yere Geç ➔
            </button>
        </div>
    `).join("");

    modalBackdrop.classList.add("active");
};

window.swapToAlternativeSpot = async function(newSpotId, alertId) {
    try {
        // Create new booking on the new spot
        await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                spot_id: newSpotId,
                booking_type: "second_car",
                vehicle_plate: "34 DNZ 102",
                driver_name: "Deniz Polat (Yer Değiştirildi)",
                host_flat_number: 10,
                duration_hours: 4
            })
        });

        // Resolve previous alert
        await fetch(`/api/eta/${alertId}/resolve`, { method: "POST" });

        document.getElementById("alternativesModalBackdrop").classList.remove("active");
        await fetchSpots();
        await fetchComplexStats();
        await fetchActiveBookings();
        await fetchActiveAlerts();
    } catch (err) {
        alert(err.message);
    }
};

window.handleSpotClick = function(spotId) {
    const spot = allSpots.find(s => s.id === spotId);
    if (!spot) return;
    
    const modalContent = document.getElementById("modalContent");
    const modalBackdrop = document.getElementById("spotModalBackdrop");
    if (modalContent && modalBackdrop) {
        modalContent.innerHTML = renderCleanSpotModal(spot);
        modalBackdrop.classList.add("active");
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
};

window.showBookingForm = function(spotId, bookingType) {
    const spot = allSpots.find(s => s.id === spotId);
    if (!spot) return;

    const modalContent = document.getElementById("modalContent");
    if (modalContent) {
        modalContent.innerHTML = renderBookingFormHtml(spot, bookingType);
    }
};

window.submitBooking = async function(e, spotId, bookingType) {
    e.preventDefault();
    const plate = document.getElementById("formPlate").value;
    const driver = document.getElementById("formDriver").value;
    const duration = parseInt(document.getElementById("formDuration").value, 10);
    const notes = document.getElementById("formNotes").value;

    try {
        const payload = {
            spot_id: spotId,
            booking_type: bookingType,
            vehicle_plate: plate,
            driver_name: driver,
            host_flat_number: 1,
            duration_hours: duration,
            notes: notes || null
        };

        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Booking failed");
        }

        const booking = await res.json();
        const modalContent = document.getElementById("modalContent");
        if (modalContent) {
            modalContent.innerHTML = renderDigitalPassCardHtml(booking);
        }

        await fetchSpots();
        await fetchComplexStats();
        await fetchActiveBookings();
    } catch (err) {
        alert(err.message);
    }
};

window.handleReleaseActiveSpot = async function(spotId) {
    const activeBooking = activeBookings.find(b => b.spot_id === spotId);
    if (!activeBooking) {
        const res = await fetch("/api/bookings");
        const list = await res.json();
        const found = list.find(b => b.spot_id === spotId && b.status === "active");
        if (found) {
            await completeBookingRequest(found.id);
        } else {
            alert("No active session found.");
        }
        return;
    }
    await completeBookingRequest(activeBooking.id);
};

async function completeBookingRequest(bookingId) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to release spot");
        
        document.getElementById("spotModalBackdrop").classList.remove("active");
        await fetchSpots();
        await fetchComplexStats();
        await fetchActiveBookings();
    } catch (err) {
        alert(err.message);
    }
}

async function handleSecurityPlateLookup(plate) {
    const resultBox = document.getElementById("securityVerificationResult");
    if (!plate || !plate.trim()) {
        resultBox.innerHTML = `<div style="padding:0.75rem; background:rgba(244,63,94,0.15); border:1px solid #f43f5e; color:#fda4af; border-radius:6px; font-size:0.8rem;">Lütfen plaka girin.</div>`;
        return;
    }

    try {
        const res = await fetch(`/api/security/verify?plate=${encodeURIComponent(plate)}`);
        const data = await res.json();

        if (data.is_authorized) {
            resultBox.innerHTML = `
                <div style="padding:1rem; background:rgba(16,185,129,0.15); border:1px solid #10b981; border-radius:8px; margin-top:0.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:800; color:#34d399; font-size:0.9rem;">✓ ${t("authorized")}</span>
                        <span style="font-family:monospace; font-weight:700; color:#fff; background:#000; padding:0.2rem 0.5rem; border-radius:4px;">${data.vehicle_plate}</span>
                    </div>
                    <div style="font-size:0.85rem; color:#fff; font-weight:600; margin-top:0.5rem;">
                        📍 Park Yeri: Spot ${data.spot_number} (${data.block} Blok · Daire ${data.host_flat})
                    </div>
                    <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">
                        Sürücü: <strong style="color:#fff;">${data.driver_name}</strong> · İzin Kodu: <strong style="color:#60a5fa;">${data.permit_code}</strong>
                    </div>
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div style="padding:1rem; background:rgba(244,63,94,0.15); border:1px solid #f43f5e; border-radius:8px; margin-top:0.75rem;">
                    <div style="font-weight:800; color:#fb7185; font-size:0.9rem;">✕ ${t("unauthorized")}</div>
                    <div style="font-size:0.8rem; color:#fecdd3; margin-top:0.35rem;">${data.message}</div>
                </div>
            `;
        }
    } catch (err) {
        resultBox.innerHTML = `<div style="color:#fda4af; font-size:0.8rem;">Hata: ${err.message}</div>`;
    }
}

function renderActivePermitsModal() {
    const listContainer = document.getElementById("activePermitsList");
    if (!listContainer) return;

    if (activeBookings.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">${t("noActivePermits")}</div>`;
        return;
    }

    listContainer.innerHTML = activeBookings.map(b => `
        <div style="background:#0b0f17; border:1px solid #232f48; border-radius:8px; padding:0.85rem; margin-bottom:0.6rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-family:monospace; font-weight:700; color:#fff; background:#000; padding:0.15rem 0.4rem; border-radius:4px; font-size:0.8rem;">${b.vehicle_plate}</span>
                    <span style="font-weight:700; font-size:0.85rem; color:#10b981;">Spot ${b.spot_number} (${b.block} Blok)</span>
                </div>
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.3rem;">
                    ${b.driver_name} · Kod: <strong style="color:#60a5fa;">${b.permit_code}</strong>
                </div>
            </div>
            <button class="filter-btn" style="background:#f43f5e; border:none; color:#fff; font-size:0.75rem;" onclick="window.handleReleaseActiveSpot('${b.spot_id}')">
                ${t("releaseBtn")}
            </button>
        </div>
    `).join("");
}
