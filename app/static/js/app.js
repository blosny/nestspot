/**
 * NestSpot – client orchestration: stats, bookings, gate, live ETA.
 */

const NestSpotState = {
    spots: [],
    bookings: [],
    alerts: [],
    block: "ALL",
    filter: "ALL",
    search: "",
    etaTimers: {},
};

document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = currentLang;
    applyTranslations();
    initEventListeners();
    refreshDashboard();
    setInterval(() => {
        fetchActiveAlerts();
        fetchActiveBookings();
    }, 4000);
});

function initEventListeners() {
    document.querySelectorAll(".segment-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            setActiveExclusive(document.querySelectorAll(".segment-btn"), btn);
            NestSpotState.block = btn.dataset.block;
            redrawGrid();
        });
    });

    document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
            setActiveExclusive(document.querySelectorAll(".filter-btn[data-filter]"), btn);
            NestSpotState.filter = btn.dataset.filter;
            redrawGrid();
        });
    });

    const searchInput = document.getElementById("spotSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            NestSpotState.search = e.target.value;
            redrawGrid();
        });
    }

    bindModalDismiss("spotModalBackdrop", "closeModalBtn");
    bindModalDismiss("etaModalBackdrop", "closeEtaModalBtn");
    bindModalDismiss("securityModalBackdrop", "closeSecurityModalBtn");
    bindModalDismiss("activePermitsModalBackdrop", "closeActivePermitsModalBtn");
    bindModalDismiss("alternativesModalBackdrop", "closeAlternativesModalBtn");

    const headedHomeBtn = document.getElementById("headedHomeBtn");
    if (headedHomeBtn) headedHomeBtn.addEventListener("click", () => openModal("etaModalBackdrop"));

    const securityGateBtn = document.getElementById("securityGateBtn");
    const gatePlateInput = document.getElementById("gatePlateInput");
    if (securityGateBtn) {
        securityGateBtn.addEventListener("click", () => {
            const result = document.getElementById("securityVerificationResult");
            if (result) result.innerHTML = "";
            openModal("securityModalBackdrop");
            if (gatePlateInput) gatePlateInput.focus();
        });
    }

    const verifyPlateBtn = document.getElementById("verifyPlateBtn");
    if (verifyPlateBtn && gatePlateInput) {
        verifyPlateBtn.addEventListener("click", () => handleSecurityPlateLookup(gatePlateInput.value));
        gatePlateInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSecurityPlateLookup(gatePlateInput.value);
        });
    }

    const activePassesBtn = document.getElementById("activePassesBtn");
    if (activePassesBtn) {
        activePassesBtn.addEventListener("click", () => {
            renderActivePermitsModal();
            openModal("activePermitsModalBackdrop");
        });
    }
}

function redrawGrid() {
    renderParkingGrid(NestSpotState.spots, NestSpotState.block, NestSpotState.filter, NestSpotState.search);
}

async function refreshDashboard() {
    await Promise.all([fetchComplexStats(), fetchSpots(), fetchActiveBookings(), fetchActiveAlerts()]);
}

async function fetchComplexStats() {
    try {
        const stats = await NestSpotApi.getStats();
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
        NestSpotState.spots = await NestSpotApi.getSpots();
        redrawGrid();
    } catch (err) {
        console.error("Error fetching spots:", err);
    }
}

async function fetchActiveBookings() {
    try {
        NestSpotState.bookings = await NestSpotApi.getActiveBookings();
    } catch (err) {
        console.error("Error fetching active bookings:", err);
    }
}

async function fetchActiveAlerts() {
    try {
        NestSpotState.alerts = await NestSpotApi.getActiveAlerts();
        renderEtaAlertBanner();
    } catch (err) {
        console.error("Error fetching ETA alerts:", err);
    }
}

function clearEtaTimers() {
    Object.values(NestSpotState.etaTimers).forEach((id) => clearInterval(id));
    NestSpotState.etaTimers = {};
}

function renderEtaAlertBanner() {
    const bannerContainer = document.getElementById("liveEtaAlertContainer");
    if (!bannerContainer) return;

    if (!NestSpotState.alerts.length) {
        bannerContainer.innerHTML = "";
        clearEtaTimers();
        return;
    }

    bannerContainer.innerHTML = NestSpotState.alerts.map(renderEtaBannerCard).join("");
    refreshIcons();
    NestSpotState.alerts.forEach((alert) => startCountdownTimer(alert.id, new Date(alert.expected_arrival)));
}

