# Makes the AceGuides study-guide cover images in ../img/aceguides/ (720px wide .webp, quality 82).
# Run from anywhere:  python3 kbventures-site/tools/make-covers.py
# Needs: pip install playwright pillow   (it uses Playwright's Chromium, or the one in /opt/pw-browsers if that is missing)
# The covers use the site's own font (Geist, loaded from fonts/geist-latin.woff2, weights 100-900), so they match the page.
# Full-size PNGs go to a temporary folder and are never saved in the repo.
import re, os, base64, tempfile, glob
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT = os.path.join(SITE, 'img', 'aceguides')
FONT = base64.b64encode(open(os.path.join(SITE, 'fonts', 'geist-latin.woff2'), 'rb').read()).decode()

y10=["Maths","Science","English","History","Economics & Business"]
vce=["English","Maths Methods","Biology","Chemistry","Physics","Business Management","Economics",("Modern History","Revolutions")]
items=[("Year 10",s,"year10") for s in y10]
for s in vce:
    a,b=(s,s) if isinstance(s,str) else s
    items.append(("VCE Units 1 & 2",a,"vce12")); items.append(("VCE Units 3 & 4",b,"vce34"))
def slug(t): return re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-')
TPL='''<!doctype html><meta charset=utf-8><style>
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,__FONT__) format("woff2")}
*{box-sizing:border-box;margin:0}
body{width:900px;height:1200px;background:#0D0E12;font-family:Geist;color:#E4E6ED;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 90% 55% at 50% -5%,#2a3347 0%,#151821 45%,#0B0C10 100%)}
.sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.05) 42%,transparent 54%)}
.grain{position:absolute;inset:0;opacity:.05;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>")}
.edge{position:absolute;inset:14px;border-radius:34px;border:1.5px solid transparent;background:linear-gradient(180deg,rgba(228,230,237,.75),rgba(138,143,158,.15) 55%,rgba(212,175,55,.65)) border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.top{position:absolute;left:84px;right:84px;top:96px;display:flex;justify-content:space-between;font-size:20px;letter-spacing:.34em;text-transform:uppercase;color:#9AA0AE;font-weight:500}
.gold{position:absolute;left:84px;top:150px;width:90px;height:2px;background:linear-gradient(90deg,#8E7424,#E7C867,#8E7424)}
.mono{position:absolute;right:-40px;bottom:120px;font-size:820px;font-weight:100;line-height:1;color:transparent;-webkit-text-stroke:1.2px rgba(160,166,182,.22);letter-spacing:-.05em}
.title{position:absolute;left:84px;right:84px;top:420px;font-weight:200;font-size:__FS__px;line-height:1.06;letter-spacing:-.02em;padding-bottom:28px;background:linear-gradient(180deg,#FFFFFF,#B9BECA);-webkit-background-clip:text;color:transparent}
.sub{position:absolute;left:84px;bottom:150px;font-size:22px;letter-spacing:.3em;text-transform:uppercase;color:#E4E6ED;font-weight:400}
.line{position:absolute;left:84px;right:84px;bottom:118px;height:1px;background:rgba(138,143,158,.35)}
.foot{position:absolute;left:84px;right:84px;bottom:70px;font-size:18px;letter-spacing:.3em;text-transform:uppercase;color:#8A8F9E}
</style><div class=bg></div><div class=sheen></div><div class=grain></div><div class=edge></div>
<div class=top><span>AceGuides</span><span>__TAG__</span></div><div class=gold></div>
<div class=mono>A</div><div class=title>__TITLE__</div><div class=sub>__LEVEL__</div><div class=line></div><div class=foot>Study guide</div>'''
os.makedirs(OUT,exist_ok=True)
tmp=tempfile.mkdtemp(prefix='kb-covers-')
with sync_playwright() as p:
    try:
        b=p.chromium.launch()
    except Exception:
        found=sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux*/chrome'))
        if not found: raise
        b=p.chromium.launch(executable_path=found[-1])
    pg=b.new_page(viewport={'width':900,'height':1200})
    for level,subj,kind in items:
        fs=118 if len(subj)<=8 else (96 if len(subj)<=14 else 76)
        tag="Year 10" if kind=="year10" else "VCE"
        lvl=level if kind=="year10" else level.replace("VCE ","")
        h=TPL.replace('__FONT__',FONT).replace('__FS__',str(fs)).replace('__TAG__',tag).replace('__TITLE__',subj.replace('&','&amp;')).replace('__LEVEL__',lvl)
        pg.set_content(h); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(120)
        name=f"{kind}-{slug(subj)}"
        png=os.path.join(tmp,name+'.png')
        pg.screenshot(path=png)
        im=Image.open(png).convert('RGB')
        im=im.resize((720,round(720*im.height/im.width)),Image.LANCZOS)
        im.save(os.path.join(OUT,name+'.webp'),'WEBP',quality=82,method=6)
        print('saved', name+'.webp')
    b.close()
