var controller;
var tweetButton;

function setSpellcheck(value, callback = function() {}) {
  chrome.storage.sync.set({ spellchecked: value }, function() {
    if (chrome.runtime.error) {
      console.error("Runtime error:", chrome.runtime.error);
    }
    callback();
  });
}

function listenToClicks(button) {
  if (!button) return;

  chrome.storage.sync.get("spellchecked", function(data) {
    let spellchecked = data.spellchecked;

    function countChars() {
      let contentSpan = document.querySelector('span[data-text="true"]');
      if (!contentSpan || !contentSpan.innerText) {
        return 0;
      }
      return contentSpan.innerText.length;
    }

    function isHomepage() {
      return (
        window.location.href === "http://twitter.com" ||
        window.location.href === "https://twitter.com" ||
        window.location.href === "http://twitter.com/home" ||
        window.location.href === "https://twitter.com/home"
      );
    }

    controller = function(event) {
      // If the user gets here, they successfully double-checked his content, but we also have to reset the spell checker
      // variable for the next tweet.
      if (spellchecked) {
        setSpellcheck(false, function() {
          spellchecked = false;
        });
        return;
      }
      // We don't mind single tweets with less than 200 characters
      if (isHomepage() && countChars() < 100) {
        return;
      }

      alert("Your tweet is long. Double-check your content for typos and wrong handles.");
      event.preventDefault();
      event.stopImmediatePropagation();

      setSpellcheck(true, function() {
        spellchecked = true;
      });
    };

    button.addEventListener("click", controller);
  });
}

// The tweet button is all over the place and, when the screen width is below a specific threshold, it's
// not even shown. We have to constantly monitor the DOM to
function findAndListenToClicksForButton(selector) {
  if (!selector) return;
  setInterval(function() {
    button = document.querySelector(selector);
    if (!button) return;
    // Initialise
    if (!tweetButton) {
      tweetButton = button;
      listenToClicks(tweetButton);
    }
    // Check for new instance
    else {
      if (button !== tweetButton) {
        setSpellcheck(false, function() {
          tweetButton.removeEventListener("click", controller);
          tweetButton = button;
          listenToClicks(tweetButton);
        });
      }
    }
  }, 800);
}

chrome.storage.sync.set({ spellchecked: false }, function() {
  if (chrome.runtime.error) {
    console.error("Runtime error:", chrome.runtime.error);
  } else {
    findAndListenToClicksForButton('div[data-testid="tweetButton"]');
  }
});

// Chrome pre-34
if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.webkitMatchesSelector;
