const { exec } = require('child_process')
const { getSCPFiles } = require('./scpfiles.js')
const db = require('./db.js')

let sleepResolve = null, sleepTimeout = null
const sleep = () => new Promise(resolve => {
    sleepResolve = resolve
    sleepTimeout = setTimeout(resolve, 300000000)
})

const wakeUpInspect = () => {
    sleepResolve()
    clearTimeout(sleepTimeout)
}

const getMetadicom = async (file) => new Promise((resolve, reject) => {
    exec(`dcmdump +P "0008,0016" +P "0008,0018" +P "0010,0020" +P "0008,0060" +P "0008,0020" ${process.self.scpfolder}/${file}`, (err, stdout, stderr) => {
        if(!err){
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

const inspect = async () => {
    const files = await getSCPFiles(true)
    if(files.length > 0){
        const dbFiles = await db.find('file', {name: {$in: files}}, {name: 1, _id: 0})
        const nonDbFiles = files.filter(file => dbFiles.find(dbFile => dbFile.name === file) === undefined)
        if(nonDbFiles.length > 0){
            console.log(`Metadata [${nonDbFiles.length} new files]`)
            for(const file of nonDbFiles){
                const metadicom = await getMetadicom(file)
                if(metadicom){
                    try {
                        await db.insert('file', { name: file, created: Date.now(), metadicom })
                    } catch (err) {}
                }
                else {
                    console.error(`Deleting corrupted file: ${file}`)
                    exec(`rm -f ${process.self.scpfolder}/${file}`, () => {})
                }
            }
            return true
        }
    }
    return false
}

const startInspect = async () => {
    let hasNew = false
    while(true){
        if(!hasNew)
            await sleep()
        console.log(":: inspect ::")
        hasNew = await inspect()
    }
}

module.exports = { startInspect, wakeUpInspect }
