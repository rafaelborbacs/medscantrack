const request = require('request')
const { exec } = require('child_process')
const getSCPFiles = require('./files.js')
const { updateNodes } = require('./node-controller.js')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const timeFormat = (time) => {
    const hours = Math.floor(time / (60 * 60 * 1000))
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = (time % (60 * 1000)) / 1000
    return (hours === 0 ? '' : `${hours}h`)
        + (minutes === 0 ? '' : `${minutes.toString().padStart(2, '0')}m`)
        + `${seconds.toFixed(2)}s`
}

const sync = async () => {
    let idle = true
    const localFiles = getSCPFiles()
    if(localFiles.length > 0){
        for(const node of process.self.nodes){
            const remoteFiles = await checkSCP(node)
            if(remoteFiles){
                const missingFiles = localFiles.filter(file => !remoteFiles.includes(file)).slice(0, 1000)
                if(missingFiles.length > 0){
                    idle = false
                    //for(const file of missingFiles)
                    //    await cpFileNode(node, file)
                    await storeSCUNode(node, missingFiles)
                }
            }
        }
    }
    return idle
}

const startSync = async () => {
    await updateNodes()
    let idle = true
    while(true){
        if(idle)
            await sleep(10000)
        idle = await sync()
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

const storeSCUNode = async (node, files) => new Promise((resolve, reject) => {
    const source = files.map(file => `${process.self.scpfolder}/${file}`).join(" ")
    const destination = `${process.self.aetitle}@${node.host}:${node.scpport}`
    console.log(`SCU -c ${destination} [${files.length} files]`)
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

module.exports = startSync
