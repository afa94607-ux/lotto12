import urllib.request
import urllib.parse
import os
import subprocess

words = {
    '10': 'ដប់',
    '9': 'ប្រាំបួន',
    '8': 'ប្រាំបី',
    '7': 'ប្រាំពីរ',
    '6': 'ប្រាំមួយ',
    '5': 'ប្រាំ',
    '4': 'បួន',
    '3': 'បី',
    '2': 'ពីរ',
    '1': 'មួយ',
    'goodluck': 'សូមជូនពរឱ្យសំណាងល្អ'
}

out_dir = '/public/audio/khmer'
os.makedirs(out_dir, exist_ok=True)
tmp_dir = '/tmp/khmer_audio'
os.makedirs(tmp_dir, exist_ok=True)

for key, text in words.items():
    print(f"Fetching {key}: {text}...")
    encoded = urllib.parse.quote(text)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded}&tl=km&client=tw-ob"
    
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    raw_mp3 = os.path.join(tmp_dir, f"{key}_raw.mp3")
    with urllib.request.urlopen(req) as resp, open(raw_mp3, 'wb') as f:
        f.write(resp.read())
    
    target_wav = os.path.join(out_dir, f"{key}.wav")
    
    # Process audio:
    # 1. Trim leading silence (silenceremove) so speech triggers instantly
    # 2. Add subtle audio presence boost & loudness normalization
    # 3. Output clean mono 24kHz 16-bit PCM WAV
    cmd = [
        'ffmpeg', '-y',
        '-i', raw_mp3,
        '-af', 'silenceremove=start_periods=1:start_duration=0.01:start_threshold=-40dB,loudnorm=I=-14:LRA=7:tp=-1',
        '-ar', '24000',
        '-ac', '1',
        target_wav
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Successfully generated {target_wav} (size: {os.path.getsize(target_wav)} bytes)")

print("All Khmer audio files generated successfully!")
