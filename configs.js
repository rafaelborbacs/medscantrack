require('dotenv').config()
const Joi = require('joi-oid')
const db = require('./db.js')

const schemaPut = Joi.object({
    aetitle: Joi.string().min(1).max(16),
    name: Joi.string().min(2).max(16),
    wsmirror: Joi.string().min(2).max(200)
}).unknown(false)

const config = () => {
    const { aetitle, name, scpport, apiport, wsmirror, scpfolder, dbfolder } = process.env
    process.self = { aetitle, name, scpport, apiport, wsmirror, scpfolder, dbfolder }
}

const dbconfig = async () => {
    const configsDB = await db.find('config', {})
    const configDB = (configsDB.length === 0 ? {} : configsDB[0])
    const self = process.self
    process.self = {...self, ...configDB}
    await db.remove('config', {})
    db.insert('config', process.self)
}

const reconfig = async (req, res) => {
    const configs = req.body
    const validation = schemaPut.validate(configs)
    if(validation.error)
        return res.status(400).json({validation, msg:'error'})
    const self = process.self
    process.self = {...self, ...configs}
    await db.remove('config', {})
    db.insert('config', process.self)
    return res.json({msg:'ok'})
}

const getConfig = (req, res) => res.json(process.self)

module.exports = { config, dbconfig, reconfig, getConfig }
