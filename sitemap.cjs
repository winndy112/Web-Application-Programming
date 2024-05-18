const {SitemapStream, streamToPromise} = require('sitemap');
const fs = require('fs');
const hostname = 'https://kheotayhaylam.azurewebsites.net';
const urls = [
    { url: '/', changefreq: 'daily', priority: 1},
    {url: '/intro', changefreq: 'daily', priority: 1},
    {url: '/index', changefreq: 'daily', priority: 0.9},
    {url: '/profile', changefreq: 'daily', priority: 0.9},
    {url: '/question-and-anwser', changefreq: 'weekly', priority: 0.6},
    {url: '/favorite', changefreq: 'daily', priority: 0.8},
    {url: '/post', changefreq: 'daily', priority: 0.8},

]
const sitemap = new SitemapStream({hostname});
for (const url of urls) {
    sitemap.write(url);
}
sitemap.end();
streamToPromise(sitemap).then(sm => {
    fs.writeFileSync('./public/sitemap.xml', sm.toString());
    console.log(sm.toString());
})