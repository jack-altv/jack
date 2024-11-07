import { $ } from "bun";
import { parseArgs } from "util";
import { existsSync, mkdirSync, lstatSync } from "node:fs";
import { readdir } from "node:fs/promises";


class Cli { 
    command //: string | null;
    argv //: string[];
    altvPkgPath //: string | null;
    outDir //: string;
    constructor(){
        this.command = null;
        this.argv = Bun.argv.slice(2)
        this.altvPkgPath = Bun.which('altv-pkg')
        this.outDir = "";
    }
    async handle() {
        if (this.argv.length > 0) {
            if (!this.argv[0].startsWith('-')){
                this.command = this.argv[0];
            }
        }
        if ( this.command === 'get' ) {
            await this.parseGetCommand()
        } 
        else if ( this.command === 'create' ){
            await this.parseCreateCommand()
        }
        return this
    }

    async parseGetCommand(){
        const {values} = parseArgs({
            args: this.argv.slice(1),
            options: { 
                altv: {
                    type: "string",
                },
                outDir: {
                    type: "string",
                    short: "o"
                }
            },
            strict:false
        })
        if (values.outDir) {
            this.outDir = values.outDir
        }
        if (!this.altvPkgPath) {
            console.log('altv-pkg not found...');
            try {
                await $`bun i -g altv-pkg`;
                console.log('\x1b[32m%s\x1b[0m', 'altv-pkg is successfully installed')
            }catch (err){
                console.error('failed to download altv-pkg:\n', err);
                process.exit(1);
            }
        }
        if (!values.altv) {
            return
        }
        if (this.outDir) {
            if (!existsSync(this.outDir) ) {
                mkdirSync(this.outDir, {recursive:true})
            }
            else if (lstatSync(this.outDir).isDirectory()){
                const files = await readdir(this.outDir, {});
                if (files.some(item => ["altv-server.exe", "altv-server"].includes(item))) {
                    // todo if there already altv-server in directory, do not reinstall right away into it...
                    console.warn('reinstalling...')
                }
            }
        }
        console.log(`downloading alt:v ${values.altv}`);
        try {
            await $`altv-pkg ${values.altv}`.cwd((this.outDir) ? (this.outDir) : "./");
            console.log('\x1b[32m%s\x1b[0m', 'alt:v server is installed', (this.outDir) ? (this.outDir) : '')

        } catch (err) {
            console.error('altv-pkg failed to download alt:v server\n', err);
            process.exit(1);
        }
    }
}


let cli =new Cli()
await cli.handle()
console.log(cli.argv)