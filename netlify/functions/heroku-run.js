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
        const { apiKey, appName, command } = JSON.parse(event.body || "{}");

        if (!apiKey || !appName || !command) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                },
                body: "apiKey, appName və command tələb olunur"
            };
        }

        const marker = `__CMD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}__`;

        const wrappedCommand =
            `bash -lc 'echo ${marker}_START; ` +
            `${command} 2>&1; ` +
            `status=$?; ` +
            `echo ${marker}_EXIT:$status; ` +
            `echo ${marker}_END'`;

        const dynoRes = await fetch(`https://api.heroku.com/apps/${appName}/dynos`, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                command: wrappedCommand,
                attach: false,
                type: "run"
            })
        });

        const dynoText = await dynoRes.text();

        if (!dynoRes.ok) {
            return {
                statusCode: dynoRes.status,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                },
                body: dynoText || "Dyno başladılmadı"
            };
        }

        await new Promise(resolve => setTimeout(resolve, 4000));

        const logSessionRes = await fetch(`https://api.heroku.com/apps/${appName}/log-sessions`, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lines: 300,
                tail: false
            })
        });

        const logSession = await logSessionRes.json();

        if (!logSession?.logplex_url) {
            return {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                },
                body: "logplex_url alınmadı"
            };
        }

        const logsRes = await fetch(logSession.logplex_url);
        const logsText = await logsRes.text();

        const startMarker = `${marker}_START`;
        const endMarker = `${marker}_END`;
        const exitPrefix = `${marker}_EXIT:`;

        const startIndex = logsText.indexOf(startMarker);
        const endIndex = logsText.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                },
                body: "Komandanın çıxışı tapılmadı. Bir az sonra yenə yoxla."
            };
        }

        let block = logsText.slice(startIndex, endIndex);

        block = block
            .split("\n")
            .filter(line =>
                !line.includes(startMarker) &&
                !line.includes(endMarker) &&
                !line.includes("Starting process with command") &&
                !line.includes("State changed from starting to complete") &&
                !line.includes("app[api]:") &&
                !line.includes("heroku[run.")
            )
            .join("\n")
            .trim();

        const exitMatch = logsText.match(new RegExp(`${marker}_EXIT:(\\d+)`));
        const exitCode = exitMatch ? Number(exitMatch[1]) : null;

        let result = block || "(çıxış yoxdur)";

        if (exitCode !== null && exitCode !== 0) {
            result += `\n\n[exit code: ${exitCode}]`;
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain"
            },
            body: result
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain"
            },
            body: error.message || "Server xətası"
        };
    }
};
