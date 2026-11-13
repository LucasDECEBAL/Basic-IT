import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import net from "node:net";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

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

function readStripeKey() {
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY.trim();
  }

  try {
    const env = fs.readFileSync(".env.local", "utf8");
    const line = env
      .split(/\r?\n/)
      .find((entry) => entry.startsWith("STRIPE_SECRET_KEY="));
    return (line?.slice("STRIPE_SECRET_KEY=".length) ?? "")
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
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

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ port: 0, host: "127.0.0.1" }, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Port introuvable.")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function pickPort() {
  const requested = Number.parseInt(process.env.PORT ?? "", 10);
  if (Number.isFinite(requested)) {
    for (let port = requested; port < requested + 20; port += 1) {
      if (await isPortFree(port)) return port;
    }
    throw new Error(`Aucun port libre entre ${requested} et ${requested + 19}.`);
  }
  return getFreePort();
}

const port = await pickPort();

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
    const stripeKey = readStripeKey();
    log(`Stripe webhook -> http://localhost:${port}/api/stripe/webhook`);

    if (!stripeKey) {
      log("STRIPE_SECRET_KEY absente : la CLI utilise son compte connecté.");
    } else if (!stripeKey.startsWith("sk_test_") && !stripeKey.startsWith("rk_test_")) {
      log("La clé Stripe n'est pas une clé de test, la CLI n'est pas liée.");
    } else {
      log("CLI Stripe liée à la clé de test du projet.");
    }

    stripe = spawn(
      "stripe",
      [
        "listen",
        "--events",
        stripeEvents,
        "--forward-to",
        `http://localhost:${port}/api/stripe/webhook`,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          ...(stripeKey &&
          (stripeKey.startsWith("sk_test_") ||
            stripeKey.startsWith("rk_test_"))
            ? { STRIPE_API_KEY: stripeKey }
            : {}),
        },
      },
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
