const axios = require('axios');
const cheerio = require('cheerio');
const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title, ott } = req.query;

    try {
        // Step 1: Bypass and Get Cookies
        const bypassReq = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });
        const cookie = bypassReq.headers['set-cookie']?.join('; ') || '';

        let hToken = "";
        // Step 2: Get Token for Netflix only
        if (ott === 'nf') {
            const playPage = await axios.post(`${mainUrl}/play.php`, `id=${id}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie, 'Referer': `${mainUrl}/` }
            });
            const h_val = playPage.data.h;
            const tokenPage = await axios.get(`${newUrl}/play.php?id=${id}&${h_val}`, {
                headers: { 'Referer': `${mainUrl}/`, 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(tokenPage.data);
            hToken = $('body').attr('data-h');
        }

        // Step 3: Choose Playlist Path
        let path = '/playlist.php';
        if (ott === 'pv') path = '/pv/playlist.php';
        else if (ott === 'hs' || ott === 'dp') path = '/mobile/hs/playlist.php';

        const playlistUrl = `${newUrl}${path}?id=${id}&t=${encodeURIComponent(title)}${hToken ? '&h='+hToken : ''}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: { 'Referer': `${mainUrl}/`, 'Cookie': `${cookie}; hd=on`, 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });

        // Step 4: Final Link with Proxy
        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            // Hum link ko proxy ke raste bhejenge taaki headers bypass ho sakein
            file: `/api/proxy?url=${encodeURIComponent(newUrl + s.file)}`
        }));

        res.status(200).json(sources);
    } catch (error) {
        res.status(500).json({ error: "Links fetch fail ho gaye" });
    }
};
