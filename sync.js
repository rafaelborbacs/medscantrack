const request = require('request')
const { exec } = require('child_process')
const getSCPFiles = require('./files.js')
const db = require('./db.js')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)

const timeFormat = (time) => {
    const hours = Math.floor(time / (60 * 60 * 1000))
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = (time % (60 * 1000)) / 1000
    return (hours === 0 ? '' : `${hours}h`)
        + (minutes === 0 ? '' : `${minutes.toString().padStart(2, '0')}m`)
        + `${seconds.toFixed(2)}s`
}

const startSync = async () => {
    let idle = true
    while(true){
        if(idle)
            await sleep(10000)
        idle = true
        const nodes = await db.find('node', {})
        if(nodes && nodes.length > 0){
            const localFiles = getSCPFiles()
            if(localFiles && localFiles.length > 0){
                for(const node of nodes){
                    const remoteFiles = await checkSCP(node)
                    if(remoteFiles){
                        const missingFiles = shuffle(localFiles.filter(file => !remoteFiles.includes(file))).slice(0, 500)
                        if(missingFiles && missingFiles.length > 0){
                            await mkdirNode(node)
                            for(const file of missingFiles)
                                await cpFileNode(node, file)
                            await storeSCUNode(node, missingFiles.length)
                            await clearDirNode(node)
                            idle = false
                        }
                    }
                }
            }
        }
    }
}

const checkSCP = async (node) => new Promise((resolve, reject) => {
    request({
        url: `http://${node.host}:${node.apiport}/scpfiles`,
        timeout: 10000,
        headers: { "Authorization": `Bearer ${process.self.aetitle}` }
    }, (error, response, body) => {
        if(error) resolve(false)
        else if (typeof body === 'string')
            try { resolve(JSON.parse(body)) }
            catch (e) { resolve(false) }
        resolve(body)
    })
})

const cpFileNode = async (node, file) => new Promise((resolve, reject) => {
    const cp = `cp -f ${process.self.scpfolder}/${file} ${process.self.scpfolder}/${node.host}_${node.scpport}`
    exec(cp, (err, stdout, stderr) => {
        if (err){
            console.error(`Error on copying ${file}`)
            reject()
        }
        resolve()
    })
})

const storeSCUNode = async (node, filesCount) => new Promise((resolve, reject) => {
    const source = `${process.self.scpfolder}/${node.host}_${node.scpport}`
    const destination = `${process.self.aetitle}@${node.host}:${node.scpport}`
    console.log(`SCU ${source} --> ${destination} [${filesCount} files]`)
    const start = new Date()
    exec(`./dcm4chee/bin/storescu -c ${destination} ${source}`, (err, stdout, stderr) => {
        if (err){
            console.error('SCU error')
            resolve(false)
        }
        const elapsed = new Date() - start
        console.log(`done in ${timeFormat(new Date(elapsed))}`)
        resolve()
    })
})

const mkdirNode = async (node) => new Promise((resolve, reject) => {
    const folder = `${process.self.scpfolder}/${node.host}_${node.scpport}`
    exec(`mkdir -p ${folder}`, (err, stdout, stderr) => {
        if (err){
            console.error(`Error on mkdir ${folder}`)
            reject()
        }
        resolve()
    })
})

const clearDirNode = async (node) => new Promise((resolve, reject) => {
    const folder = `${process.self.scpfolder}/${node.host}_${node.scpport}`
    exec(`rm -fr ${folder}/*`, (err, stdout, stderr) => {
        if (err){
            console.error(`Error on clearDir ${folder}`)
            reject()
        }
        resolve()
    })
})

module.exports = startSync
