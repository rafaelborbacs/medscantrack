const request = require('request')
const { exec } = require('child_process')
const getSCPFiles = require('./files.js')
const db = require('./db.js')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const timeFormat = (time) => {
    const hours = Math.floor(time / (60 * 60 * 1000))
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = (time % (60 * 1000)) / 1000
    return (hours === 0 ? '' : `${hours}h`)
        + (minutes === 0 ? '' : `${minutes.toString().padStart(2, '0')}m`)
        + `${seconds.toFixed(2)}s`
}

const startSync = async (self) => {
    while(true){
        await sleep(10000)
        const nodes = await db.find('node', {})
        if(nodes && nodes.length > 0){
            const localFiles = await getSCPFiles(self)
            if(localFiles && localFiles.length > 0){
                for(const node of nodes){
                    const remoteFiles = await checkSCP(self, node)
                    if(remoteFiles && remoteFiles.length > 0){
                        const missingFiles = localFiles.filter(file => !remoteFiles.includes(file))
                        if(missingFiles && missingFiles.length > 0){
                            await mkdirNode(self, node)
                            for(const file of missingFiles){
                                await cpFileNode(self, node, file)
                            }
                            await storeSCUNode(self, node)
                            await clearDirNode(self, node)
                        }
                    }      
                }
            }
        }
    }
}

const checkSCP = async (self, node) => new Promise((resolve, reject) => {
    request({
        url: `http://${node.host}:${node.apiport}/scpfiles`,
        headers: { "Authorization": `Bearer ${self.aetitle}` }
    }, (error, response, body) => {
        if(error) resolve(false)
        else resolve(body)
    })
})

const cpFileNode = async (self, node, file) => new Promise((resolve, reject) => {
    const cp = `cp -n ${self.scpfolder}/${file} ${self.scpfolder}/${node.host}_${node.scpport}`
    exec(cp, (err, stdout, stderr) => {
        if (err){
            console.error(err)
            resolve(false)
        }
        resolve(true)
    })
})

const storeSCUNode = async (self, node) => new Promise((resolve, reject) => {
    const source = `${self.scpfolder}/${node.host}_${node.scpport}`
    const destination = `${self.aetitle}@${node.host}:${node.scpport}`
    console.log(`SCU ${source} --> ${destination}`)
    const start = new Date()
    exec(`./dcm4chee/bin/storescu -c ${destination} ${source}`, (err, stdout, stderr) => {
        if (err){
            console.error('SCU error')
            resolve(false)
        }
        const elapsed = new Date() - start
        console.log(`done in ${timeFormat(new Date(elapsed))}`)
        resolve(true)
    })
})

const mkdirNode = async (self, node) => new Promise((resolve, reject) => {
    const folder = `${self.scpfolder}/${node.host}_${node.scpport}`
    exec(`mkdir -p ${folder}`, (err, stdout, stderr) => {
        if (err){
            console.error(`mkdir error --> ${folder}`)
            reject()
        }
        resolve()
    })
})

const clearDirNode = async (self, node) => new Promise((resolve, reject) => {
    const folder = `${self.scpfolder}/${node.host}_${node.scpport}`
    exec(`rm -fr ${folder}/*`, (err, stdout, stderr) => {
        if (err){
            console.error(`clearDir error --> ${folder}`)
            reject()
        }
        resolve()
    })
})

module.exports = startSync
