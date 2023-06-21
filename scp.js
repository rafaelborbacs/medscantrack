const path = require('path')
const { spawn, exec } = require('child_process')
const { updateNodes } = require('./nodes.js')
const { wakeUpSync } = require('./sync')
const { wakeUpInspect } = require('./inspect')

let scp = null
let timeoutUpdate = null
const onSCPEvents = () => {
    if(timeoutUpdate)
        clearTimeout(timeoutUpdate)
    timeoutUpdate = setTimeout(() => {
        wakeUpSync()
        wakeUpInspect()
        timeoutUpdate = null
    }, 3000)
}

const storescp = path.join('.', 'dcm4chee', 'bin', 'storescp')
const startSCP = (req, res) => {
    stopSCP()
    setTimeout(() => {
        const args = `--accept-unknown --tls-aes -b ${process.self.aetitle}:${process.self.scpport} --directory ${process.self.scpfolder}`
        scp = spawn(storescp, args.split(' '), {shell:true})
        scp.stdout.on('data', onSCPEvents)
        scp.stderr.on('data', onSCPEvents)
        scp.on('error', code => console.error(`SCP error: ${code}`))
        const msg = `SCP started at ${process.self.aetitle}:${process.self.scpport}`
        console.log(msg)
        if(res) res.json({msg})
        process.self.scp = true
    }, 4000)
}

const stopSCP = (req, res) => {
    exec(`kill -9 $(lsof -t -i:${process.self.scpport})`, () => {
        const msg = `SCP stopped`
        console.log(msg)
        scp = null
        process.self.scp = false
        if(res) res.json({msg})
    })
}

const cleanSCP = (req, res) => {
    exec(`rm -fr ${process.self.scpfolder}/*`, (err, stdout, stderr) => {
        if(err) console.error(`Error clearing SPC folder: ${process.self.scpfolder}: ${err}`)
        updateNodes()
        res.json({msg: 'ok'})
    })
}

module.exports = { startSCP, stopSCP, cleanSCP }
