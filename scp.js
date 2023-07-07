const path = require('path')
const { spawn, exec } = require('child_process')
const { updateNodes } = require('./nodes.js')
const { wakeUpSync } = require('./sync')
const { wakeUpInspect } = require('./inspect')

let timeoutUpdate = null
const wake = () => {
    process.self.state = 'idle'
    wakeUpSync()
    wakeUpInspect()
    timeoutUpdate = null
}
const onSCPAction = () => {
    process.self.state = 'receiving'
    if(timeoutUpdate)
        clearTimeout(timeoutUpdate)
    timeoutUpdate = setTimeout(wake, 6000)
}

let scp = null, scpo = null
const storescp = path.join('.', 'dcm4chee', 'bin', 'storescp')
const startSCP = (req, res) => {
    stopSCP()
    setTimeout(() => {
        const args = `--accept-unknown --tls-aes -b ${process.self.aetitle}:${process.self.scpport} --directory ${process.self.scpfolder}`
        scp = spawn(storescp, args.split(' '), {shell:true})
        scp.stdout.on('data', onSCPAction)
        scp.stderr.on('data', onSCPAction)
        scp.on('error', code => console.error(`SCP error: ${code}`))
        const msg = `SCP started at ${process.self.aetitle}:${process.self.scpport}`
        console.log(msg)
        const argso = `--accept-unknown -b ${process.self.scpporto} --directory ${process.self.scpfolder}`
        scpo = spawn(storescp, argso.split(' '), {shell:true})
        scpo.stdout.on('data', onSCPAction)
        scpo.stderr.on('data', onSCPAction)
        scpo.on('error', code => console.error(`SCP open error: ${code}`))
        const msgo = `SCP open started at ${process.self.scpporto}`
        console.log(msgo)
        if(res) res.json({msg, msgo})
        process.self.scp = true
        process.self.state = 'idle'
    }, 4000)
}

const stopSCP = (req, res) => {
    exec(`kill -9 $(lsof -t -i:${process.self.scpport}) & kill -9 $(lsof -t -i:${process.self.scpporto})`, () => {
        const msg = `SCPs stopped`
        console.log(msg)
        scp = null
        process.self.scp = false
        process.self.state = 'stopped'
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
