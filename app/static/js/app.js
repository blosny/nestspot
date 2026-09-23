/**
 * NestSpot - Main Client Logic with Booking & Security Gate Lookup
 */

let allSpots = [];
let activeBookings = [];
let currentBlock = "ALL";
let currentFilter = "ALL";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    initEventListeners();
    fetchComplexStats();
    fetchSpots();
    fetchActiveBookings();
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

        // Refresh spots & stats in background
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
        // Find by spot in current active
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
