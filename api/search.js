const axios = require('axios');
const mainUrl = "https://net22.cc";

async function getBypassCookie() {
    let attempts = 0;
    let cookie = "";
    try {
        // Kotlin logic: jab tak "r":"n" na mile
        while (attempts < 5) {
            const res = await axios.post(`${mainUrl}/tv/p.php`, {}, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
            });
            if (JSON.stringify(res.data).includes('"r":"n"')) {
                const cookieHeader = res.headers['set-cookie'];
                cookie = cookieHeader ? cookieHeader.map(c => c.split(';')[0]).join('; ') : '';
                break;
            }
            attempts++;
        }
        return cookie;
    } catch (e) { return ""; }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q, type } = req.query;
    const ott = type || 'nf'; 
    const cookie = await getBypassCookie();
    
    // Path selection based on OTT type
    const searchPath = (ott === 'pv') ? '/pv/search.php' : (ott === 'hs' || ott === 'dp') ? '/mobile/hs/search.php' : '/search.php';
    const searchUrl = `${mainUrl}${searchPath}?s=${encodeURIComponent(q)}&t=${Date.now()}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'Referer': `${mainUrl}/home`,
                'Cookie': `${cookie}; hd=on; ott=${ott}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const data = response.data.searchResult || [];
        // Poster URL logic from Kotlin
        const results = data.map(item => ({
            title: item.t,
            id: item.id,
            image: ott === 'pv' ? `https://imgcdn.kim/pv/341/${item.id}.jpg` : `https://imgcdn.kim/poster/v/${item.id}.jpg`
        }));
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "Backend Crash", details: error.message });
    }
};
