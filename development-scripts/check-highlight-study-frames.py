"""Check actual Premiere study frames; this does not claim artistic acceptance."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

folder = Path(sys.argv[1])
results = []
for name, start in [("A", 0), ("B", 45), ("C", 90)]:
    frames = [Image.open(folder / f"{start+i:04d}.png").convert("RGB") for i in range(36)]
    assert all(im.size == (1080, 1920) for im in frames), "Wrong frame size"
    bounds = [im.getbbox() for im in frames]
    assert bounds[20] is not None, f"Empty {name} reading frame"
    assert all(bounds[i] == bounds[20] for i in range(14, 33)), f"Drifting {name} hold"
    hold_equal = all(ImageChops.difference(frames[i], frames[20]).getbbox() is None for i in range(14, 33))
    assert hold_equal, f"Changing pixels during {name} reading hold"
    changing = sum(ImageChops.difference(frames[i], frames[i-1]).getbbox() is not None for i in range(1, 14))
    assert changing > 2, f"Missing {name} entrance animation"
    results.append({"study": name, "frames": 36, "reading_bounds": bounds[20], "unchanged_hold_frames": 19, "changing_entrance_frames": changing})
output = {"source": "actual Premiere PNG exports", "results": results, "artistic_acceptance": False}
print(json.dumps(output, ensure_ascii=False, indent=2))
