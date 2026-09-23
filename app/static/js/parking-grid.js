/**
 * NestSpot – Clean, intuitive Linear/Apple style parking grid & card renderers.
 */

function getStatusMeta(status) {
    const map = {
        available: { label: t("statusFree"), badgeClass: "badge-available", actionLabel: t("parkSecondCarBtn") },
        occupied_by_owner: { label: t("statusOwner"), badgeClass: "badge-owner", actionLabel: t("detailsBtn") || "Detay" },
        reserved_by_neighbor: { label: t("statusNeighbor"), badgeClass: "badge-neighbor", actionLabel: t("releaseBtn") },
        reserved_by_guest: { label: t("statusGuest"), badgeClass: "badge-guest", actionLabel: t("releaseBtn") },
        away_vacation: { label: t("statusVacation"), badgeClass: "badge-vacation", actionLabel: t("guestPassBtn") },
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
    if (drivewayDivider) drivewayDivider.style.display = showA && showB ? "flex" : "none";

    const spotsA = filtered.filter((s) => s.block === "A");
    const spotsB = filtered.filter((s) => s.block === "B");
    const empty = `<div class="empty-state" style="padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">${t("noMatchingSpots")}</div>`;

    blockAGrid.innerHTML = spotsA.length ? spotsA.map(createCleanSpotCard).join("") : empty;
    blockBGrid.innerHTML = spotsB.length ? spotsB.map(createCleanSpotCard).join("") : empty;
    refreshIcons();
}

function createCleanSpotCard(spot) {
    const statusMeta = getStatusMeta(spot.status);
    const isFree = isSpotFree(spot);
    const freeCardClass = isFree ? "is-available" : "";

    const plateMarkup = spot.current_vehicle_plate
        ? `<span class="plate-tag">${escapeHtml(spot.current_vehicle_plate)}</span>`
        : `<span style="font-size: 0.7rem; color: var(--text-dim);">${isFree ? (t("readyToPark") || "Kullanıma hazır") : (t("noVehicle") || "Araç yok")}</span>`;

    const evMarkup = spot.has_ev_charger
        ? `<div class="ev-badge"><i data-lucide="zap" style="width: 10px; height: 10px;"></i> EV Şarj</div>`
        : "";

    const actionText = isFree
        ? (t("parkSecondCarBtn") || "Park Et")
        : (isSpotReserved(spot) ? (t("releaseBtn") || "İzni Bitir") : (t("viewDetailsBtn") || "Detay Gör"));

    return `
        <div class="spot-card ${freeCardClass}" onclick="window.handleSpotClick('${escapeHtml(spot.id)}')">
            <div class="spot-card-top">
                <span class="spot-num-badge">${escapeHtml(spot.spot_number)}</span>
                <span class="spot-flat-label">${t("flatShort")} ${spot.flat_number}</span>
            </div>

            <div class="spot-badge ${statusMeta.badgeClass}">
                ${statusMeta.label}
            </div>

            <div class="spot-details">
                <span class="resident-text">${escapeHtml(spot.owner_name)}</span>
                ${plateMarkup}
            </div>

            ${evMarkup}

            <div class="spot-action-footer">
                <span>${actionText}</span>
                <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
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
        <div style="background: var(--bg-surface-elevated); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.45rem; border: 1px solid var(--border-subtle);">
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.82rem;">${escapeHtml(w.title)} (${escapeHtml(w.start_time)} – ${escapeHtml(w.end_time)})</div>
            <div style="color: var(--text-muted); font-size: 0.74rem;">${escapeHtml(w.days.join(", "))}</div>
        </div>`
        )
        .join("");
}

