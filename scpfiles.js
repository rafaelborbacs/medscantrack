const fs = require('fs')
const path = require('path')

const getSCPFiles = (checkUse) => new Promise(resolve => {
    fs.readdir(process.self.scpfolder, (err, files) => {
        resolve(
            files.filter(file => {
                if(!file.endsWith('.part') && !file.endsWith('.tmp') && !file.startsWith('.')){
                    const filePath = path.join(process.self.scpfolder, file)
                    const stats = fs.statSync(filePath)
                    return stats && stats.isFile() && (!checkUse || (Date.now() - stats.atimeMs) > 5000)
                }
            })
        )
    })
})

module.exports = { getSCPFiles }
