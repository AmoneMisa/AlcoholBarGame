from pathlib import Path

root=Path(__file__).resolve().parents[1]
target=Path('C:/Users/kubai/.codex/visualizations/2026/10/07/01a11537-35c9-7660-8318-346e7cc5f58f/bar-customizer-design.html')
text=target.read_text(encoding='utf-8')
marker='<script type="application/json" id="bar-customizer-assets">'
start=text.index(marker)+len(marker)
end=text.index('</script>',start)
data=(root/'.tmp/modular-all/bar-customizer-design-assets.json').read_text(encoding='utf-8')
text=text[:start]+data+text[end:]
target.write_text(text,encoding='utf-8')
assert target.stat().st_size<1000000
print(target.stat().st_size)
