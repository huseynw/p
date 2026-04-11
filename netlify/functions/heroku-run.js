exports.handler = async (event) => {
    try {
        const { apiKey, appName, command } = JSON.parse(event.body);

        if (!apiKey || !appName || !command) {
            return {
                statusCode: 400,
                body: "Missing data"
            };
        }

        // Heroku one-off dyno (bash run)
        const createDyno = await fetch(`https://api.heroku.com/apps/${appName}/dynos`, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                command: command,
                attach: false,
                type: "run"
            })
        });

        const data = await createDyno.json();

        return {
            statusCode: 200,
            body: `Started: ${data.id}\nCommand: ${command}`
        };

    } catch (e) {
        return {
            statusCode: 500,
            body: e.message
        };
    }
};
