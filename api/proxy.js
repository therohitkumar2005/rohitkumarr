const axios = require('axios');
const urlModule = require('url');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    const targetUrl = decodeURIComponent(url);
    const parsedUrl = urlModule.parse(targetUrl);
    // Base URL nikalna taaki relative links ko absolute banaya ja sake
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

        // Agar file ek playlist (.m3u8) hai, toh uske links badlo
        if (contentType.includes('mpegurl') || contentType.includes('mpegURL') || targetUrl.includes('.m3u8')) {
            let manifest = response.data.toString();
            const lines = manifest.split('\n');
            
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#') && !trimmed.startsWith('#EXT-X-KEY') && !trimmed.startsWith('#EXT-X-MEDIA')) {
                    return line;
                }
                if (trimmed.length === 0) return line;

                // Relative links ko absolute banana aur proxy mein lapetna
                let absoluteUrl = trimmed.startsWith('http') ? trimmed : urlModule.resolve(baseUrl, trimmed);
                
                // EXT-X-KEY jaise tags ke andar ke links badalna
                if (line.includes('URI="')) {
                    return line.replace(/URI="([^"]+)"/g, (match, p1) => {
                        const keyUrl = p1.startsWith('http') ? p1 : urlModule.resolve(baseUrl, p1);
                        return `URI="/api/proxy?url=${encodeURIComponent(keyUrl)}"`;
                    });
                }

                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            });

            return res.send(rewrittenLines.join('\n'));
        } else {
            // Agar video ka tukda (.ts) hai, toh direct bhej do
            return res.send(response.data);
        }
    } catch (e) {
        res.status(500).send("Proxy error: " + e.message);
    }
};
