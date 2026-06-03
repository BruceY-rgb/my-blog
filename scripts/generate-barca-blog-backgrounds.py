from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "source/img/barca-bg/raw"
OUT = ROOT / "source/img/barca-bg/final"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def fit_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGBA")
    sw, sh = size
    scale = max(sw / img.width, sh / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    return img.crop(((nw - sw) // 2, (nh - sh) // 2, (nw + sw) // 2, (nh + sh) // 2))


def fit_contain(img: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGBA")
    mw, mh = max_size
    scale = min(mw / img.width, mh / img.height)
    return img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)


def linear_gradient(left: tuple[int, int, int], right: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for x in range(W):
        t = x / (W - 1)
        color = tuple(int(left[i] * (1 - t) + right[i] * t) for i in range(3))
        for y in range(H):
            px[x, y] = color
    return img.convert("RGBA")


def add_noise(img: Image.Image, amount: int = 20, alpha: int = 28) -> Image.Image:
    rng = random.Random(23)
    noise = Image.new("RGBA", img.size, (0, 0, 0, 0))
    px = noise.load()
    for y in range(0, img.height, 2):
        for x in range(0, img.width, 2):
            v = rng.randint(-amount, amount)
            c = 128 + v
            px[x, y] = (c, c, c, alpha)
    return Image.alpha_composite(img, noise.resize(img.size, Image.Resampling.NEAREST))


def draw_fabric(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int], step: int = 16) -> None:
    for x in range(-H, W + H, step):
        draw.line([(x, 0), (x + H, H)], fill=color, width=1)
    for x in range(0, W, step * 4):
        draw.line([(x, 0), (x, H)], fill=(255, 255, 255, max(6, color[3] // 2)), width=1)


def draw_pitch_lines(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int], y_offset: int = 180) -> None:
    for r, a in [(900, 58), (680, 70), (470, 90)]:
        box = (W // 2 - r, H - y_offset - r // 2, W // 2 + r, H - y_offset + r * 2)
        draw.arc(box, 200, 340, fill=(color[0], color[1], color[2], a), width=4)
    draw.line([(W // 2, 0), (W // 2, H)], fill=(color[0], color[1], color[2], max(26, color[3] // 2)), width=4)


def draw_stadium_lights(draw: ImageDraw.ImageDraw, color=(255, 225, 150, 130)) -> None:
    for i in range(11):
        x = int(W * (0.48 + i * 0.046))
        y = 170 + int(math.sin(i * 0.7) * 28)
        draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=color)
        draw.line((x, y, x - 280, H), fill=(color[0], color[1], color[2], 18), width=3)


def add_crest_watermark(base: Image.Image, xy: tuple[int, int], size: int, opacity: int) -> None:
    crest = Image.open(RAW / "fcb-crest.png").convert("RGBA")
    crest = fit_contain(crest, (size, size))
    alpha = crest.getchannel("A").point(lambda p: int(p * opacity / 255))
    crest.putalpha(alpha)
    base.alpha_composite(crest, xy)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def add_photo_sticker(
    base: Image.Image,
    img_path: Path,
    box: tuple[int, int, int, int],
    angle: float = 0,
    label: str | None = None,
    label_pos: tuple[int, int] | None = None,
    crop: tuple[float, float, float, float] | None = None,
    dim: float = 1.0,
) -> None:
    src = Image.open(img_path).convert("RGBA")
    if crop:
        l, t, r, b = crop
        src = src.crop((int(src.width * l), int(src.height * t), int(src.width * r), int(src.height * b)))
    tw, th = box[2] - box[0], box[3] - box[1]
    src = fit_contain(src, (tw, th))
    if dim != 1.0:
        rgb = ImageEnhance.Brightness(src.convert("RGB")).enhance(dim).convert("RGBA")
        rgb.putalpha(src.getchannel("A"))
        src = rgb

    if src.getchannel("A").getextrema()[0] == 255:
        mask = rounded_mask(src.size, 28)
        src.putalpha(mask)

    border = Image.new("RGBA", (src.width + 22, src.height + 22), (0, 0, 0, 0))
    shadow = Image.new("RGBA", border.size, (0, 0, 0, 0))
    shadow_mask = Image.new("L", border.size, 0)
    ImageDraw.Draw(shadow_mask).rounded_rectangle((10, 10, border.width - 10, border.height - 10), radius=34, fill=190)
    shadow.putalpha(shadow_mask.filter(ImageFilter.GaussianBlur(14)))
    border = Image.alpha_composite(border, shadow)
    draw = ImageDraw.Draw(border)
    draw.rounded_rectangle((6, 6, border.width - 7, border.height - 7), radius=34, fill=(255, 250, 231, 240))
    draw.rounded_rectangle((11, 11, border.width - 12, border.height - 12), radius=28, outline=(231, 187, 0, 210), width=4)
    border.alpha_composite(src, (11, 11))
    if angle:
        border = border.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    base.alpha_composite(border, (box[0], box[1]))

    if label and label_pos:
        tape = Image.new("RGBA", (260, 58), (0, 0, 0, 0))
        td = ImageDraw.Draw(tape)
        td.rounded_rectangle((0, 0, 260, 58), radius=8, fill=(236, 218, 160, 218))
        td.line((18, 45, 236, 43), fill=(111, 78, 34, 84), width=2)
        td.text((22, 12), label, font=font(24, True), fill=(42, 43, 50, 230))
        tape = tape.rotate(-5, expand=True, resample=Image.Resampling.BICUBIC)
        base.alpha_composite(tape, label_pos)


def add_small_text(draw: ImageDraw.ImageDraw, pos: tuple[int, int], lines: list[str], fill: tuple[int, int, int, int]) -> None:
    y = pos[1]
    for i, line in enumerate(lines):
        draw.text((pos[0], y), line, font=font(26 if i == 0 else 18, i == 0), fill=fill)
        y += 34 if i == 0 else 25
    draw.line((pos[0], y + 6, pos[0] + 68, y + 6), fill=fill, width=2)


def make_home() -> Image.Image:
    base = linear_gradient((5, 18, 45), (105, 13, 48))
    draw = ImageDraw.Draw(base, "RGBA")
    draw.rectangle((0, 0, int(W * 0.5), H), fill=(3, 25, 61, 235))
    draw.rectangle((int(W * 0.5), 0, W, H), fill=(116, 14, 54, 210))
    draw.rectangle((int(W * 0.5) - 5, 0, int(W * 0.5) + 5, H), fill=(237, 187, 0, 72))

    kit = fit_cover(Image.open(RAW / "home-kit-official.jpg"), (W, H))
    kit = ImageEnhance.Contrast(kit).enhance(1.15)
    kit = ImageEnhance.Color(kit).enhance(1.25)
    kit.putalpha(88)
    base.alpha_composite(kit, (0, 0))

    draw_fabric(draw, (255, 255, 255, 18), 14)
    draw_pitch_lines(draw, (237, 187, 0, 100), 160)
    draw_stadium_lights(draw)
    draw.rectangle((0, 0, int(W * 0.42), H), fill=(2, 13, 31, 104))
    draw.rectangle((0, 0, W, H), fill=(0, 0, 0, 18))
    draw.rectangle((0, H - 78, W, H), fill=(237, 187, 0, 245))
    draw.rectangle((0, H - 74, W, H), fill=(5, 8, 20, 210))

    add_crest_watermark(base, (W - 270, 78), 190, 235)
    add_crest_watermark(base, (W - 620, 360), 420, 32)

    add_photo_sticker(base, RAW / "official-lamine.png", (1128, 120, 1488, 660), -3, "Lamine Yamal", (1410, 168), dim=.96)
    add_photo_sticker(base, RAW / "official-lewandowski.png", (1410, 245, 1790, 770), 4, "Lewandowski", (1635, 455), dim=.93)
    add_photo_sticker(base, RAW / "official-pedri.png", (1180, 500, 1498, 985), -5, "Pedri", (1458, 705), dim=.92)

    add_small_text(draw, (52, 52), ["2024/25", "FC BARCELONA HOME KIT INSPIRED"], (237, 187, 0, 245))
    add_small_text(draw, (52, 825), ["MÉS QUE UN CLUB", "CAMP NOU · EST. 1957"], (237, 187, 0, 214))
    draw.text((1660, 255), "125", font=font(66, True), fill=(237, 187, 0, 225))
    draw.text((1668, 324), "YEARS", font=font(28, True), fill=(237, 187, 0, 215))
    draw.text((1550, 820), "BLAUGRANA", font=font(36, True), fill=(204, 25, 81, 224))

    edge = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge, "RGBA")
    ed.rectangle((0, 0, W, 150), fill=(0, 0, 0, 42))
    ed.rectangle((0, H - 220, W, H), fill=(0, 0, 0, 56))
    ed.rectangle((0, 0, 120, H), fill=(0, 0, 0, 30))
    base = Image.alpha_composite(base, edge.filter(ImageFilter.GaussianBlur(38)))
    return add_noise(base, 18, 20)


def make_third() -> Image.Image:
    base = linear_gradient((224, 249, 204), (181, 232, 197))
    draw = ImageDraw.Draw(base, "RGBA")
    draw.rectangle((0, 0, int(W * 0.42), H), fill=(232, 253, 214, 145))
    draw.rectangle((int(W * 0.42), 0, W, H), fill=(188, 238, 202, 58))
    draw_fabric(draw, (28, 122, 112, 22), 20)

    kit = fit_cover(Image.open(RAW / "third-kit-official.jpg"), (W, H))
    kit = ImageEnhance.Brightness(kit).enhance(1.1)
    kit = ImageEnhance.Color(kit).enhance(.75)
    kit.putalpha(42)
    base.alpha_composite(kit, (0, 0))

    # Clean title-safe panel on the left.
    draw.rectangle((0, 0, int(W * 0.42), H), fill=(232, 253, 214, 118))

    # Camp Nou line-art and pitch marks.
    for r, a in [(1000, 60), (760, 58), (520, 50)]:
        draw.ellipse((520 - r // 2, 210 - r // 5, 520 + r, 210 + r // 2), outline=(35, 129, 122, a), width=3)
    draw_pitch_lines(draw, (26, 122, 112, 62), 110)
    draw.rectangle((955, 270, 1365, 720), outline=(35, 129, 122, 46), width=3)
    draw.ellipse((1105, 410, 1215, 520), outline=(35, 129, 122, 50), width=3)

    add_crest_watermark(base, (1135, 120), 300, 34)
    add_crest_watermark(base, (W - 238, 70), 142, 145)

    # Official third-kit image used as a real-photo kit sticker; no AI face.
    add_photo_sticker(
        base,
        RAW / "third-kit-official.jpg",
        (1280, 150, 1735, 900),
        4,
        "Third Kit",
        (1570, 235),
        crop=(0.23, 0.0, 0.77, 1.0),
        dim=1.04,
    )

    add_small_text(draw, (52, 58), ["2024/25", "FC BARCELONA THIRD KIT INSPIRED"], (24, 116, 108, 245))
    add_small_text(draw, (52, 900), ["CAMP NOU · EST. 1957", "41.3809° N, 2.1228° E"], (24, 116, 108, 208))
    draw.text((1048, 835), "GROWTH\nHOPE\nREBIRTH", font=font(28, True), fill=(24, 116, 108, 146), spacing=8)
    draw.line((1170, 930, 1240, 910), fill=(24, 116, 108, 122), width=4)
    draw.line((1240, 910, 1218, 894), fill=(24, 116, 108, 122), width=4)
    draw.line((1240, 910, 1224, 934), fill=(24, 116, 108, 122), width=4)

    draw.rectangle((0, H - 16, W, H), fill=(237, 187, 0, 230))
    return add_noise(base, 12, 18)


def main() -> None:
    make_home().convert("RGB").save(OUT / "brucey-blog-home-theme-bg.png", quality=96)
    make_third().convert("RGB").save(OUT / "brucey-blog-third-kit-bg.png", quality=96)
    print(OUT / "brucey-blog-home-theme-bg.png")
    print(OUT / "brucey-blog-third-kit-bg.png")


if __name__ == "__main__":
    main()