function renderEtaBannerCard(alert) {
    const targetInfo = alert.target_vehicle_plate
        ? `(${t("plateLabel")}: ${escapeHtml(alert.target_vehicle_plate)})`
        : "";
    const alts = alert.alternative_suggestions && alert.alternative_suggestions.length
        ? `<button type="button" class="btn-solid btn-info" onclick="window.showAlternativeSpotsModal('${escapeHtml(alert.id)}')">${t("viewAlternativesBtn")}</button>`
        : "";

    return `
        <div class="eta-live-alert-banner">
            <div class="eta-alert-left">
                <div class="eta-alert-icon"><i data-lucide="bell-ring"></i></div>
                <div>
                    <div class="eta-alert-title">${t("etaActiveAlertTitle")} · ${escapeHtml(alert.spot_number)}</div>
                    <div class="eta-alert-desc">
                        ${escapeHtml(alert.host_name)} (${t("flatShort")} ${alert.host_flat_number}) ${t("etaHeadedDesc")} ${targetInfo}
                    </div>
                </div>
            </div>
            <div class="eta-alert-actions">
                <div class="eta-timer-wrap">
                    <div class="eta-timer-label">${t("etaBufferCountdown")}</div>
                    <div class="eta-countdown-badge" id="etaCountdown-${escapeHtml(alert.id)}">--:--</div>
                </div>
                ${alts}
                <button type="button" class="btn-solid btn-success" onclick="window.handleAcknowledgeAndRelease('${escapeHtml(alert.id)}', '${escapeHtml(alert.spot_id)}')">
                    ${t("releaseSpotNowBtn")}
                </button>
            </div>
        </div>
    `;
}

