const { startDB } = require('./db.js')
const { startAPI } = require('./api.js')
const { startSCP } = require('./scp.js')
const { startSync } = require('./sync.js')
const { startInspect } = require('./inspect.js')
const { updateNodes } = require('./nodes.js')
const { config, dbconfig } = require('./configs.js')
const { startWS } = require('./wsmirror.js')

const medscan = async () => {
    config()
    startDB()
    await dbconfig()
    updateNodes()
    startAPI()
    startSCP()
    startSync()
    startInspect()
    startWS()
}

medscan()
