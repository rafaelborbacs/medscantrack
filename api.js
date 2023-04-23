const express = require('express')
const getSCPFiles = require('./files.js')
const nodeController = require('./node-controller.js')

const filter = (self, req, res, handler) => {
    if(req && req.headers['authorization'] === `Bearer ${self.aetitle}`)
        return handler(self, req, res)
    return res.status(401).send({msg:'access denied'})
}

const scpfiles = async (self, req, res) => res.json(await getSCPFiles(self))

const startAPI = (self) => {
    const api = express()
    api.use(express.json())
    api.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
        next()
    })
    api.get('/scpfiles', (req, res) => filter(self, req, res, scpfiles))
    api.get('/node', (req, res) => filter(self, req, res, nodeController.get))
    api.post('/node', (req, res) => filter(self, req, res, nodeController.post))
    api.delete('/node', (req, res) => filter(self, req, res, nodeController.remove))
    api.listen(self.apiport, () => console.log(`API is running on port ${self.apiport}`))
}

module.exports = startAPI
