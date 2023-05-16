const WebSocket = require('ws')
const request = require('request')

let ws = null
const startWS = () => {
    if(process.self.wsmirror && !ws){
        ws = new WebSocket(process.self.wsmirror)
        ws.on('open', () => {
            console.log('WS client connected')
            ws.send(JSON.stringify({
                event: 'register',
                authorization:  `Bearer ${process.self.aetitle}`,
                name: process.self.name
            }))
            ws.on('message', req => {
                req = JSON.parse(req)
                const { authorization } = req.headers
                const options = {
                    url: `http://127.0.0.1:${process.self.apiport}${req.url}`,
                    timeout: 10000,
                    method: req.method,
                    json: true,
                    body: req.body,
                    headers: { "authorization": authorization, "name": process.self.name }
                }
                request(options, (error, response, body) => {
                    ws.send(JSON.stringify({
                        event: 'response',
                        uuid: req.uuid,
                        status: error ? 404 : response.statusCode,
                        body: error ? error : body
                    }))
                })
            })
            ws.on('close', () => {
                console.error('WS closed')
                restartWS()
            })
        })
        ws.on('error', err => {
            console.error(`WS error: ${err}`)
            restartWS()
        })
    }
}

const restartWS = () => {
    console.error('Attempting to restart WS in 30 sec')
    try {
        if(ws && ws.readyState === ws.OPEN)
            ws.close()
        ws = null
    } catch(err){}
    setTimeout(() => startWS(), 30000)
}

module.exports = { startWS }
