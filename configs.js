require('dotenv').config()
const Joi = require('joi-oid')

const schemaPut = Joi.object({
    aetitle: Joi.string().min(1).max(16),
    name: Joi.string().min(2).max(16),
    wsmirror: Joi.string().min(2).max(200)
}).unknown(false)

const config = () => {
    const { aetitle, name, scpport, apiport, wsmirror, scpfolder, dbfolder } = process.env
    const env = { aetitle, name, scpport, apiport, wsmirror, scpfolder, dbfolder }
    const argv = {}
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')){
            const [key, value] = arg.substring(2).split('=')
            argv[key] = value.replace('"','').replace("'","")
        }
    })
    process.self = {...env, ...argv}
}

const reconfig = (req, res) => {
    const configs = req.body
    const validation = schemaPut.validate(configs)
    if(validation.error)
        return res.status(400).json({validation, msg:'error'})
    const self = process.self
    process.self = {...self, ...configs}
    return res.json({msg:'ok'})
}

const getConfig = (req, res) => {
    res.json(process.self)
}

module.exports = { config, reconfig, getConfig }
