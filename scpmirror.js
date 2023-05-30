const Joi = require('joi-oid')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { exec, spawn } = require('child_process')
const { getSCPFiles } = require('./scpfiles')

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

const onNotify = async (req, res) => {
    const validation = schemaGet.validate(req.body)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    let { url, host, apiport, files } = req.body
    console.log(`Notified -> ${files.length} files from ${url}`)
    if(host === process.self.host && apiport === process.self.apiport)
        return res.json({msg:'no action'})
    const localFiles = getSCPFiles()
    files = files.filter(file => !localFiles.includes(file))
    if(files.length === 0)
        return res.json({msg:'no action'})
    console.log(`missing ${files.length}`)
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
            const msg = `Done receiving mirror file: ${zipPath}`
            console.log(msg)
            try { writer.end() } catch (error) {}
            await unzipFile(zipPath, aetitle, zipFolder)
            await storeSCUSelf(zipFolder)
            exec(`rm -fr ${zipFolder}`, () => {
                console.log(`Done processing mirror file`)
                res.json({msg})
            })
        })
        writer.on('error', error => {
            const msg = `Runtime error on receiving mirror file: ${error}`
            console.error(msg)
            try { writer.end() } catch (error) {}
            exec(`rm -fr ${zipFolder}`, () => res.status(500).json({msg}))
        })
    } catch (error) {
        const msg = `Error on receiving mirror file: ${error}`
        console.error(msg)
        res.status(500).json({msg})
    }
}

module.exports = { onNotify }
