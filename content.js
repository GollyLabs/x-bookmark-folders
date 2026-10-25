'use strict';

// After a post is bookmarked, X shows a toast with an "Add to Folder" button.
// This script clicks that button so the folder picker opens immediately.
// It matches visible text rather than X's internal test IDs where it can,
// because the text is less likely to change between X releases.

const BOOKMARK_BUTTON_SELECTOR = '[data-testid="bookmark"]';
const MENU_ITEM_SELECTOR = '[role="menuitem"]';
const CLICKABLE_SELECTOR = 'button, a, [role="button"], [role="link"]';
const BOOKMARK_LABEL = /^bookmark$/i;
const ADD_TO_FOLDER_LABEL = /^add to folder$/i;
const WATCH_TIMEOUT_MS = 5000;

let stopWatching = null;

document.addEventListener('click', onClick, true);

/**
 * Starts watching for the toast when the user bookmarks a post, either from
 * the action bar or from the "Bookmark" item in a post's share menu.
 *
 * @param {MouseEvent} event
 */
function onClick(event) {
  if (event.isTrusted && isBookmarkTrigger(event.target)) {
    watchForAddToFolder();
  }
}

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isBookmarkTrigger(target) {
  if (typeof target?.closest !== 'function') {
    return false;
  }

  if (target.closest(BOOKMARK_BUTTON_SELECTOR)) {
    return true;
  }

  const menuItem = target.closest(MENU_ITEM_SELECTOR);
  return menuItem != null && BOOKMARK_LABEL.test(normalize(menuItem.textContent));
}

/**
 * Clicks "Add to Folder" as soon as it appears, or gives up after
 * WATCH_TIMEOUT_MS. Accounts without bookmark folders never see the button,
 * so for them the watch expires without effect.
 */
function watchForAddToFolder() {
  stopWatching?.();

  const observer = new MutationObserver(() => {
    if (clickAddToFolder()) {
      stop();
    }
  });
  const timer = setTimeout(stop, WATCH_TIMEOUT_MS);

  function stop() {
    observer.disconnect();
    clearTimeout(timer);
    if (stopWatching === stop) {
      stopWatching = null;
    }
  }

  stopWatching = stop;
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * @returns {boolean} Whether the button was found and clicked.
 */
function clickAddToFolder() {
  const button = findAddToFolderButton(document);
  if (!button) {
    return false;
  }

  button.click();
  return true;
}

/**
 * @param {ParentNode} root
 * @returns {HTMLElement | null}
 */
function findAddToFolderButton(root) {
  for (const element of root.querySelectorAll(CLICKABLE_SELECTOR)) {
    if (ADD_TO_FOLDER_LABEL.test(normalize(element.textContent))) {
      return element;
    }
  }

  return null;
}

/**
 * @param {string | null | undefined} text
 * @returns {string}
 */
function normalize(text) {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}
