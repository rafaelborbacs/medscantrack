const killPort = require('kill-port')
const path = require('path')
const { spawn, exec } = require('child_process')

let scp = null

const storescp = path.join('.', 'dcm4chee', 'bin', 'storescp')
const startSCP = (req, res) => {
    if(scp){
        if(res) res.status(400).json({msg: 'SCP already running'})
    }
    else {
        killPort(process.self.scpport)
        .then(() => {})
        .catch(err => {})
        .finally(() => {
            const args = `--accept-unknown --tls-aes -b ${process.self.aetitle}:${process.self.scpport} --directory ${process.self.scpfolder}`
            scp = spawn(storescp, args.split(' '), {shell:true})
            scp.stdout.on('data', () => {})
            scp.stderr.on('data', () => {})
            scp.on('error', code => console.error(`SCP error: ${code}`))
            const msg = `SCP started at ${process.self.aetitle}:${process.self.scpport}`
            console.log(msg)
            if(res) res.json({msg})
            process.self.scp = true
        })
    }
}

const stopSCP = (req, res) => {
    if(scp){
        scp.on('exit', (code, signal) => {
            const msg = `SCP paused`
            console.log(msg)
            if(res) res.json({msg})
            scp = null
            process.self.scp = false
            killPort(process.self.scpport)
        })
        scp.kill()
        
    }
    else if(res)
        res.status(400).json({msg: 'SCP not running'})
}

const cleanSCP = (req, res) => {
    exec(`rm -fr ${process.self.scpfolder}/*`, (err, stdout, stderr) => {
        if(err) console.error(`Error clearing SPC folder: ${process.self.scpfolder}: ${err}`)
    })
    res.json({msg: 'ok'})
}

module.exports = { startSCP, stopSCP, cleanSCP }
