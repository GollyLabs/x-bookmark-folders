import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');

/**
 * Minimal stand-in for a DOM element. `selectors` lists the selectors the
 * element itself matches.
 */
class FakeElement {
  constructor({ selectors = [], text = '', parent = null } = {}) {
    this.selectors = selectors;
    this.textContent = text;
    this.parent = parent;
    this.clicks = 0;
  }

  closest(selector) {
    for (let element = this; element; element = element.parent) {
      if (element.selectors.includes(selector)) {
        return element;
      }
    }
    return null;
  }

  click() {
    this.clicks += 1;
  }
}

function load() {
  const state = {
    clickListener: null,
    clickables: [],
    observers: [],
    timers: []
  };

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.connected = false;
      state.observers.push(this);
    }

    observe() {
      this.connected = true;
    }

    disconnect() {
      this.connected = false;
    }
  }

  const context = vm.createContext({
    document: {
      body: {},
      addEventListener(type, listener, capture) {
        assert.equal(type, 'click');
        assert.equal(capture, true);
        state.clickListener = listener;
      },
      querySelectorAll(selector) {
        assert.equal(selector, 'button, a, [role="button"], [role="link"]');
        return state.clickables;
      }
    },
    MutationObserver: FakeMutationObserver,
    setTimeout(callback) {
      const timer = { callback, cleared: false };
      state.timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      timer.cleared = true;
    }
  });

  vm.runInContext(source, context);

  return {
    state,
    click(target, isTrusted = true) {
      state.clickListener({ target, isTrusted });
    },
    mutate() {
      for (const observer of state.observers.filter((o) => o.connected)) {
        observer.callback([]);
      }
    },
    activeObservers() {
      return state.observers.filter((observer) => observer.connected);
    }
  };
}

function bookmarkIcon() {
  const button = new FakeElement({ selectors: ['[data-testid="bookmark"]'] });
  return new FakeElement({ parent: button });
}

function addToFolderButton() {
  return new FakeElement({ text: '  Add to\n Folder ' });
}

test('clicks Add to Folder when it appears after a bookmark click', () => {
  const page = load();
  page.click(bookmarkIcon());

  page.mutate();
  assert.equal(page.activeObservers().length, 1);

  const button = addToFolderButton();
  page.state.clickables.push(new FakeElement({ text: 'Undo' }), button);
  page.mutate();

  assert.equal(button.clicks, 1);
  assert.equal(page.activeObservers().length, 0);
  assert.equal(page.state.timers[0].cleared, true);
});

test('starts watching from the Bookmark item in the share menu', () => {
  const page = load();
  const menuItem = new FakeElement({
    selectors: ['[role="menuitem"]'],
    text: 'Bookmark'
  });
  page.click(new FakeElement({ parent: menuItem }));

  assert.equal(page.activeObservers().length, 1);
});

test('ignores the Remove Bookmark menu item and unrelated clicks', () => {
  const page = load();
  page.click(new FakeElement({
    selectors: ['[role="menuitem"]'],
    text: 'Remove Bookmark'
  }));
  page.click(new FakeElement({ selectors: ['[data-testid="like"]'] }));
  page.click({});
  page.click(null);

  assert.equal(page.activeObservers().length, 0);
});

test('ignores synthetic clicks', () => {
  const page = load();
  page.click(bookmarkIcon(), false);

  assert.equal(page.activeObservers().length, 0);
});

test('stops watching after the timeout', () => {
  const page = load();
  page.click(bookmarkIcon());
  page.state.timers[0].callback();

  const button = addToFolderButton();
  page.state.clickables.push(button);
  page.mutate();

  assert.equal(button.clicks, 0);
  assert.equal(page.activeObservers().length, 0);
});

test('replaces an earlier watch when the user bookmarks again', () => {
  const page = load();
  page.click(bookmarkIcon());
  page.click(bookmarkIcon());

  assert.equal(page.activeObservers().length, 1);
  assert.equal(page.state.timers[0].cleared, true);
});
