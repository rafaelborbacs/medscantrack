const Joi = require('joi-oid')
const db = require('./db.js')
const { wakeUpInspect } = require('./inspect')

const schemaRemove = Joi.object({
    names: Joi.array().items(Joi.string().min(1))
}).unknown(false)

const get = async (req, res) => {
    const query = {}
    if(req.query.name)
        query.name = req.query.name
    let projection = undefined
    if(req.query.names)
        projection = {name: 1, _id: 0}
    let data = await db.find('file', query, projection)
    if(req.query.count)
        data = data.length
    return res.json(data)
}

const remove = async (req, res) => {
    const data = req.body
    const validation = schemaRemove.validate(data)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    let query = {}
    if(data.names && data.names.length > 0)
        query = {name: {$in: data.names}}
    await db.remove('file', query)
    wakeUpInspect()
    return res.json({msg:'ok'})
}

module.exports = { get, remove }
