const axios = require('axios');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://net52.cc/',
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer'
            },
            responseType: 'stream'
        });
        response.data.pipe(res);
    } catch (e) {
        res.status(500).send("Proxy Error");
    }
};
