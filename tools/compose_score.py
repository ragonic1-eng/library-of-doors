"""Original procedural ambient score. No samples, model, credentials or paid services.
Run: python tools/compose_score.py (requires numpy, scipy and ffmpeg).
Versioned files ship with the app; no Blob upload is needed.
"""
from pathlib import Path
import subprocess
import tempfile
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io.wavfile import write

OUT = Path(__file__).resolve().parents[1] / 'app/public/audio/music'
SR, SECONDS = 24000, 40
# Each phrase shares a small rising three-note motif, with different harmony and space.
SCORES = {
    'crossroads-v1': ([50, 57, 60, 64], [74, 77, 81, 76, 74, 72, 69, 76], 'wind'),
    'hell-v1': ([38, 45, 51, 57], [62, 63, 69, 62], 'rumble'),
    'ruby-v1': ([45, 52, 58, 64], [69, 70, 76, 73, 69, 76, 70, 64], 'pulse'),
    'wings-v1': ([48, 55, 62, 64], [72, 76, 79, 81, 79, 76, 74, 72], 'air'),
    'friend-v1': ([43, 50, 57, 59], [67, 71, 74, 78, 74, 71, 69, 67], 'room'),
}

def render(chord, melody, texture, seed):
    rng = np.random.default_rng(seed)
    n = SR * SECONDS
    t = np.arange(n) / SR
    stereo = np.zeros((n, 2))
    for i, note in enumerate(chord):
        # Integer periods in the loop: no discontinuity at the file boundary.
        freq = round(440 * 2 ** ((note - 69) / 12) * SECONDS) / SECONDS
        phase = rng.uniform(0, 2 * np.pi)
        tone = np.sin(2*np.pi*freq*t + phase) + .13*np.sin(2*np.pi*freq*2*t + phase)
        swell = .045 * (1 + .35*np.cos(2*np.pi*(i+1)*t/SECONDS))
        pan = .2 + .6 * i / (len(chord)-1)
        stereo += (tone*swell)[:, None] * [np.sqrt(1-pan), np.sqrt(pan)]
    # Soft struck-glass motif; circular delay creates a continuous reverberant loop.
    for i, note in enumerate(melody):
        start = int((i*SECONDS/len(melody) + 1)*SR)
        local = np.arange(7*SR)/SR
        freq = 440 * 2 ** ((note-69)/12)
        env = (1-np.exp(-local*15))*np.exp(-local/.95)
        tone = .08*env*(np.sin(2*np.pi*freq*local)+.15*np.sin(2*np.pi*freq*2.01*local))
        indices = (start+np.arange(len(local))) % n
        for echo, gain in [(0,1),(.23,.24),(.49,.15),(.83,.09)]:
            stereo[(indices+int(echo*SR))%n, i%2] += gain*tone
            stereo[(indices+int((echo+.11)*SR))%n, 1-i%2] += gain*.5*tone
    noise = rng.normal(0, 1, (n,2))
    cutoff = 170 if texture in ('rumble','room') else 850
    noise = sosfilt(butter(2, cutoff, fs=SR, output='sos'), noise, axis=0)
    noise *= .014 * (1+.4*np.sin(2*np.pi*t/10))[:,None]
    # Smooth the noise seam without touching music or recorded voices.
    edge = SR
    noise[:edge] *= np.linspace(0,1,edge)[:,None]
    noise[-edge:] *= np.linspace(1,0,edge)[:,None]
    stereo += noise
    if texture == 'pulse':
        stereo += (.017*np.sin(2*np.pi*55*t)*(1+np.cos(2*np.pi*t/2))**2)[:,None]
    stereo *= .42 / max(.42, np.max(np.abs(stereo)))
    # A 20 ms seam envelope also protects against MP3 encoder boundary transients.
    edge = int(.02 * SR)
    stereo[:edge] *= np.linspace(0, 1, edge)[:, None]
    stereo[-edge:] *= np.linspace(1, 0, edge)[:, None]
    return stereo.astype(np.float32)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for i,(name,spec) in enumerate(SCORES.items()):
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp)/'score.wav'
            write(wav, SR, render(*spec, i+431))
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),
                '-af','loudnorm=I=-25:TP=-3:LRA=7','-ar',str(SR),'-codec:a','libmp3lame','-b:a','64k',
                str(OUT/f'{name}.mp3')], check=True)
        print(name)
