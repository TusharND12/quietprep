"""Download a pinned CPU runtime and model into this project (Linux x86_64)."""

import argparse
import hashlib
import os
from pathlib import Path
import platform
import tarfile
import tempfile
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from models import MODELS

RUNTIME = ROOT / ".runtime"
FILES = [
    (
        "llama.tar.gz",
        "https://github.com/ggml-org/llama.cpp/releases/download/b11146/llama-b11146-bin-ubuntu-x64.tar.gz",
        "c150306eb16b5ab696f76a8bdf810c35fd98a24e82158742e6fa28f420ff8410",
    ),
]


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def main():
    if platform.system() != "Linux" or platform.machine() != "x86_64":
        raise SystemExit("Use the Ollama setup in README.md on this platform.")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", choices=MODELS, default="coaching")
    args = parser.parse_args()
    model = MODELS[args.model]
    files = [*FILES, (model["filename"], model["url"], model["sha256"])]
    print(f"Selected {model['name']} ({model['download_gb']:.2f} GB download).", flush=True)
    RUNTIME.mkdir(exist_ok=True)
    for name, url, expected in files:
        target = RUNTIME / name
        if target.exists() and digest(target) == expected:
            print(f"Verified existing {name}", flush=True)
            continue
        temporary = target.with_suffix(target.suffix + ".part")
        print(f"Downloading {name}…", flush=True)
        request = urllib.request.Request(url, headers={"User-Agent": "QuietPrep-setup/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response, temporary.open("wb") as output:
            downloaded = 0
            next_report = 100 * 1024 * 1024
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                downloaded += len(chunk)
                if downloaded >= next_report:
                    print(f"  {downloaded // (1024 * 1024)} MiB", flush=True)
                    next_report += 100 * 1024 * 1024
        if digest(temporary) != expected:
            raise SystemExit(f"Checksum mismatch for {name}; refusing to use it.")
        os.replace(temporary, target)
        print(f"SHA-256 verified: {name}", flush=True)
    runtime_dir = RUNTIME / "llama"
    marker = runtime_dir / ".archive-sha256"
    if not marker.exists() or marker.read_text().strip() != FILES[0][2] or not any(runtime_dir.rglob("llama-server")):
        # Extract separately, then rename files into place. Switching models must
        # not truncate a runtime executable that may already be running.
        with tempfile.TemporaryDirectory(dir=RUNTIME) as directory:
            staged = Path(directory)
            with tarfile.open(RUNTIME / "llama.tar.gz") as archive:
                archive.extractall(staged, filter="data")
            for source in sorted(staged.rglob("*"), key=lambda path: len(path.parts)):
                target = runtime_dir / source.relative_to(staged)
                if source.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    os.replace(source, target)
            marker.write_text(FILES[0][2] + "\n")
    print(f"Ready. Run: python3 scripts/run_local.py --model {args.model}", flush=True)


if __name__ == "__main__":
    main()
