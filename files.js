const fs = require('fs')
const path = require('path')

const getSCPFiles = async (self) => {
    return fs.readdirSync(self.scpfolder).filter(file => {
        const filePath = path.join(self.scpfolder, file)
        return !file.endsWith(".part")
            && !file.startsWith(".")
            && fs.existsSync(filePath)
            && fs.statSync(filePath).isFile()
    })
}

module.exports = getSCPFiles
