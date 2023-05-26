const request = require('request')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const mirrorGET = () => {
    request({
        url: `${process.self.httpmirror}/get`,
        json: true,
        timeout: 30000,
        headers: { "authorization": `Bearer ${process.self.aetitle}`, "name": process.self.name }
    }, (error, response, body) => {
        if(error)
            console.log('httpmirror error on GET:', error)
        else if(body)
            mirrorSELF(body)
    })
}

const mirrorSELF = (req) => {
    request({
        url: `http://127.0.0.1:${process.self.apiport}${req.url}`,
        method: req.method,
        json: true,
        timeout: 20000,
        body: req.body,
        headers: req.headers
    }, (error, response, body) => {
        if(error)
            console.log('httpmirror error on SELF:', error)
        else if(body)
            mirrorPUT(req, {body, status: response.statusCode})
    })
}

const mirrorPUT = (req, body) => {
    request({
        url: `${process.self.httpmirror}/put`,
        json: true,
        timeout: 60000,
        headers: req.headers,
        method: 'PUT',
        json: true,
        body
    }, (error, response, body) => {
        if(error)
            console.log('httpmirror error on PUT:', error)
    })
}

const startHTTPMirror = async () => {
    while(true){
        await sleep(2000)
        if(process.self.httpmirror)
            mirrorGET()
    }
}

module.exports = { startHTTPMirror }
