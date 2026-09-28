#!/usr/bin/env python3
"""Procedural soundtrack for the 成交方程式 reels.

Everything is synthesized with numpy/scipy (no samples, no licenses): kick, hats,
claps, sub bass, detuned pads, plucked arps, inharmonic "gem" bells, risers,
impacts and a convolution reverb. Hits are placed on the reels' own cue times
(showreel/timings.json) so the music lands exactly on the animation.

Writes  .render/audio/<reel>.wav  (for muxing into MP4)
and     dist/showreel/audio/<name>.mp3  (for the web player)
"""
import json
import pathlib
import subprocess

import numpy as np
from scipy import signal

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent
REPO = ROOT.parent
WAV_DIR = REPO / ".render" / "audio"
MP3_DIR = REPO / "dist" / "showreel" / "audio"
FFMPEG = subprocess.run(["python3", "-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"],
                        capture_output=True, text=True).stdout.strip()

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name):
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((12 * (o + 1) + NOTE[n] - 69) / 12)


CHORDS = {
    "Am9": ("A2", ["A3", "C4", "E4", "G4", "B4"]),
    "Fmaj7": ("F2", ["F3", "A3", "C4", "E4", "G4"]),
    "Cadd9": ("C3", ["G3", "C4", "D4", "E4", "G4"]),
    "G6": ("G2", ["G3", "B3", "D4", "E4", "A4"]),
    "Em7": ("E2", ["E3", "G3", "B3", "D4", "G4"]),
    "Dm9": ("D2", ["D3", "F3", "A3", "C4", "E4"]),
}
PROG = ["Am9", "Fmaj7", "Cadd9", "G6"]
PROG_DARK = ["Am9", "Em7", "Fmaj7", "Dm9"]
BELLS = ["A4", "C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6"]

rng = np.random.default_rng(20260926)
_TABLE = None


def saw_table():
    global _TABLE
    if _TABLE is None:
        x = np.arange(4096) / 4096
        _TABLE = sum(((-1) ** (k + 1)) * np.sin(2 * np.pi * k * x) / k for k in range(1, 28)) * (2 / np.pi)
    return _TABLE


def osc_saw(freq, n):
    ph = (np.arange(n) * freq / SR) % 1.0
    return np.interp(ph * 4096, np.arange(4096), saw_table())


def tt(sec):
    return np.arange(int(SR * sec)) / SR


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * .45), "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


# ---------------------------------------------------------------- one-shots
def s_kick(amp=1.0):
    t = tt(.5)
    f = 44 + 100 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.0)
    click = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 400) * .25
    return (body + click) * amp


def s_hat(amp=.18, open_=False):
    t = tt(.3 if open_ else .08)
    x = hp(rng.standard_normal(len(t)), 7500, 4) * np.exp(-t * (18 if open_ else 75))
    return x * amp


def s_clap(amp=.45):
    t = tt(.45)
    n = bp(rng.standard_normal(len(t)), 900, 3200)
    env = np.zeros_like(t)
    for d in (0, .011, .022):
        env += np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d)
    env += np.exp(-t * 9) * .35
    return n * env * amp


def s_bell(freq, amp=.22, length=3.2):
    t = tt(length)
    out = np.zeros_like(t)
    for r, a, d in ((1, 1, 1.4), (2.76, .42, 2.3), (5.4, .22, 3.8), (8.93, .1, 6.0), (2.0, .25, 1.9)):
        out += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d)
    return out * (1 - np.exp(-t * 900)) * amp


def s_pluck(freq, amp=.12, length=.55, bright=1.0):
    t = tt(length)
    x = (np.sin(2 * np.pi * freq * t) + .5 * np.sin(4 * np.pi * freq * t)
         + .22 * bright * np.sin(6 * np.pi * freq * t) + .1 * bright * np.sin(8 * np.pi * freq * t))
    return x * np.exp(-t * 7.5) * (1 - np.exp(-t * 600)) * amp


def s_riser(length, amp=.22):
    t = tt(length)
    n = rng.standard_normal(len(t))
    # sweep: blend of progressively higher band-passed noise
    lowb, highb = bp(n, 300, 1200), bp(n, 2500, 9000)
    k = (t / length) ** 1.6
    noise = (lowb * (1 - k) + highb * k) * k
    f = 180 * (2 ** (3 * t / length))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 * k
    return (noise + tone) * amp


