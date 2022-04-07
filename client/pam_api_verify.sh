#!/usr/bin/env bash
# /usr/sbin/pam_api_verify
# chmod 0755 /usr/sbin/pam_api_verify
# requires curl and qj
# $ sudo apt install curl jq

# add this to /etc/pam.d/common-auth, before `auth    [success=1 default=ignore]      pam_unix.so nullok_secure`
# auth sufficient pam_exec.so expose_authtok debug log=/tmp/debug.log /usr/sbin/pam_api_verify

PAM_PASSWORD=`cat -`
URL="http://localhost:3000/auth/login/"
AUTH_TOKEN="secret-auth-token"
JSON_INPUT=$( jq -n -c \
    --arg username "$PAM_USER" \
    --arg password "$PAM_PASSWORD" \
    '{username: $username, password: $password}' )
JSON_RESULT=`curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Basic $AUTH_TOKEN" -m 5 --connect-timeout 10 -d ${JSON_INPUT} ${URL}`
OAUTH_TOKEN=`echo $JSON_RESULT | jq -r '."accessToken"'`
RAW_SCOPES=`echo $JSON_RESULT | jq -r '."scope"'`
OAUTH_ERROR=`echo $JSON_RESULT | jq -r '."error"'`
SCOPES=${RAW_SCOPES// /,}
if [[ "${PAM_TYPE}" == "auth" ]]; then
    if [[ $OAUTH_ERROR == "null" && $OAUTH_TOKEN != "" && $OAUTH_TOKEN != "null" ]]; then
        if [[ "${PAM_TYPE}" == "auth" ]] && [ ! -d "/home/${PAM_USER}" ]; then
            useradd -m -s /bin/bash -G ${SCOPES} ${PAM_USER}
        fi
    else
        exit 1
    fi
fi
