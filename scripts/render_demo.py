"""Render the synthetic browser recording with captions. Requires ffmpeg.

Run browser_check.mjs --record first. Capture is sampled at approximately 2 Hz;
playback is not a latency benchmark. No application or model data is uploaded.
"""

import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def timestamp(seconds):
    hundredths = round(seconds * 100)
    hours, remaining = divmod(hundredths, 360_000)
    minutes, remaining = divmod(remaining, 6_000)
    whole, fraction = divmod(remaining, 100)
    return f"{hours}:{minutes:02d}:{whole:02d}.{fraction:02d}"


def main():
    executable = shutil.which("ffmpeg")
    if not executable:
        raise SystemExit("Install ffmpeg to render a demo; it is not needed to run QuietPrep.")
    recording = json.loads((ROOT / ".runtime/recording.json").read_text())
    duration = recording["frames"] / recording["fps"]
    stages = recording["stages"]
    captions = """[Script Info]
ScriptType: v4.00+
PlayResX: 1440
PlayResY: 1100
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,22,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,40,40,12,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    for index, stage in enumerate(stages):
        start = stage["frame"] / recording["fps"]
        end = stages[index + 1]["frame"] / recording["fps"] if index + 1 < len(stages) else duration
        label = stage["label"].replace("{", "(").replace("}", ")").replace("\\", " ")
        label += r"\N{\fs16}Synthetic example · local CPU inference · sampled recording"
        captions += f"Dialogue: 0,{timestamp(start)},{timestamp(end)},Default,,0,0,0,,{label}\n"
    (ROOT / ".runtime/demo-captions.ass").write_text(captions, encoding="utf-8")
    output = ROOT / "docs/media/quietprep-demo.mp4"
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        executable, "-y", "-hide_banner", "-loglevel", "error",
        "-framerate", str(recording["fps"]), "-i", str(Path(recording["directory"]) / "demo_%04d.png"),
        "-t", str(duration), "-vf",
        "drawbox=x=0:y=ih-76:w=iw:h=76:color=0x273827@0.96:t=fill,subtitles=.runtime/demo-captions.ass",
        "-c:v", "libx264", "-preset", "fast", "-crf", "24", "-pix_fmt", "yuv420p",
        "-r", "24", "-movflags", "+faststart", str(output),
    ], cwd=ROOT, check=True)
    print(f"Saved {output} ({duration:.1f} seconds).")


if __name__ == "__main__":
    main()
