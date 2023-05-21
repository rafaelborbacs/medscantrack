const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const { config } = require('./configs.js')

const sendSCPFile = (node, filePath) => new Promise((resolve, reject) => {
    try {
        const form = new FormData()
        form.append('file', fs.createReadStream(filePath))
        const headers = form.getHeaders()
        axios.post(`${node.apiprotocol}://${node.host}:${node.apiport}/mirrorscp`, form, {
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": `Bearer ${process.self.aetitle}`,
                "name": node.name,
                ...headers
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        })
        .then(response => {
            console.log(`Mirror SCP file sent`)
            resolve(true)
        })
        .catch(error => {
            console.error(`Mirror file transfering error: ${error}`)
            resolve(false)
        })    
    } catch (error) {
        console.error(`Mirror SCP sending file error: ${error}`)
        resolve(false)
    }
})

module.exports = { sendSCPFile }

config()
sendSCPFile(
    {apiprotocol:'http', host:'127.0.0.1', apiport: '8383', name: 'LOCAL'},
    'C:\\temp\\input.txt'
)
