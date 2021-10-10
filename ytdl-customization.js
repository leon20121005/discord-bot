const fetch = require('node-fetch');
const miniget = require('miniget');

async function stream(url, options) {
    const videoId = url.split('v=')[1];
    const response = await fetch(`https://www.yt-download.org/api/button/mp3/${videoId}`);
    const text = await response.text();
    return miniget(text.split('<a href="')[1].split('" class="shadow-xl')[0], options);
}

module.exports = stream;
