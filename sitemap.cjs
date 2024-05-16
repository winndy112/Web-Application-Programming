const {SitemapStream, streamToPromise} = require('sitemap');
const fs = require('fs');
const hostname = 'https://kheotayhaylam.azurewebsites.net';
const urls = [
    { url: '/', changefreq: 'daily', priority: 1},
    {url: '/home', changefreq: 'daily', priority: 0.3},
]