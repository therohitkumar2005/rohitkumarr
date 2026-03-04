// api/search.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: "Kuch toh search karein" });

    // Naya Domain
    const baseUrl = 'https://net22.cc';
    // Net22 aksar is format mein search leta hai
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(q)}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': baseUrl,
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000 
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Net22/NetMirror ke naye structure ke liye links dhundna
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).find('.title').text().trim() || $(el).text().trim();
            const img = $(el).find('img').attr('src');
            
            // Ye check karta hai ki link movie ya video ka hi ho
            if (href && (href.includes('/v/') || href.includes('/movie/') || href.includes('/watch/'))) {
                results.push({
                    title: title || "Watch Video",
                    link: href.startsWith('http') ? href : baseUrl + href,
                    image: img ? (img.startsWith('http') ? img : baseUrl + img) : 'https://via.placeholder.com/150'
                });
            }
        });

        // Agar array khali hai toh debug info dein
        if (results.length === 0) {
            return res.status(200).json({ 
                msg: "Koi result nahi mila.", 
                debug_url: searchUrl,
                tip: "Browser mein search karke dekhein kya URL wahi hai?" 
            });
        }

        return res.status(200).json(results);

    } catch (error) {
        return res.status(500).json({ 
            error: "Net22 site block hai ya down hai", 
            details: error.message 
        });
    }
};
