const request = require('request')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const mirrorGET = () => {
    request({
        url: `${process.self.httpmirror}/get`,
        json: true,
        headers: { "authorization": `Bearer ${process.self.aetitle}`, "name": process.self.name }
    }, (error, response, body) => {
        if(error)
            console.log('httpmirror error on GET:', error)
        else if(body)
            mirrorSELF(body)
    })
}

const mirrorSELF = (req) => {
    const url = `http://127.0.0.1:${process.self.apiport}${req.url}`
    console.log(`Mirror SELF -> ${url}`)
    request({
        url,
        method: req.method,
        json: true,
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
    console.log(`Mirror PUT`)
    request({
        url: `${process.self.httpmirror}/put`,
        json: true,
        headers: req.headers,
        method: 'PUT',
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
