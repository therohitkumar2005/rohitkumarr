const axios = require('axios');

const mainUrl = "https://net22.cc";

async function getBypassCookie() {
    try {
        // Kotlin logic: POST to /tv/p.php until it gives "r":"n"
        const response = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });
        
        // Axios automatically manages cookies, but we need the specific 't_hash_t'
        const cookieHeader = response.headers['set-cookie'];
        return cookieHeader ? cookieHeader.map(c => c.split(';')[0]).join('; ') : '';
    } catch (e) {
        console.error("Bypass failed", e.message);
        return "";
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query missing" });

    const cookie = await getBypassCookie();
    const unixTime = Date.now();
    
    // Kotlin Search API URL
    const searchUrl = `${mainUrl}/search.php?s=${encodeURIComponent(q)}&t=${unixTime}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${mainUrl}/home`,
                'Cookie': `${cookie}; hd=on; ott=nf`, // ott=nf means Netflix Mirror
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Addon logic to format search results
        const data = response.data;
        if (!data || !data.searchResult) return res.json([]);

        const results = data.searchResult.map(item => ({
            title: item.t,
            id: item.id,
            image: `https://imgcdn.kim/poster/v/${item.id}.jpg`, // Kotlin image logic
            link: item.id // Hum sirf ID bhejenge video nikalne ke liye
        }));

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "API Error", details: error.message });
    }
};
