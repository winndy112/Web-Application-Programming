const {SitemapStream, streamToPromise} = require('sitemap');
const fs = require('fs');
const hostname = 'https://kheotayhaylam.azurewebsites.net';
const urls = [
    { url: '/', changefreq: 'daily', priority: 1},
    {url: '/intro', changefreq: 'daily', priority: 1},
    {url: '/index', changefreq: 'daily', priority: 0.8},
    {url: '/favorite', changefreq: 'daily', priority: 0.5},
    {url: '/profile', changefreq: 'daily', priority: 0.7},
    {url: '/question-and-anwser', changefreg: 'yearly', priority: 0.5},
    {url: '/user', changefreq: 'daily', priority: 0.8}
]
const sitemap = new SitemapStream({hostname});
for (const url of urls) {
    sitemap.write(url);
}
sitemap.end();
streamToPromise(sitemap).then(sm => {
    fs.writeFileSync('./interface/sitemap.xml', sm.toString());
    console.log(sm.toString());
})