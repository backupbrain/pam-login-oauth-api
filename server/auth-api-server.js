const express = require('express')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())

/** Edit these lines **/
const port = 3000

const authTokens = [
    'secret-auth-token'
]

const accounts = {
    'debian': {
        'hashedPassword': '$2b$10$uTxdUaFEIPQEfnESNgmFx.De3lL2Oor9NAQ0oXpgGgdbLeLtcBh0i',
        'groups': [
            'sudo',
            'users'
        ]
    },
}
/** End of Editing **/

// TODO: build admin dashboand to manage users and auth tokens
// TODO: set up to support multiple domains or service providers
// TODO: connect to a database
// TODO: log login attempts in database
// TODO: add a timeout on login failures, status = 429

// expected input:
// '{"username": "test", "password": "test"}'
// expected return
// '{"accessToken": "tBxKIhN", "tokenType": "Bearer", "scope": "sudo users"}'

const verifyPassword = (password, hashedPassword) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hashedPassword, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

const generateOauthToken = (length=7) => {
    let result  = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength))
   }
   return result
}

app.post('/auth/login/', async (req, res) => {
    const authorizationHeader = req.headers['authorization']
    let authTokenValid = false
    if (authorizationHeader && authorizationHeader.length > "Basic ".length) {
        const authToken = authorizationHeader.substring("Basic ".length)
        if (authTokens.includes(authToken)) {
            authTokenValid = true
        }
    } else {
        authTokenValid = false
    }
    if (!authTokenValid) {
        console.log('Invalid auth token')
        res.status(403)
        res.send({
            error: 'unauthorized',
            error_description: 'Invalid auth token.'
        })
        return
    }
    const jsonBody = req.body

    const username = jsonBody.username
    const password = jsonBody.password
    if (!username) {
        console.log('no username')
        res.status(400)
        res.send({
            error: 'invalid_parameter',
            error_description: 'Missing "username" must be a string'
        })
        return
    }
    if (!password) {
        console.log('no password')
        res.status(400)
        res.send({
            error: 'invalid_parameter',
            errorDescription: 'Missing "password" must be a string'
        })
        return
    }
    const account = accounts[username]
    if (!account) {
        console.log('no account')
        res.status(401)
        res.send({
            error: 'access_denied',
            errorDescription: 'Access denied.'
        })
        return
    }
    try {
        const doPasswordsMatch = await verifyPassword(password, account.hashedPassword)
        if (!doPasswordsMatch) {
            console.log('password mismatch')
            res.status(401)
            res.send({
                error: 'access_denied',
                errorDescription: 'Access denied.'
            })
            return
        }
    } catch (error) {
        res.status(500)
        res.send({
            error: 'internal_error',
            errorDescription: error.toString()
        })
        return
    }
    const oauthToken = generateOauthToken()
    const output = {
        accessToken: oauthToken,
        tokenType: 'Bearer',
        // expires_in: time_duration_until_token_expires,
        scope: account.groups.join(' ')
    }
    res.send(output)
})


app.listen(port, () => {
    console.log(`Auth API server listening on port ${port}`)
})

/*
const server = http.createServer((req, res) => {
    let data = ''
    req.on('data', (chunk) => {
        data += chunk
    })
    req.on('end', () => {
        console.log(data.toString())
    })
})

server.listen(port)
console.log(`Auth API server listening on port ${port}`)
/* */