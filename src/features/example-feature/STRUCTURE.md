# Feature Folder Contract

Every feature folder must expose the same contract so the router can load it dynamically.

Required files:

- `index.js` — Must export an `init(mount, State)` function. Router will call this after injecting `template.html` into the `#app-content` element.
- `template.html` — HTML fragment (no <html>/<body>) for the feature. Must include ARIA attributes and support keyboard navigation.
- `styles.css` — Optional scoped CSS for the feature. Router will attempt to load it if present.
- `logic.js` — Optional helper module(s) for feature behavior.

Import rules:

- A feature must NOT import internal files from other feature folders. Import only from `../shared/*` or its own files.

Example:

```js
// good
import { createCard } from '../shared/index.js';
import { helper } from './logic.js';

// bad
import something from '../other-feature/secret.js';
```
