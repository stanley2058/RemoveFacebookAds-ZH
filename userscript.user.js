// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.4
// @author       STW
// @match        https://www.facebook.com/*
// @require      https://unpkg.com/rxjs/bundles/rxjs.umd.min.js
// ==/UserScript==

// Gist Url: https://gist.github.com/stanley2058/970e49b0d2295be290d5793e367c46fc
// Change the threshold to match your desire, -1 will remove all ads.
const threshold = 3000;

/* Change Log
1.4 - Optimize algorithm, fixing ad not being removed.
1.3 - Use rxjs to reduce resource usage while idle.
*/

const { fromEvent } = rxjs;
const { throttleTime } = rxjs.operators;

unsafeWindow.deletedPost = [];
unsafeWindow.deletedPostOwner = [];

fromEvent(window, 'scroll').pipe(throttleTime(300)).subscribe(next => {
    [...document.querySelector('div[role="feed"]').querySelectorAll('div[role="article"]')].filter(div => div.innerText.includes("贊助")).forEach(div => {
        const socialNum = Math.max(...[...div.querySelectorAll('span[data-hover="tooltip"]')].map(span => parseInt(span.innerText.replace(/,/g, '').trim())).filter(num => isFinite(num)));
        if (threshold === -1 || socialNum < threshold) {
            unsafeWindow.deletedPost.push(div.innerHTML);
            unsafeWindow.deletedPostOwner.push({name: div.querySelector('h5 a').innerText, url: div.querySelector('h5 a').href});
            div.innerHTML = '';
        }
    });
})

unsafeWindow.AD_ShowDeletedPosts = function() {
    for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) console.log(`${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`);
}
unsafeWindow.AD_ShowFullPostByIndex = function(index) {
    console.log(unsafeWindow.deletedPost[index]);
}
