# NestSpot Architecture & Engineering Specification

**NestSpot** is a residential peer-to-peer parking sharing platform designed for gated residential complexes and apartment buildings. It enables neighbors to share allocated private parking slots during away hours and vacations, validates guest permits at the security gate, and coordinates real-time resident returns with automated buffer countdowns and spot swaps.

---

## 🏛️ System Architecture Overview

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Responsive Web / Mobile)"]
        UI["UI Manager (ui.js)"]
        Grid["Interactive Grid (parking-grid.js)"]
        API["API Client (api.js)"]
        i18n["Localization TR/EN (i18n.js)"]
        App["App Controller (app.js)"]
    end

    subgraph API_Gateway ["FastAPI Application (app/main.py)"]
        SpotsRouter["/api/spots (spots.py)"]
        BookingsRouter["/api/bookings (bookings.py)"]
        SecurityRouter["/api/security (security.py)"]
        EtaRouter["/api/eta (eta.py)"]
    end

    subgraph Domain_Services ["Domain Logic & Services"]
        SpotService["SpotService (spot_service.py)"]
        BookingService["BookingService (booking_service.py)"]
        EtaService["EtaService (eta_service.py)"]
        PlateNormalizer["PlateNormalizer (plate.py)"]
        TimeWindowEngine["TimeWindowEngine (time_window.py)"]
    end

    App --> API
    Grid --> API
    API -->|HTTP REST| API_Gateway

    SpotsRouter --> SpotService
    BookingsRouter --> BookingService
    SecurityRouter --> BookingService
    EtaRouter --> EtaService

    BookingService --> SpotService
    BookingService --> PlateNormalizer
    BookingService --> TimeWindowEngine
    EtaService --> SpotService
    EtaService --> BookingService
```

---

## 🔄 1. Reservation & Guest Pass Lifecycle

A resident can book a neighbor's vacant spot for a 2nd family car or a visiting guest.

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Initial State / Vacation Mode
    AVAILABLE --> RESERVED_BY_GUEST : Guest Booking Created
    AVAILABLE --> RESERVED_BY_NEIGHBOR : 2nd Car Booking Created
    
    state ActiveSession {
        RESERVED_BY_GUEST --> OVERSTAYED : Duration Expired
        RESERVED_BY_NEIGHBOR --> OVERSTAYED : Duration Expired
        RESERVED_BY_GUEST --> SWAPPED : Host ETA Alert & Spot Swap
        RESERVED_BY_NEIGHBOR --> SWAPPED : Host ETA Alert & Spot Swap
    }

    RESERVED_BY_GUEST --> COMPLETED : Driver/Host Ends Booking
    RESERVED_BY_NEIGHBOR --> COMPLETED : Driver/Host Ends Booking
    SWAPPED --> AVAILABLE : Old Spot Freed Immediately
    OVERSTAYED --> COMPLETED : Released
    COMPLETED --> AVAILABLE : Spot Available for Others
    COMPLETED --> AWAY_VACATION : If Spot Owner in Vacation Mode
```

---

## ⚡ 2. Live ETA Departure & Spot Swap Protocol

When a spot owner leaves the office and heads home, they broadcast an ETA alert (`15`, `20`, `30`, `45` min). The occupant receives a live countdown buffer and can either release or execute a 1-click spot swap to an alternative free spot.

```mermaid
sequenceDiagram
    autonumber
    actor Owner as 🏠 Spot Owner (Ahmet)
    participant API as 🚀 NestSpot Backend
    actor Guest as 🚗 Occupant (Caner)
    actor Security as 🛡️ Gate Security Guard

    Owner->>API: POST /api/eta/broadcast (spot_id="spot-a-01", 20 mins)
    API->>API: Compute nearest alternative spots (A-04, B-01, B-05)
    API-->>Guest: Live ETA Broadcast Banner + 15m Countdown Buffer
    alt Guest clicks "Park Yerini Değiştir (Swap)"
        Guest->>API: POST /api/bookings/{id}/swap (new_spot="spot-b-01")
        API->>API: Move booking to B-01, Release A-01, Resolve ETA Alert
        API-->>Guest: New Digital Permit (Spot B-01)
        API-->>Owner: Spot A-01 is now FREE
    else Guest completes session directly
        Guest->>API: POST /api/bookings/{id}/complete
        API->>API: Release Spot A-01
        API-->>Owner: Spot A-01 is now FREE
    end
```

---

## 🛡️ 3. Security Gate License Plate Verification Flow

Guards at the apartment entrance scan or enter approaching vehicle plates. The system normalizes Turkish characters and punctuation, matches active permits and registered resident vehicles.

```mermaid
flowchart TD
    Start([Vehicle Approaches Security Gate]) --> InputPlate[Guard Enters Plate: '34 şah 42']
    InputPlate --> Normalize[Normalize Plate: Trim, Uppercase, TR char mapping -> '34 SAH 42']
    Normalize --> CheckActiveBookings{Active Booking Permit Found?}
    
    CheckActiveBookings -- Yes --> VerifyActive[Check Permit Status & Expiration]
    VerifyActive --> GrantGuest[✅ ACCESS GRANTED<br>Guest/2nd Car Permit<br>Assigns Spot: A-01]
    
    CheckActiveBookings -- No --> CheckResidentOwner{Resident Owner Plate?}
    CheckResidentOwner -- Yes --> GrantResident[✅ ACCESS GRANTED<br>Resident Owner Confirmed<br>Directs to Assigned Spot]
    CheckResidentOwner -- No --> DenyAccess[❌ ACCESS DENIED<br>No Active Permit Found<br>Instruct Guard to Contact Resident]

    GrantGuest --> End([Gate Barrier Opens])
    GrantResident --> End
    DenyAccess --> Stop([Barrier Remains Closed])
```

---

## ⏰ 4. Time Window & Conflict Resolution Matrix

- **Overnight Schedules (`22:00 - 06:00`)**: Evaluated by splitting into dual interval segments `[22:00, 24:00)` and `[00:00, 06:00)`.
- **Interval Collision Rule**: `start_a < end_b AND start_b < end_a` (Half-open intervals `[start, end)` avoid boundary collisions).
- **Plate Normalization Table**:
  | Raw Input | Normalized Key |
  |---|---|
  | `34 abc 123` | `34ABC123` |
  | `34-ıjk-99` | `34IJK99` |
  | `06  şah  42` | `06SAH42` |
  | `35 ÖZ 707` | `35OZ707` |

---

## 🔒 5. Concurrency & Data Guarantees
- In-memory thread-safe state operations.
- Dynamic auto-expiration of completed and stale ETA alerts and bookings upon read.
- Idempotent resolution endpoints with atomic spot status updates.
