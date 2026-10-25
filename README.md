# X Bookmark Folders

X Bookmark Folders is a small Manifest V3 extension for Microsoft Edge and other Chromium browsers. When you bookmark a post on X, it opens X's **Add to Folder** picker right away, so you can file the post without clicking the toast.

## How it works

When you bookmark a post, X saves it and shows a toast with an **Add to Folder** button. The extension waits up to five seconds after your click for that button and clicks it for you.

The extension starts watching after either of these clicks:

- the bookmark icon in a post's action bar, and
- the **Bookmark** item in a post's share menu.

Removing a bookmark does nothing. X shows the **Add to Folder** button only to accounts that have bookmark folders, which require a paid X plan. Without folders, the extension has no effect.

The extension matches the English text "Add to Folder" and "Bookmark". If X is set to another language, the extension won't find the button.

## Install unpacked in Microsoft Edge

1. Open `edge://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project directory, which contains `manifest.json`.
5. Reload any X tabs that are already open.

## Install unpacked in Google Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project directory, which contains `manifest.json`.
5. Reload any X tabs that are already open.

## Privacy and permissions

The extension runs a content script on `https://x.com/*` and `https://twitter.com/*` only. It requests no other permissions. It stores no data, makes no network requests, and contains no remote code.

## When X changes its page

The extension finds the action-bar bookmark button by X's `data-testid="bookmark"` attribute. It finds the menu item and the toast button by their visible text. If X renames either one, update the constants at the top of `content.js`.

## Development and validation

The extension has no dependencies and no build step. Node.js 20 or later is used only for local tests.

```sh
npm test
npm run check
```

The tests run `content.js` against a fake DOM.

## Project structure

```text
manifest.json              Manifest V3 metadata and the X content script
content.js                 Watches for a bookmark and clicks Add to Folder
test/                      Node built-in tests
icons/                     Original SVG and generated PNG extension icons
LICENSE                    MIT license
package.json               Test and validation scripts
```

## License

[MIT](LICENSE)
