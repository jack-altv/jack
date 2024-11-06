import { $ } from "bun";
import {parseArgs} from "util";
import { exec } from "child_process";

const ALTV_PKG = Bun.which('altv-pkg');
const argv = Bun.argv.slice(2)
let command = null;


async function handle() {
    if (argv.length > 0) {
        if (!argv[0].startsWith('-')){
            command = argv[0];
        }
    }
    if ( command === 'get' ) {
        const {values} = parseArgs({
            args: argv.slice(1),
            options: { 
                altv: {
                    type: "string",
                }
            },
            strict:false
        })
        if (values.altv) {
            console.log(`downloading alt:v ${values.altv}`);
            // const pkg = spawn('altv-pkg', [values.altv])
            // pkg.on('close', (code) => {
            //     console.log(`child process exited with code ${code}`);
            // });
            // pkg.stdout.on('data', (data)=>{
            //     console.log('stdout: ' + data.toString())
            // })
            
            // pkg.stderr.on('data', (data)=>{
            //     console.log('stderr: ' + data.toString())
            // })
            // pkg.on('error', (err) => {
            //     console.error('Failed to start subprocess.\n' + err);
            // });
            exec(`altv-pkg ${values.altv}`, (error, stdout, stderr) => {
                if (error){
                    console.log(error.message)
                    console.error('altv-pkg failed to download alt:v server');
                    process.exit(0)
                }
                if (stderr) {
                    console.log(stderr)
                }
                if (stdout) {
                    console.log(stdout)
                }
                console.log('\x1b[32m%s\x1b[0m', 'alt:v server is installed')
            })
            
        }
        else if (!ALTV_PKG) {
            console.log('altv-pkg not found...');
            try {
                const result = await $`bun i -g altv-pkg`;
                console.log('\x1b[32m%s\x1b[0m', 'altv-pkg is successfully installed')
            }catch (err){
                console.error('failed to download altv-pkg')
                process.exit(err.exitCode)
            }
        }
    }
    
}

await handle()
console.log(argv)