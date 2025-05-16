/**
 * CurseFetch
 * Copyright (c) 2025, Coadon_Pile
 *
 * Super intuitive code.
 *
 * @license MIT
 */

import { RL, prompt, trace, info, warn, error } from "./terminal.js";
import PupStealthPlugin from "puppeteer-extra-plugin-stealth";
import pup from "puppeteer-extra";
import TC from "./termcolor.js";
import https from "https";
import fs from "fs";

const LOOKUP_LINK = "https://cflookup.com/";

function abort() {
    error("Aborting!");
    RL.close();
    process.exit(1);
}

console.log(TC.BRIGHT + "CurseFetch!" + TC.RESET);

info("Booting up!");

pup.use(PupStealthPlugin());

info("Do not put quotes around filepaths!");

console.log(TC.FG_BLUE + "INSERT MANIFEST.JSON FILE PATH" + TC.RESET);
const manifestPath = await prompt("> ");

console.log(TC.FG_BLUE + "INCLUDE OPTIONAL MODS? (Return for No)" + TC.RESET);
const includeOptional =
    (await prompt("> ")).toLowerCase() == "yes" ? true : false;

console.log(TC.FG_BLUE + "SHOW SCRAPING BROWSER? (Return for No)" + TC.RESET);
const headless = (await prompt("> ")).toLowerCase() == "yes" ? false : true;

if (headless) {
    warn("Will show scraping browser!");
}

info("Tribute to modlist.html");

trace("Reading manifest.json file...");

let manifest;
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
} catch (e) {
    error("Error reading manifest.json file--\n" + e.message);
    abort();
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
    abort();
}

let modfiles = [];

manifest["files"].forEach((entry) => {
    if (
        entry["projectID"] == null ||
        entry["fileID"] == null ||
        typeof entry["required"] != "boolean"
    ) {
        error("Bad `files` entry.");
        abort();
    }
    modfiles.push(entry);
});

console.log(modfiles);

info(TC.BRIGHT + `Found ${modfiles.length} file entries.`);

console.log(
    TC.FG_CYAN +
        'START SCRAPING PROJECT LINKS? (Anything but "yes" will quit.)' +
        TC.RESET
);
if ((await prompt("> ")) != "yes") {
    abort();
}

trace("Starting scraper...");

const browser = await pup.launch({
    headless: headless,
    defaultViewport: null,
});

const page = await browser.newPage();

warn("Scraper active! There may be network activity.");

for (let i = 0; i < modfiles.length; i++) {
    trace(`Opening lookup page for entry ${i}...`);

    await page.goto(LOOKUP_LINK + modfiles[i]["projectID"], {
        waitUntil: "domcontentloaded",
    });

    trace(`Scraping project link for entry ${i}...`);

    const projectLink = await page.evaluate(() => {
        const link = document.querySelectorAll('a[target="_blank"]');
        return link[0].getAttribute("href");
    });

    if (projectLink == null) {
        error("Link failed to be scraped.");
        browser.close();
        abort();
    }

    modfiles[i]["projectLink"] = projectLink;
}

info("All project links found!");

info("Information saving to modpack_files.json for bookkeeping.");
fs.writeFileSync("modpack_files.json", JSON.stringify(modfiles));

console.log(
    TC.FG_CYAN +
        'START SCRAPING DOWNLOAD LINKS? (Anything but "yes" will quit.)' +
        TC.RESET
);
if ((await prompt("> ")) != "yes") {
    abort();
}

for (let i = 0; i < modfiles.length; i++) {
    trace(`Opening file page for entry ${i}...`);

    await page.goto(
        modfiles[i]["projectLink"] + "/files/" + modfiles[i]["fileID"],
        {
            waitUntil: "domcontentloaded",
        }
    );

    trace(`Scraping filename for entry ${i}...`);

    await page.waitForSelector(".section-file-name", { timeout: 10000 });

    const filename = await page.evaluate(() => {
        const sect = document.querySelectorAll("section .section-file-name");
        const par = sect[0].querySelectorAll("p");
        return par[0].textContent;
    });

    if (filename == null) {
        error("Filename failed to be scraped.");
        browser.close();
        abort();
    }

    modfiles[i]["filename"] = filename;

    // 4 appears to be the magic number.
    let fileID = modfiles[i]["fileID"].toString();
    let segmented = [fileID.slice(0, 4), "/", fileID.slice(4)].join("");
    modfiles[i][
        "downloadLink"
    ] = `https://mediafilez.forgecdn.net/files/${segmented}/${filename}`;
}

info("All project links found!");

info("Information saving to modpack_files.json for bookkeeping.");
fs.writeFileSync("modpack_files.json", JSON.stringify(modfiles));

console.log(
    TC.FG_CYAN + 'START DOWNLOADING? (Anything but "yes" will quit.)' + TC.RESET
);
if ((await prompt("> ")) != "yes") {
    abort();
}

const foldername = `downloads-${new Date().toISOString()}`;

info("Will save to folder ");

try {
    fs.mkdirSync(foldername);
} catch (e) {
    error("Error creating folder--\n" + e.message);
    abort();
}

for (let i = 0; i < modfiles.length; i++) {
    trace(`Downloading file for entry ${i}...`);

    const file = modfiles[i];
    trace(`Source: ${file["downloadLink"]}`);

    const dest = foldername + "/" + file["filename"];
    const stream = fs.createWriteStream(dest);
    const request = https.get(file["downloadLink"], (response) => {
        response.pipe(stream);

        stream.on("finish", () => {
            stream.close();
            info(`${file["filename"]} saved.`)
        });
    }).on("error", (e) => {
        fs.unlink(dest);
        error(`Error downloading ${file["filename"]}--\n` + e.message);
    });
}

info("All files (that can be saved) are saved!");

trace("Shutting down...")

browser.close();
RL.close();

console.log(TC.RESET + TC.BRIGHT + TC.FG_CYAN + TC.REVERSE + "Job Done! :)");
