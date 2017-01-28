#!/bin/bash
if [ ! -f ${OPENVPN:-}/openvpn.conf ]; then
    /usr/local/bin/ovpn_genconfig -u udp://${SERVER_NAME}
fi

source "${OPENVPN}/ovpn_env.sh"
if [ ! -f ${EASYRSA_PKI}/ta.key ]; then
    /usr/local/bin/ovpn_initpki nopass
fi

CLIENT_COUNT=$(( ${CLIENT_CONFIG_COUNT} > 1 ? ${CLIENT_CONFIG_COUNT} : 1 ))
CLIENTS_DIR="${OPENVPN}/clients"
[ -d ${CLIENTS_DIR} ] || mkdir -p ${CLIENTS_DIR}

for i in {1..${CLIENT_COUNT}}; do
    CLIENT_NAME="client${i}"
    CLIENT_FILE="${CLIENTS_DIR}/${CLIENT_NAME}.ovpn"
    if [ -f ${CLIENT_FILE} ]; then
        continue
    fi

    /usr/local/bin/easyrsa build-client-full ${CLIENT_NAME} nopass
    /usr/local/bin/ovpn_getclient ${CLIENT_NAME} > ${CLIENT_FILE}
done

/usr/local/bin/ovpn_run
