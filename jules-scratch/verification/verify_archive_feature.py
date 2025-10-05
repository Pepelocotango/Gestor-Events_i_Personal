import asyncio
from playwright.async_api import async_playwright, expect
import os
import re

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Go to the app
            await page.goto("http://localhost:5173", timeout=60000)

            # Wait for the welcome screen to be visible
            await expect(page.get_by_text("Benvingut/da. Si us plau, obre un document existent o crea'n un de nou per començar.")).to_be_visible(timeout=30000)

            # Click "Nou Document" to get to the main interface
            await page.get_by_role("button", name="Nou Document").click()

            # Wait for the main display to load and expand the event list section
            await expect(page.get_by_text("Vista de Calendari")).to_be_visible(timeout=30000)
            await page.get_by_role("button", name=re.compile("Llista d'Esdeveniments")).click()

            # Manually add an old event to test archiving
            await page.get_by_role("button", name="Afegir Nou Marc").click()

            # Fill out the form for an old event
            await expect(page.get_by_text("Afegir Nou Marc d'Esdeveniment")).to_be_visible()
            await page.get_by_label("Nom de l'esdeveniment").fill("Esdeveniment Antic per Arxivar")
            await page.get_by_label("Data d'inici").fill("2020-01-01")
            await page.get_by_label("Data de Fi").fill("2020-01-05")
            await page.get_by_role("button", name="Crear", exact=True).click()

            # ** CRITICAL FIX 2: Use a specific selector for the card title to avoid strict mode violation **
            await expect(page.get_by_role("heading", name="Esdeveniment Antic per Arxivar")).to_be_visible()

            # --- 1. Verify the 'Arxivar Antics' button and modal ---
            archive_button = page.get_by_role("button", name="Arxivar Antics")
            await expect(archive_button).to_be_visible()
            await archive_button.click()

            # The modal should appear
            await expect(page.get_by_text(re.compile("Estàs segur que vols arxivar 1 esdeveniments antics?"))).to_be_visible()
            await page.screenshot(path="jules-scratch/verification/01_archive_modal.png")

            # Confirm archiving
            await page.get_by_role("button", name="Arxivar").click()

            # Check for success toast
            await expect(page.get_by_text("1 esdeveniments arxivats correctament.")).to_be_visible()

            # --- 2. Verify the archived view ---
            show_archived_checkbox = page.get_by_label("Mostrar arxivats")
            await expect(show_archived_checkbox).to_be_visible()
            await show_archived_checkbox.check()

            # The title should change
            await expect(page.get_by_text("Esdeveniments Arxivats")).to_be_visible()

            # Check if our archived event is visible
            await expect(page.get_by_text("Esdeveniment Antic per Arxivar")).to_be_visible()
            await page.screenshot(path="jules-scratch/verification/02_archived_view.png")

            # --- 3. Verify the restore functionality ---
            # Find the card for the archived event
            archived_event_card = page.locator(".bg-white:has-text('Esdeveniment Antic per Arxivar')")
            await expect(archived_event_card).to_be_visible()

            # Click the restore button inside that card
            restore_button = archived_event_card.get_by_role("button", name="Restaurar")
            await expect(restore_button).to_be_visible()
            await restore_button.click()

            # The event should disappear from the archived view
            await expect(archived_event_card).not_to_be_visible()

            # --- 4. Verify Tech Sheets integration ---
            await page.get_by_role("link", name="Fitxes de Bolo").click()
            await expect(page.get_by_text("Gestor de Fitxes de Bolo")).to_be_visible()

            # Check that the restored event is in the list
            event_selector = page.get_by_label("Selecciona un esdeveniment per veure o editar la seva fitxa:")
            restored_event_option_text = "1/1/2020 - Esdeveniment Antic per Arxivar"
            await expect(event_selector.locator(f"option", text=re.compile(restored_event_option_text))).to_be_visible()

            # Go back and archive again to test the other path
            await page.get_by_role("link", name="Calendari i Llista").click()
            await page.get_by_role("button", name="Arxivar Antics").click()
            await page.get_by_role("button", name="Arxivar").click()
            await expect(page.get_by_text("1 esdeveniments arxivats correctament.")).to_be_visible()

            # Go back to Tech Sheets
            await page.get_by_role("link", name="Fitxes de Bolo").click()
            await expect(page.get_by_text("Gestor de Fitxes de Bolo")).to_be_visible()

            # Check that the event is NOT in the list by default
            await expect(event_selector.locator(f"option", text=re.compile(restored_event_option_text))).not_to_be_visible()

            # Check the box to include archived events
            include_archived_checkbox = page.get_by_label("Incloure arxivats")
            await expect(include_archived_checkbox).to_be_visible()
            await include_archived_checkbox.check()

            # The archived event should now be visible in the dropdown
            await expect(event_selector.locator(f"option", text=re.compile(restored_event_option_text))).to_be_visible()
            await page.screenshot(path="jules-scratch/verification/03_tech_sheets_view.png")

            print("Verification script completed successfully!")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

async def main():
    await run_verification()

if __name__ == "__main__":
    asyncio.run(main())