#!/bin/bash
if [ ! -f ${OPENVPN:-}/openvpn.conf ]; then
    /usr/local/bin/ovpn_genconfig -u udp://${SERVER_NAME}
fi

source "${OPENVPN}/ovpn_env.sh"
if [ ! -d ${EASYRSA_PKI} ]; then
    echo "FreeNAS\n" | /usr/local/bin/ovpn_initpki nopass
fi

CLIENT_COUNT=$(( ${CLIENT_CONFIG_COUNT} > 1 ? ${CLIENT_CONFIG_COUNT} : 1 ))
CLIENTS_DIR="${OPENVPN}/clients"
[ -d ${CLIENTS_DIR} ] || mkdir -p ${CLIENTS_DIR}

for (( c=1; c<=${CLIENT_COUNT}; c++ )); do
    CLIENT_NAME="client${c}"
    CLIENT_FILE="${CLIENTS_DIR}/${CLIENT_NAME}.ovpn"
    if [ -f ${CLIENT_FILE} ]; then
        continue
    fi

    /usr/local/bin/easyrsa build-client-full ${CLIENT_NAME} nopass
    /usr/local/bin/ovpn_getclient ${CLIENT_NAME} > ${CLIENT_FILE}
    echo "dhcp-option DNS 192.168.255.1" >> ${CLIENT_FILE}
    echo "dhcp-option DNS 8.8.8.8" >> ${CLIENT_FILE}
done

/usr/local/bin/ovpn_run
