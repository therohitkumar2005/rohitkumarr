// api/search.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // CORS headers taaki browser block na kare
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: "Search query missing" });
    }

    const baseUrl = 'https://netmirror.gg';
    // User ne jo URL diya tha uske hisaab se path:
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(q)}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 8000 // 8 seconds ke baad band ho jaye agar site slow ho
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Naya logic: NetMirror.gg ke thumbnails aur links dhundna
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            const img = $(el).find('img').attr('src');
            
            if (href && (href.includes('/v/') || href.includes('/movie/'))) {
                results.push({
                    title: title || "Movie/Show",
                    link: href.startsWith('http') ? href : baseUrl + href,
                    image: img ? (img.startsWith('http') ? img : baseUrl + img) : 'https://via.placeholder.com/150'
                });
            }
        });

        // Duplicate links hatana
        const finalData = results.filter((v,i,a)=>a.findIndex(t=>(t.link===v.link))===i);

        return res.status(200).json(finalData);

    } catch (error) {
        console.error("Backend Error:", error.message);
        return res.status(500).json({ 
            error: "NetMirror site ne respond nahi kiya", 
            details: error.message 
        });
    }
};
