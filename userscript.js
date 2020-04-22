// ==UserScript==
// @name         Remove Facebook Ad Posts
// @version      1
// @author       STW
// @match        https://www.facebook.com/
// ==/UserScript==

unsafeWindow.deletedPost = [];
unsafeWindow.deletedPostOwner = [];

setInterval(() => {
    Array.from(document.querySelectorAll('div')).filter(d => d.getAttribute('role') === 'article').forEach(div => {
        if (Array.from(div.querySelectorAll('a')).filter(a => a.getAttribute('role') === 'button').filter(a => a.innerText === '贊助').length === 1) {
            unsafeWindow.deletedPost.push(div.innerHTML);
            unsafeWindow.deletedPostOwner.push({name: div.querySelector('h5 a').innerText, url: div.querySelector('h5 a').href});
            div.innerHTML = '';
        }
    });
}, 1000);

unsafeWindow.showDeletedPosts = function() {
    for (let i = 0; i < unsafeWindow.deletedPostOwner.length; ++i) console.log(`${i}: ${unsafeWindow.deletedPostOwner[i].name}\n${unsafeWindow.deletedPostOwner[i].url}`);
}
unsafeWindow.showFullPostByIndex = function(index) {
    console.log(unsafeWindow.deletedPost[index]);
}
