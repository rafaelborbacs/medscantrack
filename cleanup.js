const { spawn } = require('child_process')

const cleanup = async () => {
    let args = `-9 $(sudo lsof -t -i:${process.self.scpport})`
    const killSCP = spawn('kill', args.split(' '))
    killSCP.stdout.on('data', () => {})
    killSCP.stderr.on('data', () => {})
    killSCP.on('close', (code) => {})
    killSCP.on('error', (err) => {})
    args = `-9 $(sudo lsof -t -i:${process.self.apiport})`
    const killAPI = spawn('kill', args.split(' '))
    killAPI.stdout.on('data', () => {})
    killAPI.stderr.on('data', () => {})
    killAPI.on('close', (code) => {})
    killAPI.on('error', (err) => {})
}

module.exports = cleanup
