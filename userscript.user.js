// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1.3
// @author       STW
// @match        https://www.facebook.com/*
// @require      https://unpkg.com/rxjs/bundles/rxjs.umd.min.js
// ==/UserScript==

// Change the threshold to match your desire, -1 will remove all ads.
const threshold = 3000;

/* Change Log
1.3 - Use rxjs to reduce resource usage while idle.
*/

const { fromEvent } = rxjs;
const { throttleTime } = rxjs.operators;

unsafeWindow.deletedPost = [];
unsafeWindow.deletedPostOwner = [];

fromEvent(window, 'scroll').pipe(throttleTime(300)).subscribe(next => {
    Array.from(document.querySelectorAll('div')).filter(d => d.getAttribute('role') === 'article').forEach(div => {
        if (Array.from(div.querySelectorAll('a')).filter(a => a.getAttribute('role') === 'button').filter(a => a.innerText.includes('贊助')).length === 1) {
            const reactArr = Array.from(div.querySelectorAll('a')).filter(a => a.getAttribute('role') === 'button')
                               .map(a => Array.from(a.querySelectorAll('span'))).flat()
                               .filter(span => span.getAttribute('data-hover') === 'tooltip' && span.classList.length === 0 && span.id === '')
                               .map(span => span.innerText);

            if (threshold === -1 || reactArr.length === 0 || parseInt(reactArr[0].replace(/,/g, '')) <= threshold) {
                unsafeWindow.deletedPost.push(div.innerHTML);
                unsafeWindow.deletedPostOwner.push({name: div.querySelector('h5 a').innerText, url: div.querySelector('h5 a').href});
                div.innerHTML = '';
            }
        }
    });
})

unsafeWindow.AD_ShowDeletedPosts = function() {
    for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) console.log(`${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`);
}
unsafeWindow.AD_ShowFullPostByIndex = function(index) {
    console.log(unsafeWindow.deletedPost[index]);
}
