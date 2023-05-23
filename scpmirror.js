const Joi = require('joi-oid')
const axios = require('axios')

const schemaGet = Joi.object({
    url: Joi.string().min(3).required(),
    host: Joi.string().min(8).max(64).required(),
    apiport: Joi.number().min(1).max(99999).required(),
    files: Joi.array().items(Joi.string().min(1)).min(1).required()
}).unknown(false)

const unzipFile = async (zipPath, aetitle, folder) => new Promise((resolve, reject) => {
    if(process.platform === 'win32') {
        exec(`peazip.exe -ext2folder -password=${aetitle} ${zipPath} -d ${folder}`, (err, stdout, stderr) => {
            console.log(`---> unzip ---> ${err}`)
            console.log(`---> unzip ---> ${stdout}`)
            console.log(`---> unzip ---> ${stderr}`)
            if(err) console.error(`Error clearing folder: ${folder}`)
            resolve()
        })
    }
    else {
        exec(`unzip -P ${aetitle} ${zipPath} -d ${folder}`, (err, stdout, stderr) => {
            if(err) console.error(`Error unziping file: ${zipPath}`)
            resolve()
        })
    }
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
        const zipPath = path.join(scpfolder, zipName)
        const writer = fs.createWriteStream(zipPath)
        response.data.pipe(writer)
        writer.on('finish', async () => {
            try { writer.end() } catch (error) {}
            await unzipFile(zipPath, aetitle, scpfolder)
            res.json({msg:'ok'})
        })
        writer.on('error', error => {
            const msg = `Runtime error on receiving SCP zip file: ${error}`
            console.error(msg)
            res.status(500).json({msg})
            try { writer.end() } catch (error) {}
        })
    } catch (error) {
        const msg = `Error on receiving zip file: ${error}`
        console.log(msg)
        if(error.response && error.response.status)
            res.status(error.response.status).json({msg})
        else 
            res.status(500).json({msg})
    }
}

module.exports = { onNotify }
