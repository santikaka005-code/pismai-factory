const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

assert.match(styles, /@media \(max-width: 920px\) \{[\s\S]*?\.topbar \{[\s\S]*?margin-left: 0;/);
assert.match(styles, /@media \(max-width: 920px\) \{[\s\S]*?\.content \{[\s\S]*?padding: 18px 16px 28px;/);
assert.match(styles, /@media \(max-width: 920px\) \{[\s\S]*?\.sidebar \{[\s\S]*?transform: translateX\(-105%\);/);
assert.match(styles, /@media \(max-width: 920px\) \{[\s\S]*?\.sidebar \{[\s\S]*?z-index: 100;/);
assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*?\.home-fruit-grid \{[\s\S]*?grid-template-columns: 1fr;/);
assert.match(app, /const routeChanged = Boolean\(lastRenderedRoute && lastRenderedRoute !== route\)/);
assert.match(app, /if \(routeChanged\) window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);

console.log("Responsive shell UI tests passed.");
