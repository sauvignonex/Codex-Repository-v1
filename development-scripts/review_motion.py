from pathlib import Path
import sys,subprocess
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parent
sys.path.insert(0,str(root/'python-deps'))
import imageio_ffmpeg
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
for name,start,top in [('form',15.7,False),('script',23.5,False),('fry',50.3,True)]:
    target=root/'reel-review'/name;target.mkdir(exist_ok=True)
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-ss',str(start),'-i',r'D:/Projects Adobe/Рилс Колобки/Рилс Колобки [Обложка вшита].mp4','-t','1.6','-vf','fps=10,crop=iw:ih/2:0:'+('0' if top else 'ih/2')+',scale=324:288','-q:v','2',str(target/'%03d.jpg')],check=True)
    sheet=Image.new('RGB',(1296,1272),(24,24,28));draw=ImageDraw.Draw(sheet)
    for j,p in enumerate(sorted(target.glob('*.jpg'))):
        x=j%4*324;y=j//4*318;sheet.paste(Image.open(p),(x,y+30));draw.text((x+6,y+4),f'{start+j/10:.1f}s',font=font,fill='white')
    path=root/'reel-review'/f'motion-{name}.jpg';sheet.save(path,quality=94);print(path)