def s_impact(amp=.9, length=3.5):
    t = tt(length)
    f = 26 + 50 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    crack = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 9) * .5
    return (boom + crack) * amp


def s_whoosh(length=.9, amp=.16):
    t = tt(length)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 2
    return bp(n, 600, 5000) * env * amp


def s_tick(freq=2200, amp=.07):
    t = tt(.06)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 90) * amp


def s_ding(amp=.1):
    return s_bell(hz("E6"), amp, 1.2) + s_bell(hz("B6"), amp * .5, 1.2)


# ---------------------------------------------------------------- mixer
class Mix:
    def __init__(self, dur):
        self.n = int(SR * (dur + 4))
        self.dur = dur
        self.bus = {k: np.zeros((self.n, 2)) for k in ("pad", "bass", "drums", "fx", "send")}
        self.kenv = np.zeros(self.n)

    def add(self, bus, x, t0, gain=1.0, pan=0.0, send=0.0):
        i = int(t0 * SR)
        if i >= self.n or i + len(x) <= 0:
            return
        if i < 0:
            x, i = x[-i:], 0
        x = x[: self.n - i]
        if x.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            x = np.stack([x * l * 1.414, x * r * 1.414], axis=1)
        self.bus[bus][i:i + len(x)] += x * gain
        if send:
            self.bus["send"][i:i + len(x)] += x * gain * send

    def render(self, out_wav, fade_in=.0, fade_out=2.5, master=1.0):
        # sidechain pads + bass against the kick envelope
        duck = 1 - .55 * np.clip(self.kenv, 0, 1)
        duck = lp(duck, 30, 1)
        pad = self.bus["pad"] * duck[:, None]
        bass = self.bus["bass"] * duck[:, None]
        # reverb: exponentially decaying stereo noise IR
        L = int(SR * 2.8)
        tIR = np.arange(L) / SR
        ir = np.stack([lp(rng.standard_normal(L), 6000) * np.exp(-tIR * 2.4) for _ in range(2)], axis=1)
        ir[: int(SR * .012)] = 0
        send = self.bus["send"] + pad * .35
        wet = np.stack([signal.fftconvolve(send[:, c], ir[:, c])[: self.n] for c in range(2)], axis=1) * .085
        x = pad + bass + self.bus["drums"] + self.bus["fx"] + wet
        x = hp(x, 28)
        x = np.tanh(x * 1.25) / np.tanh(1.25)
        end = int(SR * self.dur)
        x = x[: end + int(SR * .2)]
        if fade_in:
            k = int(SR * fade_in); x[:k] *= np.linspace(0, 1, k)[:, None]
        k = int(SR * fade_out)
        x[end - k:end] *= np.linspace(1, 0, k)[:, None] ** 1.5
        x[end:] = 0
        x = x[:end]
        x = x / (np.max(np.abs(x)) + 1e-9) * .89 * master
        out_wav.parent.mkdir(parents=True, exist_ok=True)
        pcm = (x * 32767).astype(np.int16)
        import wave
        with wave.open(str(out_wav), "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        return x


# ---------------------------------------------------------------- arrangement
DEFAULT = dict(kick=0, hat=0, clap=False, arp=0, pad=.5, bright=.45, bass=False, prog=PROG)


def section_at(sections, t):
    cur = DEFAULT
    for s in sections:
        if s["start"] <= t < s["end"]:
            cur = dict(DEFAULT, **s)
    return cur


def arrange(m, sections, bpm=120, bars_per_chord=2):
    beat = 60 / bpm
    chord_len = beat * 4 * bars_per_chord
    # pads + bass, one chord segment at a time
    k = 0
    while k * chord_len < m.dur + chord_len:
        t0 = k * chord_len
        sec = section_at(sections, t0 + .01)
        prog = sec["prog"]
        name = prog[k % len(prog)]
        root, tones = CHORDS[name]
        seg = chord_len + 1.2
        n = int(SR * seg)
        if sec["pad"] > 0:
            L = np.zeros(n); R = np.zeros(n)
            for note in tones:
                f = hz(note)
                L += osc_saw(f * 2 ** (-6 / 1200), n) + osc_saw(f * 2 ** (4 / 1200), n)
                R += osc_saw(f * 2 ** (6 / 1200), n) + osc_saw(f * 2 ** (-3 / 1200), n)
            st = np.stack([L, R], axis=1) / (len(tones) * 2)
            st = lp(st, 350 + sec["bright"] * 3200, 2)
            tt_ = np.arange(n) / SR
            env = np.minimum(1, tt_ / .7) * np.minimum(1, np.clip((seg - tt_) / 1.2, 0, 1))
            m.add("pad", st * env[:, None], t0 - .05, gain=sec["pad"] * .55)
        if sec["bass"]:
            f = hz(root)
            for b in range(4 * bars_per_chord):
                tb = t0 + b * beat
                sb = section_at(sections, tb)
                if not sb["bass"]:
                    continue
                t = tt(beat * .95)
                x = (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 2.2) * (1 - np.exp(-t * 400))
                m.add("bass", x, tb, gain=.34)
        k += 1
    # drums + arp on the beat grid
    nbeats = int(m.dur / beat) + 1
    kick = s_kick()
    for i in range(nbeats):
        tb = i * beat
        sec = section_at(sections, tb + .001)
        pos = i % 4
        if sec["kick"] == 2 or (sec["kick"] == 1 and pos in (0,)):
            m.add("drums", kick, tb, gain=.85)
            kl = len(kick)
            idx = int(tb * SR)
            e = np.exp(-np.arange(min(kl, m.n - idx)) / SR * 9)
            m.kenv[idx: idx + len(e)] = np.maximum(m.kenv[idx: idx + len(e)], e)
        if sec["hat"] >= 1:
            m.add("drums", s_hat(.15), tb + beat / 2, pan=.25)
        if sec["hat"] >= 2:
            m.add("drums", s_hat(.07), tb + beat / 4, pan=-.2)
            m.add("drums", s_hat(.07), tb + 3 * beat / 4, pan=.2)
        if sec["clap"] and pos in (1, 3):
            m.add("drums", s_clap(), tb, send=.25)
        if sec["arp"]:
            chord_idx = int(tb / chord_len)
            _, tones = CHORDS[sec["prog"][chord_idx % len(sec["prog"])]]
            steps = 4 if sec["arp"] >= 2 else 2
            for s in range(steps):
                note = tones[(i * steps + s) % len(tones)]
                f = hz(note) * 2
                m.add("fx", s_pluck(f, .075 if sec["arp"] >= 2 else .065, bright=.6 + .4 * sec["bright"]),
                      tb + s * beat / steps, pan=(.35 if s % 2 else -.35), send=.3)


def cue(m, kind, t, p=None, g=1.0):
    if kind == "bell":
        m.add("fx", s_bell(hz(p), .2 * g), t, pan=(hash(p) % 7 - 3) / 8, send=.6)
    elif kind == "chord":
        for i, note in enumerate(p):
            m.add("fx", s_bell(hz(note), .13 * g, 4.2), t + i * .018, pan=(i - len(p) / 2) / 5, send=.7)
    elif kind == "impact":
        m.add("fx", s_impact(.85 * g), t, send=.35)
    elif kind == "riser":
        m.add("fx", s_riser(p, .2 * g), t, send=.3)
    elif kind == "whoosh":
        m.add("fx", s_whoosh(.9, .15 * g), t - .2, send=.25)
    elif kind == "tick":
        m.add("fx", s_tick(p or 2200, .07 * g), t, pan=.2)
    elif kind == "ding":
        m.add("fx", s_ding(.09 * g), t, pan=-.2, send=.4)
    elif kind == "pluck":
        m.add("fx", s_pluck(hz(p), .12 * g, .9), t, send=.4)


# ---------------------------------------------------------------- per-reel cue sheets
def cues_open(s, short=False):
    k = .55 if short else 1
    c = [("bell", s + .1, "A5"), ("bell", s + 1.0 * k, "E5", .8), ("riser", s + 1.3 * k, 2.6 * k, .6),
         ("impact", s + 3.95 * k, None, .7), ("chord", s + 3.95 * k, ["A4", "E5", "B5", "C6"])]
    if short:
        c += [("impact", s + 2.5, None, .9), ("chord", s + 2.5, ["A4", "C5", "E5", "A5"])]
        c += [("whoosh", s + 6.25, None)]
    else:
        c += [("bell", s + 5.0, "E5", .7), ("bell", s + 6.5, "G5", .7), ("riser", s + 6.9, 2.0, 1.0),
              ("impact", s + 8.9, None, 1.0), ("chord", s + 8.9, ["A3", "E4", "A4", "C5", "E5", "B5"]),
              ("whoosh", s + 11.3, None)]
    return c


def cues_market(s):
    c = [("tick", s + .5 + i * .26, 1800 + i * 120) for i in range(6)]
    c += [("bell", s + 4.8 + i * .45, n) for i, n in enumerate(["C5", "E5", "G5"])]
    c += [("impact", s + 9.4, None, .45), ("bell", s + 10.1, "A4"), ("impact", s + 13.2, None, .6), ("chord", s + 13.9, ["C5", "E5", "G5", "C6"])]
    return c


def cues_fail(s):
    c = [("impact", s + .3, None, .5), ("bell", s + 2.4, "A4", .7), ("whoosh", s + 3.5, None, .6), ("bell", s + 6.7, "E5", .8)]
    c += [("tick", s + 9.8 + i * .13, 1400 + i * 40) for i in range(19)]
    c += [("impact", s + 12.9, None, .6), ("bell", s + 17.8, "E5", .8)]
    c += [("tick", s + 22.1 + i * .09, 2600) for i in range(14)]
    c += [("bell", s + 24.5, "A5", .8)]
    return c


def cues_eq(s):
    c = [("impact", s + .7, None, .55), ("impact", s + 1.3, None, .5), ("whoosh", s + 4.1, None, .6), ("bell", s + 4.6, "C5")]
    c += [("tick", s + 7.9 + i * .18, 2000 + i * 150) for i in range(5)]
    c += [("bell", s + 9.3, "E5", .7), ("pluck", s + 12.5, "A4"), ("pluck", s + 12.65, "C5"), ("pluck", s + 12.8, "E5"), ("bell", s + 13.2, "A5", .7)]
    return c


def cues_gates(s, per=1.9, x0=0.0):
    notes = ["A4", "C5", "D5", "E5", "G5"]
    c = []
    for i, n in enumerate(notes):
        c += [("bell", s + x0 + 1.6 + i * per, n), ("whoosh", s + x0 + 1.9 + i * per, None, .5)]
    done = s + x0 + 1.9 + 4 * per + 1.3
    c += [("impact", done, None, .8), ("chord", done, ["A4", "C5", "E5", "A5", "C6"])]
    return c


def cues_pitch(s, x0=0.0, per=1.95, first=1.8):
    notes = ["E5", "G5", "A5", "C6", "D6", "E6"]
    return [("bell", s + x0 + first + i * per, n) for i, n in enumerate(notes)]


def cues_rhythm(s):
    c = []
    for m_ in (10, 12, 14, 16, 18):
        c.append(("tick", s + 1.8 + m_ / 22 * 10, 1200, 1.4))
    for m_ in (7.15, 7.4, 7.75, 10.1, 12.1, 14.15, 16.1, 18.2, 19.4, 20.3, 20.8):
        c.append(("ding", s + 1.8 + m_ / 22 * 10, None, .8))
    c += [("impact", s + 13.2 + i * .45, None, .35) for i in range(4)]
    c += [("bell", s + 13.3 + i * .45, n, .8) for i, n in enumerate(["E5", "A5", "C6", "E6"])]
    c += [("tick", s + 15.5 + i * 1.5, 2400) for i in range(3)]
    return c


def cues_data(s):
    c = [("tick", s + .7 + i * .1, 2200) for i in range(5)]
    c += [("tick", s + 2.6 + i * 1.05, 900, 1.5) for i in range(4)]
    c += [("tick", s + 8.0 + i * .12, 1800 + (i % 4) * 100) for i in range(18)]
    c += [("impact", s + 10.2, None, .3), ("bell", s + 12.6, "C5")]
    return c


def cues_style(s):
    return [("bell", s + 1.0, "E5", .6), ("bell", s + 5.4, "A5"), ("pluck", s + 3.6, "C5"), ("pluck", s + 4.6, "E5"),
            ("impact", s + 10.6, None, .5), ("chord", s + 10.6, ["C5", "E5", "G5"])]


def cues_decode(s):
    c = [("tick", s + 1.0 + i * .14, 1600) for i in range(6)] + [("tick", s + 1.6 + i * .14, 2400) for i in range(6)]
    c += [("tick", s + 7.6 + i * .12, 2000 + i * 60) for i in range(13)]
    c += [("impact", s + 11.9, None, .6), ("bell", s + 13.3, "A5")]
    return c


def cues_value(s):
    c = [("tick", s + .8 + i * .15, 1800) for i in range(4)]
    c += [("tick", s + 3.4 + i * .06, 2600, .6) for i in range(12)]
    c += [("bell", s + 5.4 + i * .16, n, .7) for i, n in enumerate(["A5", "C6", "D6", "E6", "G6", "A5"])]
    c += [("pluck", s + 8.8 + i * .5, n) for i, n in enumerate(["A4", "C5", "E5", "G5", "A5", "C6"])]
    c += [("chord", s + 12.1, ["A4", "E5", "A5"]), ("impact", s + 15.6, None, .45), ("riser", s + 16.0, 1.9, .8)]
    return c


def cues_outro(s, short=False):
    c = [("bell", s + .3 + i * .22, n) for i, n in enumerate(["A4", "C5", "E5", "G5", "A5"])]
    c += [("impact", s + 1.75, None, 1.0), ("chord", s + 1.75, ["A3", "E4", "A4", "C5", "E5", "A5"])]
    x2 = 4.0 if short else 5.3
    c += [("impact", s + x2 + .5, None, .7), ("chord", s + x2 + .5, ["F4", "A4", "C5", "E5", "G5"], 1.1)]
    return c


def full():
    secs = [
        dict(start=0, end=8.9, pad=.45, bright=.3),
        dict(start=8.9, end=12, pad=.6, bright=.45),
        dict(start=12, end=28, kick=2, hat=1, bass=True, pad=.5, bright=.5),
        dict(start=28, end=54, kick=1, bass=True, arp=1, pad=.42, bright=.33, prog=PROG_DARK),
        dict(start=54, end=70, kick=2, hat=1, clap=True, arp=1, bass=True, pad=.5, bright=.55),
        dict(start=70, end=88, kick=2, hat=2, clap=True, arp=2, bass=True, pad=.55, bright=.72),
        dict(start=88, end=108, kick=2, hat=1, clap=True, arp=1, bass=True, pad=.5, bright=.6),
        dict(start=108, end=128, kick=2, hat=2, clap=True, arp=2, bass=True, pad=.5, bright=.7),
        dict(start=128, end=144, kick=2, hat=1, arp=1, bass=True, pad=.45, bright=.35),
        dict(start=144, end=158, arp=1, pad=.5, bright=.45),
        dict(start=158, end=174, kick=2, hat=1, clap=True, arp=1, bass=True, pad=.5, bright=.6),
        dict(start=174, end=192, kick=2, hat=2, clap=True, arp=2, bass=True, pad=.6, bright=.8),
        dict(start=192, end=205, pad=.55, bright=.5),
    ]
    c = cues_open(0) + cues_market(12) + cues_fail(28) + cues_eq(54) + cues_gates(70) + cues_pitch(88) + cues_rhythm(108) \
        + cues_data(128) + cues_style(144) + cues_decode(158) + cues_value(174) + cues_outro(192)
    c += [("whoosh", t - .4, None, .7) for t in (12, 28, 54, 70, 88, 108, 128, 144, 158, 174, 192)]
    c += [("riser", 66, 4, .8), ("riser", 170, 4, .8), ("riser", 104.5, 3.5, .6)]
    return 202, secs, c, 120


def investor():
    secs = [
        dict(start=0, end=2.5, pad=.45, bright=.3),
        dict(start=2.5, end=7, pad=.6, bright=.45),
        dict(start=7, end=23, kick=2, hat=1, bass=True, pad=.5, bright=.5),
        dict(start=23, end=32, kick=1, bass=True, arp=1, pad=.42, bright=.33, prog=PROG_DARK),
        dict(start=32, end=48, kick=2, hat=1, clap=True, arp=1, bass=True, pad=.5, bright=.55),
        dict(start=48, end=58, kick=2, hat=2, clap=True, arp=2, bass=True, pad=.55, bright=.65),
        dict(start=58, end=76, kick=2, hat=2, clap=True, arp=2, bass=True, pad=.6, bright=.8),
        dict(start=76, end=88, kick=2, hat=1, clap=True, arp=1, bass=True, pad=.5, bright=.6),
        dict(start=88, end=99, pad=.55, bright=.5),
    ]
    ev = [("tick", 23 + 1.2 + i * .13, 1400 + i * 40) for i in range(19)] + [("impact", 23 + 4.4, None, .6)]
    sysc = [("tick", 48 + .8 + i * .22, 1800 + i * 90) for i in range(7)]
    dec = [("tick", 76 + 2.4 + i * .09, 2600) for i in range(14)] + [("bell", 76 + 5.0, "A5")]
    c = cues_open(0, True) + cues_market(7) + ev + cues_eq(32) + sysc + cues_value(58) + dec + cues_outro(88, True)
    c += [("whoosh", t - .4, None, .7) for t in (7, 23, 32, 48, 58, 76, 88)]
    c += [("riser", 44, 4, .8), ("riser", 72, 4, .7)]
    return 96, secs, c, 120


def teaser():
    secs = [dict(start=0, end=1.5, pad=.5, bright=.4),
            dict(start=1.5, end=13, kick=2, hat=2, clap=True, arp=2, bass=True, pad=.55, bright=.75),
            dict(start=13, end=16, pad=.6, bright=.5)]
    c = [("bell", .05, "A5"), ("riser", .1, .85, .8), ("impact", .95, None, .9), ("chord", .95, ["A4", "E5", "A5"])]
    c += [("impact", t, None, .45) for t in (1.5, 2.0, 2.5)]
    c += [("bell", 3.0 + i * .5, n) for i, n in enumerate(["A4", "C5", "D5", "E5", "G5"])] + [("impact", 5.25, None, .7)]
    c += [("impact", 5.5 + i * .5, None, .5) for i in range(4)] + [("bell", 5.5 + i * .5, n, .8) for i, n in enumerate(["E5", "A5", "C6", "E6"])]
    c += [("whoosh", 7.5, None, .8), ("impact", 9.0, None, .8), ("tick", 10.0, 2000), ("chord", 10.5, ["C5", "E5", "G5"])]
    c += [("tick", 11.1 + k * .02, 2600, .5) for k in range(12)] + [("bell", 11.6 + k * .1, n, .7) for k, n in enumerate(["A5", "C6", "D6", "E6", "G6", "E6"])]
    c += [("riser", 11.2, 1.8, 1.0), ("impact", 13.0, None, 1.0), ("chord", 13.0, ["A3", "E4", "A4", "C5", "E5", "A5"])]
    return 15, secs, c, 120


def lesson(meta):
    dur = meta["dur"]
    secs = [dict(start=0, end=dur + 3, kick=1, arp=1, pad=.42, bright=.38, bass=False)]
    c = [("bell", .15, "A5", .8), ("chord", .6, ["A4", "E5", "B5"], .7)]
    notes = ["E5", "G5", "A5", "C6", "D6", "E6", "G6", "A5", "C6", "E6"]
    for i, b in enumerate(meta.get("beats", [])):
        if i:
            c += [("whoosh", b["start"], None, .5), ("bell", b["start"] + .1, notes[i % len(notes)], .55)]
        if b["type"] == "check":
            st = b["start"] + min(b["dur"] - 1.6, 3.0)
            c += [("impact", st, None, .55), ("chord", st, ["C5", "E5", "G5", "C6"], .9)]
        if b["type"] in ("next", "finale"):
            c += [("chord", b["start"] + .4, ["F4", "A4", "C5", "E5"], .8)]
    return dur, secs, c, 100


def build(name, spec, mp3_name):
    dur, secs, cues, bpm = spec
    m = Mix(dur)
    arrange(m, secs, bpm=bpm)
    for q in cues:
        kind, t, p = q[0], q[1], q[2]
        g = q[3] if len(q) > 3 else 1.0
        cue(m, kind, t, p, g)
    wav = WAV_DIR / f"{name}.wav"
    m.render(wav, fade_in=.02, fade_out=1.8 if dur > 20 else .9)
    MP3_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "160k",
                    str(MP3_DIR / mp3_name)], check=True)
    print(f"{name}: {dur}s → {mp3_name}")


def main():
    timings = {r["id"]: r for r in json.loads((ROOT / "timings.json").read_text())}
    build("full", full(), "reel-full.mp3")
    build("investor", investor(), "reel-investor.mp3")
    build("teaser", teaser(), "reel-teaser.mp3")
    for i in range(10):
        meta = timings.get(f"l{i}")
        if meta:
            build(f"l{i}", lesson(meta), f"lesson-{i}.mp3")


if __name__ == "__main__":
    main()
