#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = __dirname;
const PREFERRED_PORT = Number(process.env.PORT) || 8765;
const HOST = process.env.HOST || "0.0.0.0";
const MAX_PORT_TRIES = 20;
const INDEX = "剧情游戏启动器_开发者调试版.html";
const BLOCKED = new Set([".git", "node_modules"]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".skill": "application/zip",
  ".txt": "text/plain; charset=utf-8"
};

function lanAddresses() {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list || []) {
      if ((item.family === "IPv4" || item.family === 4) && !item.internal) {
        ips.push(item.address);
      }
    }
  }
  return ips;
}

function resolveFile(urlPath) {
  let decoded = "/";
  try {
    decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  } catch (error) {
    return null;
  }
  const relative = decoded === "/" ? INDEX : decoded.replace(/^\/+/, "");
  const file = path.normalize(path.join(ROOT, relative));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null;
  const parts = path.relative(ROOT, file).split(path.sep);
  if (parts.some(part => BLOCKED.has(part) || part === "..")) return null;
  return file;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, "", {
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed");
    return;
  }

  const file = resolveFile(req.url);
  if (!file) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, "Not Found");
      return;
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(file).on("error", () => {
      if (!res.headersSent) send(res, 500, "Read Error");
      else res.destroy();
    }).pipe(res);
  });
});

function printReady(port) {
  const ips = lanAddresses().filter(ip => !ip.startsWith("169.254."));
  console.log("");
  console.log("Story-to-Game 局域网服务已启动");
  console.log(`本机访问:    http://127.0.0.1:${port}/`);
  if (ips.length) {
    for (const ip of ips) {
      console.log(`局域网访问:  http://${ip}:${port}/`);
    }
  } else {
    console.log("未检测到可用局域网 IPv4，请检查网线或 Wi-Fi。");
  }
  if (port !== PREFERRED_PORT) {
    console.log(`端口 ${PREFERRED_PORT} 已被占用，已改用 ${port}。`);
  }
  console.log("");
  console.log("其他设备需与这台电脑在同一网络。若手机打不开，在 Windows 防火墙放行该端口。");
  console.log("按 Ctrl+C 停止服务。");
  console.log("");
}

function listenOn(port, triesLeft) {
  const onError = error => {
    server.off("listening", onListening);
    if (error.code === "EADDRINUSE" && triesLeft > 0) {
      console.warn(`端口 ${port} 已被占用，尝试 ${port + 1}...`);
      listenOn(port + 1, triesLeft - 1);
      return;
    }
    if (error.code === "EADDRINUSE") {
      console.error(`端口 ${PREFERRED_PORT}-${port} 都已被占用。`);
      console.error("关掉旧的 start.bat / node 窗口后再试，或运行: set PORT=8800&& start.bat");
      process.exit(1);
    }
    throw error;
  };
  const onListening = () => {
    server.off("error", onError);
    printReady(port);
  };
  server.once("error", onError);
  server.once("listening", onListening);
  server.listen(port, HOST);
}

listenOn(PREFERRED_PORT, MAX_PORT_TRIES);
