const { spawn } = require('child_process')

const spawnSCP = async (self) => {
    const args = `--accept-unknown -b ${self.aetitle}@${self.host}:${self.scpport} --directory ${self.scpfolder}`
    const child = spawn('./dcm4chee/bin/storescp', args.split(' '))
    child.stdout.on('data', () => {})
    child.stderr.on('data', () => {})
    child.on('close', (code) => {})
    child.on('error', (code) => console.error(`SCP error code ${code}`))
    console.log(`SCP is running at ${self.aetitle}@${self.host}:${self.scpport}`)
}

module.exports = spawnSCP
