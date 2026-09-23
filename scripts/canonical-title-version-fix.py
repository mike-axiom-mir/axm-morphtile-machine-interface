from pathlib import Path

# This transient helper updates only stale version truth assertions after the bounded feature bump.

def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one occurrence, found {count}: {old!r}")
    p.write_text(text.replace(old, new, 1))


replace_once(
    "test/interface-intent.test.js",
    '  assert.equal(MACHINE.version, "0.5.17");',
    '  assert.equal(MACHINE.version, "0.5.18");'
)
replace_once(
    "test/nested-layout.test.js",
    '  assert.equal(out.machine.version, "0.5.17");',
    '  assert.equal(out.machine.version, "0.5.18");'
)
replace_once(
    "test/ordered-elements.test.js",
    '  assert.equal(out.machine.version, "0.5.17");',
    '  assert.equal(out.machine.version, "0.5.18");'
)
