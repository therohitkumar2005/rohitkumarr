const axios = require('axios');
const cheerio = require('cheerio');

const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title, ott } = req.query;

    try {
        // Step 1: Cookie Bypass
        const bypassResponse = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' },
            timeout: 5000 
        });
        const cookie = bypassResponse.headers['set-cookie']?.join('; ') || '';

        let hToken = "";
        // Step 2: Netflix Token Logic
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
                    headers: { 'Referer': `${mainUrl}/` }
                });
                const $ = cheerio.load(tokenPage.data);
                hToken = $('body').attr('data-h');
            }
        }

        // Step 3: Playlist Path
        let path = (ott === 'pv') ? '/pv/playlist.php' : 
                   (ott === 'hs' || ott === 'dp') ? '/mobile/hs/playlist.php' : '/playlist.php';

        const playlistUrl = `${newUrl}${path}?id=${id}&t=${encodeURIComponent(title)}${hToken ? '&h='+hToken : ''}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: { 
                'Referer': `${mainUrl}/`, 
                'Cookie': `${cookie}; hd=on`, 
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' 
            }
        });

        if (!response.data || !response.data[0]) {
             return res.status(404).json({ error: "Playlist data is empty" });
        }

        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            // Proxy use kar rahe hain taaki segment block na hon
            file: `/api/proxy?url=${encodeURIComponent(newUrl + s.file)}`
        }));

        res.status(200).json(sources);

    } catch (error) {
        console.error("Backend Error Detail:", error.message);
        res.status(500).json({ 
            error: "Server Error", 
            message: error.message,
            step: "Failed during link extraction" 
        });
    }
};
