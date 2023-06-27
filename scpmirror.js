const Joi = require('joi-oid')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { exec, spawn } = require('child_process')
const { getSCPFiles } = require('./scpfiles')
const { wakeUpInspect } = require('./inspect')
const { wakeUpSync } = require('./sync')

const schemaGet = Joi.object({
    url: Joi.string().min(3).required(),
    host: Joi.string().min(8).max(64).required(),
    apiport: Joi.number().min(1).max(99999).required(),
    files: Joi.array().items(Joi.string().min(1)).min(1).required()
}).unknown(false)

const unzipFile = async (zipPath, aetitle, folder) => new Promise((resolve, reject) => {
    exec(`unzip -P ${aetitle} ${zipPath} -d ${folder}`, (err, stdout, stderr) => {
        if(err) console.error(`Error on unziping file: ${zipPath} error: ${err}`)
        resolve()
    })
})

const storescu = path.join('.', 'dcm4chee', 'bin', 'storescu')
const storeSCUSelf = async (folder) => new Promise((resolve, reject) => {
    const destination = `${process.self.aetitle}@127.0.0.1:${process.self.scpport}`
    console.log(`SELF SCU ${folder} --> ${destination}`)
    const scu = spawn(storescu, ['--tls-aes','-c', destination, folder], {shell:true})
    scu.stdout.on('data', () => {})
    scu.stderr.on('data', () => {})
    scu.on('close', () => {
        console.log('SELF SCU done')
        resolve()
    })
    scu.on('error', error => {
        console.log(`SELF SCU done with error: ${error}`)
        resolve()
    })
})

let onGoingSCPFiles = []
const getOnGoingSCPFiles = () => onGoingSCPFiles

const onNotify = async (req, res) => {
    if(!process.self.httpmirror)
        return res.json({msg:'no action'})
    const validation = schemaGet.validate(req.body)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    let { url, host, apiport, files } = req.body
    console.log(`I've been notified -> ${files.length} files by ${url}`)
    wakeUpSync()
    wakeUpInspect()
    const localFiles = getSCPFiles()
    files = files.filter(file => !localFiles.includes(file))
    if(files.length === 0){
        const msg = 'already in sync'
        console.log(msg)
        return res.json({msg})
    }
    const msg = `missing ${files.length} -> reaching mirror for them`
    console.log(msg)
    res.json({msg})
    files.forEach(file => !onGoingSCPFiles.includes(file) && onGoingSCPFiles.push(file))
    try {
        const { aetitle, scpfolder, name } = process.self
        const uuid = Math.random().toString(36).substring(2, 9)
        const response = await axios.post(`${url}/mirrorfiles`, { aetitle, name, uuid, files }, {
            responseType: 'stream',
            headers: { "Authorization": `Bearer ${aetitle}`, "name": name }
        })
        const zipName =  `${uuid}.zip`
        const zipFolder = path.join(scpfolder, uuid)
        fs.mkdirSync(zipFolder, {recursive: true})
        const zipPath = path.join(zipFolder, zipName)
        const writer = fs.createWriteStream(zipPath)
        response.data.pipe(writer)
        writer.on('finish', async () => {
            onGoingSCPFiles = onGoingSCPFiles.filter(file => !files.includes(file))
            const msg = `Done receiving mirror file: ${zipPath}`
            console.log(msg)
            try { writer.end() } catch (error) {}
            await unzipFile(zipPath, aetitle, zipFolder)
            await storeSCUSelf(zipFolder)
            exec(`rm -fr ${zipFolder}`, () => {
                console.log('Done processing mirror file')
                wakeUpInspect()
            })
        })
        writer.on('error', error => {
            onGoingSCPFiles = onGoingSCPFiles.filter(file => !files.includes(file))
            console.error(`Runtime error on receiving mirror file: ${error}`)
            try { writer.end() } catch (error) {}
            exec(`rm -fr ${zipFolder}`, () => {})
        })
    } catch (error) {
        onGoingSCPFiles = onGoingSCPFiles.filter(file => !files.includes(file))
        console.error(`Error on receiving mirror file: ${error}`)
    }
}

module.exports = { onNotify, getOnGoingSCPFiles }
