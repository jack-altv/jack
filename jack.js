import { $ } from "bun";
import { parseArgs } from "util";
import { existsSync, mkdirSync, lstatSync } from "node:fs";
import { readdir } from "node:fs/promises";

/**
 * is given array of files contains server.toml file
 * @param {Array.<string>} files 
 * @returns {boolean}
 */
function isAltvServerTomlDirectory(files) {
    return files.includes('server.toml') 
}
/**
 * is given array of files contains altv-server binary file
 * @param {Array.<string>} files 
 * @returns {boolean}
 */
function isAltvServerDirectory(files) {
    return files.some(item => ["altv-server.exe", "altv-server"].includes(item));
}

/**
 * reads server.toml file in path, returns data or null if failed to read
 * @param {string} path 
 * @returns {Object | null}
 */
function readServerToml(path){
    try {
        const data = require(`${path}/server.toml`);
        return data
    }
    catch (err) {
        return null
    } 
}

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
    /**
     * main function that does all cli stuff
     * @returns {Object.<Cli>}
     */
    async handle() {
        if (this.argv.length > 0) {
            if (!this.argv[0].startsWith('-')){
                this.command = this.argv[0];
            }
        }
        if ( this.command === 'get' ) {
            await this.parseGetCommand()
        } 
        else if ( this.command === 'new' ){
            await this.parseNewCommand()
        }
        else {
            const {values} = parseArgs({
                args: this.argv
                , options: {
                    resource: {
                        type: 'boolean'
                        , short: 'r'
                    }
                }
            })
            await this.printInfoBasic()
            if (values.resource){
                const cwd = process.cwd()
                const data = readServerToml(cwd)

                if (!data){
                    console.error('failed to read server.toml file');
                    process.exit(2);
                }

                console.log('Resources of current alt:v server:')

                if (existsSync(`${cwd}/resources`)){
                    try {
                        const files = await readdir(`${cwd}/resources`);
                        printComparedResources(data.resources, files);
                    }catch (err){
                        console.error("error reading resources directory")
                        process.exit(2)
                    }
                }
                else {
                    console.error('failed to found resources directory');
                    process.exit(2);
                }
                function printComparedResources(tomlresources, dirresources) {
                    for(const element of tomlresources){
                        if(dirresources.includes(element)){
                            console.log(`  \x1b[32m+\x1b[0m ${element}`)
                        }
                        else {
                            console.log(`    ${element} \x1b[31mnot found\x1b[0m`);
                        }
                    }
                    for(const element of dirresources) {
                        if(!tomlresources.includes(element)) {
                            console.log(`    \x1b[2m${element}\x1b[0m`);
                        }
                    }
                }
                return this;
            }

        }
        return this
    }
    /**
     * prints basic info when typing `jack` without arguments on the command line
     */
    async printInfoBasic(){
        
        console.log('\x1b[34mjack is a command line tool to help in alt:v server development.\x1b[0m');
        console.log('Usage: jack [COMMAND][--OPTION][=VALUE]')
        console.log('Type `jack help` to see all commands and options.')
        try {
            const files = await readdir(process.cwd());
            if (isAltvServerTomlDirectory(files)) {
                console.log('current directory is the alt:v server:')
    
                const data = readServerToml(process.cwd());
                if (data){
                    console.log(`  ${data.name} (${data.description})\n  port: ${data.port} | ${data.resources.length} resources | gamemode: ${data.gamemode} | debug: ${data.debug}`);
                }
                else {
                    console.log('failed to read server info.\n', err);
                }
            }else {
                console.log('no alt:v server.toml found in the current directory')
            }
        }
        catch (err) {
            console.error('error reading directory')
        }
    }
   
    /**
     * parses command `new` : jack new [option][=value]
     */
    async parseNewCommand() {
        const {values} = parseArgs({
            args: this.argv.slice(1),
            options: {
                resource: {
                    type: "string",
                    short: "r"
                }
            }
        })
        if (values.resource) {
            const name = values.resource;
            return;
        }
        console.log('Creates a resource boilerplate.\nUsage: jack new [--OPTION][=VALUE]')
        console.log('Options:\n        --resource        -r          name of the resource')
    }
    
    /**
     * parses command `get` : jack get [[option][=value] | [value]]
     */
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
                if (isAltvServerDirectory(files)) {
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
// console.log(cli.argv)