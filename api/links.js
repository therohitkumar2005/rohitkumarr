const axios = require('axios');
const cheerio = require('cheerio');
const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title, ott } = req.query;

    try {
        // Step 1: Bypass for Cookie
        const bypassRes = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });
        const cookie = bypassRes.headers['set-cookie']?.join('; ') || '';

        let hToken = "";
        // Step 2: Netflix Token Logic
        if (ott === 'nf') {
            const playRes = await axios.post(`${mainUrl}/play.php`, `id=${id}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie, 'Referer': `${mainUrl}/` }
            });
            if (playRes.data && playRes.data.h) {
                const tokenPage = await axios.get(`${newUrl}/play.php?id=${id}&${playRes.data.h}`, {
                    headers: { 'Referer': `${mainUrl}/` }
                });
                const $ = cheerio.load(tokenPage.data);
                hToken = $('body').attr('data-h'); //
            }
        }

        // Step 3: Path Selection based on Provider
        let path = '/playlist.php';
        if (ott === 'pv') path = '/pv/playlist.php'; // Prime
        else if (ott === 'hs' || ott === 'dp') path = '/mobile/hs/playlist.php'; // Hotstar/Disney

        const playlistUrl = `${newUrl}${path}?id=${id}&t=${encodeURIComponent(title)}${hToken ? '&h='+hToken : ''}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: { 'Referer': `${mainUrl}/`, 'Cookie': 'hd=on', 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });

        if (!response.data || !response.data[0]) return res.json([]);

        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            // Full Proxied link for Manifest Rewriting
            file: `/api/proxy?url=${encodeURIComponent(newUrl + s.file)}`
        }));

        res.status(200).json(sources);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: "Backend Crash", details: e.message });
    }
};
