// api/search.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: "Kuch search karein" });

    // Hum 2-3 alag tareeke try karenge kyunki 404 aa raha hai
    const baseUrl = 'https://netmirror.gg';
    const searchUrl = `${baseUrl}/search.php?q=${encodeURIComponent(q)}`; // Kuch sites search.php use karti hain
    const fallbackUrl = `${baseUrl}/search?q=${encodeURIComponent(q)}`;

    try {
        // Pehle search.php try karte hain, agar wo na chale toh fallback
        let response;
        try {
            response = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
        } catch (e) {
            response = await axios.get(fallbackUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
        }

        const $ = cheerio.load(response.data);
        const results = [];

        // NetMirror.gg ke liye naya selector
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            
            // Sirf wahi links lein jo movies ya videos ke hon
            if (href && (href.includes('/v/') || href.includes('/movie/') || href.includes('/watch/'))) {
                results.push({
                    title: title || "Watch Now",
                    link: href.startsWith('http') ? href : baseUrl + href,
                    image: $(el).find('img').attr('src') || 'https://via.placeholder.com/150'
                });
            }
        });

        if (results.length === 0) {
            return res.status(200).json({ msg: "Koi result nahi mila, par site chal rahi hai." });
        }

        return res.status(200).json(results);

    } catch (error) {
        return res.status(500).json({ 
            error: "NetMirror link galat hai ya site block hai", 
            tried_url: searchUrl,
            status: error.response ? error.response.status : "No Response"
        });
    }
};
