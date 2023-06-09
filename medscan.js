const { startDB } = require('./db.js')
const { startAPI } = require('./api.js')
const { startSCP } = require('./scp.js')
const { startSync } = require('./sync.js')
const { startInspect } = require('./inspect.js')
const { updateNodes } = require('./nodes.js')
const { config, dbconfig } = require('./configs.js')
const { startHTTPMirror } = require('./httpmirror.js')
const { exec } = require('child_process')

const medscan = async () => {
    config()
    startDB()
    await dbconfig()
    await updateNodes()
    console.log(process.self)
    startAPI()
    startSCP()
    startSync()
    startInspect()
    startHTTPMirror()
    exec('curl ifconfig.me', (err, stdout, stderr) => {
        if(stdout) console.log(`My IP: ${stdout}`)
    })
}

medscan()
