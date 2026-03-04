const axios = require('axios');
const cheerio = require('cheerio');
const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title, ott } = req.query;

    try {
        let token = "";
        // Only Netflix needs the complex token logic
        if (ott === 'nf') {
            const playPage = await axios.post(`${mainUrl}/play.php`, `id=${id}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': `${mainUrl}/` }
            });
            const h_val = playPage.data.h;
            const tokenPage = await axios.get(`${newUrl}/play.php?id=${id}&${h_val}`, {
                headers: { 'Referer': `${mainUrl}/` }
            });
            const $ = cheerio.load(tokenPage.data);
            token = $('body').attr('data-h');
        }

        // Determine playlist path
        const path = (ott === 'pv') ? '/pv/playlist.php' : (ott === 'hs' || ott === 'dp') ? '/mobile/hs/playlist.php' : '/playlist.php';
        const playlistUrl = `${newUrl}${path}?id=${id}&t=${encodeURIComponent(title)}${token ? '&h='+token : ''}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: { 'Referer': `${mainUrl}/`, 'Cookie': 'hd=on', 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });

        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            // Proxy use kar rahe hain taaki video chale
            file: `/api/proxy?url=${encodeURIComponent(newUrl + s.file)}`
        }));

        res.status(200).json(sources);
    } catch (error) {
        res.status(500).json({ error: "Links not found" });
    }
};
