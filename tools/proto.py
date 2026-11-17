#!/usr/bin/env python3
"""Прототипи Потойбіччя: розкласти один HTML на частини і зібрати назад.

  python3 tools/proto.py build                       зібрати всі фічі й сторінку-розвідник у site/
  python3 tools/proto.py build <фіча>                зібрати одну фічу: site/<фіча>/index.html
  python3 tools/proto.py split <фіча> <файл.html>    один HTML -> <фіча>/src/index.html + src/a/* + src/bin/*

Фіча — це папка в корені репозиторію, у якій є src/index.html і feature.json (назва, опис, хто веде, стан).

split нічого не знає про код сторінки: він лише виймає все, що закодовано base64
(картинки, Rive-файл, rive.wasm), у файли, а на їхньому місці лишає позначку @@FILE:шлях@@.
build ставить файли назад. Після split одразу перевіряється, що build дає той самий HTML байт у байт.
"""
import base64, hashlib, html, json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
NOINDEX = '<meta name="robots" content="noindex,nofollow,noarchive">'   # просимо пошуковики не індексувати
MARK = "@@FILE:"          # позначка файла: @@FILE:a/header.webp@@
NL = "⏎\n"                # зайвий перенос рядка, який build прибирає (щоб довга мапа картинок була по рядку на картинку)
MIN_LEN = 400             # коротші base64-шматки лишаємо в коді

EXT = {"image/png": "png", "image/webp": "webp", "image/jpeg": "jpg", "image/gif": "gif",
       "image/svg+xml": "svg", "font/woff2": "woff2", "font/woff": "woff", "font/ttf": "ttf",
       "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg", "video/mp4": "mp4",
       "application/wasm": "wasm", "application/json": "json", "application/octet-stream": "bin"}
VAR_NAMES = {"__FISH_RIV": "bin/fish.riv", "__RIVE_WASM": "bin/rive.wasm"}

# 1) "ключ":"data:mime;base64,XXXX"   2) data:mime;base64,XXXX   3) window.__NAME="XXXX"
PAT = re.compile(
    r'(?:"(?P<key>[\w./-]+)":")?data:(?P<mime>[\w/+.-]+);base64,(?P<b64>[A-Za-z0-9+/]{%d,}={0,2})'
    r'|window\.(?P<var>__[A-Za-z0-9_]+)="(?P<vb64>[A-Za-z0-9+/]{%d,}={0,2})"' % (MIN_LEN, MIN_LEN))


def assemble(text, read_file):
    text = text.replace(NL, "")
    return re.sub(r"@@FILE:([^@]+)@@", lambda m: base64.b64encode(read_file(m.group(1))).decode(), text)


def split(feature, html_path):
    SRC = ROOT / feature / "src"
    INDEX = SRC / "index.html"
    html_path = pathlib.Path(html_path)
    src_text = html_path.read_bytes().decode("utf-8").replace(NOINDEX, "")
    assert MARK not in src_text and NL not in src_text, "у файлі вже є службові позначки — це не зібраний HTML"

    files, by_hash = {}, {}   # шлях -> байти; хеш -> шлях

    def repl(m):
        b64 = m.group("b64") or m.group("vb64")
        try:
            data = base64.b64decode(b64, validate=True)
        except Exception:
            return m.group(0)
        if base64.b64encode(data).decode() != b64:
            return m.group(0)
        h = hashlib.sha1(data).hexdigest()
        if m.group("var"):
            want = VAR_NAMES.get(m.group("var"), "bin/%s.bin" % m.group("var").strip("_").lower())
        else:
            key = m.group("key")
            ok = key and "/" in key and ".." not in key and not key.startswith("/")
            want = key if ok else None
        if want and files.get(want, data) != data:
            want = None                                   # така назва вже зайнята іншим вмістом
        if not want:
            want = by_hash.get(h) or "a/_%s.%s" % (h[:12], EXT.get(m.group("mime") or "", "bin"))
        files[want] = data
        by_hash.setdefault(h, want)
        return m.group(0)[: m.start("b64" if m.group("b64") else "vb64") - m.start()] + MARK + want + "@@" + \
            ('"' if m.group("var") else "")

    out = PAT.sub(repl, src_text)
    # довгі рядки з багатьма картинками (мапа window.__A) — по одній картинці на рядок
    lines = []
    for line in out.split("\n"):
        if line.count(MARK) > 3:
            line = line.replace('@@",', '@@",' + NL)
        lines.append(line)
    out = "\n".join(lines)

    assert assemble(out, lambda p: files[p]) == src_text, "перевірка не зійшлась: зібране відрізняється від вихідного"

    for d in (SRC / "a", SRC / "bin"):
        if d.exists():
            shutil.rmtree(d)
    for p, data in files.items():
        f = SRC / p
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(data)
    INDEX.parent.mkdir(parents=True, exist_ok=True)
    INDEX.write_bytes(out.encode("utf-8"))
    total = sum(len(d) for d in files.values())
    print("розкладено: src/index.html %.0f КБ, файлів %d (%.1f МБ). Перевірка: збирається назад байт у байт."
          % (len(out.encode()) / 1e3, len(files), total / 1e6))


def features():
    return sorted(d.name for d in ROOT.iterdir() if (d / "src" / "index.html").exists())


def meta(feature):
    f = ROOT / feature / "feature.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def build_one(feature):
    src = ROOT / feature / "src"
    text = assemble((src / "index.html").read_bytes().decode("utf-8"), lambda p: (src / p).read_bytes())
    if NOINDEX not in text:
        text = re.sub(r"<head[^>]*>", lambda m: m.group(0) + NOINDEX, text, count=1)
    out = SITE / feature / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(text.encode("utf-8"))
    print("зібрано: site/%s/index.html (%.1f МБ)" % (feature, out.stat().st_size / 1e6))


def build_hub():
    e = html.escape
    cards = []
    for f in features():
        m = meta(f)
        tags = "".join('<span>%s</span>' % e(m[k]) for k in ("owner", "status") if m.get(k))
        cards.append('<a class="card" href="%s/index.html"><h2>%s</h2><p>%s</p><div class="tags">%s</div></a>'
                     % (e(f), e(m.get("title", f)), e(m.get("about", "")), tags))
    page = (ROOT / "tools" / "hub.html").read_text(encoding="utf-8")
    SITE.mkdir(exist_ok=True)
    (SITE / "index.html").write_text(page.replace("<!--CARDS-->", "\n".join(cards)), encoding="utf-8")
    print("зібрано: site/index.html (розвідник, фіч: %d)" % len(cards))


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) == 3 and a[0] == "split":
        split(a[1], a[2])
    elif a and a[0] == "build" and len(a) <= 2:
        for f in (a[1:] or features()):
            build_one(f.strip("/"))
        build_hub()
    else:
        sys.exit(__doc__)
