const { startDB } = require('./db.js')
const startAPI = require('./api.js')
const spawnSCP = require('./scp.js')
const startSync = require('./sync.js')

const [, , aetitle, host, scpport, scpfolder, dbfolder, apiport] = process.argv

const self = { aetitle, host, scpport, scpfolder, dbfolder, apiport }

if(!aetitle || !host || !scpport || !scpfolder || !dbfolder || !apiport){
    console.log("usage: medscan [aetitle] [host] [scpport] [scpfolder] [dbfolder] [apiport]")
    process.exit(1)
}

console.log(self)

startDB(self)
startAPI(self)
spawnSCP(self)
startSync(self)
