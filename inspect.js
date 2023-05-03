const { exec } = require('child_process')
const chokidar = require('chokidar')
const db = require('./db.js')

const deleteFile = async (file) => new Promise((resolve, reject) => {
    exec(`rm -f ${process.self.scpfolder}/${file}`, (err, stdout, stderr) => resolve())
})

const getMetadicom = async (file) => new Promise((resolve, reject) => {
    exec(`dcmdump +P "0008,0016" +P "0008,0018" +P "0010,0020" +P "0008,0060" +P "0008,0020" ${process.self.scpfolder}/${file}`, (err, stdout, stderr) => {
        if (!err){
            try {
                const metadicom = {}
                const arr = stdout.split("\n").map(line => line.trim().replace(/\s+/g, ' ').replace(/=|\[|\]|\(|\)/g, '').split(" #"))
                for(foreline of arr){
                    const line = foreline[0]
                    const tag = line.substring(0, 9)
                    const value = line.substring(13)
                    if(tag === "0008,0016") metadicom.sopclassuid = value
                    if(tag === "0008,0018") metadicom.sopinstanceuid = value
                    if(tag === "0010,0020") metadicom.patientid = value
                    if(tag === "0008,0060") metadicom.modality = value
                    if(tag === "0008,0020") metadicom.studydate = value
                }
                if(Object.keys(metadicom).length > 0)
                    return resolve(metadicom)
            }
            catch(er){}
        }
        resolve(false)
    })
})

const inspect = async (file) => {
    const dbFiles = await db.find('file', {name: file}, {name: 1, _id: 0})
    if(dbFiles.length === 0){
        console.log(`New file: ${file}`)
        const metadicom = await getMetadicom(file)
        if(metadicom)
            await db.insert('file', {name: file, created: Date.now(), metadicom})
        else {
            console.error(`Erasing corrupted file: ${file}`)
            await deleteFile(file)
        }
    }
}

const startInspect = async () => {
    const watcher = chokidar.watch(process.self.scpfolder, {
        ignored: [
            /[\/\\]\./, // dotfiles
            /\.tmp$/, // temp
            /(^|[/\\])\../, // starting with a dot
            /\/$/, // dir
        ],
        persistent: true
    })
    watcher.on('add', (filePath) => inspect(filePath.split('/').pop()))
    watcher.on('error', (err) => console.error('Error watching directory'))
}

module.exports = startInspect
