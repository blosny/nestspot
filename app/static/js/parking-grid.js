/**
 * NestSpot – parking grid, spot modal, booking form, digital pass.
 */

function getStatusMeta(status) {
    const map = {
        available: { label: t("statusFree"), pillClass: "pill-available", dotClass: "ind-available" },
        occupied_by_owner: { label: t("statusOwner"), pillClass: "pill-owner", dotClass: "ind-owner" },
        reserved_by_neighbor: { label: t("statusNeighbor"), pillClass: "pill-neighbor", dotClass: "ind-neighbor" },
        reserved_by_guest: { label: t("statusGuest"), pillClass: "pill-guest", dotClass: "ind-guest" },
        away_vacation: { label: t("statusVacation"), pillClass: "pill-vacation", dotClass: "ind-available" },
    };
    return map[status] || map.available;
}

function isSpotFree(spot) {
    return spot.status === "available" || spot.status === "away_vacation";
}

function isSpotReserved(spot) {
    return spot.status === "reserved_by_neighbor" || spot.status === "reserved_by_guest";
}

function matchesSearch(spot, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const haystack = [
        spot.spot_number,
        spot.owner_name,
        `d:${spot.flat_number}`,
        `flat ${spot.flat_number}`,
        `daire ${spot.flat_number}`,
        spot.current_vehicle_plate || "",
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(q);
}

function matchesStatusFilter(spot, activeFilter) {
    if (activeFilter === "AVAILABLE") return isSpotFree(spot);
    if (activeFilter === "EV") return Boolean(spot.has_ev_charger);
    if (activeFilter === "VACATION") return Boolean(spot.is_vacation_mode);
    return true;
}

function renderParkingGrid(spots, activeBlock = "ALL", activeFilter = "ALL", searchTerm = "") {
    const blockAGrid = document.getElementById("blockAGrid");
    const blockBGrid = document.getElementById("blockBGrid");
    const blockASection = document.getElementById("blockASection");
    const blockBSection = document.getElementById("blockBSection");
    const drivewayDivider = document.getElementById("drivewayDivider");
    if (!blockAGrid || !blockBGrid) return;

    const filtered = spots.filter((s) => matchesSearch(s, searchTerm) && matchesStatusFilter(s, activeFilter));

    const showA = activeBlock !== "B";
    const showB = activeBlock !== "A";
    if (blockASection) blockASection.style.display = showA ? "block" : "none";
    if (blockBSection) blockBSection.style.display = showB ? "block" : "none";
    if (drivewayDivider) drivewayDivider.style.display = showA && showB ? "block" : "none";

    const spotsA = filtered.filter((s) => s.block === "A");
    const spotsB = filtered.filter((s) => s.block === "B");
    const empty = `<div class="empty-state">${t("noMatchingSpots")}</div>`;

    blockAGrid.innerHTML = spotsA.length ? spotsA.map(createCleanSpotCard).join("") : empty;
    blockBGrid.innerHTML = spotsB.length ? spotsB.map(createCleanSpotCard).join("") : empty;
    refreshIcons();
}

function createCleanSpotCard(spot) {
    const statusMeta = getStatusMeta(spot.status);
    const freeClass = isSpotFree(spot) ? "status-available" : "";
    const plate = spot.current_vehicle_plate
        ? `<span class="spot-plate">${escapeHtml(spot.current_vehicle_plate)}</span>`
        : "";
    const ev = spot.has_ev_charger
        ? `<span class="ev-tag" title="${escapeHtml(spot.ev_charger_power || t("evWallbox"))}">
                <i data-lucide="zap" class="ev-icon"></i> EV
           </span>`
        : "";

    return `
        <div class="spot-card ${freeClass}" onclick="window.handleSpotClick('${escapeHtml(spot.id)}')">
            <div class="spot-header">
                <span class="spot-id">${escapeHtml(spot.spot_number)}</span>
                ${ev}
            </div>
            <div class="spot-status-pill ${statusMeta.pillClass}">
                <span class="legend-dot ${statusMeta.dotClass}"></span>
                <span>${statusMeta.label}</span>
            </div>
            <div class="spot-footer">
                <span class="spot-owner">${escapeHtml("D:" + spot.flat_number + " · " + spot.owner_name.split(" ")[0])}</span>
                ${plate}
            </div>
        </div>
    `;
}

function renderSchedule(spot) {
    if (!spot.available_windows || spot.available_windows.length === 0) {
        return `<div class="muted-copy">${t("noSchedule")}</div>`;
    }
    return spot.available_windows
        .map(
            (w) => `
        <div class="schedule-card">
            <div class="schedule-title">${escapeHtml(w.title)} (${escapeHtml(w.start_time)} – ${escapeHtml(w.end_time)})</div>
            <div class="schedule-days">${escapeHtml(w.days.join(", "))}</div>
        </div>`
        )
        .join("");
}

function renderSpotActions(spot) {
    if (isSpotFree(spot)) {
        return `
            <div class="action-row">
                <button type="button" class="btn-solid btn-success" onclick="window.showBookingForm('${escapeHtml(spot.id)}', 'second_car')">
                    ${t("parkSecondCarBtn")}
                </button>
                <button type="button" class="btn-solid btn-info" onclick="window.showBookingForm('${escapeHtml(spot.id)}', 'guest')">
                    ${t("guestPassBtn")}
                </button>
            </div>
            <button type="button" class="filter-btn btn-full" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>
        `;
    }
    if (isSpotReserved(spot)) {
        return `
            <div class="action-row">
                <button type="button" class="btn-solid btn-danger" onclick="window.handleReleaseActiveSpot('${escapeHtml(spot.id)}')">
                    ${t("releaseBtn")}
                </button>
                <button type="button" class="filter-btn btn-narrow" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>
            </div>
        `;
    }
    return `<button type="button" class="filter-btn btn-full" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>`;
}

function renderCleanSpotModal(spot) {
    const statusMeta = getStatusMeta(spot.status);
    const ev = spot.has_ev_charger
        ? `<span class="ev-tag ev-tag-lg">⚡ ${escapeHtml(spot.ev_charger_power || "Wallbox")}</span>`
        : "";
    const plate = spot.current_vehicle_plate
        ? `<span class="plate-chip">${escapeHtml(spot.current_vehicle_plate)}</span>`
        : "";

    return `
        <div class="modal-intro">
            <div class="modal-intro-row">
                <h3 class="modal-heading">${t("spotTitle")} ${escapeHtml(spot.spot_number)}</h3>
                <span class="chip-muted">${escapeHtml(spot.block)} ${t("blockFlat")} · ${t("flatShort")} ${spot.flat_number}</span>
            </div>
            <div class="muted-copy">${t("residentOwner")}: <strong class="text-strong">${escapeHtml(spot.owner_name)}</strong></div>
        </div>
        <div class="info-panel">
            <div class="eyebrow">${t("statusLabel")}</div>
            <div class="pill-row">
                <span class="spot-status-pill ${statusMeta.pillClass} no-margin">
                    <span class="legend-dot ${statusMeta.dotClass}"></span> ${statusMeta.label}
                </span>
                ${ev}
                ${plate}
            </div>
        </div>
        <div class="schedule-block">
            <div class="eyebrow">${t("awaySchedule")}</div>
            ${renderSchedule(spot)}
        </div>
        <div id="bookingActionContainer">${renderSpotActions(spot)}</div>
    `;
}

function renderBookingFormHtml(spot, bookingType) {
    const isGuest = bookingType === "guest";
    const defaultPlate = isGuest ? "34 GST 789" : "34 DNZ 102";
    const defaultDriver = isGuest ? "Caner Misafir" : "Ahmet Yılmaz (2. Araç)";

    return `
        <div class="modal-intro">
            <h3 class="modal-heading">${isGuest ? t("guestPassTitle") : t("parkSecondCarBtn")} · ${escapeHtml(spot.spot_number)}</h3>
            <p class="muted-copy">${escapeHtml(spot.block)} ${t("blockFlat")} · ${t("flatShort")} ${spot.flat_number} (${escapeHtml(spot.owner_name)})</p>
        </div>
        <form id="spotBookingForm" onsubmit="window.submitBooking(event, '${escapeHtml(spot.id)}', '${escapeHtml(bookingType)}')">
            <div class="form-group">
                <label class="form-label">${t("vehiclePlate")}</label>
                <input type="text" id="formPlate" required class="form-input input-plate" value="${defaultPlate}">
            </div>
            <div class="form-group">
                <label class="form-label">${t("driverName")}</label>
                <input type="text" id="formDriver" required class="form-input" value="${escapeHtml(defaultDriver)}">
            </div>
            <div class="form-group">
                <label class="form-label">${t("durationHours")}</label>
                <select id="formDuration" class="form-input">
                    <option value="2">${t("hours2")}</option>
                    <option value="4" selected>${t("hours4")}</option>
                    <option value="8">${t("hours8")}</option>
                    <option value="24">${t("hours24")}</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">${t("notesOptional")}</label>
                <input type="text" id="formNotes" class="form-input" placeholder="${isGuest ? t("guestNotePh") : t("secondCarNotePh")}">
            </div>
            <div class="action-row action-row-top">
                <button type="button" class="filter-btn btn-flex" onclick="window.handleSpotClick('${escapeHtml(spot.id)}')">${t("cancelBtn")}</button>
                <button type="submit" class="btn-solid btn-success btn-flex">${t("confirmBtn")}</button>
            </div>
        </form>
    `;
}

function renderDigitalPassCardHtml(booking) {
    const until = new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `
        <div class="digital-pass-card">
            <div class="pass-header">
                <div>
                    <div class="pass-kicker">${t("nestspotPermit")}</div>
                    <div class="pass-spot">${t("spotTitle")} ${escapeHtml(booking.spot_number)} (${escapeHtml(booking.block)} ${t("blockFlat")})</div>
                </div>
                <div class="pass-code-badge">${escapeHtml(booking.permit_code)}</div>
            </div>
            <div class="pass-plate">${escapeHtml(booking.vehicle_plate)}</div>
            <div class="pass-meta">
                <div>${t("driverName")}: <strong class="text-strong block">${escapeHtml(booking.driver_name)}</strong></div>
                <div>${t("validUntil")}: <strong class="text-success block">${until}</strong></div>
            </div>
            <div class="pass-ok">✓ ${t("gateVerified")} (${t("flatShort")} ${booking.host_flat_number})</div>
        </div>
        <div class="action-row action-row-top">
            <button type="button" class="filter-btn btn-flex" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>
        </div>
    `;
}
