const { describe, test } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

const Webhook = require("../../../server/notification-providers/webhook");

describe("Webhook notification provider", () => {
    test("sends empty POST body when webhookContentType is empty", async () => {
        const server = http.createServer();

        const requestPromise = new Promise((resolve) => {
            server.on("request", (req, res) => {
                const chunks = [];

                req.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                req.on("end", () => {
                    res.statusCode = 200;
                    res.end("OK");
                    resolve({
                        body: Buffer.concat(chunks).toString(),
                        contentLength: req.headers["content-length"],
                    });
                });
            });
        });

        await new Promise((resolve) => {
            server.listen(0, "127.0.0.1", resolve);
        });

        const { port } = server.address();
        const provider = new Webhook();

        await provider.send({
            httpMethod: "post",
            webhookContentType: "empty",
            webhookURL: `http://127.0.0.1:${port}/webhook`,
        }, "test-msg");

        const requestData = await requestPromise;
        await new Promise((resolve) => {
            server.close(resolve);
        });

        assert.strictEqual(requestData.body, "");
        assert.ok(requestData.contentLength === "0" || typeof requestData.contentLength === "undefined");
    });
});
