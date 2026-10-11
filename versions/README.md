# Temporary design comparison

- `index.html`: refined design
- `original.html`: original presentation with temporary comparison controls
- `versions/before-ux/`: exact source snapshot before refinement; media and vendor assets are shared at the site root

The footer switch preserves the active page and selected project. Both entry points work under a GitHub Pages repository path without a build step.

After choosing the refined design, remove `original.html`, `assets/original-adapter.js`, `versions/`, `assets/compare.css`, and `assets/compare.js`. Remove the two comparison asset references and `.design-compare` footer markup from `index.html`, then restore the footer text. Keep `assets/refined.css` and `assets/refined.js`.

To restore the original design completely, copy the five source files in `versions/before-ux/` back to their matching root paths. The media files have not been changed.
