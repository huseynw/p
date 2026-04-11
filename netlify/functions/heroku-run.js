exports.handler = async (event) => {
    try {
        const { apiKey, appName, command } = JSON.parse(event.body);

        const dynoRes = await fetch(`https://api.heroku.com/apps/${appName}/dynos`, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                command: command,
                attach: true,   // 🔥 ƏSAS FİX
                type: "run"
            })
        });

        const dyno = await dynoRes.json();

        if (!dyno.attach_url) {
            return {
                statusCode: 500,
                body: "attach_url alınmadı"
            };
        }

        // 🔥 attach_url-dan çıxışı oxu
        const outputRes = await fetch(dyno.attach_url, {
            method: "GET"
        });

        const text = await outputRes.text();

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
