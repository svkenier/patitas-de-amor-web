import os
from PIL import Image

workspace_dir = r"C:\Users\SVKENIER\OneDrive\Escritorio\patitas-de-amor-bqto\patitasDeAmorBqto"
public_dir = os.path.join(workspace_dir, "public")

desktop_old = os.path.join(public_dir, "hero-desktop.webp")
desktop_backup = os.path.join(public_dir, "hero-desktop.backup.webp")
if os.path.exists(desktop_old) and not os.path.exists(desktop_backup):
    os.rename(desktop_old, desktop_backup)

mobile_old = os.path.join(public_dir, "hero-mobile.webp")
mobile_backup = os.path.join(public_dir, "hero-mobile.backup.webp")
if os.path.exists(mobile_old) and not os.path.exists(mobile_backup):
    os.rename(mobile_old, mobile_backup)

desktop_new_src = r"C:\Users\SVKENIER\.gemini\antigravity-ide\brain\ab395417-db44-4ef9-bfdc-68f4cf0731f6\hero_desktop_sharp_1789840866687.jpg"
mobile_new_src = r"C:\Users\SVKENIER\.gemini\antigravity-ide\brain\ab395417-db44-4ef9-bfdc-68f4cf0731f6\hero_mobile_sharp_1789840884056.jpg"

if os.path.exists(desktop_new_src):
    img = Image.open(desktop_new_src)
    img.save(os.path.join(public_dir, "hero-desktop.webp"), "WEBP", quality=85)
    print("Saved hero-desktop.webp")

if os.path.exists(mobile_new_src):
    img = Image.open(mobile_new_src)
    img.save(os.path.join(public_dir, "hero-mobile.webp"), "WEBP", quality=85)
    print("Saved hero-mobile.webp")

print("Conversion complete.")
