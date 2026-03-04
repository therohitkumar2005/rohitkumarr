const axios = require('axios');
const urlModule = require('url');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    const targetUrl = decodeURIComponent(url);
    const parsedUrl = urlModule.parse(targetUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1)}`;

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Referer': 'https://net52.cc/',
                'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer',
                'Cookie': 'hd=on'
            },
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'] || "";
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        // Rewrite Manifest links (.m3u8 parsing)
        if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
            let manifest = response.data.toString();
            const lines = manifest.split('\n');
            const rewritten = lines.map(line => {
                if (line.trim().startsWith('#') || line.trim().length === 0) return line;
                const absUrl = line.trim().startsWith('http') ? line.trim() : urlModule.resolve(baseUrl, line.trim());
                return `/api/proxy?url=${encodeURIComponent(absUrl)}`;
            }).join('\n');
            return res.send(rewritten);
        }

        res.send(response.data);
    } catch (e) {
        res.status(500).send("Proxy Error");
    }
};
