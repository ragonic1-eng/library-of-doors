"""Inventory every scene/conditional/aftermath; optionally decode every remote narration.
python tools/audit_audio.py [--online]
Network or metadata checks never certify word-for-word speech: listen/transcribe flagged files.
"""
import concurrent.futures, hashlib, json, os, subprocess, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('NEXT_PUBLIC_CLIP_BASE', 'https://7zfkb2xtonrtoupx.public.blob.vercel-storage.com/clips').rstrip('/')
OUT = ROOT / 'audit'
OUT.mkdir(exist_ok=True)

def line_id(text):
    h = 0x811c9dc5
    for b in text.strip().encode():
        h = ((h ^ b) * 0x01000193) & 0xffffffff
    return f'{h:08x}'

rows, scenes = [], []
for path in sorted((ROOT/'app/src/content/books').glob('*/book.json')):
    book=json.loads(path.read_text())
    for sid, scene in book['scenes'].items():
        count=0
        groups=[('beat',scene.get('beats',[]))] + [(f"choice:{c['id']}",c.get('aftermath',[])) for c in scene.get('choices',[])]
        for group, beats in groups:
            for i,beat in enumerate(beats):
                if not beat.get('text'): continue
                lid=line_id(beat['text']); count+=1
                rows.append(dict(book=book['id'],scene=sid,location=f'{group}:{i}',text=beat['text'],
                    conditions={k:beat[k] for k in ('if','unless') if k in beat},id=lid,
                    url=f"{BASE}/{book['id']}/audio/lines/{lid}.mp3",status='not-fetched',listening='not-verified'))
        conv=scene.get('conversation',{})
        scenes.append(dict(book=book['id'],scene=sid,title=scene['title'],narrator_references=count,
            character=conv.get('character'),opening=conv.get('opening'),inner_voice=scene.get('innerVoice'),
            music=scene.get('music'),live_voice='requires-live-playback' if conv or scene.get('innerVoice') else 'not-applicable'))

cache=OUT/'cache'
def fetch(row):
    dest=cache/f"{row['book']}-{row['id']}.mp3"
    try:
        with urllib.request.urlopen(row['url'],timeout=15) as response: data=response.read()
        dest.write_bytes(data)
        meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(dest)]))
        duration=float(meta['format']['duration'])
        subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-f','null','-'],check=True,capture_output=True)
        wps=len(row['text'].split())/duration
        return dict(status='decoded-needs-listening',duration=round(duration,3),words_per_second=round(wps,2),
            duration_flag='review-short-take' if wps>4.5 else 'none',sha256=hashlib.sha256(data).hexdigest())
    except Exception as e: return dict(status='unavailable',error=str(e)[:200])

network='not-requested'
if '--online' in sys.argv:
    cache.mkdir(exist_ok=True)
    first=fetch(rows[0])
    if first['status']=='unavailable':
        network=first['error']
        for row in rows: row.update(status='blocked-before-media-audit',error=network)
    else:
        network='available'
        unique={row['url']:row for row in rows}
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            results=dict(zip(unique,pool.map(fetch,unique.values())))
        for row in rows: row.update(results[row['url']])
report=dict(network=network,scene_count=len(scenes),narration_references=len(rows),
    unique_recordings=len({r['url'] for r in rows}),scenes=scenes,recordings=rows)
(OUT/'audio-inventory.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({k:report[k] for k in ('network','scene_count','narration_references','unique_recordings')},indent=2))
