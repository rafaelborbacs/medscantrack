const WebSocket = require('ws')
const path = require('path')
const fs = require('fs')
const request = require('request')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

let ws = null
const connectWS = () => {
    console.log('Attempting to connect WS')
    try {
        ws = new WebSocket(process.self.wsmirror)
        ws.on('open', () => {
            console.log('WS connected')
            ws.send(JSON.stringify({
                event: 'register',
                authorization:  `Bearer ${process.self.aetitle}`,
                name: process.self.name
            }))
            const tempFilePath = path.join(process.self.scpfolder, 'mirror', 'mirror.zip')
            let fileStream = null
            ws.on('message', (data, isBinary) => {
                if(data == '<EOF></EOF>'){
                    if(fileStream !== null)
                        fileStream.end()
                    console.log(`WS SCP mirror -> file received`)
                    fileStream = null
                }
                else if(isBinary){
                    if(fileStream == null){
                        console.log(`WS SCP mirror -> receiving new file`)
                        fileStream = fs.createWriteStream(tempFilePath)
                    }
                    fileStream.write(data)
                }
                else {
                    req = JSON.parse(data)
                    const { authorization } = req.headers
                    request({
                        url: `http://127.0.0.1:${process.self.apiport}${req.url}`,
                        method: req.method,
                        json: true,
                        body: req.body,
                        headers: { "authorization": authorization, "name": process.self.name }
                    }, (error, response, body) => {
                        ws.send(JSON.stringify({
                            event: 'response',
                            uuid: req.uuid,
                            status: response && response.statusCode ? response.statusCode : 500,
                            body: {...body, ...error}
                        }))
                    })
                }
            })
            ws.on('close', () => console.error('WS closed'))
        })
        ws.on('error', err => console.error(`WS runtime error: ${err}`))
    }
    catch(err){
        console.error(`WS connecting error: ${err}`)
    }
}

const startWS = async () => {
    while(true){
        if(process.self.wsmirror){
            if(!ws || ws.readyState !== WebSocket.OPEN)
                connectWS()
        }
        else if(ws){
            try { ws.close() } catch(err){}
            ws = null
        }
        await sleep(4000)
    }
}

const restartWS = (req, res) => {
    try { ws.close() } catch(err){}
    ws = null
    res.json({msg: 'WS will restart soon'})
}

const statusWS = (req, res) => {
    if(ws && ws.readyState === WebSocket.OPEN)
        res.json({status: true})
    else
        res.json({status: false})
}

module.exports = { startWS, restartWS, statusWS }
