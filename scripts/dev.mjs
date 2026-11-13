import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const requestedPort = Number.parseInt(process.env.PORT ?? "3000", 10);
const startPort = Number.isFinite(requestedPort) ? requestedPort : 3000;
const stripeEnabled = process.env.STRIPE_LISTEN !== "0";
const stripeEvents = [
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
].join(",");

function log(message) {
  process.stdout.write(`[dev] ${message}\n`);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPort(start) {
  for (let port = start; port < start + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`Aucun port libre entre ${start} et ${start + 19}.`);
}

const port = await pickPort(startPort);

const alias = spawnSync(
  "portless",
  ["alias", "basic-it", String(port), "--force"],
  { stdio: "ignore" },
);

if (alias.status === 0) {
  log(`https://basic-it.localhost -> localhost:${port}`);
}

let shuttingDown = false;
let stripe = null;

let secret = null;
let resolveSecret;
const secretReady = new Promise((resolve) => {
  resolveSecret = resolve;
});

if (stripeEnabled) {
  const hasStripe = !spawnSync("stripe", ["--version"], { encoding: "utf8" }).error;

  if (!hasStripe) {
    log("Stripe CLI absente, démarrage du serveur seul.");
    resolveSecret(null);
  } else {
    log(`Stripe webhook -> http://localhost:${port}/api/stripe/webhook`);

    stripe = spawn(
      "stripe",
      [
        "listen",
        "--events",
        stripeEvents,
        "--forward-to",
        `http://localhost:${port}/api/stripe/webhook`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let output = "";
    let lineBuffer = "";

    const forwardLine = (line) => {
      process.stdout.write(`${line.replace(/whsec_[A-Za-z0-9]+/g, "whsec_***")}\n`);
    };

    const scan = (chunk) => {
      const text = chunk.toString();
      output = `${output}${text}`.slice(-8192);

      if (!secret) {
        const match = output.match(/whsec_[A-Za-z0-9]+/);
        if (match) {
          secret = match[0];
          resolveSecret(secret);
        } else if (/stripe login|not logged in|please log in/i.test(output)) {
          log("Stripe CLI non connectée. Lance `stripe login`, puis relance `bun run dev`.");
          resolveSecret(null);
        }
      }

      lineBuffer += text;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";
      lines.forEach(forwardLine);
    };

    const flushStripeOutput = () => {
      if (!lineBuffer) return;
      forwardLine(lineBuffer);
      lineBuffer = "";
    };

    stripe.stdout.on("data", scan);
    stripe.stderr.on("data", scan);
    stripe.on("exit", flushStripeOutput);
    stripe.on("error", () => {
      log("Stripe CLI n'a pas pu démarrer, le serveur continue.");
      resolveSecret(null);
    });
    stripe.on("exit", (code) => {
      resolveSecret(null);
      if (!shuttingDown) {
        log(`Stripe listener arrêté (code ${code}), le serveur continue.`);
      }
    });
  }
} else {
  resolveSecret(null);
}

const parsedSecret = await Promise.race([
  secretReady,
  new Promise((resolve) => setTimeout(() => resolve(null), 12_000)),
]);

const env = { ...process.env };
if (parsedSecret) {
  env.STRIPE_WEBHOOK_SECRET = parsedSecret;
  log("Secret de webhook récupéré et injecté dans Next.");
}

log(`Next sur http://localhost:${port}`);
if (stripeEnabled && !parsedSecret) {
  log("Pas de secret Stripe injecté. Le serveur démarre quand même.");
}

const next = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  stdio: "inherit",
  env,
});

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!next.killed) next.kill("SIGTERM");
  if (stripe && !stripe.killed) stripe.kill("SIGTERM");
  setTimeout(() => process.exit(code), 400);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
next.on("exit", (code) => shutdown(code ?? 0));
