const killPort = require('kill-port')
const express = require('express')
const getSCPFiles = require('./files.js')
const nodes = require('./node-controller.js')
const files = require('./file-controller.js')

const filter = (req, res, handler) => {
    if(req && req.headers['authorization'] === `Bearer ${process.self.aetitle}`)
        return handler(req, res)
    return res.status(401).send({msg:'access denied'})
}

const scpfiles = async (req, res) => res.json(await getSCPFiles())

const startAPI = () => {
    killPort(process.self.apiport).then(() => {
        const api = express()
        api.use(express.json({limit: '2mb'}))
        api.use(express.json())
        api.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', '*')
            res.setHeader('Access-Control-Allow-Headers', '*')
            next()
        })
        api.get('/scpfiles', (req, res) => filter(req, res, scpfiles))
        api.get('/node', (req, res) => filter(req, res, nodes.get))
        api.post('/node', (req, res) => filter(req, res, nodes.post))
        api.delete('/node', (req, res) => filter(req, res, nodes.remove))
        api.get('/file', (req, res) => filter(req, res, files.get))
        api.delete('/file', (req, res) => filter(req, res, files.remove))
        api.listen(process.self.apiport, () => console.log(`API is running on port ${process.self.apiport}`))
    })
    .catch((err) => console.log(`Error on shutting port ${process.self.apiport}`))
}

module.exports = startAPI
