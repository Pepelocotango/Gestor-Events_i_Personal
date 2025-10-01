import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    """
    This script verifies that notes added to a material item are
    correctly displayed in the material list UI.
    """
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Arrange: Go to the application's root and create a new document.
    page.goto("http://localhost:5173/")

    # Wait for the welcome screen to be visible and click the correct button.
    expect(page.get_by_role("heading", name="Gestor d'Esdeveniments")).to_be_visible()

    # Use the correct locator for the "New Document" button.
    page.get_by_role("button", name="Nou Document").click()

    # Now that a document is open, the main UI should be visible.
    # Navigate to the material page.
    page.goto("http://localhost:5173/#/material")

    # Wait for the main content to be visible to ensure the page is loaded.
    expect(page.locator("main")).to_be_visible()
    expect(page.get_by_role("button", name="Afegir nou ítem")).to_be_visible()

    # 2. Act: Add a new material item with notes.
    page.get_by_role("button", name="Afegir nou ítem").click()

    # Fill in the form fields.
    page.get_by_label("Nom del material").fill("Cable HDMI 10m")
    page.get_by_label("Estoc").fill("25")
    page.get_by_label("Ubicació").fill("Magatzem Principal")

    notes_text = "Són els cables més llargs, revisar abans de tornar."
    page.get_by_label("Notes").fill(notes_text)

    # Click the "Desar" (Save) button.
    page.get_by_role("button", name="Desar").click()

    # 3. Assert: Verify the new item and its notes are in the list.
    new_item_card = page.locator('.bg-white:has-text("Cable HDMI 10m")').first

    expect(new_item_card).to_be_visible()
    expect(new_item_card).to_contain_text("Estoc: 25")
    expect(new_item_card).to_contain_text("Ubicació: Magatzem Principal")
    expect(new_item_card).to_contain_text(notes_text)

    # 4. Screenshot: Capture the final result for visual verification.
    new_item_card.screenshot(path="jules-scratch/verification/verification.png")

    # Clean up
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)