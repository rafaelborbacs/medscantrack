const { startDB } = require('./db.js')
const startAPI = require('./api.js')
const spawnSCP = require('./scp.js')
const startSync = require('./sync.js')

const [, , aetitle, scpport, scpfolder, dbfolder, apiport] = process.argv

const self = { aetitle, scpport, scpfolder, dbfolder, apiport }

if(!aetitle|| !scpport || !scpfolder || !dbfolder || !apiport){
    console.log("usage: medscan [aetitle] [scpport] [scpfolder] [dbfolder] [apiport]")
    process.exit(1)
}

console.log(self)

startDB(self)
startAPI(self)
spawnSCP(self)
startSync(self)
