const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
    const { q } = req.query;
    // Naya URL yahan hai
    const baseUrl = 'https://netmirror.gg';
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(q)}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': baseUrl
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // NetMirror.gg ke naye design ke hisaab se links nikaalna
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            
            // Hum sirf movies ya series ke links uthayenge
            if (href && (href.includes('/v/') || href.includes('/movie/'))) {
                results.push({
                    title: title || "Movie",
                    link: href.startsWith('http') ? href : baseUrl + href,
                    // Yahan poster image nikalne ki koshish (optional)
                    image: $(el).find('img').attr('src') || 'https://via.placeholder.com/150'
                });
            }
        });

        // Duplicate results hatane ke liye
        const uniqueResults = results.filter((v,i,a)=>a.findIndex(t=>(t.link === v.link))===i);

        res.status(200).json(uniqueResults);
    } catch (error) {
        res.status(500).json({ error: "Data fetch nahi ho paya", details: error.message });
    }
}
