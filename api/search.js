// api/search.js
const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
    const { q } = req.query; // User jo search karega
    const targetUrl = `https://netmirror.org/search?q=${q}`; // NetMirror ka search link

    try {
        const response = await axios.get(targetUrl);
        const $ = cheerio.load(response.data);
        const results = [];

        // Ye part NetMirror ki site se movie ka naam aur link nikaalega
        $('.movie-list .item').each((i, el) => {
            results.push({
                title: $(el).find('.title').text(),
                link: $(el).find('a').attr('href'),
                image: $(el).find('img').attr('src')
            });
        });

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "Data fetch nahi ho paya" });
    }
}