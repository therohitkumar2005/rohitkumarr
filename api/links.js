const axios = require('axios');
const newUrl = "https://net52.cc"; // Kotlin provider URL

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id, title } = req.query;

    const playlistUrl = `${newUrl}/playlist.php?id=${id}&t=${encodeURIComponent(title)}&tm=${Date.now()}`;

    try {
        const response = await axios.get(playlistUrl, {
            headers: {
                'Referer': 'https://net22.cc/',
                'Cookie': 'hd=on',
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer'
            }
        });

        // Kotlin logic for sources
        const sources = response.data[0].sources.map(s => ({
            label: s.label,
            file: `${newUrl}${s.file}`
        }));

        res.status(200).json(sources);
    } catch (error) {
        res.status(500).json({ error: "Video link nahi mila" });
    }
};
