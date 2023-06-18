const killPort = require('kill-port')
const express = require('express')
const fs = require('fs')
const nodes = require('./nodes.js')
const files = require('./files.js')
const { getSCPFiles } = require('./scpfiles.js')
const { startSCP, stopSCP, cleanSCP } = require('./scp.js')
const { reconfig, getConfig } = require('./configs.js')
const { onNotify } = require('./scpmirror.js')

const filter = (req, res, handler) => {
    if(req && req.headers['authorization'] === `Bearer ${process.self.aetitle}`)
        return handler(req, res)
    return res.status(401).send({msg:'access denied'})
}

const scpfiles = async (req, res) => res.json(getSCPFiles())

const startAPI = () => {
    killPort(process.self.apiport)
    .then(() => {})
    .catch(err => {})
    .finally(() => {
        const api = express()
        api.use(express.json({limit: '16mb'}))
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
        api.post('/stopscp', (req, res) => filter(req, res, stopSCP))
        api.post('/startscp', (req, res) => filter(req, res, startSCP))
        api.delete('/cleanscp', (req, res) => filter(req, res, cleanSCP))
        api.get('/config', (req, res) => filter(req, res, getConfig))
        api.put('/config', (req, res) => filter(req, res, reconfig))
        api.post('/notify', (req, res) => filter(req, res, onNotify))
        api.listen(process.self.apiport, () => console.log(`API is running on port ${process.self.apiport}`))
    })
}

module.exports = { startAPI }
