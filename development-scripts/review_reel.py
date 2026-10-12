from pathlib import Path
import subprocess, sys
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'python-deps'))
import imageio_ffmpeg
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
video = r'D:/Projects Adobe/Рилс Колобки/Рилс Колобки [Обложка вшита].mp4'
dest = ROOT / 'reel-review'
frames = dest / 'frames'
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',video,'-vf','fps=1,scale=270:480','-q:v','2',str(frames/'frame-%03d.jpg')],check=True)
files=sorted(frames.glob('frame-*.jpg'))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
for start in range(0,len(files),12):
    sheet=Image.new('RGB',(1080,1530),(24,24,28))
    draw=ImageDraw.Draw(sheet)
    for j,p in enumerate(files[start:start+12]):
        x=(j%4)*270;y=(j//4)*510
        sheet.paste(Image.open(p),(x,y+30))
        draw.text((x+8,y+4),f'{start+j:02d} s',font=font,fill='white')
    path=dest/f'sheet-{start//12+1}.jpg';sheet.save(path,quality=92);print(path)
print('Frames:',len(files))
