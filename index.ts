#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

function generateImportsExports(dir: string) {
    console.log(dir + ": candidate found.");
    const files = fs.readdirSync(dir).filter((file) => {
        if (file === "index.ts") return false;
        if (file.endsWith(".ts")) return true;
        try {
            let fpath = path.join(dir, file);
            let stat = fs.statSync(fpath);
            if (stat.isDirectory()) {
                let indexStat = fs.statSync(path.join(fpath, "index.ts"));
                return indexStat.isFile();
            } else {
                return false;
            }
        } catch {
            return false;
        }
    });

    console.log(files);

    let builder: string[] = ["// Automatically generated index"];

    if (!files.length) {
        builder.push("export default undefined;");
    } else {
        for (let filename of files) {
            let importName: string;

            if (filename.endsWith(".ts")) importName = filename.substring(0, filename.length - 3);
            else importName = filename;

            builder.push(`export * from "./${importName}";`);
        }
    }

    let indexDest = path.join(dir, "index.ts");
    fs.writeFileSync(indexDest, builder.join("\n"));
    console.log(dir + ": index generated.");
}

export default function crawl(root: string, flagName: string) {
    const folders = fs.readdirSync(root).filter((file) => {
        let fpath = path.join(root, file);
        let stat = fs.statSync(fpath);
        if (stat.isDirectory()) {
            return true;
        }
    });

    for (let dir of folders) {
        crawl(path.join(root, dir), flagName);
        try {
            fs.statSync(path.join(root, dir, flagName));
            generateImportsExports(path.join(root, dir));
        } catch {}
    }
}

let root: string = process.argv.length >= 3 ? process.argv[2] : ".";
let flagName: string = process.argv.length >= 4 ? process.argv[3] : ".auto-index";
console.log(`Starting index generation with root: ${root} and flag name: ${flagName}.`);
crawl(root, flagName);
