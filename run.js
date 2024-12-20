#!/usr/bin/env node

import { exec } from "child_process";
import readline from "readline";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const argv = process.argv.slice(2);
const file = fileURLToPath(import.meta.url);
const dir = `${dirname(file)}${(process.platform == 'win32') ? '\\' : '/'}`

exec(`bun run ${dir}jack.js ${argv.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
        console.error(error.message);
        if ( !process.env.PATH.includes(".bun") ) {
            startBunDownload();
        }
        return;
    }
    if (stderr){ 
        console.error(`Error occured: ${stderr}`);
    }
    console.log(stdout);
})

function startBunDownload() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Install the Bun runtime? [y/n]\n', (answer) => {
        rl.close();

        if (!answer.toLowerCase().startsWith('y')) {
            console.warn('Cancelling Bun installation.')
            return;
        }
        console.log('Downloading...')

        const command = (process.platform == 'win32') ? ('powershell -c "irm bun.sh/install.ps1 | iex"') : ('curl -fsSL https://bun.sh/install | bash')
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(err.message)
                console.log('failed to download `bun` runtime')
            }
            if (stderr){
                console.log(stderr)
            }
            console.log(stdout)
        })
    });
    
}