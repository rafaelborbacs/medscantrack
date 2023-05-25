const path = require('path')
const fs = require('fs')
const request = require('request')

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const mirrorGET = async () => new Promise((resolve, reject) => {
    request({
        url: `${process.self.httpmirror}/get`,
        json: true,
        headers: { "authorization": authorization, "name": process.self.name }
    }, (error, response, body) => {
        if(error)
            console.log(`httpmirror error on GET: ${error}`)
        resolve(body)
    })
})

const mirrorSELF = async (conn) => new Promise((resolve, reject) => {
    request({
        url: `http://127.0.0.1:${process.self.apiport}${conn.req.baseUrl}`,
        method: conn.req.method,
        json: true,
        body: conn.req.body,
        headers: conn.req.headers
    }, (error, response, body) => {
        if(error)
            console.log(`httpmirror error on SELF: ${error}`)
        resolve(body)
    })
})

const mirrorPUT = async (conn, body) => new Promise((resolve, reject) => {
    request({
        url: `${process.self.httpmirror}/put`,
        json: true,
        headers: { "authorization": authorization, "name": process.self.name, uuid: conn.uuid },
        method: 'PUT',
        json: true,
        body
    }, (error, response, body) => {
        if(error)
            console.log(`httpmirror error on PUT: ${error}`)
        resolve()
    })
})

const startHTTPMirror = () => {
    while(true){
        await sleep(1000)
        const conn = await mirrorGET()
        console.log('(1): ' + conn)
        if(conn){
            const body = await mirrorSELF(conn)
            console.log('(2): ' + body)
            const conn = await mirrorPUT(conn, body)
            console.log('(3): ' + conn)
        }
    }
}

req = JSON.parse(data)
const { authorization } = req.headers


module.exports = { startHTTPMirror }
