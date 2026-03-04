const axios = require('axios');
const cheerio = require('cheerio');

const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title, ott } = req.query;

    try {
        // Step 1: Bypass for Cookie
        let cookie = "";
        try {
            const bypassRes = await axios.post(`${mainUrl}/tv/p.php`, {}, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' },
                timeout: 5000
            });
            cookie = bypassRes.headers['set-cookie']?.join('; ') || '';
        } catch (e) { console.log("Bypass failed, continuing..."); }

        let hToken = "";
        // Step 2: Token Logic for Netflix
        if (ott === 'nf') {
            const playPage = await axios.post(`${mainUrl}/play.php`, `id=${id}`, {
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded', 
                    'Cookie': cookie, 
                    'Referer': `${mainUrl}/` 
                }
            });
            
            if (playPage.data && playPage.data.h) {
                const h_val = playPage.data.h;
                const tokenPage = await axios.get(`${newUrl}/play.php?id=${id}&${h_val}`, {
                    headers: { 'Referer': `${mainUrl}/`, 'User-Agent': 'Mozilla/5.0' }
                });
                const $ = cheerio.load(tokenPage.data);
                hToken = $('body').attr('data-h'); // Extracting data-h token
            }
        }

        // Step 3: Playlist URL selection
        let path = '/playlist.php';
        if (ott === 'pv') path = '/pv/playlist.php';
        else if (ott === 'hs' || ott === 'dp') path = '/mobile/hs/playlist.php';

        const playlistUrl = `${newUrl}${path}?id=${id}&t=${encodeURIComponent(title)}${hToken ? '&h='+hToken : ''}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: { 
                'Referer': `${mainUrl}/`, 
                'Cookie': `${cookie}; hd=on`, 
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' 
            }
        });

        // Safe Response Handling
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            return res.status(200).json([]); // Return empty array instead of crashing
        }

        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            // Proxying video segments
            file: `/api/proxy?url=${encodeURIComponent(newUrl + s.file)}`
        }));

        res.status(200).json(sources);

    } catch (error) {
        console.error("Links API Error:", error.message);
        res.status(200).json([]); // Return empty array on error to stop frontend crash
    }
};
