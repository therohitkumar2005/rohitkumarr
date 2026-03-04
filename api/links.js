const axios = require('axios');
const cheerio = require('cheerio');

const mainUrl = "https://net22.cc";
const newUrl = "https://net52.cc";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title } = req.query;

    try {
        // 1. Step: Pehle 'h' value nikalna (Bypass logic se)
        const playPage = await axios.post(`${mainUrl}/play.php`, `id=${id}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${mainUrl}/`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const h_val = playPage.data.h; // Kotlin code mein 'h' nikalne ka logic

        // 2. Step: Asli Token nikalna (data-h attribute se)
        const tokenPage = await axios.get(`${newUrl}/play.php?id=${id}&${h_val}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Referer': `${mainUrl}/`
            }
        });
        const $ = cheerio.load(tokenPage.data);
        const token = $('body').attr('data-h'); // Kotlin logic

        // 3. Step: Playlist fetch karna (Token use karke)
        // Netflix mirror ke liye path alag hai
        const playlistUrl = `${newUrl}/playlist.php?id=${id}&t=${encodeURIComponent(title)}&h=${token}&tm=${Date.now()}`;

        const response = await axios.get(playlistUrl, {
            headers: {
                'Referer': `${mainUrl}/`,
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer',
                'Cookie': 'hd=on'
            }
        });

        // Kotlin code mein sources nikalne ka tareeka
        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            file: `${newUrl}${s.file}`
        }));

        res.status(200).json(sources);
    } catch (error) {
        res.status(500).json({ error: "Link extract nahi ho paya", details: error.message });
    }
};