function startCountdownTimer(alertId, targetTime) {
    if (NestSpotState.etaTimers[alertId]) clearInterval(NestSpotState.etaTimers[alertId]);

    function update() {
        const timerEl = document.getElementById(`etaCountdown-${alertId}`);
        if (!timerEl) return;
        const distance = targetTime.getTime() - Date.now();
        if (distance <= 0) {
            timerEl.textContent = `00:00 (${t("arrivedLabel")})`;
            timerEl.classList.add("eta-expired");
            clearInterval(NestSpotState.etaTimers[alertId]);
            return;
        }
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    update();
    NestSpotState.etaTimers[alertId] = setInterval(update, 1000);
}

window.submitEtaBroadcast = async function (e) {
    e.preventDefault();
    const minutes = parseInt(document.getElementById("etaMinutesInput").value, 10);
    try {
        await NestSpotApi.broadcastEta({
            spot_id: "spot-a-01",
            minutes_remaining: minutes,
            host_name: "Ahmet Yılmaz",
            note: "Left work, heading home.",
        });
        closeModal("etaModalBackdrop");
        await fetchActiveAlerts();
    } catch (err) {
        alert(err.message);
    }
};

window.handleAcknowledgeAndRelease = async function (alertId, spotId) {
    try {
        await NestSpotApi.resolveEta(alertId);
        const booking = NestSpotState.bookings.find((b) => b.spot_id === spotId);
        if (booking) await NestSpotApi.completeBooking(booking.id);
        await refreshDashboard();
    } catch (err) {
        alert(err.message);
    }
};

window.showAlternativeSpotsModal = function (alertId) {
    const alert = NestSpotState.alerts.find((a) => a.id === alertId);
    if (!alert || !alert.alternative_suggestions) return;
    const listEl = document.getElementById("alternativesList");
    listEl.innerHTML = alert.alternative_suggestions
        .map(
            (s) => `
        <div class="list-row">
            <div>
                <div class="list-row-title">${t("spotTitle")} ${escapeHtml(s.spot_number)} (${escapeHtml(s.block)} ${t("blockFlat")} · ${t("flatShort")} ${s.flat_number})</div>
                <div class="muted-copy">
                    ${t("residentShort")}: <strong class="text-strong">${escapeHtml(s.owner_name)}</strong>
                    ${s.has_ev_charger ? " · ⚡ " + t("evWallbox") : ""}
                </div>
            </div>
            <button type="button" class="btn-solid btn-success btn-compact" onclick="window.swapToAlternativeSpot('${escapeHtml(s.spot_id)}', '${escapeHtml(alert.id)}')">
                ${t("swapHereBtn")}
            </button>
        </div>`
        )
        .join("");
    openModal("alternativesModalBackdrop");
};

window.swapToAlternativeSpot = async function (newSpotId, alertId) {
    try {
        const alert = NestSpotState.alerts.find((a) => a.id === alertId);
        const booking = alert
            ? NestSpotState.bookings.find((b) => b.spot_id === alert.spot_id)
            : null;
        if (booking) {
            await NestSpotApi.swapBooking(booking.id, newSpotId);
        } else {
            await NestSpotApi.createBooking({
                spot_id: newSpotId,
                booking_type: "second_car",
                vehicle_plate: alert && alert.target_vehicle_plate ? alert.target_vehicle_plate : "34 SWAP 01",
                driver_name: alert && alert.target_driver_name ? alert.target_driver_name : "Spot Swap",
                host_flat_number: 1,
                duration_hours: 4,
            });
            if (alertId) await NestSpotApi.resolveEta(alertId);
        }
        closeModal("alternativesModalBackdrop");
        await refreshDashboard();
    } catch (err) {
        alert(err.message);
    }
};

window.handleSpotClick = function (spotId) {
    const spot = NestSpotState.spots.find((s) => s.id === spotId);
    if (!spot) return;
    const modalContent = document.getElementById("modalContent");
    const modalBackdrop = document.getElementById("spotModalBackdrop");
    if (modalContent && modalBackdrop) {
        modalContent.innerHTML = renderCleanSpotModal(spot);
        openModal("spotModalBackdrop");
        refreshIcons();
    }
};

window.showBookingForm = function (spotId, bookingType) {
    const spot = NestSpotState.spots.find((s) => s.id === spotId);
    if (!spot) return;
    const modalContent = document.getElementById("modalContent");
    if (modalContent) modalContent.innerHTML = renderBookingFormHtml(spot, bookingType);
};

window.submitBooking = async function (e, spotId, bookingType) {
    e.preventDefault();
    const payload = {
        spot_id: spotId,
        booking_type: bookingType,
        vehicle_plate: document.getElementById("formPlate").value,
        driver_name: document.getElementById("formDriver").value,
        host_flat_number: 1,
        duration_hours: parseInt(document.getElementById("formDuration").value, 10),
        notes: document.getElementById("formNotes").value || null,
    };
    try {
        const booking = await NestSpotApi.createBooking(payload);
        const modalContent = document.getElementById("modalContent");
        if (modalContent) modalContent.innerHTML = renderDigitalPassCardHtml(booking);
        await refreshDashboard();
    } catch (err) {
        alert(err.message);
    }
};

window.handleReleaseActiveSpot = async function (spotId) {
    let booking = NestSpotState.bookings.find((b) => b.spot_id === spotId);
    if (!booking) {
        const list = await NestSpotApi.getAllBookings();
        booking = list.find((b) => b.spot_id === spotId && b.status === "active");
    }
    if (!booking) {
        alert(t("noActiveSession"));
        return;
    }
    await completeBookingRequest(booking.id);
};

async function completeBookingRequest(bookingId) {
    try {
        await NestSpotApi.completeBooking(bookingId);
        closeModal("spotModalBackdrop");
        closeModal("activePermitsModalBackdrop");
        await refreshDashboard();
    } catch (err) {
        alert(err.message);
    }
}

async function handleSecurityPlateLookup(plate) {
    const resultBox = document.getElementById("securityVerificationResult");
    if (!plate || !plate.trim()) {
        resultBox.innerHTML = `<div class="verify-box verify-fail">${t("enterPlate")}</div>`;
        return;
    }
    try {
        const data = await NestSpotApi.verifyPlate(plate);
        if (data.is_authorized) {
            resultBox.innerHTML = `
                <div class="verify-box verify-ok">
                    <div class="verify-head">
                        <span class="verify-ok-title">✓ ${t("authorized")}</span>
                        <span class="plate-chip">${escapeHtml(data.vehicle_plate)}</span>
                    </div>
                    <div class="verify-line">📍 ${t("parkAt")}: ${t("spotTitle")} ${escapeHtml(data.spot_number)} (${escapeHtml(data.block)} ${t("blockFlat")} · ${t("flatShort")} ${data.host_flat})</div>
                    <div class="muted-copy">
                        ${t("driverName")}: <strong class="text-strong">${escapeHtml(data.driver_name)}</strong>
                        · ${t("permitCodeShort")}: <strong class="text-info">${escapeHtml(data.permit_code)}</strong>
                    </div>
                </div>`;
        } else {
            resultBox.innerHTML = `
                <div class="verify-box verify-fail">
                    <div class="verify-fail-title">✕ ${t("unauthorized")}</div>
                    <div class="verify-fail-msg">${escapeHtml(data.message)}</div>
                </div>`;
        }
    } catch (err) {
        resultBox.innerHTML = `<div class="verify-box verify-fail">${t("errorPrefix")}: ${escapeHtml(err.message)}</div>`;
    }
}

function renderActivePermitsModal() {
    const listContainer = document.getElementById("activePermitsList");
    if (!listContainer) return;
    if (!NestSpotState.bookings.length) {
        listContainer.innerHTML = `<div class="empty-state">${t("noActivePermits")}</div>`;
        return;
    }
    listContainer.innerHTML = NestSpotState.bookings
        .map(
            (b) => `
        <div class="list-row">
            <div>
                <div class="list-row-head">
                    <span class="plate-chip">${escapeHtml(b.vehicle_plate)}</span>
                    <span class="text-success-strong">${t("spotTitle")} ${escapeHtml(b.spot_number)} (${escapeHtml(b.block)} ${t("blockFlat")})</span>
                </div>
                <div class="muted-copy">
                    ${escapeHtml(b.driver_name)} · ${t("permitCodeShort")}: <strong class="text-info">${escapeHtml(b.permit_code)}</strong>
                </div>
            </div>
            <button type="button" class="btn-solid btn-danger btn-compact" onclick="window.handleReleaseActiveSpot('${escapeHtml(b.spot_id)}')">
                ${t("releaseBtn")}
            </button>
        </div>`
        )
        .join("");
}
