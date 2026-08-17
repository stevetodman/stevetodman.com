"""Generate deterministic 4K synthetic ECG display states with Pillow.

All values are fictional and contain no patient identifiers. These textures are
for simulation presentation, not diagnosis or patient monitoring.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ASSET_DIR = Path(__file__).resolve().parents[1]
TEXTURE_DIR = ASSET_DIR / "textures"
TEXTURE_DIR.mkdir(parents=True, exist_ok=True)
WIDTH, HEIGHT = 4096, 2048


def font(size, bold=False):
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("/System/Library/Fonts/SFNS.ttf"),
        Path("/System/Library/Fonts/Helvetica.ttc"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
             "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def ecg_value(phase):
    def gaussian(center, width, amplitude):
        distance = min(abs(phase - center), 1.0 - abs(phase - center))
        return amplitude * math.exp(-((distance / width) ** 2))
    return (gaussian(0.18, 0.035, 0.12) - gaussian(0.39, 0.012, 0.20)
            + gaussian(0.415, 0.010, 1.05) - gaussian(0.445, 0.016, 0.32)
            + gaussian(0.70, 0.075, 0.28))


def waveform(draw, bounds, cycles, color, kind="ecg", width=10):
    left, top, right, bottom = bounds
    center = (top + bottom) / 2
    amplitude = (bottom - top) * 0.40
    points = []
    for pixel in range(left, right + 1, 3):
        normalized = (pixel - left) / max(1, right - left)
        phase = (normalized * cycles) % 1.0
        if kind == "ecg":
            value = ecg_value(phase)
        elif kind == "pleth":
            value = max(0.0, math.sin(phase * math.tau)) ** 3 - math.sin(phase * math.tau * 2) * 0.14
        else:
            value = math.sin(normalized * math.tau * cycles) * 0.45
        points.append((pixel, center - value * amplitude))
    draw.line(points, fill=color, width=width, joint="curve")


def render_state(key, title, heart_rate, spo2, bp, cycles, alert=False):
    image = Image.new("RGB", (WIDTH, HEIGHT), (2, 12, 20))
    draw = ImageDraw.Draw(image)
    green, cyan, amber = (45, 255, 116), (40, 190, 255), (255, 190, 55)
    white, dim, coral = (218, 238, 244), (22, 65, 78), (255, 70, 48)
    # Fine clinical grid, large trace lanes, and a separated numeric rail.
    for x in range(0, WIDTH, 64):
        draw.line((x, 0, x, HEIGHT), fill=(4, 23, 31), width=1)
    for y in range(0, HEIGHT, 64):
        draw.line((0, y, WIDTH, y), fill=(4, 23, 31), width=1)
    draw.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), outline=(35, 92, 106), width=6)
    draw.line((2920, 120, 2920, 1940), fill=dim, width=5)
    draw.line((100, 720, 2860, 720), fill=dim, width=4)
    draw.line((100, 1310, 2860, 1310), fill=dim, width=4)

    draw.text((110, 62), "CARDIOHOSPITAL  /  SIMULATION MONITOR", font=font(72, True), fill=white)
    draw.text((110, 155), title, font=font(58, True), fill=coral if alert else green)
    draw.text((110, 300), "LEAD II", font=font(42, True), fill=green)
    draw.text((110, 840), "PLETH", font=font(42, True), fill=cyan)
    draw.text((110, 1430), "RESP", font=font(42, True), fill=amber)
    waveform(draw, (180, 330, 2810, 690), cycles, green, "ecg", 11)
    waveform(draw, (180, 870, 2810, 1260), cycles * 0.92, cyan, "pleth", 10)
    waveform(draw, (180, 1490, 2810, 1820), 2.2, amber, "resp", 9)

    def centered(text, center_x, y, selected_font, fill):
        bounds = draw.textbbox((0, 0), text, font=selected_font)
        draw.text((center_x - (bounds[2] - bounds[0]) / 2, y), text, font=selected_font, fill=fill)

    centered("HR", 3500, 210, font(52, True), green)
    centered(str(heart_rate), 3500, 280, font(280, True), green)
    centered("bpm", 3500, 580, font(45), green)
    centered("SpO2", 3500, 760, font(52, True), cyan)
    centered(f"{spo2}%", 3500, 830, font(190, True), cyan)
    centered("NIBP mmHg", 3500, 1190, font(48, True), amber)
    centered(bp, 3500, 1270, font(150, True), amber)
    centered("NO PATIENT DATA", 3500, 1680, font(48, True), white)
    centered("SYNTHETIC DISPLAY", 3500, 1760, font(40), dim)
    path = TEXTURE_DIR / f"T_CH_WallECG_Screen_{key}_4K.png"
    image.save(path, format="PNG", optimize=True, compress_level=7)
    print(path)
    return path


def generate_all():
    return {
        "sinus": render_state("sinus", "NORMAL SINUS RHYTHM", 82, 98, "108/68", 4.3),
        "tachy": render_state("tachy", "SINUS TACHYCARDIA", 142, 97, "102/64", 7.2, True),
        "artifact": render_state("artifact", "CHECK LEAD CONTACT", 88, 98, "110/70", 4.6, True),
    }


if __name__ == "__main__":
    generate_all()
