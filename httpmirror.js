const request = require('request')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const mirrorGET = async () => new Promise((resolve, reject) => {
    request({
        url: `${process.self.httpmirror}/get`,
        json: true,
        timeout: 10000,
        headers: { "authorization": `Bearer ${process.self.aetitle}`, "name": process.self.name }
    }, (error, response, body) => {
        if(error){
            console.log(`httpmirror error on GET: ${error}`)
            return resolve(false)
        }
        resolve(body)
    })
})

const mirrorSELF = async (req) => new Promise((resolve, reject) => {
    request({
        url: `http://127.0.0.1:${process.self.apiport}${req.url}`,
        method: req.method,
        json: true,
        body: req.body,
        headers: req.headers
    }, (error, response, body) => {
        if(error){
            console.log('httpmirror error on SELF:', error)
            return resolve(false)
        }
        resolve({body, status: response.statusCode})
    })
})

const mirrorPUT = async (req, body) => new Promise((resolve, reject) => {
    request({
        url: `${process.self.httpmirror}/put`,
        json: true,
        headers: req.headers,
        method: 'PUT',
        json: true,
        body
    }, (error, response, body) => {
        if(error)
            console.log(`httpmirror error on PUT: ${error}`)
        resolve()
    })
})

const startHTTPMirror = async () => {
    while(true){
        await sleep(1000)
        if(process.self.httpmirror){
            const req = await mirrorGET()
            if(req){
                const response = await mirrorSELF(req)
                if(response)
                    await mirrorPUT(req, response)
            }
        }
    }
}

module.exports = { startHTTPMirror }
