# Musique originale pour la vidéo (rien d'emprunté) : 120 bpm, La mineur, 36 s.
# 0-7 s : nappe douce + notes éparses + montée ; 7 s (n = 40 devient rouge) : impact puis rythme ; 33 s : accord final.
import numpy as np, wave
SR = 44100
DUR = 35.8
N = int(SR * DUR)
rng = np.random.default_rng(40)
mix = np.zeros(N)

def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N: return
    j = min(N, i + len(sig))
    mix[i:j] += gain * sig[: j - i]

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def pluck(freq, dur=0.6, bright=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    s = np.sin(2*np.pi*freq*t) + 0.5*np.sin(2*np.pi*2*freq*t)*np.exp(-t*9) + 0.25*bright*np.sin(2*np.pi*3.01*freq*t)*np.exp(-t*14) + 0.12*np.sin(2*np.pi*4.2*freq*t)*np.exp(-t*30)
    return s * env(n, 0.003, 0.22)

def bass(freq, dur=0.5):
    n = int(SR * dur); t = np.arange(n) / SR
    s = np.sin(2*np.pi*freq*t) + 0.3*np.sin(2*np.pi*2*freq*t)
    return s * env(n, 0.01, 0.35)

def kick():
    n = int(SR*0.35); t = np.arange(n)/SR
    f = 50 + 110*np.exp(-t*30)
    ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) * np.exp(-t*9)

def hat(open_=False):
    n = int(SR*(0.18 if open_ else 0.05)); t = np.arange(n)/SR
    x = rng.standard_normal(n)
    x = np.diff(x, prepend=0)  # passe-haut grossier
    return x * np.exp(-t*(18 if open_ else 70))

def clap():
    n = int(SR*0.25); t = np.arange(n)/SR
    x = rng.standard_normal(n)
    x = np.diff(x, prepend=0)
    burst = np.exp(-t*40) + 0.6*np.exp(-np.maximum(t-0.012, 0)*40)*(t > 0.012) + 0.4*np.exp(-np.maximum(t-0.024, 0)*40)*(t > 0.024)
    return x * burst * np.exp(-t*9)

def pad(freqs, dur):
    n = int(SR*dur); t = np.arange(n)/SR
    s = sum(np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*f*2*t) + 0.2*np.sin(2*np.pi*f*1.003*t) for f in freqs)
    a = np.minimum(1, t/0.6) * np.minimum(1, (dur - t)/0.5)
    return s * a / len(freqs)

BEAT = 0.5
chords = [  # La mineur : Am - F - C - G, une mesure (2 s) chacun
    dict(root=110.00, notes=[220.00, 261.63, 329.63]),
    dict(root=87.31,  notes=[174.61, 220.00, 261.63]),
    dict(root=130.81, notes=[261.63, 329.63, 392.00]),
    dict(root=98.00,  notes=[196.00, 246.94, 293.66]),
]
bars = int(DUR // 2)
for b in range(bars):
    t0 = b * 2.0
    ch = chords[b % 4]
    drop = t0 >= 7.0 - 1e-6          # après l'impact
    final = t0 >= 32.0
    # nappe
    add(pad(ch['notes'] + [ch['notes'][0]/2], 2.1), t0, 0.16 if not drop else 0.11)
    if final: continue
    # arpège de notes pincées (croches), plus dense après l'impact
    arp = [0, 1, 2, 1, 2, 1, 0, 1] if drop else [0, None, 2, None, 1, None, None, 0]
    for k, idx in enumerate(arp):
        if idx is None: continue
        f = ch['notes'][idx] * 2
        add(pluck(f, 0.55), t0 + k*0.25, 0.30 if drop else 0.20)
    if drop:
        # basse sur les temps, kick sur 1 et 3 puis chaque temps, chapeaux, claps sur 2 et 4
        for beat in range(4):
            tb = t0 + beat*BEAT
            add(bass(ch['root'], 0.45), tb, 0.55)
            add(kick(), tb, 0.55 if beat % 2 == 0 else 0.35)
            add(hat(), tb + 0.25, 0.14)
            add(hat(), tb, 0.08)
            if beat in (1, 3): add(clap(), tb, 0.20)
    elif t0 >= 4.0:
        for beat in range(4):
            add(bass(ch['root'], 0.45), t0 + beat*BEAT, 0.28)

# montée (4,5 s -> 7 s) : bruit filtré qui s'ouvre + notes qui montent, puis impact à 7,0 s
t_up = np.arange(int(SR*2.5))/SR
noise = rng.standard_normal(len(t_up))
noise = np.diff(noise, prepend=0)
rise = noise * (t_up/2.5)**2.2 * 0.22
add(rise, 4.5)
for k, f in enumerate([440.0, 493.88, 523.25, 587.33, 659.25, 783.99, 880.0, 987.77]):
    add(pluck(f, 0.4), 5.5 + k*0.1875, 0.22 + 0.02*k)
# impact
n = int(SR*1.2); t = np.arange(n)/SR
boom = np.sin(2*np.pi*(45 + 120*np.exp(-t*8))*t) * np.exp(-t*3.2)
shimmer = np.diff(rng.standard_normal(n), prepend=0) * np.exp(-t*4) * 0.25
add(boom*0.9 + shimmer, 7.0)

# accord final à 32 s et petit « tintement » sur la carte finale (33 s)
add(pad([220.00, 261.63, 329.63, 440.0], 3.7), 32.0, 0.22)
for k, f in enumerate([440.0, 523.25, 659.25, 880.0]):
    add(pluck(f, 1.6), 33.0 + k*0.12, 0.28)

# fondu d'entrée / sortie, normalisation douce
fade_in = np.minimum(1, np.arange(N)/(SR*0.5))
fade_out = np.minimum(1, (N - np.arange(N))/(SR*2.2))
mix *= fade_in * fade_out
# réverbération simple (3 échos courts)
out = mix.copy()
for d, g in ((0.09, 0.28), (0.17, 0.18), (0.29, 0.10)):
    k = int(d*SR); out[k:] += g*mix[:-k]
out /= np.max(np.abs(out)) * 1.15
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
with wave.open('musique.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', len(pcm)/SR)
