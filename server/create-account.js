const bcrypt = require('bcrypt')
const saltRounds = 10

const hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                reject(err)
            } else {
                resolve(hash)
            }
        })
    })
}

const main = async () => {
    const args = process.argv.slice(2);
    const username = args[0]
    const password = args[1]
    const groups = args[2]
    const hashedPassword = await hashPassword(password)

    const account = {
        hashedPassword: hashedPassword,
        groups: groups.split(',')
    }
    console.log(`"${username}": ${JSON.stringify(account, null, 4)},`)
}

main()
