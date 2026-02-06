import json
import os

# On estan els teus fitxers actuals
files_info = {
    'ca': 'src/locales/ca.json',
    'es': 'src/locales/es.json',
    'en': 'src/locales/en.json'
}

def flatten(x, name=''):
    out = {}
    if type(x) is dict:
        for a in x: flatten(x[a], name + a + '.')
    else: out[name[:-1]] = x
    return out

def unflatten(dictionary):
    result = {}
    for key, value in dictionary.items():
        parts = key.split(".")
        d = result
        for part in parts[:-1]:
            if part not in d: d[part] = {}
            d = d[part]
        d[parts[-1]] = value
    return result

# 1. Llegim tots els fitxers i fem una llista de TOTES les claus que existeixen
data = {}
all_keys = set()
for lang, path in files_info.items():
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            flat = flatten(json.load(f))
            data[lang] = flat
            all_keys.update(flat.keys())

# 2. Creem els nous fitxers: si falta una traducció, avisem
for lang, path in files_info.items():
    final_flat = {}
    for key in sorted(all_keys):
        if key in data[lang]:
            final_flat[key] = data[lang][key]
        else:
            final_flat[key] = f"PENDENT TRADUCCIÓ ({lang.upper()})"
    
    final_json = unflatten(final_flat)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(final_json, f, ensure_ascii=False, indent=4)

print("✅ Fitxers ca.json, es.json i en.json unificats amb èxit!")