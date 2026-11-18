"""Re-encode the game textures as WebP, keeping each texture's own pixel size
(the game relies on those sizes), except the large card pictures and
backgrounds which are drawn smaller than their source anyway."""
import os
import sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
# name -> max width in pixels for pictures that are always drawn scaled down
SHRINK = {
    "up_amo.png": 400, "up_hp.png": 400, "up_lf.png": 400, "up_ms.png": 400,
    "story_back_closed.png": 1600, "story_back_open.png": 1600,
    "background_menu.png": 1600,
}
LOSSLESS = {"crosshair.png", "player.png", "gun.png", "explosion.png",
            "button.png", "button_clic.png", "upgrade.png", "up_click.png",
            "hp.png", "amo.png", "cor_rect.png", "dash_icon.png",
            "diag_box.png", "game_over.png"}

for name in sorted(os.listdir(os.path.join(SRC, "tex"))):
    im = Image.open(os.path.join(SRC, "tex", name))
    im = im.convert("RGBA") if ("A" in im.mode or im.mode == "P") else im.convert("RGB")
    if name in SHRINK and im.width > SHRINK[name]:
        w = SHRINK[name]
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    target = os.path.join(OUT, "tex", name.replace(".png", ".webp"))
    if name in LOSSLESS:
        im.save(target, "WEBP", lossless=True, method=6)
    else:
        im.save(target, "WEBP", quality=82, method=6)
    print(f"{name:24} {im.size} {os.path.getsize(target) // 1024} KB")
