const axios = require('axios');
const mainUrl = "https://net22.cc";

async function getBypassCookie() {
    try {
        const res = await axios.post(`${mainUrl}/tv/p.php`, {}, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Android) ExoPlayer' }
        });
        const cookieHeader = res.headers['set-cookie'];
        return cookieHeader ? cookieHeader.map(c => c.split(';')[0]).join('; ') : '';
    } catch (e) { return ""; }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query missing" });

    const cookie = await getBypassCookie();
    const providers = [
        { id: 'nf', path: '/search.php' },           // Netflix
        { id: 'pv', path: '/pv/search.php' },        // Prime
        { id: 'hs', path: '/mobile/hs/search.php' }, // Hotstar
        { id: 'dp', path: '/mobile/hs/search.php' }  // Disney+
    ];

    try {
        // Sabhi providers se ek saath data mangwana
        const requests = providers.map(p => 
            axios.get(`${mainUrl}${p.path}?s=${encodeURIComponent(q)}&t=${Date.now()}`, {
                headers: {
                    'Cookie': `${cookie}; hd=on; ott=${p.id}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            }).then(r => ({ data: r.data.searchResult || [], ott: p.id }))
              .catch(() => ({ data: [], ott: p.id }))
        );

        const allResponses = await Promise.all(requests);
        let finalResults = [];

        allResponses.forEach(resp => {
            resp.data.forEach(item => {
                finalResults.push({
                    title: item.t,
                    id: item.id,
                    // Dynamic image logic based on provider
                    image: resp.ott === 'pv' ? `https://imgcdn.kim/pv/341/${item.id}.jpg` : `https://imgcdn.kim/poster/v/${item.id}.jpg`,
                    ott: resp.ott // Yeh zaroori hai player ko batane ke liye
                });
            });
        });

        // Duplicate results hatana (agar koi movie do jagah ho)
        const uniqueResults = finalResults.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
        res.status(200).json(uniqueResults);

    } catch (error) {
        res.status(500).json({ error: "Global Search Failed" });
    }
};
