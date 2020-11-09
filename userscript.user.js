// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.7
// @author       STW
// @match        https://www.facebook.com/*
// @require      https://unpkg.com/rxjs/bundles/rxjs.umd.min.js
// @grant   GM_getValue
// @grant   GM_setValue
// @grant   GM_deleteValue
// ==/UserScript==

// Gist Url: https://gist.github.com/stanley2058/970e49b0d2295be290d5793e367c46fc
// Change the threshold to match your desire, -1 will remove all ads.
const threshold = 1000;

/* Change Log
1.7 - Fix for new FB UI.
1.6 - Fix FB localStorage getting clear.
1.5 - Add block button, help msg, AD origin highlight.
1.4 - Optimize algorithm, fixing ad not being removed.
1.3 - Use rxjs to reduce resource usage while idle.
*/

const { fromEvent } = rxjs;
const { throttleTime } = rxjs.operators;

unsafeWindow.AD_Version = "1.6";

unsafeWindow.deletedPost = [];
unsafeWindow.deletedPostOwner = [];

let blockList = [];

(() => {
    const item = GM_getValue("AD_BlockList", null);
    if (item) blockList = JSON.parse(item);
})();

unsafeWindow.AD_Block = function(name) {
    blockList.push(name);
    GM_setValue("AD_BlockList", JSON.stringify(blockList));
}

fromEvent(window, 'scroll').pipe(throttleTime(300)).subscribe(next => {
    [...document.querySelector('div').querySelectorAll('div[role="article"]')].filter(div => {
        const list = [...div.querySelectorAll("span > a")];
        for (const a of list) {
            const attr = a.getAttribute("aria-label");
            if (attr && attr.includes("贊助")) return true;
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
})

unsafeWindow.AD_Help = function() {
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

unsafeWindow.AD_ShowDeletedPosts = function() {
    for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) console.log(`${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`);
}
unsafeWindow.AD_ShowFullPostByIndex = function(index) {
    console.log(unsafeWindow.deletedPost[index]);
}
unsafeWindow.AD_ClearBlockList = function() {
    GM_deleteValue('AD_BlockList');
}
unsafeWindow.AD_UnBlock = function(name) {
    blockList = blockList.filter(n => n !== name);
    GM_setValue("AD_BlockList", JSON.stringify(blockList));
}
