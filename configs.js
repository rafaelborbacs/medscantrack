require('dotenv').config()
const Joi = require('joi-oid')
const db = require('./db.js')
const { startSCP } = require('./scp.js')

const schemaPut = Joi.object({
    aetitle: Joi.string().min(1).max(16),
    name: Joi.string().min(2).max(16)
}).unknown(false)

const config = () => {
    const { aetitle, name, scpport, scpporto, apiport, httpmirror, scpfolder, dbfolder } = process.env
    process.self = { aetitle, name: name.toUpperCase(), scpport, scpporto, apiport, httpmirror, scpfolder, dbfolder }
    process.self.state = 'idle'
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
    startSCP()
    res.json({msg:'ok'})
}

const getConfig = (req, res) => res.json(process.self)

module.exports = { config, dbconfig, reconfig, getConfig }
