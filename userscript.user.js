// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.11
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
const threshold = 1000;

// Change to false to switch back to Facebook's default behavior.
const forceAllComment = true;

/* Change Log
1.11   - Force comment section to show all comments.
1.10   - Update selector according to FB's changes.
1.9.1  - Update unpkg url.
1.9.0  - Auto remove ADs in the first 2 seconds after page load.
1.8    - Remove top right sponser div.
1.7    - Fix for new FB UI.
1.6    - Fix FB localStorage getting clear.
1.5    - Add block button, help msg, AD origin highlight.
1.4    - Optimize algorithm, fixing ad not being removed.
1.3    - Use rxjs to reduce resource usage while idle.
*/

const { fromEvent, interval, timer } = rxjs;
const { throttleTime, takeUntil } = rxjs.operators;

unsafeWindow.AD_Version = "1.11";

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
}

const deleteAd = () => {
    [...document.querySelector('div').querySelectorAll('div[role="article"]')].filter(div => {
        const list = [...div.querySelectorAll("a[role='link']")];
        for (const a of list) {
            if (a.innerText === "贊助") return true;
        }

        // force to show all comment
        if (forceAllComment) {
            const commentBtn = div.querySelectorAll("div[role='button'][tabindex='0'] > span[dir='auto']")[0];
            if (commentBtn?.innerText.includes("留言")) {
                const d = div;
                commentBtn.onclick = () => {
                    const timer = setInterval(() => {
                        const selectBtn = [...d.querySelectorAll("div[role='button'][tabindex='0'] > span[dir='auto']")].find(e => e.innerText.includes("最相關"))
                        if (selectBtn) {
                            selectBtn.click();
                            const timer2 = setInterval(() => {
                                const allCommentBtn = [...document.querySelectorAll("div[tabindex='-1'] div[aria-hidden='false'] div[role='menuitem']")][2];
                                if (allCommentBtn) {
                                    allCommentBtn.click();
                                    clearInterval(timer2);
                                }
                            }, 10);
                            clearInterval(timer);
                        }
                    }, 10);
                };
            }
        }

        return false;
    }).forEach(div => {
        const socialNum = Math.max(...[...div.querySelectorAll("div[role='button'] > span")].map(e => parseInt(e.innerText)).filter(n => isFinite(n)));
        const name = div.querySelector('h4 a').innerText;
        if (threshold === -1 || isNaN(socialNum) || socialNum < threshold || blockList.includes(name)) {
            unsafeWindow.deletedPost.push(div.innerHTML);
            unsafeWindow.deletedPostOwner.push({name, url: div.querySelector('h4 a').href});
            div.innerHTML = '';
        } else {
            if (!div.querySelector('button[name="blockBtn"]')) {
                div.querySelector("h4 a").style.backgroundColor = "orangered";
                div.querySelector('h4').innerHTML += `<button name='blockBtn' style='position:absolute;right:50px;background-color:wheat;color:navy;' onclick="AD_Block('${name}')">Block</button>`;
            }
        }
    });

    const sponser_div = document.querySelectorAll("div[data-pagelet='RightRail'] > div")[0];
    if (sponser_div.innerText.includes("贊助")) sponser_div.innerHTML = "";
}

fromEvent(window, 'scroll').pipe(throttleTime(300)).subscribe(next => deleteAd());
interval(50).pipe(takeUntil(timer(2000))).subscribe(next => deleteAd());

unsafeWindow.AD_Help = () => {
    console.log('%cFacebook AD Post Blocker', 'color: yellow; background-color: navy; font-size: 24pt;');
    console.log(`%cCurrent Version: ${AD_Version}`, 'color: cyan; background-color: navy; font-size: 12pt;');
    console.log('%cCheck Update: https://gist.github.com/stanley2058/970e49b0d2295be290d5793e367c46fc', 'color: cyan; background-color: navy; font-size: 12pt;');
    console.log('%cOptions:', 'color: greenyellow; background-color: navy; font-size: 18pt;');
    console.log('1. AD_ShowDeletedPosts() | Show deleted post origin')
    console.log('2. AD_ShowFullPostByIndex(index) | Show full html detail of certain deleted post')
    console.log('3. AD_ClearBlockList() | Clear the block list')
    console.log('4. AD_UnBlock(name) | Unblock post from certain origin')
    console.log()
    console.log("%cCurrent Blocked:", "color: greenyellow; background-color: navy; font-size: 16pt;")
    console.log(blockList)
}

unsafeWindow.AD_ShowDeletedPosts = () => {
    for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) console.log(`${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`);
}
unsafeWindow.AD_ShowFullPostByIndex = (index) => {
    console.log(unsafeWindow.deletedPost[index]);
}
unsafeWindow.AD_ClearBlockList = () => {
    GM_deleteValue('AD_BlockList');
}
unsafeWindow.AD_UnBlock = (name) => {
    blockList = blockList.filter(n => n !== name);
    GM_setValue("AD_BlockList", JSON.stringify(blockList));
}
