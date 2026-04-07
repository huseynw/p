exports.handler = async (event) => {
    // Brauzerdən gələn məlumatları alırıq
    const { url, apiKey } = JSON.parse(event.body);

    try {
        // Node-un daxili fetch funksiyasından istifadə edirik (Heç bir require lazım deyil)
        const response = await fetch(url, {
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`
            }
        });
        
        const data = await response.text();

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain" 
            },
            body: data
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
