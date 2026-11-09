"""Runs the browser tests: python tests/browser/run.py [site URL]

With no URL it builds the app and tests it on this computer, including against simulated iPhone and Android code.
With a URL, such as the live site, it runs the two suites that can test a real server.
"""
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
url = sys.argv[1:]
if not url:
    subprocess.run(['node', 'scripts/build.js'], cwd=HERE.parents[1], check=True)
suites = ['e2e_app.py', 'e2e_calendar.py'] + ([] if url else ['e2e_native.py', 'e2e_alarms.py', 'crawl_app.py'])
env = {**os.environ, 'PYTHONIOENCODING': 'utf-8'}
failed = []
for suite in suites:
    print(f'--- {suite}', flush=True)
    if subprocess.run([sys.executable, str(HERE / suite), *url], env=env).returncode:
        failed.append(suite)
print(f'Failed: {", ".join(failed)}' if failed else f'All {len(suites)} suites passed')
sys.exit(1 if failed else 0)
