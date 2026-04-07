exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: ""
        };
    }

    try {
        const { apiKey, appName } = JSON.parse(event.body || "{}");

        if (!apiKey || !appName) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ error: "apiKey və appName tələb olunur" })
            };
        }

        const response = await fetch(`https://api.heroku.com/apps/${appName}`, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        const text = await response.text();

        return {
            statusCode: response.status,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
            body: text
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message })
        };
    }
};
