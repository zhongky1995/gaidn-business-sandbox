"""Build the standalone app and update the GitHub Pages directory."""
from pathlib import Path
import runpy
import shutil
root = Path(__file__).resolve().parent
runpy.run_path(str(root / 'build.py'), run_name='__main__')
(root / 'docs').mkdir(exist_ok=True)
shutil.copy2(root / 'dist/index.html', root / 'docs/index.html')
(root / 'docs/.nojekyll').touch()
print('GitHub Pages directory updated: docs/')
