const Db = require('tingodb')().Db

let db = null

const startDB = async (self) => {
    db = new Db(self.dbfolder, {})
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

const find = async (collection, query) => {
    return new Promise((resolve, reject) => {
        db.collection(collection).find(query).toArray((error, results) => {
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
