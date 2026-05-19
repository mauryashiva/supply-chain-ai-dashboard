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
            await page.route("http://127.0.0.1:8000/api/v1/customer/catalog", lambda route: route.fulfill(
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

            # Click the plus button (Quick Add)
            await page.locator("button.absolute.bottom-2.right-2").click()
            await asyncio.sleep(1)

            # Take screenshot of the bottom sheet
            await page.screenshot(path="/home/jules/verification/bottom_sheet_variants.png")

            # Click standard variant and add to cart
            await page.click("text=Add to Cart")
            await asyncio.sleep(1)

            # Open cart drawer - the navigation structure changed, clicking on cart text wrapper
            await page.locator("div.flex-col:has-text('Cart')").first.click()
            await asyncio.sleep(1)

            # Take screenshot of cart drawer
            await page.screenshot(path="/home/jules/verification/cart_drawer_variants.png")

        finally:
            frontend_process.terminate()
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_variants())
