"""Download a pinned CPU runtime and model into this project (Linux x86_64)."""

import hashlib
import os
from pathlib import Path
import platform
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / ".runtime"
FILES = [
    (
        "llama.tar.gz",
        "https://github.com/ggml-org/llama.cpp/releases/download/b11146/llama-b11146-bin-ubuntu-x64.tar.gz",
        "c150306eb16b5ab696f76a8bdf810c35fd98a24e82158742e6fa28f420ff8410",
    ),
    (
        "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/91cad51170dc346986eccefdc2dd33a9da36ead9/qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e",
    ),
]


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def main():
    if platform.system() != "Linux" or platform.machine() != "x86_64":
        raise SystemExit("Use the Ollama setup in README.md on this platform.")
    RUNTIME.mkdir(exist_ok=True)
    for name, url, expected in FILES:
        target = RUNTIME / name
        if target.exists() and digest(target) == expected:
            print(f"Verified existing {name}", flush=True)
            continue
        temporary = target.with_suffix(target.suffix + ".part")
        print(f"Downloading {name} (model is approximately 1.12 GB)…", flush=True)
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
    with tarfile.open(RUNTIME / "llama.tar.gz") as archive:
        archive.extractall(RUNTIME / "llama", filter="data")
    print("Ready. Run: python3 scripts/run_local.py", flush=True)


if __name__ == "__main__":
    main()
