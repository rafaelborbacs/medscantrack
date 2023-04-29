const Db = require('tingodb')().Db

let db = null

const startDB = async () => {
    db = new Db(process.self.dbfolder, {})
    db.collection('file').ensureIndex({name: 1}, (err, indexName) => console.log(`Index created: ${indexName}`))
    console.log(`DB is running embedded`)
}

const insert = async (collection, obj) => {
    return new Promise((resolve, reject) => {
        db.collection(collection).insert([obj], (error, result) => {
            if(error) reject(error)
            else resolve(result)
        })
    })
}

const find = async (collection, query, projection) => {
    return new Promise((resolve, reject) => {
        db.collection(collection).find(query, projection).toArray((error, results) => {
            if(error) reject(error)
            else resolve(results)
        })
    })
}

const remove = async (collection, query) => {
    return new Promise((resolve, reject) => {
        db.collection(collection).remove(query, (error, result) => {
            if(error) reject(error)
            else resolve(result)
        })
    })
}

module.exports = { startDB, insert, find, remove }
