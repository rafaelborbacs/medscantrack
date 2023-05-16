const { startDB } = require('./db.js')
const { startAPI } = require('./api.js')
const { startSCP } = require('./scp.js')
const { startSync } = require('./sync.js')
const { startInspect } = require('./inspect.js')
const { updateNodes } = require('./nodes.js')
const { config } = require('./config.js')
const { startWS } = require('./wsclient.js')

config()

console.log(process.self)

startDB()
updateNodes()
startAPI()
startSCP()
startSync()
startInspect()
startWS()
