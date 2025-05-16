# CurseFetch

The CurseForge Modpack Extractor.

## Motivation and What Does This Do

Absolutely not sponsored.

I sometimes make things fast when I'm annoyed. Many mod pack developers wouldn't give a s--- about making a server friendly zip file.

Modrinth did an okay job by [having](https://support.modrinth.com/en/articles/8802250-modpacks-on-modrinth) a
[way](https://github.com/nothub/mrpack-install) to support the use of mod packs for servers without the need of a client!

Shivaxi did an absolutely amazing job for actually *providing* the server pack of RLCraft for download on CurseForge!

I was thinking about trying out Better Minecraft when I hit this huge roadblock.

This program provisions the function to automate the manual download of mod files from CurseForge by reading the `manifest.json`
and querying the world wide web.

## Concept

Things may change, so this is what worked on 16 May 2025 Night. This code is open source. If you are capable, you may
adjust the source code to fit your needs at your time. Pull requests are welcome.

CurseForge uses the link style --
`https://mediafilez.forgecdn.net/files/[FILE ID]/[FULL FILE NAME]`
-- as their media content delivery link. A correct request (with a correct link) will download the file.

The file id is segmented every four digits from left to right by a `/`. The file id is listed IN the manifest file.

The file name is the hard part. However, this information is explicitly listed in the file's overview page with a link style --
`https://www.curseforge.com/minecraft/modpacks/[PROJECT NAME]/files/[FILE ID]`
-- which we must scrape.

The project homepage is usually linked by --
`https://www.curseforge.com/minecraft/modpacks/[PROJECT NAME]`
-- and is also what is listed in the `modlist.html` of every modpack, which we will also scrape.

The order of the `modlist.html` and `manifest.json` matches. Thus, the mod files may be downloaded in bulk.

CurseForge---your website looked like sb shat on it, please fix it.

## License

MIT