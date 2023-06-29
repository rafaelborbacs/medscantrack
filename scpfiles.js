const fs = require('fs')
const path = require('path')

const getSCPFiles = (checkUse) => new Promise(resolve => {
    fs.readdir(process.self.scpfolder, (err, files) => {
        resolve(
            files.filter(async file => {
                if(file.endsWith(".part") || file.endsWith(".tmp") || file.startsWith("."))
                    return false
                const filePath = path.join(process.self.scpfolder, file)
                const stats = await new Promise(resolve => fs.stat(filePath, (err, stat) => resolve(stat)))
                return stats && stats.isFile() && (!checkUse || (Date.now() - stats.atimeMs) > 5000)
            })
        )
    })
})

module.exports = { getSCPFiles }
