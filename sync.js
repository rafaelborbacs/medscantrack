const fs = require('fs')
const path = require('path')
const request = require('request')
const { exec, spawn } = require('child_process')
const { getSCPFiles } = require('./scpfiles.js')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const timeFormat = (time) => {
    const hours = Math.floor(time / (60 * 60 * 1000))
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = (time % (60 * 1000)) / 1000
    return (hours === 0 ? '' : `${hours}h`)
        + (minutes === 0 ? '' : `${minutes.toString().padStart(2, '0')}m`)
        + `${seconds.toFixed(2)}s`
}

const checkSCP = async (node) => new Promise((resolve, reject) => {
    request({
        url: `${node.apiprotocol}://${node.host}:${node.apiport}/scpfiles`,
        timeout: 30000,
        headers: { "authorization": `Bearer ${process.self.aetitle}`, "name": node.name }
    }, (error, response, body) => {
        if(error) resolve(false)
        else if(typeof body === 'string')
            try { resolve(JSON.parse(body)) }
            catch (e) { resolve(false) }
        resolve(body)
    })
})

const copyFile = async (node, file) => new Promise((resolve, reject) => {
    const source = path.join(process.self.scpfolder, file)
    const destination = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`, file)
    fs.copyFile(source, destination, err => {
        if(err) console.error(`Error on copying ${file}: ${err}`)
        resolve()
    })
})

const storescu = path.join('.', 'dcm4chee', 'bin', 'storescu')
const storeSCUNode = async (node, missingFiles) => new Promise((resolve, reject) => {
    const start = new Date()
    const source = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`)
    const destination = `${process.self.aetitle}@${node.host}:${node.scpport}`
    console.log(`SCU ${source} --> ${destination} [${missingFiles.length} files]`)
    const scu = spawn(storescu, ['--tls-aes','-c', destination, source], {shell:true})
    scu.stdout.on('data', () => {})
    scu.stderr.on('data', () => {})
    scu.on('close', code => {
        const elapsed = new Date() - start
        console.log(`done in ${timeFormat(new Date(elapsed))}`)
        resolve()
    })
    scu.on('error', code => {
        const elapsed = new Date() - start
        console.log(`done in ${timeFormat(new Date(elapsed))} with SCU error: ${code}`)
        resolve()
    })
})

const clearDirNode = async (node) => new Promise((resolve, reject) => {
    const folder = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`)
    exec(`rm -fr ${folder}/*`, (err, stdout, stderr) => {
        if(err) console.error(`Error clearing folder: ${folder}`)
        resolve()
    })
})

const startSync = async () => {
    while(true){
        await sleep(7000)
        const localFiles = getSCPFiles()
        if(localFiles.length > 0){
            for(const node of process.self.nodes)
                await syncNode(node, localFiles)
        }
    }
}

const syncNode = async (node, localFiles) => {
    const remoteFiles = await checkSCP(node)
    if(remoteFiles && remoteFiles.length >= 0){
        const missingFiles = localFiles.filter(file => !remoteFiles.includes(file))
        if(missingFiles.length > 0){
            for(const file of missingFiles)
                await copyFile(node, file)
            await storeSCUNode(node, missingFiles)
            await notifyNode(node, missingFiles)
            await clearDirNode(node)
        }
    }
}

const notifyNode = async (node, sentFiles) => new Promise((resolve, reject) => {
    const baseURL = `${node.apiprotocol}://${node.host}:${node.apiport}`
    const url = `${baseURL}/notify`
    console.log(`Notify ${url} -> ${sentFiles.length} files`)
    request({
        url,
        timeout: Infinity,
        headers: { "authorization": `Bearer ${process.self.aetitle}`, "name": node.name },
        method: 'POST',
        json: true,
        body: { files: sentFiles, url: baseURL, host: node.host, apiport: node.apiport }
    }, (error, response, body) => {
        if(error)
            console.error(`Error no notifying node: ${error}`)
        resolve()
    })
})

module.exports = { startSync }
