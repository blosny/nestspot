import asyncio
from pathlib import Path
import sys
import threading
import time

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from playwright.async_api import async_playwright
import uvicorn

SCREENSHOTS_DIR = Path("docs/screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

def start_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="error")
    server = uvicorn.Server(config)
    server.run()

async def capture_nestspot_walkthrough():
    # Start uvicorn in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1.5)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        print("1. Navigating to NestSpot...")
        await page.goto("http://127.0.0.1:8000", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.screenshot(path=SCREENSHOTS_DIR / "01_dashboard_overview.png")
        print("Captured 01_dashboard_overview.png")

        print("2. Opening Spot Reservation Modal (A-01)...")
        await page.click(".spot-card:has-text('A-01')")
        await page.wait_for_timeout(500)
        await page.screenshot(path=SCREENSHOTS_DIR / "02_spot_modal_details.png")
        print("Captured 02_spot_modal_details.png")

        print("3. Generating Guest Permit...")
        await page.click("text=Misafir İzin Kartı Oluştur")
        await page.wait_for_timeout(500)
        await page.click("text=Onayla & Rezerve Et")
        await page.wait_for_timeout(600)
        await page.screenshot(path=SCREENSHOTS_DIR / "03_digital_permit_card.png")
        print("Captured 03_digital_permit_card.png")
        await page.click("#closeModalBtn")

        print("4. Opening Security Gate Verification...")
        await page.click("#securityGateBtn")
        await page.fill("#gatePlateInput", "34 GST 789")
        await page.click("#verifyPlateBtn")
        await page.wait_for_timeout(500)
        await page.screenshot(path=SCREENSHOTS_DIR / "04_security_gate_verification.png")
        print("Captured 04_security_gate_verification.png")
        await page.click("#closeSecurityModalBtn")

        print("5. Broadcasting Live ETA Alert...")
        await page.click("#headedHomeBtn")
        await page.wait_for_timeout(500)
        await page.click("text=Canlı Bildirimi Başlat")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=SCREENSHOTS_DIR / "05_live_eta_countdown_banner.png")
        print("Captured 05_live_eta_countdown_banner.png")

        print("6. Viewing Active Permits...")
        await page.click("#activePassesBtn")
        await page.wait_for_timeout(500)
        await page.screenshot(path=SCREENSHOTS_DIR / "06_active_permits_list.png")
        print("Captured 06_active_permits_list.png")

        await browser.close()
        print("All 6 screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(capture_nestspot_walkthrough())
