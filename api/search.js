const axios = require('axios');
const mainUrl = "https://net22.cc";

async function getBypassCookie() {
    let attempts = 0;
    let cookie = "";
    try {
        // Kotlin logic: Do-while loop jab tak verify check "r":"n" na ho jaye
        while (attempts < 5) {
            const res = await axios.post(`${mainUrl}/tv/p.php`, {}, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                timeout: 3000
            });
            
            if (res.data && res.data.r === "n") {
                const cookieHeader = res.headers['set-cookie'];
                cookie = cookieHeader ? cookieHeader.map(c => c.split(';')[0]).join('; ') : '';
                break;
            }
            attempts++;
        }
        return cookie;
    } catch (e) { return ""; }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;
    if (!q) return res.status(200).json([]);

    const cookie = await getBypassCookie();
    
    // Providers definition based on Kotlin classes
    const providers = [
        { ott: 'nf', path: '/search.php' },           // Netflix
        { ott: 'pv', path: '/pv/search.php' },        // Prime
        { ott: 'hs', path: '/mobile/hs/search.php' }, // Hotstar
        { ott: 'dp', path: '/mobile/hs/search.php' }  // Disney+
    ];

    try {
        const requests = providers.map(p => 
            axios.get(`${mainUrl}${p.path}?s=${encodeURIComponent(q)}&t=${Date.now()}`, {
                headers: {
                    'Cookie': `${cookie}; hd=on; ott=${p.ott}`,
                    'Referer': `${mainUrl}/home`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'X-Requested-With': 'XMLHttpRequest' //
                },
                timeout: 8000
            }).then(r => ({ data: r.data.searchResult || [], ott: p.ott }))
              .catch(() => ({ data: [], ott: p.ott }))
        );

        const allResponses = await Promise.all(requests);
        let finalResults = [];

        allResponses.forEach(resp => {
            resp.data.forEach(item => {
                finalResults.push({
                    title: item.t,
                    id: item.id,
                    // Dynamic image structure from Kotlin
                    image: resp.ott === 'pv' ? `https://imgcdn.kim/pv/341/${item.id}.jpg` : `https://imgcdn.kim/poster/v/${item.id}.jpg`,
                    ott: resp.ott
                });
            });
        });

        // Duplicates remove karein (kabhi-kabhi same movie multi-platform par hoti hai)
        const uniqueResults = finalResults.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
        res.status(200).json(uniqueResults);

    } catch (error) {
        res.status(500).json({ error: "Search logic failed" });
    }
};
