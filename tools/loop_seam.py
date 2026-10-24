"""Measure how invisible a talking loop's join is: mean absolute difference (0-255) between its first and last frame.

    python -I tools/loop_seam.py <clip.mp4>

Prints `seam <n>  motion <m>`: seam under 6 is the plan's go line (rule 13); motion is the largest difference between the
first frame and any frame sampled through the clip, so a frozen clip (motion near 0) cannot pass as a perfect loop.
"""
import sys

import cv2
import numpy as np


def frames(path):
    cap = cv2.VideoCapture(path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    out = []
    for i in sorted({0, n // 4, n // 2, 3 * n // 4, max(n - 1, 0)}):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, f = cap.read()
        if ok:
            out.append(cv2.resize(f, (640, 360)).astype(np.float32))
    cap.release()
    return out


fs = frames(sys.argv[1])
if len(fs) < 2:
    sys.exit("could not read the clip")
seam = float(np.abs(fs[0] - fs[-1]).mean())
motion = max(float(np.abs(fs[0] - f).mean()) for f in fs[1:-1]) if len(fs) > 2 else 0.0
print(f"seam {seam:.2f}  motion {motion:.2f}")
