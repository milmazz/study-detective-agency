"""Synthesize the sound effects a video asks for and mix them under the narration.

    python3 sfx.py <video-dir>

Reads <video-dir>/build/meta.json (written by meta.cjs from the video's
window.SFX() cue list) and build/narration.wav; writes build/mix.wav.
Every effect is generated in code, so there are no sound files to license.
Available cues: see make() below; add a new branch there for a new sound.
"""
import json, os, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(3)

def t(d): return np.arange(int(d * SR)) / SR
def env(x, a=.005, r=None):
    n = len(x); e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if r: e *= np.exp(-np.arange(n) / SR / r)
    return x * e
def tone(f, d, r=.15, shape='sine'):
    tt = t(d); ph = 2 * np.pi * (np.cumsum(np.broadcast_to(f, tt.shape)) / SR if np.ndim(f) else f * tt)
    w = np.sin(ph) if shape == 'sine' else np.sign(np.sin(ph)) * .5 if shape == 'square' else 2 * np.abs(2 * ((ph / 2 / np.pi) % 1) - 1) - 1
    return env(w, r=r)
def noise(d, r=.1, lp=1.0):
    x = rng.standard_normal(int(d * SR))
    if lp < 1:
        y = np.zeros_like(x); a = lp
        for i in range(1, len(x)): y[i] = y[i-1] + a * (x[i] - y[i-1])
        x = y / (np.abs(y).max() + 1e-9)
    return env(x, r=r)
def pluck(f, d=2.2):
    n = int(SR / f); buf = rng.uniform(-1, 1, n); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % n]; buf[i % n] = .497 * (buf[i % n] + buf[(i + 1) % n])
    return out

def mix(*xs):
    n = max(len(x) for x in xs); out = np.zeros(n)
    for x in xs: out[:len(x)] += x
    return out

def make(k):
    if k == 'click':  return mix(.5 * noise(.03, r=.006), .3 * tone(2200, .03, r=.006))
    if k == 'boop':   return .35 * tone(np.linspace(520, 300, int(.12 * SR)), .12, r=.06)
    if k == 'knock':  return mix(.5 * tone(180, .15, r=.04), .2 * noise(.05, r=.01, lp=.2))
    if k == 'pop':    return .35 * tone(np.linspace(400, 1100, int(.07 * SR)), .07, r=.03)
    if k == 'whoosh': x = noise(.6, r=None, lp=.08); return .35 * x * np.sin(np.linspace(0, np.pi, len(x)))
    if k == 'crash':  return mix(.45 * noise(.5, r=.12, lp=.5), .35 * tone(np.linspace(300, 90, int(.4 * SR)), .4, r=.15))
    if k == 'splash': return mix(.4 * noise(.45, r=.12, lp=.25), .2 * tone(np.linspace(900, 300, int(.2 * SR)), .2, r=.06))
    if k == 'twang':  return mix(.5 * pluck(196, 2.4), .25 * pluck(392, 1.5))
    if k == 'zap':    return mix(.3 * tone(np.linspace(1600, 200, int(.25 * SR)), .25, r=.1, shape='square'), .2 * noise(.15, r=.04))
    if k == 'ding':   return mix(.3 * tone(1318, 1.0, r=.35), .15 * tone(2637, .8, r=.2))
    if k == 'buzz':   x = tone(170, 1.1, r=None, shape='square'); return .25 * x * (0.7 + .3 * np.sign(np.sin(2 * np.pi * 12 * t(1.1))))
    if k == 'tick':   return .25 * tone(1000, .05, r=.015)
    if k == 'winddown': return .3 * tone(np.linspace(900, 150, int(.8 * SR)), .8, r=.5, shape='tri')
    if k == 'windup':   return .25 * np.concatenate([tone(700 + i * 90, .05, r=.02, shape='tri') for i in range(6)])
    if k == 'tada':   return mix(*[.18 * np.pad(tone(f, .9, r=.35, shape='tri'), (int(i * .09 * SR), 0)) for i, f in enumerate([523, 659, 784, 1047])])
    if k == 'wrong':  return mix(.25 * tone(330, .18, r=.12, shape='tri'), .25 * np.pad(tone(247, .3, r=.15, shape='tri'), (int(.16 * SR), 0)))
    raise KeyError(k)

def main(vdir):
    build = os.path.join(os.path.abspath(vdir), 'build')
    meta = json.load(open(os.path.join(build, 'meta.json')))
    with wave.open(os.path.join(build, 'narration.wav')) as w:
        voice = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    n = int((meta['dur'] + .5) * SR)
    out = np.zeros(n, dtype=np.float32); out[:min(n, len(voice))] += voice[:n]
    fx = np.zeros(n, dtype=np.float32)
    for c in meta['sfx']:
        x = np.asarray(make(c['k']), dtype=np.float32); i = int(c['t'] * SR)
        if i < n: fx[i:i + len(x)] += x[:n - i]
    out += .55 * fx
    peak = np.abs(out).max()
    if peak > .98: out *= .98 / peak
    with wave.open(os.path.join(build, 'mix.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
    print('mix.wav', round(n / SR, 2), 's, sfx', len(meta['sfx']))

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
