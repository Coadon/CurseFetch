/**
 * CurseFetch
 * Copyright (c) 2025, Coadon_Pile
 *
 * Super intuitive code.
 *
 * @license MIT
 */

import { RL, prompt, trace, info, warn, error } from "./terminal.js";
import TC from "./termcolor.js";
import pup from "puppeteer";
import fs from "fs";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log(TC.BRIGHT + "CurseFetch!" + TC.RESET);

info("Do not put quotes around filepaths!");

// console.log(TC.FG_BLUE + "INSERT MANIFEST.JSON FILE PATH" + TC.RESET);
const manifestPath =
    "/Users/rupert/Library/Application Support/minecraft/bettermc/mods/Better MC [FORGE] 1.20.1 v41/manifest.json";
// await prompt("> ");

// console.log(TC.FG_BLUE + "INSERT MODLIST.HTML FILE PATH" + TC.RESET);
const modlistHtmlPath =
    "/Users/rupert/Library/Application Support/minecraft/bettermc/mods/Better MC [FORGE] 1.20.1 v41/modlist.html";
// await prompt("> ");

console.log(TC.FG_BLUE + "SHOW SCRAPING BROWSER? (Return for No)" + TC.RESET);
const headless = (await prompt("> ")).toLowerCase() == "yes" ? false : true;

if (headless) {
    warn("Will show scraping browser!");
}

info(
    "Please note: program will download all modpacks no matter required or optional!"
);

trace("Reading manifest.json file...");

let manifest;
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
} catch (e) {
    error("Error reading manifest.json file--\n" + e.message);
    error("Aborting!");
    RL.close();
    process.exit(1);
}

trace("Reading modlist.html file...");

if (!fs.existsSync(modlistHtmlPath)) {
    error("The modlist.html file cannot be found at " + modlistHtmlPath);
    error("Aborting!");
    RL.close();
    process.exit(1);
}

trace("Parsing manifest...");

if (manifest["manifestType"] != "minecraftModpack") {
    warn(
        "Manifest is potentially not a CurseForge Minecraft modpack manifest."
    );
}

if (manifest["manifestVersion"] != "1") {
    warn("Manifest version may be unsupported by this program.");
}

if (!manifest["files"]) {
    error("Missing `files` property of manifest!");
    error("Aborting!");
    RL.close();
    process.exit(1);
}

const files = Array.from(manifest["files"]).map((entry) => {
    if (entry["projectID"] == null || entry["fileID"] == null) {
        error("Bad `files` entry.");
        error("Aborting!");
        RL.close();
        process.exit(1);
    }
    return { projectID: entry["projectID"], fileID: entry["fileID"] };
});

info(`Found ${files.length} file entries.`);

trace("Starting scraper...");

const browser = await pup.launch({
    headless: headless,
    defaultViewport: null,
});

warn("Scraper active! There may be network activity.");

trace("Opening scraper page for modlist.html...");

const modlistHtml = await browser.newPage();

await modlistHtml.goto("file://" + modlistHtmlPath, {
    waitUntil: "domcontentloaded",
});

trace("Scraping modlist.html...");

const projects = await modlistHtml.evaluate(() => {
    const links = document.querySelectorAll("a");
    return Array.from(links).map((link) => {
        const href = link.getAttribute("href");
        return href;
    });
});

info(`Found ${projects.length} project links.`);

browser.close();
RL.close();
