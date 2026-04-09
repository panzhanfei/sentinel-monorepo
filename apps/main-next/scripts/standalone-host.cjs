"use strict";
/**
 * Optional PM2 entry next to standalone server.js: set HOST/HOSTNAME before loading Next.
 */
if (!process.env.HOST) process.env.HOST = process.env.HOSTNAME || "0.0.0.0";
if (!process.env.HOSTNAME) process.env.HOSTNAME = process.env.HOST;
require("./server.js");
