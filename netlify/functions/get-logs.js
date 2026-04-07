const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { url, apiKey } = JSON.parse(event.body);

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`
            }
        });
        const data = await response.text();

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: data
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
