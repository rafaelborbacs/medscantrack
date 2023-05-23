const Joi = require('joi-oid')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { exec } = require('child_process')

const schemaGet = Joi.object({
    url: Joi.string().min(3).required(),
    host: Joi.string().min(8).max(64).required(),
    apiport: Joi.number().min(1).max(99999).required(),
    files: Joi.array().items(Joi.string().min(1)).min(1).required()
}).unknown(false)

const unzipFile = async (zipPath, aetitle, folder) => new Promise((resolve, reject) => {
    exec(`unzip -P ${aetitle} ${zipPath} -d ${folder}`, (err, stdout, stderr) => {
        if(err) console.error(`Error unziping file: ${zipPath}`)
        resolve()
    })
})

const onNotify = async (req, res) => {
    const validation = schemaGet.validate(req.body)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    const { url, host, apiport, files } = req.body
    if(host === process.self.host && apiport === process.self.apiport)
        return res.json({msg:'ok'})
    try {
        const { aetitle, scpfolder } = process.self
        const uuid = Math.random().toString(36).substring(2, 9)
        const response = await axios.post(`${url}/mirrorfiles`, { aetitle, files, uuid }, {
            responseType: 'stream',
            //timeout: Infinity,
            headers: { "Authorization": `Bearer ${aetitle}` }
        })
        const zipName =  `${uuid}.zip`
        const zipFolder = path.join(scpfolder, uuid)
        fs.mkdirSync(zipFolder, {recursive: true})
        const zipPath = path.join(zipFolder, zipName)
        const writer = fs.createWriteStream(zipPath)
        response.data.pipe(writer)
        writer.on('finish', async () => {
            try { writer.end() } catch (error) {}
            await unzipFile(zipPath, aetitle, scpfolder)
            fs.rmSync(zipFolder, {recursive: true, force: true})
            res.json({msg:'ok'})
        })
        writer.on('error', error => {
            const msg = `Runtime error on receiving mirror file`
            console.error(msg, error)
            res.status(500).json({msg})
            try { writer.end() } catch (error) {}
        })
    } catch (error) {
        const msg = `Error on receiving mirror file`
        console.error(msg, error)
        res.status(500).json({msg})
    }
}

module.exports = { onNotify }
