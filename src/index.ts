import "dotenv/config";
import fetch from "node-fetch";
import { ResponseData } from "./types.js";
import { existsSync, readFileSync, writeFileSync } from "fs";

const { API_KEY, RATE } = process.env;
const projectList = existsSync("projects.txt") ? readFileSync("projects.txt", "utf-8").split("\n") : [];

const ratePerSecond = parseFloat(RATE || "19") / 3600;

if (!API_KEY) {
    throw new Error("API_KEY is not defined");
}

function formatDate(date: Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

const now = new Date();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

const url = `https://wakapi.dev/api/compat/wakatime/v1/users/current/summaries?start=${formatDate(twoWeeksAgo)}&end=${formatDate(now)}`;

fetch(url, {
    headers: {
        Authorization: `Basic ${Buffer.from(API_KEY).toString("base64")}`
    }
}).then(res => {
    if (!res.ok) {
        throw new Error("Failed to fetch data: " + res.statusText);
    }

    return res.json() as Promise<ResponseData>;
}).then(async summary => {

    const out: Record<string, number> = {};

    summary.data.forEach(timeRange => {
        timeRange.projects.forEach(project => {
            const projectName = project.name;
            const timeSeconds = project.total_seconds;

            if (out[projectName]) {
                out[projectName] += timeSeconds;
            } else {
                out[projectName] = timeSeconds;
            }
        })
    })

    const outArray = Object.entries(out)
        .filter(([project]) => projectList.length === 0 || projectList.includes(project))
        .sort((a, b) => b[1] - a[1]);

    const longestName = outArray.reduce((acc, [project]) => Math.max(acc, project.length), 0);

    const outString: string[] = []

    outString.push(`From [${twoWeeksAgo.toDateString()}] to [${now.toDateString()}]\n`)

    outArray.map(([project, time]) => {
        const hours = time / 3600;
        return `${project.padEnd(longestName)} | ${hours.toFixed(2).padStart(5, " ")} hours | $${(time * ratePerSecond).toFixed(2)}`;
    }).forEach(line => outString.push(line));

    const totalHours = outArray.reduce((acc, [, time]) => acc + time, 0) / 3600;
    const totalSeconds = outArray.reduce((acc, [, time]) => acc + time, 0);
    const totalCost = totalSeconds * ratePerSecond;

    outString.push(`\n${"Total".padEnd(longestName)} | ${totalHours.toFixed(2)} hours | $${totalCost.toFixed(2)}`);

    const binId = await fetch("https://bin.gart.sh/api/v2/bin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: JSON.stringify(summary, null, 2),
            language: "json",
            filename: `wakapi-export-${formatDate(twoWeeksAgo)}-${formatDate(now)}`,
            extension: "json",
            expiration: "never"
        })
    }).then(res => res.json() as Promise<{
        success: boolean;
        id: string;
    }>).then((data) => data.id);

    outString.push(`\nFull data: https://bin.gart.sh/${binId}`);
    outString.push(`Generated at ${new Date().toUTCString()} with https://gart.sh/wakapi-exporter`)

    writeFileSync("output.txt", outString.join("\n"));

})