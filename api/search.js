const axios = require('axios');
const mainUrl = "https://net22.cc";

async function getBypassCookie() {
    try {
        const response = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });
        const cookieHeader = response.headers['set-cookie'];
        return cookieHeader ? cookieHeader.map(c => c.split(';')[0]).join('; ') : '';
    } catch (e) { return ""; }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q, type } = req.query; // type can be nf, pv, hs, dp
    const ott = type || 'nf'; 
    const cookie = await getBypassCookie();
    
    // Kotlin logic for different search paths
    const searchPath = (ott === 'pv') ? '/pv/search.php' : (ott === 'hs' || ott === 'dp') ? '/mobile/hs/search.php' : '/search.php';
    const searchUrl = `${mainUrl}${searchPath}?s=${encodeURIComponent(q)}&t=${Date.now()}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${mainUrl}/home`,
                'Cookie': `${cookie}; hd=on; ott=${ott}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const data = response.data.searchResult || [];
        const results = data.map(item => ({
            title: item.t,
            id: item.id,
            // Image logic from Providers
            image: ott === 'pv' ? `https://imgcdn.kim/pv/341/${item.id}.jpg` : `https://imgcdn.kim/poster/v/${item.id}.jpg`,
            ott: ott
        }));

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "Search Failed" });
    }
};
