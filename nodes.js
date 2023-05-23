const fs = require('fs')
const path = require('path')
const Joi = require('joi-oid')
const db = require('./db.js')

const schemaPost = Joi.object({
    host: Joi.string().min(8).max(64).required(),
    name: Joi.string().min(2).max(16).required(),
    scpport: Joi.number().min(1).max(99999).required(),
    apiport: Joi.number().min(1).max(99999).required(),
    apiprotocol: Joi.string().valid('http', 'https').required()
}).unknown(false)

const schemaRemove = Joi.object({
    name: Joi.string().min(1).max(60).required()
}).unknown(false)

const get = async (req, res) => {
    await updateNodes()
    res.json(process.self.nodes)
}

const post = async (req, res) => {
    const node = req.body
    const validation = schemaPost.validate(node)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    let data = await db.find('node', { name: node.name })
    if(data && data.length > 0)
        return res.status(409).send({node, msg:'duplicate entry host:name'})
    data = await db.find('node', { host: node.host, scpport: node.scpport })
    if(data && data.length > 0)
        return res.status(409).send({node, msg:'duplicate entry host:scpport'})
    data = await db.find('node', { host: node.host, apiport: node.apiport })
    if(data && data.length > 0)
        return res.status(409).send({node, msg:'duplicate entry host:apiport'})
    const rs = await db.insert('node', node)
    updateNodes()
    res.json({rs, msg:'ok'})
}

const remove = async (req, res) => {
    const node = req.body
    const validation = schemaRemove.validate(node)
    if(validation.error)
        return res.status(400).send({validation, msg:'error'})
    const rs = await db.remove('node', node)
    updateNodes()
    res.json({rs, msg:'ok'})
}

const updateNodes = async () => {
    process.self.nodes = await db.find('node', {})
    for(const node of process.self.nodes)
        await mkdirNode(node)
}

const mkdirNode = async (node) => new Promise((resolve, reject) => {
    const folder = path.join(process.self.scpfolder, `${node.host}_${node.scpport}`)
    fs.mkdir(folder, {recursive: true}, err => {
        if(err){
            console.error(`Error on mkdir ${folder}`)
            reject()
        }
        else resolve()
    })
})

module.exports = { get, post, remove, updateNodes }
