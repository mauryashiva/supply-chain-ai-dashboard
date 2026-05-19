import asyncio
from playwright.async_api import async_playwright

async def verify_variants():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 375, 'height': 812})

        # Start customer frontend
        import subprocess
        frontend_process = subprocess.Popen(["npm", "run", "dev", "--", "--port", "5174"], cwd="customer-store")
        await asyncio.sleep(4)  # Wait for it to start

        try:
            # We will use playwright route interception to mock the API response for discovery page to test the variant selection modal logic
            await page.route("http://127.0.0.1:8000/api/v1/customer/catalog*", lambda route: route.fulfill(
                json={
                    "items": [{
                        "id": 999,
                        "name": "SMARTPHONE XYZ",
                        "sku": "IPH-13-W",
                        "selling_price": 8999,
                        "taxable_price": 8000,
                        "gst_rate": 18,
                        "stock_quantity": 10,
                        "category": {"id": 1, "name": "Electronics"},
                        "images": [{"id": 1, "media_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800", "media_type": "image"}],
                        "variants": [
                            {"id": 1, "product_id": 999, "sku": "IPH-13-128", "ram": "8GB", "storage": "128GB", "color": "Midnight Black", "stock_quantity": 5, "price_override": 9999},
                            {"id": 2, "product_id": 999, "sku": "IPH-13-256", "ram": "8GB", "storage": "256GB", "color": "Gold", "stock_quantity": 2, "price_override": 11999}
                        ]
                    }],
                    "total": 1, "page": 1, "pages": 1
                }
            ))

            await page.goto("http://localhost:5174/")
            await asyncio.sleep(2)

            # Click the quick add button by text since there's an overlay
            await page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const plusBtn = btns.find(b => b.innerHTML.includes('lucide-plus'));
                if (plusBtn) plusBtn.click();
            }""")
            await asyncio.sleep(1)

            # Take screenshot of the bottom sheet
            await page.screenshot(path="/home/jules/verification/bottom_sheet_variants.png")

            # Click variant selection and add to cart
            await page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const addBtn = btns.find(b => b.textContent && b.textContent.includes('Add to Cart'));
                if (addBtn) addBtn.click();
            }""")
            await asyncio.sleep(1)

            # Open cart drawer
            await page.evaluate("""() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const cartSpan = spans.find(s => s.textContent === 'Cart');
                if (cartSpan && cartSpan.parentElement) cartSpan.parentElement.click();
            }""")
            await asyncio.sleep(1)

            # Take screenshot of cart drawer
            await page.screenshot(path="/home/jules/verification/cart_drawer_variants.png")

        finally:
            frontend_process.terminate()
            await browser.close()

if __name__ == "__main__":
    import os
    os.system("kill $(lsof -t -i :5174) 2>/dev/null || true")
    os.system("kill $(lsof -t -i :5175) 2>/dev/null || true")
    asyncio.run(verify_variants())
