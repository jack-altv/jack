import { $ } from "bun";
// import {parseArgs} from "util"

const argv = Bun.argv.slice(2)
let command = null;

if (argv.len > 0) {
    if (!argv[0].startsWith('-')){
        command = argv[0];
    }
}

// console.log(await Bun.file(Bun.which('altv-pkg')).exists())
// console.log(Bun.which('altv-pkg'))

if ( !Bun.which('altv-pkg') ) {
    console.log('altv-pkg not found...')
    try {
        const result = await $`bun i -g altv-pkg`;
        console.log('\x1b[32m%s\x1b[0m', 'altv-pkg is successfully installed!')
    }catch (err){
        console.error('failed to download altv-pkg')
        Bun.process.exit(err.exitCode)
    }
}else {
    console.log('altv-pkg is already installed!')
}

console.log(argv)
// console.log(Bun.which('bun'))
// console.log(Bun.argv)

// console.log(buffer.toString()); // Hello World!\n