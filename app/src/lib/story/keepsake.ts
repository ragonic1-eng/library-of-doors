// Her Reading as a picture to keep or send: drawn on the phone in a canvas (portrait 1080x1920, the size phones
// share best), with no server and no cost.
import type { Reading } from "./types";

const W = 1080, H = 1920, PAD = 90;
const GOLD = "#c9a24a", INK = "#efe8da", DIM = "#9a948a", BLUE = "#aab4ea";
const SERIF = 'Georgia, "Times New Roman", serif';

/** Draws text wrapped to a width; returns the y below it. */
function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lh: number, align: CanvasTextAlign = "center", draw = true): number {
  c.textAlign = align;
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > width && line) {
      if (draw) c.fillText(line, x, y);
      y += lh;
      line = word;
    } else line = test;
  }
  if (line && draw) c.fillText(line, x, y);
  return y + lh;
}

function label(c: CanvasRenderingContext2D, text: string, y: number, color = GOLD) {
  c.font = `28px ${SERIF}`;
  c.fillStyle = color;
  c.textAlign = "center";
  c.fillText(text.toUpperCase().split("").join(String.fromCharCode(8202)), W / 2, y); // hair spaces: letter-spaced caps
}

export async function drawKeepsake(r: Reading, o: { book: string; ending: string; mercy: number; dedication: string }): Promise<Blob> {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  const bg = c.createRadialGradient(W / 2, 380, 50, W / 2, 700, 1400);
  bg.addColorStop(0, "#1d1810");
  bg.addColorStop(1, "#050507");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  c.strokeStyle = "rgba(201,162,74,0.45)";
  c.lineWidth = 2;
  c.strokeRect(40, 40, W - 80, H - 80);
  for (let i = 0; i < 90; i++) { // a little dream dust
    c.fillStyle = `rgba(201,162,74,${0.08 + Math.random() * 0.3})`;
    c.beginPath();
    c.arc(60 + Math.random() * (W - 120), 60 + Math.random() * (H - 120), Math.random() * 2.4, 0, Math.PI * 2);
    c.fill();
  }

  let y = 150;
  label(c, `The Library of Doors · ${o.book}`, y);
  y += 95;
  c.fillStyle = INK;
  c.font = `italic 76px ${SERIF}`;
  y = wrap(c, r.archetype, W / 2, y, W - 2 * PAD, 84);
  if (r.dream?.title) {
    y += 20;
    label(c, "What kind of Dream you are", y);
    y += 70;
    c.fillStyle = "#f0e2bd";
    c.font = `italic 58px ${SERIF}`;
    y = wrap(c, r.dream.title, W / 2, y, W - 2 * PAD, 66);
  }
  c.fillStyle = "#d9c8a0";
  c.font = `italic 32px ${SERIF}`;
  y = wrap(c, r.tagline, W / 2, y + 10, W - 2 * PAD - 40, 44);

  if (r.dream?.gifts.length) {
    y += 30;
    label(c, "The dreams you give", y);
    y += 40;
    for (const g of r.dream.gifts.slice(0, 3)) {
      const top = y, tw = W - 2 * PAD - 72;
      const body = (draw: boolean) => {
        c.font = `24px ${SERIF}`;
        c.fillStyle = BLUE;
        const mid = wrap(c, `FOR ${g.to.toUpperCase()}`, PAD + 36, top + 52, tw, 32, "left", draw);
        c.font = `italic 29px ${SERIF}`;
        c.fillStyle = "#e4e1f2";
        return wrap(c, g.dream, PAD + 36, mid + 6, tw, 40, "left", draw);
      };
      const bottom = body(false); // measure, draw the card, then the words on it
      c.strokeStyle = "rgba(160,170,230,0.35)";
      c.fillStyle = "rgba(70,80,160,0.14)";
      c.fillRect(PAD, top, W - 2 * PAD, bottom - top);
      c.strokeRect(PAD, top, W - 2 * PAD, bottom - top);
      body(true);
      y = bottom + 22;
      if (y > H - 520) break;
    }
  }
  if (r.dream?.nightmare && y < H - 420) {
    y += 20;
    label(c, "Your nightmares", y, "#d98b7a");
    c.font = `italic 28px ${SERIF}`;
    c.fillStyle = "#e6cfca";
    y = wrap(c, r.dream.nightmare, W / 2, y + 50, W - 2 * PAD - 40, 40);
  }
  if (r.depth?.strengths.length && y < H - 300) {
    c.font = `30px ${SERIF}`;
    c.fillStyle = "#ead9ac";
    y = wrap(c, r.depth.strengths.join("  ·  "), W / 2, y + 40, W - 2 * PAD, 42);
  }

  c.fillStyle = DIM;
  c.font = `28px ${SERIF}`;
  c.textAlign = "center";
  c.fillText(`Ending: ${o.ending}   ·   Mercy ${o.mercy > 0 ? "+" : ""}${o.mercy}`, W / 2, H - 170);
  c.fillStyle = GOLD;
  c.font = `italic 30px ${SERIF}`;
  c.fillText(o.dedication, W / 2, H - 110);

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("no image"))), "image/png"));
}

/** Opens the phone's share sheet with the picture (WhatsApp, Photos...), or downloads it where sharing is not offered. */
export async function shareKeepsake(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "My Reading" });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // she closed the share sheet
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
