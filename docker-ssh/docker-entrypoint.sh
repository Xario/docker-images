#!/bin/sh
set -e

# first arg is `-f` or `--some-option`
if [ "${1#-}" != "$1" ]; then
	set -- docker "$@"
fi

# if our command is a valid Docker subcommand, let's invoke it through Docker instead
# (this allows for "docker run docker ps", etc)
if docker help "$1" > /dev/null 2>&1; then
	set -- docker "$@"
fi

# if we have "--link some-docker:docker" and not DOCKER_HOST, let's set DOCKER_HOST automatically
if [ -z "$DOCKER_HOST" -a "$DOCKER_PORT_2375_TCP" ]; then
	export DOCKER_HOST='tcp://docker:2375'
fi

echo "PATH=${PATH}" > /root/.ssh/environment

[ -f /etc/ssh/ssh_host_rsa_key ] || ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -q -N ""
[ -f /etc/ssh/ssh_host_dsa_key ] || ssh-keygen -t dsa -f /etc/ssh/ssh_host_dsa_key  -q -N ""
[ -f /etc/ssh/ssh_host_ecdsa_key ] || ssh-keygen -t ecdsa -f /etc/ssh/ssh_host_ecdsa_key  -q -N ""
[ -f /docker.pub ] && cp /docker.pub /root/.ssh/authorized_keys

exec /usr/sbin/sshd -D &>/dev/null
