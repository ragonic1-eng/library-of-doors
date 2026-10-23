// fetch() for a JSON POST that waits as long as the image gateway needs.
// Node's built-in fetch gives up when the response headers take more than 5 minutes, and with several
// reference photos attached the image model can take longer than that when the gateway is busy.
import { request } from "node:https";

// A picture normally takes 1 to 3 minutes. Past this, the model is treated as silent and the caller moves to its
// next backup model instead of waiting (SLOW_FETCH_MINUTES to change it).
const WAIT_MS = Number(process.env.SLOW_FETCH_MINUTES ?? 6) * 60_000;

export function slowFetch(url, init) {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: init.method ?? "POST", headers: init.headers, timeout: WAIT_MS }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: async () => body.toString("utf8"),
          json: async () => JSON.parse(body.toString("utf8")),
        });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(Object.assign(new Error(`no answer in ${WAIT_MS / 60_000} minutes`), { silent: true })));
    req.on("error", reject);
    req.end(init.body);
  });
}
