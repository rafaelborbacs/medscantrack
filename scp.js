const killPort = require('kill-port')
const path = require('path')
const { spawn } = require('child_process')

const storescp = path.join('.', 'dcm4chee', 'bin', 'storescp')
const spawnSCP = () => {
    killPort(process.self.scpport)
    .then(() => {})
    .catch(err => console.log(`Error on shutting port ${process.self.scpport}: ${err}`))
    .finally(() => {
        const args = `--accept-unknown -b ${process.self.aetitle}:${process.self.scpport} --directory ${process.self.scpfolder}`
        const scp = spawn(storescp, args.split(' '), {shell:true})
        scp.stdout.on('data', () => {})
        scp.stderr.on('data', () => {})
        scp.on('close', code => {})
        scp.on('error', code => console.error(`SCP error: ${code}`))
        console.log(`SCP is running at ${process.self.aetitle}:${process.self.scpport}`)
    })
}

module.exports = spawnSCP
