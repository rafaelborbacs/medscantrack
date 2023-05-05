require('dotenv').config()
const { startDB } = require('./db.js')
const startAPI = require('./api.js')
const spawnSCP = require('./scp.js')
const startSync = require('./sync.js')
const startInspect = require('./inspect.js')
const { updateNodes } = require('./node-controller.js')

const [, , aetitle, scpport, scpfolder, dbfolder, apiport] = process.argv

let self = { aetitle, scpport, scpfolder, scpfolder, dbfolder, apiport }

if(!aetitle || !scpport || !scpfolder || !dbfolder || !apiport)
    self = {
        aetitle: process.env.aetitle,
        scpport: process.env.scpport,
        scpfolder: process.env.scpfolder,
        dbfolder: process.env.dbfolder,
        apiport: process.env.apiport
    }

if(!self.aetitle || !self.scpport || !self.scpfolder || !self.dbfolder || !self.apiport){
    console.log("usage: medscan [aetitle] [scpport] [scpfolder] [dbfolder] [apiport]")
    process.exit(1)
}

process.self = self
console.log(process.self)

startDB()
updateNodes()
startAPI()
spawnSCP()
startSync()
startInspect()
