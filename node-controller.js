const Joi = require('joi-oid')
const db = require('./db.js')

const schemaPost = Joi.object({
    host: Joi.string().min(8).max(32).required(),
    scpport: Joi.number().min(1).max(99999).required(),
    apiport: Joi.number().min(1).max(99999).required(),
    name: Joi.string().min(1).max(60).required()
})

const schemaRemove = Joi.object({
    host: Joi.string().min(8).max(32).required(),
    scpport: Joi.number().min(1).max(99999).required()
})

const get = async (self, req, res) => {
    const query = {}
    const data = await db.find('node', query)
    return res.json(data)
}

const post = async (self, req, res) => {
    const node = {
        host: req.body.host,
        scpport: req.body.scpport,
        apiport: req.body.apiport,
        name: req.body.name
    }
    const validation = schemaPost.validate(node)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    const rs = await db.insert('node', node)
    return res.json({node, rs, msg:'ok'})
}

const remove = async (self, req, res) => {
    const node = {
        host: req.body.host,
        scpport: req.body.scpport
    }
    const validation = schemaRemove.validate(node)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    const rs = await db.remove('node', node)
    return res.json({node, rs, msg:'ok'})
}

module.exports = { get, post, remove }
