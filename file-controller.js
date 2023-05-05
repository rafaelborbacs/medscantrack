const Joi = require('joi-oid')
const db = require('./db.js')

const schemaRemove = Joi.object({
    names: Joi.array().items(Joi.string().min(1)).min(1).required()
})

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
    const rs = await db.remove('file', {name: {$in: data.names}})
    return res.json({rs, msg:'ok'})
}

module.exports = { get, remove }