function renderSpotActions(spot) {
    if (isSpotFree(spot)) {
        return `
            <div class="modal-action-row">
                <button type="button" class="btn-cancel" style="flex: 1;" onclick="window.showBookingForm('${escapeHtml(spot.id)}', 'second_car')">
                    ${t("parkSecondCarBtn")}
                </button>
                <button type="button" class="btn-primary-orange" style="flex: 1;" onclick="window.showBookingForm('${escapeHtml(spot.id)}', 'guest')">
                    ${t("guestPassBtn")}
                </button>
            </div>
            <button type="button" class="btn-cancel" style="width: 100%; margin-top: 0.65rem;" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>
        `;
    }
    if (isSpotReserved(spot)) {
        return `
            <div class="modal-action-row">
                <button type="button" class="btn-primary-orange" style="background: #ef4444; flex: 1;" onclick="window.handleReleaseActiveSpot('${escapeHtml(spot.id)}')">
                    ${t("releaseBtn")}
                </button>
                <button type="button" class="btn-cancel" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>
            </div>
        `;
    }
    return `<button type="button" class="btn-cancel" style="width: 100%; margin-top: 0.75rem;" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>`;
}

function renderCleanSpotModal(spot) {
    const statusMeta = getStatusMeta(spot.status);
    const ev = spot.has_ev_charger
        ? `<div class="ev-badge" style="font-size: 0.75rem; padding: 2px 7px;">⚡ ${escapeHtml(spot.ev_charger_power || "Wallbox Şarj")}</div>`
        : "";
    const plate = spot.current_vehicle_plate
        ? `<div style="font-size: 0.85rem; font-weight: 700; color: #f8fafc; margin-top: 4px;">Plaka: ${escapeHtml(spot.current_vehicle_plate)}</div>`
        : "";

    return `
        <div class="modal-intro">
            <h3 class="modal-heading">${t("spotTitle")} ${escapeHtml(spot.spot_number)}</h3>
            <p class="muted-copy">${escapeHtml(spot.block)} ${t("blockFlat")} · ${t("flatShort")} ${spot.flat_number} (${escapeHtml(spot.owner_name)})</p>
        </div>
        
        <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">DURUM BİLGİSİ</div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span class="spot-badge ${statusMeta.badgeClass}">${statusMeta.label}</span>
                ${ev}
            </div>
            ${plate}
        </div>

        <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">MÜSAİTLİK PLANI</div>
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
                <input type="text" id="formPlate" required class="form-input" value="${defaultPlate}">
            </div>
            <div class="form-group">
                <label class="form-label">${t("driverName")}</label>
                <input type="text" id="formDriver" required class="form-input" value="${escapeHtml(defaultDriver)}">
            </div>
            <div class="form-group">
                <label class="form-label">${t("durationHours")}</label>
                <select id="formDuration" class="form-select">
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
            <div class="modal-action-row">
                <button type="button" class="btn-cancel" onclick="window.handleSpotClick('${escapeHtml(spot.id)}')">${t("cancelBtn")}</button>
                <button type="submit" class="btn-primary-orange">${t("confirmBtn")}</button>
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
                    <div style="font-size: 0.72rem; opacity: 0.9;">DİJİTAL OTOPARK İZNİ</div>
                    <div style="font-size: 1.25rem; font-weight: 800;">YER ${escapeHtml(booking.spot_number)}</div>
                </div>
                <div class="pass-code-badge">${escapeHtml(booking.permit_code)}</div>
            </div>
            <div class="pass-plate">
                ${escapeHtml(booking.vehicle_plate)}
            </div>
            <div class="pass-meta">
                <div>Sürücü: <strong>${escapeHtml(booking.driver_name)}</strong></div>
                <div>Geçerlilik: <strong>${until}</strong></div>
                <div>Ev Sahibi: <strong>Daire ${booking.host_flat_number}</strong></div>
                <div>Durum: <strong>Aktif İzin</strong></div>
            </div>
        </div>
        <div class="modal-action-row">
            <button type="button" class="btn-primary-orange" style="width: 100%;" onclick="closeModal('spotModalBackdrop')">${t("closeBtn")}</button>
        </div>
    `;
}
