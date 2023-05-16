require('dotenv').config()
const Joi = require('joi-oid')

const schemaPut = Joi.object({
    aetitle: Joi.string().min(1).max(16),
    name: Joi.string().min(2).max(16),
    scpport: Joi.number().min(1).max(99999),
    apiport: Joi.number().min(1).max(99999),
    startws: Joi.bool()
}).unknown(false)

const config = () => {
    const { aetitle, name, scpport, apiport, wsmirror, scpfolder, dbfolder } = process.env
    const env = { aetitle, name, scpport, apiport, wsmirror, scpfolder, dbfolder }
    const argv = {}
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')){
            const [key, value] = arg.substring(2).split('=')
            argv[key] = value
        }
    })
    process.self = {...env, ...argv}
}

const reconfig = (req, res) => {
    const configs = req.body
    const validation = schemaPut.validate(configs)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    const self = process.self
    process.self = {...self, ...configs}
    return res.send({msg:'ok'})
}

module.exports = { config, reconfig }
