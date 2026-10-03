"""Start the downloaded local model and QuietPrep. Ctrl-C stops both."""

import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def main():
    candidates = list((ROOT / ".runtime" / "llama").rglob("llama-server"))
    model = ROOT / ".runtime" / "qwen2.5-1.5b-instruct-q4_k_m.gguf"
    if not candidates or not model.exists():
        raise SystemExit("Run python3 scripts/setup_local.py first.")
    executable = candidates[0]
    environment = os.environ.copy()
    environment["LD_LIBRARY_PATH"] = str(executable.parent)
    children = []

    def stop(*_):
        for child in reversed(children):
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()

    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    try:
        log = (ROOT / ".runtime" / "model.log").open("w")
        children.append(subprocess.Popen([
            str(executable), "-m", str(model), "--host", "127.0.0.1",
            "--port", "8091", "-c", "4096", "-t", "6", "-ngl", "0",
            "--alias", "qwen2.5:1.5b", "--no-webui", "--no-slots",
            "--cors-origins", "http://127.0.0.1:8767", "--log-verbosity", "1",
        ], env=environment, stdout=log, stderr=log))
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        for _ in range(120):
            if children[0].poll() is not None:
                raise SystemExit("Model failed to start; check .runtime/model.log.")
            try:
                with opener.open("http://127.0.0.1:8091/health", timeout=2):
                    break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(0.5)
        else:
            raise SystemExit("Model startup timed out; check .runtime/model.log.")
        environment["QUIETPREP_BACKEND"] = "llama"
        environment["QUIETPREP_MODEL_URL"] = "http://127.0.0.1:8091"
        children.append(subprocess.Popen([sys.executable, str(ROOT / "server.py")], env=environment))
        while all(child.poll() is None for child in children):
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        stop()


if __name__ == "__main__":
    main()
