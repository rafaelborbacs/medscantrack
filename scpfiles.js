const fs = require('fs')
const path = require('path')

const getSCPFiles = (checkUse) => new Promise(resolve => {
    const filtered = []
    const calls = new Set()
    fs.readdir(process.self.scpfolder, (err, files) => {
        files.forEach(file => {
            if(!file.endsWith('.part') && !file.endsWith('.tmp') && !file.startsWith('.')){
                const filePath = path.join(process.self.scpfolder, file)
                calls.add(file)
                fs.stat(filePath, (err, stats) => {
                    if(!err && stats && stats.isFile() && (!checkUse || (Date.now() - stats.atimeMs) > 5000))
                        filtered.push(file)
                    calls.delete(file)
                    if(calls.size === 0)
                        resolve(filtered)
                })
            }
        })
        if(calls.size === 0)
            resolve(filtered)
    })
})

module.exports = { getSCPFiles }
