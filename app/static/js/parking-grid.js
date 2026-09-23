/**
 * NestSpot - Clean Parking Grid & Reservation Modal Renderer
 */

function getStatusMeta(status) {
    const map = {
        available: { label: t("statusFree"), pillClass: "pill-available", dotClass: "ind-available" },
        occupied_by_owner: { label: t("statusOwner"), pillClass: "pill-owner", dotClass: "ind-owner" },
        reserved_by_neighbor: { label: t("statusNeighbor"), pillClass: "pill-neighbor", dotClass: "ind-neighbor" },
        reserved_by_guest: { label: t("statusGuest"), pillClass: "pill-guest", dotClass: "ind-guest" },
        away_vacation: { label: t("statusVacation"), pillClass: "pill-vacation", dotClass: "ind-available" }
    };
    return map[status] || map.available;
}

function renderParkingGrid(spots, activeBlock = "ALL", activeFilter = "ALL", searchTerm = "") {
    const blockAGrid = document.getElementById("blockAGrid");
    const blockBGrid = document.getElementById("blockBGrid");
    const blockASection = document.getElementById("blockASection");
    const blockBSection = document.getElementById("blockBSection");
    const drivewayDivider = document.getElementById("drivewayDivider");

    if (!blockAGrid || !blockBGrid) return;

    let filtered = spots;

    // Search filter
    if (searchTerm && searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(s =>
            s.spot_number.toLowerCase().includes(q) ||
            s.owner_name.toLowerCase().includes(q) ||
            `d:${s.flat_number}`.toLowerCase().includes(q) ||
            `flat ${s.flat_number}`.toLowerCase().includes(q) ||
            (s.current_vehicle_plate && s.current_vehicle_plate.toLowerCase().includes(q))
        );
    }

    // Status filter
    if (activeFilter === "AVAILABLE") {
        filtered = filtered.filter(s => s.status === "available" || s.status === "away_vacation");
    } else if (activeFilter === "EV") {
        filtered = filtered.filter(s => s.has_ev_charger);
    } else if (activeFilter === "VACATION") {
        filtered = filtered.filter(s => s.is_vacation_mode);
    }

    // Block visibility
    if (activeBlock === "A") {
        blockASection.style.display = "block";
        blockBSection.style.display = "none";
        if (drivewayDivider) drivewayDivider.style.display = "none";
    } else if (activeBlock === "B") {
        blockASection.style.display = "none";
        blockBSection.style.display = "block";
        if (drivewayDivider) drivewayDivider.style.display = "none";
    } else {
        blockASection.style.display = "block";
        blockBSection.style.display = "block";
        if (drivewayDivider) drivewayDivider.style.display = "block";
    }

    const spotsA = filtered.filter(s => s.block === "A");
    const spotsB = filtered.filter(s => s.block === "B");

    blockAGrid.innerHTML = spotsA.length > 0
        ? spotsA.map(createCleanSpotCard).join("")
        : `<div class="empty-state">${t("noMatchingSpots")}</div>`;

    blockBGrid.innerHTML = spotsB.length > 0
        ? spotsB.map(createCleanSpotCard).join("")
        : `<div class="empty-state">${t("noMatchingSpots")}</div>`;

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function createCleanSpotCard(spot) {
    const statusMeta = getStatusMeta(spot.status);
    const isFree = spot.status === "available" || spot.status === "away_vacation";

    return `
        <div class="spot-card ${isFree ? 'status-available' : ''}" onclick="window.handleSpotClick('${spot.id}')">
            <div class="spot-header">
                <span class="spot-id">${spot.spot_number}</span>
                ${spot.has_ev_charger ? `
                    <span class="ev-tag" title="${spot.ev_charger_power || 'EV Wallbox'}">
                        <i data-lucide="zap" style="width:10px;height:10px;"></i> EV
                    </span>
                ` : ''}
            </div>

            <div class="spot-status-pill ${statusMeta.pillClass}">
                <span class="legend-dot ${statusMeta.dotClass}"></span>
                <span>${statusMeta.label}</span>
            </div>

            <div class="spot-footer">
                <span class="spot-owner">D:${spot.flat_number} · ${spot.owner_name.split(' ')[0]}</span>
                ${spot.current_vehicle_plate ? `<span style="font-family: monospace; font-size: 0.65rem; color: #94a3b8;">${spot.current_vehicle_plate}</span>` : ''}
            </div>
        </div>
    `;
}

function renderCleanSpotModal(spot) {
    const statusMeta = getStatusMeta(spot.status);
    const isFree = spot.status === "available" || spot.status === "away_vacation";
    const isReserved = spot.status === "reserved_by_neighbor" || spot.status === "reserved_by_guest";

    let scheduleHtml = "";
    if (spot.available_windows && spot.available_windows.length > 0) {
        scheduleHtml = spot.available_windows.map(w => `
            <div style="padding: 0.6rem 0.75rem; background: #0b0f17; border: 1px solid #232f48; border-radius: 6px; margin-top: 0.35rem;">
                <div style="font-size: 0.8rem; font-weight: 600; color: #10b981;">${w.title} (${w.start_time} – ${w.end_time})</div>
                <div style="font-size: 0.7rem; color: #64748b; margin-top: 0.15rem;">${w.days.join(", ")}</div>
            </div>
        `).join("");
    } else {
        scheduleHtml = `<div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">${t("noSchedule")}</div>`;
    }

    return `
        <div style="margin-bottom: 1rem; padding-right: 2.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">${t("spotTitle")} ${spot.spot_number}</h3>
                <span style="font-size: 0.75rem; color: #94a3b8; background: #1e293b; padding: 0.2rem 0.5rem; border-radius: 4px;">
                    ${spot.block} Blok · Daire ${spot.flat_number}
                </span>
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8;">${t("residentOwner")}: <strong style="color: #e2e8f0;">${spot.owner_name}</strong></div>
        </div>

        <div style="background: #0b0f17; border: 1px solid #232f48; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; margin-bottom: 0.35rem;">${t("statusLabel")}</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="spot-status-pill ${statusMeta.pillClass}" style="margin:0;">
                    <span class="legend-dot ${statusMeta.dotClass}"></span> ${statusMeta.label}
                </span>
                ${spot.has_ev_charger ? `
                    <span class="ev-tag" style="font-size:0.75rem; padding: 0.25rem 0.5rem;">
                        ⚡ ${spot.ev_charger_power || 'Wallbox'}
                    </span>
                ` : ''}
                ${spot.current_vehicle_plate ? `
                    <span style="font-family: monospace; font-size: 0.75rem; background:#000; padding: 0.25rem 0.5rem; border-radius:4px; border:1px solid #475569; color:#fff;">
                        ${spot.current_vehicle_plate}
                    </span>
                ` : ''}
            </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600;">${t("awaySchedule")}</div>
            ${scheduleHtml}
        </div>

        <div id="bookingActionContainer">
            ${isFree ? `
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <button class="filter-btn" style="flex:1; justify-content:center; background:#10b981; color:#fff; border:none; font-weight:600;" onclick="window.showBookingForm('${spot.id}', 'second_car')">
                        ${t("parkSecondCarBtn")}
                    </button>
                    <button class="filter-btn" style="flex:1; justify-content:center; background:#3b82f6; color:#fff; border:none; font-weight:600;" onclick="window.showBookingForm('${spot.id}', 'guest')">
                        ${t("guestPassBtn")}
                    </button>
                </div>
                <button class="filter-btn" style="width:100%; justify-content:center;" onclick="document.getElementById('spotModalBackdrop').classList.remove('active')">
                    ${t("closeBtn")}
                </button>
            ` : isReserved ? `
                <div style="display: flex; gap: 0.5rem;">
                    <button class="filter-btn" style="flex:1; justify-content:center; background:#f43f5e; color:#fff; border:none; font-weight:600;" onclick="window.handleReleaseActiveSpot('${spot.id}')">
                        ${t("releaseBtn")}
                    </button>
                    <button class="filter-btn" style="flex:0.6; justify-content:center;" onclick="document.getElementById('spotModalBackdrop').classList.remove('active')">
                        ${t("closeBtn")}
                    </button>
                </div>
            ` : `
                <button class="filter-btn" style="width:100%; justify-content:center;" onclick="document.getElementById('spotModalBackdrop').classList.remove('active')">
                    ${t("closeBtn")}
                </button>
            `}
        </div>
    `;
}

function renderBookingFormHtml(spot, bookingType) {
    const isGuest = bookingType === "guest";
    const defaultPlate = isGuest ? "34 GST 789" : "34 DNZ 102";
    const defaultDriver = isGuest ? "Caner Misafir" : "Ahmet Yılmaz (2. Araç)";

    return `
        <div style="margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">
                ${isGuest ? t("guestPassTitle") : t("parkSecondCarBtn")} · Spot ${spot.spot_number}
            </h3>
            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem;">
                ${spot.block} Blok · Daire ${spot.flat_number} (${spot.owner_name})
            </p>
        </div>

        <form id="spotBookingForm" onsubmit="window.submitBooking(event, '${spot.id}', '${bookingType}')">
            <div class="form-group">
                <label class="form-label">${t("vehiclePlate")}</label>
                <input type="text" id="formPlate" required class="form-input" style="font-family: monospace; text-transform: uppercase;" value="${defaultPlate}">
            </div>

            <div class="form-group">
                <label class="form-label">${t("driverName")}</label>
                <input type="text" id="formDriver" required class="form-input" value="${defaultDriver}">
            </div>

            <div class="form-group">
                <label class="form-label">${t("durationHours")}</label>
                <select id="formDuration" class="form-input" style="background:#0b0f17;">
                    <option value="2">2 Hours</option>
                    <option value="4" selected>4 Hours</option>
                    <option value="8">8 Hours (Full Shift)</option>
                    <option value="24">24 Hours (Full Day)</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">${t("notesOptional")}</label>
                <input type="text" id="formNotes" class="form-input" placeholder="${isGuest ? 'Ziyaretçi veya kurye notu...' : 'İkinci araç...'}">
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" class="filter-btn" style="flex:1; justify-content:center;" onclick="window.handleSpotClick('${spot.id}')">
                    ${t("cancelBtn")}
                </button>
                <button type="submit" class="filter-btn active" style="flex:1; justify-content:center; background:#10b981; color:#fff; border:none; font-weight:600;">
                    ${t("confirmBtn")}
                </button>
            </div>
        </form>
    `;
}

function renderDigitalPassCardHtml(booking) {
    return `
        <div class="digital-pass-card">
            <div class="pass-header">
                <div>
                    <div style="font-size:0.7rem; color:#94a3b8; font-weight:600;">NESTSPOT PERMIT</div>
                    <div style="font-size:0.85rem; font-weight:700; color:#fff;">Spot ${booking.spot_number} (${booking.block} Blok)</div>
                </div>
                <div class="pass-code-badge">${booking.permit_code}</div>
            </div>

            <div class="pass-plate">${booking.vehicle_plate}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.08);">
                <div>${t("driverName")}: <strong style="color:#fff; display:block;">${booking.driver_name}</strong></div>
                <div>${t("validUntil")}: <strong style="color:#10b981; display:block;">${new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></div>
            </div>

            <div style="margin-top: 0.75rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 0.4rem; text-align: center; font-size: 0.7rem; font-weight: 700; color: #34d399;">
                ✓ ${t("gateVerified")} (Flat ${booking.host_flat_number})
            </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="filter-btn" style="flex:1; justify-content:center;" onclick="document.getElementById('spotModalBackdrop').classList.remove('active')">
                ${t("closeBtn")}
            </button>
        </div>
    `;
}
