exports.handler = async (event) => {
    try {
        const { apiKey, appName, command } = JSON.parse(event.body);

        // command run et
        await fetch(`https://api.heroku.com/apps/${appName}/dynos`, {
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

        // biraz gözlə ki output loga düşsün
        await new Promise(r => setTimeout(r, 2000));

        // log session aç
        const logRes = await fetch(`https://api.heroku.com/apps/${appName}/log-sessions`, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lines: 50,
                tail: false
            })
        });

        const logData = await logRes.json();

        // logları çək
        const logs = await fetch(logData.logplex_url);
        const text = await logs.text();

        return {
            statusCode: 200,
            body: text
        };

    } catch (e) {
        return {
            statusCode: 500,
            body: e.message
        };
    }
};
