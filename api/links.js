const axios = require('axios');
const cheerio = require('cheerio');

const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title, ott } = req.query;

    try {
        // 1. Get Bypass Cookie
        const bypassRes = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' },
            timeout: 5000
        });
        const cookie = bypassRes.headers['set-cookie']?.join('; ') || '';

        let hToken = "";
        // 2. Secret Token Logic for Netflix Only
        if (ott === 'nf') {
            try {
                const playReq = await axios.post(`${mainUrl}/play.php`, `id=${id}`, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie, 'Referer': `${mainUrl}/` }
                });
                
                if (playReq.data && playReq.data.h) {
                    const tokenPage = await axios.get(`${newUrl}/play.php?id=${id}&${playReq.data.h}`, {
                        headers: { 'Referer': `${mainUrl}/`, 'User-Agent': 'Mozilla/5.0' }
                    });
                    const $ = cheerio.load(tokenPage.data);
                    hToken = $('body').attr('data-h') || ""; // Extract data-h
                }
            } catch (e) { console.error("Netflix Token Error", e.message); }
        }

        // 3. Select Path based on Provider
        let path = '/playlist.php'; // Default/Netflix
        if (ott === 'pv') path = '/pv/playlist.php'; // Prime
        else if (ott === 'hs' || ott === 'dp') path = '/mobile/hs/playlist.php'; // Hotstar/Disney

        const playlistUrl = `${newUrl}${path}?id=${id}&t=${encodeURIComponent(title)}${hToken ? '&h='+hToken : ''}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: { 
                'Referer': `${mainUrl}/`, 
                'Cookie': `${cookie}; hd=on`, 
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' 
            }
        });

        // 4. Response formatting
        if (!response.data || !response.data[0]) {
            return res.status(200).json([]); 
        }

        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            // Link ko proxy ke raste bhej rahe hain
            file: `/api/proxy?url=${encodeURIComponent(newUrl + s.file)}`
        }));

        res.status(200).json(sources);

    } catch (error) {
        console.error("Backend Error:", error.message);
        // Crash hone ke bajaye empty array bhej rahe hain taaki frontend handle kar sake
        res.status(200).json([]); 
    }
};
