// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.14
// @author       STW
// @match        https://www.facebook.com/*
// @require      https://unpkg.com/@reactivex/rxjs/dist/global/rxjs.umd.min.js
// @icon         https://www.google.com/s2/favicons?domain=facebook.com.tw
// @grant   GM_getValue
// @grant   GM_setValue
// @grant   GM_deleteValue
// @description  Remove Facebook ads, currently only works for Traditional Chinese.
// ==/UserScript==

// GitHub Repo: https://github.com/stanley2058/RemoveFacebookAds-ZH
// Direct Link: https://github.com/stanley2058/RemoveFacebookAds-ZH/raw/main/userscript.user.js
// Change the threshold to match your desire, -1 will remove all ads.
const threshold = 10000;
const lookBack = 15;

/* Change Log
1.14   - Fix due to FB's changes (they move the sponsor text into a svg).
1.13.2 - Fix because FB stupidly added a span wrapper for the feed.
1.13.1 - Usual fixes because FB change the CSS structure.
1.13   - Improve process time and accuracy, remove force all comment.
1.12.3 - Fix to counter spoofing container changed to div.
1.12.2 - Additional follow up fix.
1.12.1 - Follow up patch due to Facebook's additional spoofing. Go F yourself FB.
1.12   - Fix accordingly to Facebook's spoofing change.
1.11   - Force comment section to show all comments.
1.10   - Update selector according to FB's changes.
1.9.1  - Update unpkg url.
1.9.0  - Auto remove ADs in the first 2 seconds after page load.
1.8    - Remove top right sponsor div.
1.7    - Fix for new FB UI.
1.6    - Fix FB localStorage getting clear.
1.5    - Add block button, help msg, AD origin highlight.
1.4    - Optimize algorithm, fixing ad not being removed.
1.3    - Use rxjs to reduce resource usage while idle.
*/

const { fromEvent, interval, timer } = rxjs;
const { throttleTime, takeUntil } = rxjs.operators;

unsafeWindow.AD_Version = "1.14";

unsafeWindow.deletedPost = [];
unsafeWindow.deletedPostOwner = [];

let blockList = [];

(() => {
  const item = GM_getValue("AD_BlockList", null);
  if (item) blockList = JSON.parse(item);
})();

unsafeWindow.AD_Block = (name) => {
  blockList.push(name);
  GM_setValue("AD_BlockList", JSON.stringify(blockList));
};

const deleteAd = () => {
  const feed = [...document.querySelectorAll("#ssrb_feed_start+div > div")];
  const start = feed.length > lookBack ? feed.length - lookBack : 0;
  feed.slice(start, feed.length).forEach((div) => {
    const useLayer = div.querySelector("svg use");
    if (!useLayer) return;
    const id = useLayer.getAttribute("xlink:href").substring(1);
    const texts = document.getElementById(id)?.innerHTML || "";

    const set = new Set(texts);
    const isSponsor = set.has("贊") && set.has("助");

    if (!isSponsor) return;

    const socialNum = Math.max(
      ...[...div.querySelectorAll("div[role='button'] > span")]
        .map((e) => parseInt(e.innerText))
        .filter((n) => isFinite(n))
    );
    const name = div.querySelector("h4 a").innerText;
    if (
      threshold === -1 ||
      isNaN(socialNum) ||
      socialNum < threshold ||
      blockList.includes(name)
    ) {
      unsafeWindow.deletedPost.push(div.innerHTML);
      unsafeWindow.deletedPostOwner.push({
        name,
        url: div.querySelector("h4 a").href,
      });
      div.innerHTML = "";
    } else {
      if (!div.querySelector('button[name="blockBtn"]')) {
        div.querySelector("h4 a").style.backgroundColor = "orangered";
        div.querySelector(
          "h4"
        ).innerHTML += `<button name='blockBtn' style='position:absolute;right:50px;background-color:wheat;color:navy;' onclick="AD_Block('${name}')">Block</button>`;
      }
    }
  });

  const sponsorDiv = document.querySelector("#ssrb_rhc_start + div span");
  sponsorDiv.innerHTML = "";
};

fromEvent(window, "scroll")
  .pipe(throttleTime(300))
  .subscribe((next) => deleteAd());

unsafeWindow.AD_Help = () => {
  console.log(
    "%cFacebook AD Post Blocker",
    "color: yellow; background-color: navy; font-size: 24pt;"
  );
  console.log(
    `%cCurrent Version: ${AD_Version}`,
    "color: cyan; background-color: navy; font-size: 12pt;"
  );
  console.log(
    "%cCheck Update: https://github.com/stanley2058/RemoveFacebookAds-ZH/raw/main/userscript.user.js",
    "color: cyan; background-color: navy; font-size: 12pt;"
  );
  console.log(
    "%cOptions:",
    "color: greenyellow; background-color: navy; font-size: 18pt;"
  );
  console.table([
    {
      method: "AD_ShowDeletedPosts()",
      description: "Show deleted post origin",
    },
    {
      method: "AD_ShowFullPostByIndex(index)",
      description: "Show full html detail of certain deleted post",
    },
    { method: "AD_ClearBlockList()", description: "Clear the block list" },
    {
      method: "AD_UnBlock(name)",
      description: "Unblock post from certain origin",
    },
  ]);
  console.log(
    "%cCurrent Blocked:",
    "color: greenyellow; background-color: navy; font-size: 16pt;"
  );
  console.log(blockList);
};

unsafeWindow.AD_ShowDeletedPosts = () => {
  for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) {
    console.log(
      `${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`
    );
  }
};
unsafeWindow.AD_ShowFullPostByIndex = (index) => {
  console.log(unsafeWindow.deletedPost[index]);
};
unsafeWindow.AD_ClearBlockList = () => {
  GM_deleteValue("AD_BlockList");
};
unsafeWindow.AD_UnBlock = (name) => {
  blockList = blockList.filter((n) => n !== name);
  GM_setValue("AD_BlockList", JSON.stringify(blockList));
};
