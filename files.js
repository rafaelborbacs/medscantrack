const fs = require('fs')
const path = require('path')

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)

const getSCPFiles = async (self) => {
    return shuffle(
        fs.readdirSync(self.scpfolder).filter(file => {
            const filePath = path.join(self.scpfolder, file)
            return !file.endsWith(".part")
                && !file.startsWith(".")
                && fs.existsSync(filePath)
                && fs.statSync(filePath).isFile()
        })
    )
}

module.exports = getSCPFiles
