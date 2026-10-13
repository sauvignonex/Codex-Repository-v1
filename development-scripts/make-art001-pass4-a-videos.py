"""Offline comparison of true AE RGBA with baked reference; never chromakey."""
from pathlib import Path
from PIL import Image
import subprocess,json,sys,shutil
root=Path(sys.argv[1]);ffmpeg=sys.argv[2]; native=root/'dist/art001-pass4-a/native';out=root/'dist/art001-pass4-a/videos';out.mkdir(exist_ok=True)
ref=root/'examples/Рилс Колобки — референс.mp4'
def run(args):subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y',*args],check=True)
for family,start,count in [('A',87,89)]:
    plate=out/f'{family}-plate.png'
    run(['-ss',str(start/30),'-i',str(ref),'-frames:v','1','-vf','scale=1080:1920',str(plate)])
    # Extra transparent frames show actual clip cut; these ten are generated,
    # not exported AE frames and are excluded from alpha verification.
    frames=out/f'{family}-extended';frames.mkdir(exist_ok=True)
    for i in range(count):shutil.copy2(native/'full-alpha'/f'{family}-{i:03}.png',frames/f'{i:03}.png')
    for i in range(count,count+10):Image.new('RGBA',(1080,1920)).save(frames/f'{i:03}.png')
    run(['-framerate','30','-i',str(frames/'%03d.png'),'-vf','format=rgb24','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(out/f'AE-{family}-full.mp4')])
    duration=(count+10)/30
    run(['-ss',str(start/30),'-i',str(ref),'-loop','1','-i',str(plate),'-framerate','30','-i',str(frames/'%03d.png'),'-filter_complex','[0:v]scale=540:960,setsar=1,setpts=PTS-STARTPTS[left];[1:v][2:v]overlay=shortest=1:eof_action=pass,scale=540:960,setsar=1[right];[left][right]hstack=shortest=1','-t',str(duration),'-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(out/f'Compare-{family}-full-alpha.mp4')])
print(json.dumps({'source':'AE true RGBA over offline frozen reference plate, left actual moving reference; ten generated transparent tail frames represent clip out','videos':2,'chromakey':False,'native_premiere_composite':False},indent=2))
