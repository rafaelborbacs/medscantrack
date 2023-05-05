const fs = require('fs')
const path = require('path')
const request = require('request')
const { exec, spawn } = require('child_process')
const getSCPFiles = require('./files.js')

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
                const missingFiles = localFiles.filter(file => !remoteFiles.includes(file))
                if(missingFiles.length > 0){
                    idle = false
                    for(const file of missingFiles)
                        await copyFile(node, file)
                    await storeSCUNode(node, missingFiles.length)
                    await clearDirNode(node)
                }
            }
        }
    }
    return idle
}

const startSync = async () => {
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

const copyFile = async (node, file) => new Promise((resolve, reject) => {
    const source = path.join(process.self.scpfolder, file)
    const destination = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`, file)
    fs.copyFile(source, destination, err => {
        if (err){
            console.error(`Error on copying ${file}`)
            reject()
        }
        else resolve()
    })
})

const storescu = path.join('.', 'dcm4chee', 'bin', 'storescu')
const storeSCUNode = async (node, filesCount) => new Promise((resolve, reject) => {
    const start = new Date()
    const source = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`)
    const destination = `${process.self.aetitle}@${node.host}:${node.scpport}`
    console.log(`SCU ${source} --> ${destination} [${filesCount} files]`)
    const scu = spawn(storescu, ['-c', destination, source], {shell:true})
    scu.stdout.on('data', () => {})
    scu.stderr.on('data', () => {})
    scu.on('close', code => {
        const elapsed = new Date() - start
        console.log(`done in ${timeFormat(new Date(elapsed))}`)
        resolve()
    })
    scu.on('error', code => {
        console.error(`SCU error: ${code}`)
        const elapsed = new Date() - start
        console.log(`done in ${timeFormat(new Date(elapsed))}`)
        resolve()
    })
})

const clearDirNode = async (node) => new Promise((resolve, reject) => {
    const folder = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`)
    if (process.platform === 'win32') {
        exec(`del /S /Q ${folder}\\*`, (err, stdout, stderr) => {
            if (err) console.error(`Error clearing folder: ${folder}`);
            resolve()
        })
    }
    else {
        exec(`rm -fr ${folder}/*`, (err, stdout, stderr) => {
            if (err) console.error(`Error clearing folder: ${folder}`);
            resolve()
        })
    }
})

module.exports = startSync
