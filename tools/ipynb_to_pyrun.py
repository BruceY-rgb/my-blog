#!/usr/bin/env python3
"""
Convert Jupyter Notebook (.ipynb) to Hexo markdown with {% pyrun %} tags
Usage: python scripts/ipynb_to_pyrun.py input.ipynb output.md
"""

import json
import sys
from pathlib import Path

def convert_ipynb_to_markdown(ipynb_path, output_path):
    with open(ipynb_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)

    lines = []

    for cell in nb.get('cells', []):
        cell_type = cell.get('cell_type')
        source = ''.join(cell.get('source', []))

        if cell_type == 'markdown':
            lines.append(source)
            lines.append('')

        elif cell_type == 'code' and source.strip():
            # Detect required packages from imports
            imports = []
            for line in source.split('\n'):
                if line.strip().startswith(('import ', 'from ')):
                    if 'numpy' in line or 'np' in line:
                        imports.append('numpy')
                    if 'pandas' in line or 'pd' in line:
                        imports.append('pandas')
                    if 'matplotlib' in line or 'plt' in line:
                        imports.append('matplotlib')

            preload = ' '.join(set(imports))
            lines.append(f'{{% pyrun {preload} %}}')
            lines.append(source)
            lines.append('{% endpyrun %}')
            lines.append('')

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'✓ Converted {ipynb_path} -> {output_path}')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python scripts/ipynb_to_pyrun.py input.ipynb output.md')
        sys.exit(1)

    convert_ipynb_to_markdown(sys.argv[1], sys.argv[2])
