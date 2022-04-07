# OAuth REST API for PAM

This is an OAUTH REST-API microservice and PAM authentication script that authenticates a server login.

It is currently proof-of-concept only.

## How It Works

It consists of two parts:

1. A REST API
2. A PAM authentication script

The module prioritizes the system authentication. If the user authenticaties through the API, the login will succeed.

| System user | API user | Login through        |
| ----------- | -------- | -------------------- |
| Yes         | Yes      | Login through system |
| Yes         | No       | Login through system |
| No          | Yes      | Login through API    |
| No          | No       | Login fails          |

### REST API

The REST API serves as a basic OAUTh-compatible login API.

The request format looks like this:

**Request:**

```console
HTTP/1.1 POST http://example.com:3000/auth/login/
Content-Type: application/json
Authorization: Bearer <auth-token>

{"username": "<login-username>", "password": "<login-password>"}
```

A successful login response looks like this:

- `accessToken`: A unique string signifying a successful login
- `tokenType`: A string, always "Bearer"
- `scope`: A string, space-separated list signifying the groups the user will be a member of

**Successful Login Response**

```console
HTTP 200 OK
Content-Type: application/json

{"accessToken": "tBxKIhN", "tokenType": "Bearer", "scope": "sudo users"}}
```

A login failed response looks like this:

**Failed Login Response**

```console
HTTP 401 Unauthorized
Content-Type: application/json

{"error": "access_denied", "errorDescription": "Access denied"}}
```

### PAM Aunthentication Script

When configured, the script executes each time a user tries to log into the server.

Native users (those that have an entry in `/etc/passwd` and `/etc/shadow`) will be logged in to the system regardless if the API has a user.

Users that don't have an entry on the system, but are able to log in through the API will be created on the local system, added to the `scope` groups, and a home folder will be created.

It uses `pam_exec` to execute a shell scirpt which verifies login credentials through the REST API.

## Set Up

### Configuring the Server

Install required modules:

```console
$ npm install
```

Make sure to set the port, add users and auth tokens.

- `port`: the HTTP port the API will run on
- `authTokens`: an array of Authorization tokens used to verify the API client
- `accounts`: a dictionary of objects that define the users that will have login access to the servers

To edit the accounts, you'll need to generate password hashes. The output will be in the format of an accounts dictionary entry.

```console
$ npm createuser <username> <password> <comma separated groups>
```

For example, the `debian` user with the password `password` and access to the groups `sudo`, and `users`

```console
$ npm run createuser debian password sudo,users

"debian": {
    "hashedPassword": "$2b$10$uTxdUaFEIPQEfnESNgmFx.De3lL2Oor9NAQ0oXpgGgdbLeLtcBh0i",
    "groups": [
        "sudo",
        "users"
    ]
},
```

This line can be added into the `accounts` dictionary.

Then run the server:

```
$ node server/auth-api-server.js
# or
$ npm run server
```

This service can be run behind an NGiNX reverse proxy.

### Installing the Script

Install required programs, for example on Debian:

```console
$ sudo apt install -y curl jq
```

Make sure to change the following settings in the script:

- `URL`: the API URL, including the `/auth/login/` endpoint
- `AUTH_TOKEN`: An authentication token from the server's `authTokens` array

The script must be copied to `/usr/sbin/pam_api_verify.sh` and made executable:

```console
$ sudo cp client/pam_api_verify.sh /usr/sbin/pam_api_verify
$ sudo chmod 0755 /usr/sbin/pam_api_veri
```

The following line must also be added to beginning of `/etc/pam.d/common-auth`:

```console
auth sufficient pam_exec.so expose_authtok debug log=/tmp/debug.log /usr/sbin/pam_api_verify
```

## Known limitations

At this time, this system doesn't support a database or administrative dashboard.

It does not support multiple domains or service providers

It does not have a way to log login attempts, nor does it provide a way to create timeouts or rate-limiting that prevent brute-force attacks on logins.

Right now the `pam_api_verify.sh` script doesn't handle special characters very well, including `$`, `%`, `%`, `'`, and `"`.
