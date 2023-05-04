const fs = require('fs')
const path = require('path')

const getSCPFiles = (checkUse) => {
    return fs.readdirSync(process.self.scpfolder).filter(file => {
        const filePath = path.join(process.self.scpfolder, file)
        if(file.endsWith(".part") || file.endsWith(".tmp") || file.startsWith(".") || !fs.existsSync(filePath))
            return false
        const stats = fs.statSync(filePath)
        return stats && stats.isFile() && (!checkUse || (Date.now() - stats.atimeMs) > 2000)
    })
}

module.exports = getSCPFiles
