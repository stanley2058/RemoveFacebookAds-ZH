// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.5
// @author       STW
// @match        https://www.facebook.com/*
// @require      https://unpkg.com/rxjs/bundles/rxjs.umd.min.js
// ==/UserScript==

// Gist Url: https://gist.github.com/stanley2058/970e49b0d2295be290d5793e367c46fc
// Change the threshold to match your desire, -1 will remove all ads.
const threshold = 1000;

/* Change Log
1.5 - Add block button, help msg, AD origin highlight.
1.4 - Optimize algorithm, fixing ad not being removed.
1.3 - Use rxjs to reduce resource usage while idle.
*/

const { fromEvent } = rxjs;
const { throttleTime } = rxjs.operators;

unsafeWindow.AD_Version = "1.5";

unsafeWindow.deletedPost = [];
unsafeWindow.deletedPostOwner = [];

let blockList = [];

(() => {
    const item = localStorage.getItem("AD_BlockList");
    if (item) blockList = JSON.parse(item);
})();

unsafeWindow.addToBlockList = function(name) {
    blockList.push(name);
    localStorage.setItem("AD_BlockList", JSON.stringify(blockList));
}

fromEvent(window, 'scroll').pipe(throttleTime(300)).subscribe(next => {
    [...document.querySelector('div').querySelectorAll('div[role="article"]')].filter(div => div.innerText.includes("贊助")).forEach(div => {
        const socialNum = Math.max(...[...div.querySelectorAll('span[data-hover="tooltip"]')].map(span => parseInt(span.innerText.replace(/,/g, '').trim())).filter(num => isFinite(num)));
        const name = div.querySelector('h5 a').innerText;
        if (threshold === -1 || isNaN(socialNum) || socialNum < threshold || blockList.includes(name)) {
            unsafeWindow.deletedPost.push(div.innerHTML);
            unsafeWindow.deletedPostOwner.push({name, url: div.querySelector('h5 a').href});
            div.innerHTML = '';
        } else {
            if (!div.querySelector('button[name="blockBtn"]')) {
                div.querySelector("h5 a").style.backgroundColor = "orangered";
                div.querySelector('h5').innerHTML += `<button name='blockBtn' style='position:absolute;right:50px;background-color:wheat;color:navy;' onclick="addToBlockList('${name}')">Block</button>`;
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
}

unsafeWindow.AD_ShowDeletedPosts = function() {
    for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) console.log(`${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`);
}
unsafeWindow.AD_ShowFullPostByIndex = function(index) {
    console.log(unsafeWindow.deletedPost[index]);
}
unsafeWindow.AD_ClearBlockList = function() {
    localStorage.removeItem('AD_BlockList');
}
unsafeWindow.AD_UnBlock = function(name) {
    blockList = blockList.filter(n => n !== name);
    localStorage.setItem("AD_BlockList", JSON.stringify(blockList));
}
