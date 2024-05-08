// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.16
// @author       STW
// @match        https://www.facebook.com/*
// @require      https://unpkg.com/@reactivex/rxjs/dist/global/rxjs.umd.min.js
// @icon         https://www.google.com/s2/favicons?domain=facebook.com.tw
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @description  Remove Facebook ads, currently only works for Traditional Chinese.
// ==/UserScript==

// GitHub Repo: https://github.com/stanley2058/RemoveFacebookAds-ZH
// Direct Link: https://github.com/stanley2058/RemoveFacebookAds-ZH/raw/main/userscript.user.js
// Change the threshold to match your desire, -1 will remove all ads.
const threshold = 10000;
const lookBack = 15;

const sponsorIdentifiers = ["贊", "助"];
const commentIdentifiers = {
    comment: "留言",
    mostRelated: "最相關",
    allComment: "所有留言"
};

/* Change Log
1.16   - Update post selector. Remove delete button.
1.15   - Force all comment is back now!
1.14.4 - Fix feed selector.
1.14.3 - Fix feed selector again.
1.14.2 - Change AD deletion method.
1.14.1 - Fix feed selector due to FB's minor changes.
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

const { fromEvent, interval } = rxjs;
const { throttleTime } = rxjs.operators;

unsafeWindow.AD_Version = "1.16";

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
  // delete top right ad
  const sponsorDiv = document.querySelector("#ssrb_rhc_start + div span");
  if (sponsorDiv) sponsorDiv.innerHTML = "";

  const feed = Array.from(document.querySelectorAll("div:not(.html-div):not([class]):has(> div.html-div)"));
  if (feed.length === 0) return;
  const start = feed.length > lookBack ? feed.length - lookBack : 0;
  feed.slice(start, feed.length).forEach((div) => {
    const useLayer = div.querySelector("svg use");
    if (!useLayer) return;
    const texts = document.querySelector(useLayer.getAttribute("xlink:href") || "")?.innerHTML || "";

    const set = new Set(texts);
    const isSponsor = sponsorIdentifiers.every(i => set.has(i));

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

      // delete post
      div.style.display = "none";
    }
  });
};

const forceAllComment = () => {
    const dropMenu = Array.from(document.querySelectorAll('h3[dir="auto"],h2[dir="auto"]'))
        .filter(h => h.innerText === commentIdentifiers.comment)
        .flatMap(h => Array.from(h.parentElement.querySelectorAll('div[role="button"]')))
            .find(e => e.innerText.includes(commentIdentifiers.mostRelated));
    if (!dropMenu) return;
    dropMenu.click();
    setTimeout(() => {
        Array.from(document.querySelectorAll('div[role="menuitem"]'))
            .find(e => e.innerText.startsWith(commentIdentifiers.allComment))?.click();
    }, 1)
}

fromEvent(window, "scroll")
  .pipe(throttleTime(300))
  .subscribe(deleteAd);

interval(200).subscribe(forceAllComment);

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
