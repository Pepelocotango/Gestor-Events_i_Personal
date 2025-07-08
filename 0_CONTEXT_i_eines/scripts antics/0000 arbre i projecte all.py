#!/usr/bin/env python3
"""
Genera dos fitxers a 0_CONTEXT_i_eines:
- 00arbre_directoris.txt: arbre complet del projecte (exclou només 0_CONTEXT_i_eines de l'arrel)
- 00_projecte_concatenat.txt: concatenació de fitxers i carpetes rellevants del projecte
Es pot executar des de 0_CONTEXT_i_eines i escaneja l'arrel del projecte automàticament.
"""
import os
import sys

OUTPUT_FILE = "00_projecte_concatenat.txt"
ARBRE_FILE = "00arbre_directoris.txt"

ROOT_FILES_TO_INCLUDE = [
    "package.json", "package-lock.json", "vite.config.ts", "tailwind.config.cjs",
    "postcss.config.cjs", "tsconfig.json", "main.cjs", "preload.cjs", "index.html",
    "README.md", "LICENSE", ".gitattributes", ".gitignore", "metadata.json"
]
DIRECTORIES_TO_INCLUDE = ["src", ".github", "examples json"]
DIRECTORIES_TO_EXCLUDE = ["0_CONTEXT_i_eines", "node_modules", "dist", ".git", "chekpoints"]
FILES_TO_EXCLUDE = [
    "google-credentials.json", ".env.local", OUTPUT_FILE, ARBRE_FILE,
    os.path.basename(__file__),
]

def arbre_simple_a_fitxer(directori_a_escanejar, fitxer_sortida_obj):
    print(f"Arbre del directori: {os.path.abspath(directori_a_escanejar)}\n", file=fitxer_sortida_obj)
    directori_base_norm = os.path.normpath(directori_a_escanejar)
    directorios_a_excluir = []
    if os.path.abspath(directori_a_escanejar) == os.path.abspath(os.path.join(os.path.dirname(__file__), '..')):
        directorios_a_excluir = ['0_CONTEXT_i_eines']
    directorios_especials = ['node_modules', '.git']
    for arrel, dirs, fitxers in os.walk(directori_a_escanejar, topdown=True):
        if directorios_a_excluir and os.path.abspath(arrel) == os.path.abspath(directori_a_escanejar):
            dirs[:] = [d for d in dirs if d not in directorios_a_excluir]
        dirs.sort()
        arrel_norm = os.path.normpath(arrel)
        nivell = 0 if arrel_norm == directori_base_norm else arrel_norm[len(directori_base_norm):].count(os.sep)
        indent = '    ' * nivell
        nom_directori_actual = os.path.basename(arrel_norm)
        # Si és node_modules o .git, només mostra el primer nivell de subdirectoris
        if nom_directori_actual in directorios_especials:
            print(f"{indent}{nom_directori_actual}/", file=fitxer_sortida_obj)
            subindent = '    ' * (nivell + 1)
            try:
                subdirs = [d for d in os.listdir(arrel) if os.path.isdir(os.path.join(arrel, d))]
                for d in sorted(subdirs):
                    print(f"{subindent}{d}/", file=fitxer_sortida_obj)
            except Exception:
                pass
            dirs.clear()
            continue
        if nivell == 0:
            print(f"{nom_directori_actual}/ (directori arrel de l'escaneig)", file=fitxer_sortida_obj)
        else:
            print(f"{indent}{nom_directori_actual}/", file=fitxer_sortida_obj)
        subindent = '    ' * (nivell + 1)
        for f in sorted(fitxers):
            print(f"{subindent}{f}", file=fitxer_sortida_obj)
        if fitxers and dirs:
            print("", file=fitxer_sortida_obj)

def write_file_content(outfile, file_path):
    relative_path = os.path.relpath(file_path).replace(os.sep, '/')
    outfile.write(f"--- START OF FILE: ./{relative_path} ---\n")
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if not content.strip():
                outfile.write("[Fitxer buit]\n")
            else:
                outfile.write(content)
    except Exception as e:
        outfile.write(f"[Error llegint el fitxer: {e}]\n")
    outfile.write(f"\n--- END OF FILE: ./{relative_path} ---\n\n")

def concatena_projecte(directori_arrel, fitxer_sortida):
    print("Iniciant la concatenació completa del projecte...")
    files_to_exclude_set = set(FILES_TO_EXCLUDE)
    with open(fitxer_sortida, "w", encoding="utf-8") as outfile:
        print("Processant fitxers de configuració de l'arrel...")
        for file_name in ROOT_FILES_TO_INCLUDE:
            file_path = os.path.join(directori_arrel, file_name)
            if file_name in files_to_exclude_set:
                continue
            if os.path.exists(file_path) and os.path.isfile(file_path):
                print(f"  -> Afegint: {file_name}")
                write_file_content(outfile, file_path)
            else:
                print(f"Avís: El fitxer d'arrel '{file_name}' no s'ha trobat.")
        for directory in DIRECTORIES_TO_INCLUDE:
            dir_path = os.path.join(directori_arrel, directory)
            if not os.path.isdir(dir_path):
                print(f"Avís: El directori '{directory}' no existeix.")
                continue
            print(f"Processant el directori: '{directory}'...")
            for root, dirs, files in os.walk(dir_path, topdown=True):
                dirs[:] = [d for d in dirs if d not in DIRECTORIES_TO_EXCLUDE]
                files.sort()
                for file in files:
                    if file in files_to_exclude_set:
                        continue
                    file_path = os.path.join(root, file)
                    print(f"  -> Afegint: {file_path}")
                    write_file_content(outfile, file_path)
    print("-" * 50)
    print(f"✅ Procés finalitzat amb èxit.")
    print(f"El projecte complet s'ha escrit a '{fitxer_sortida}'")
    print("-" * 50)

if __name__ == "__main__":
    try:
        directori_script = os.path.dirname(os.path.abspath(__file__))
        directori_arrel = os.path.abspath(os.path.join(directori_script, '..'))
        ruta_arbre = os.path.join(directori_script, ARBRE_FILE)
        ruta_concat = os.path.join(directori_script, OUTPUT_FILE)
        with open(ruta_arbre, 'w', encoding='utf-8') as f_out:
            arbre_simple_a_fitxer(directori_arrel, f_out)
        print(f"L'arbre de directoris s'ha generat correctament a: {ruta_arbre}")
        print(f"S'ha escanejat el directori: {directori_arrel}")
        concatena_projecte(directori_arrel, ruta_concat)
        print(f"La concatenació del projecte s'ha generat correctament a: {ruta_concat}")
        input("\nProcés completat. Prem ENTER per sortir...")
    except Exception as e:
        missatge_error = f"Ha ocorregut un error inesperat: {e}"
        print(missatge_error, file=sys.stderr)
        os.system(f'zenity --error --text="{missatge_error}" --title="Error en Arbre Directoris" 2>/dev/null || true')
        input(f"\nS'ha produït un error inesperat. Prem ENTER per sortir...")
        sys.exit(1)
