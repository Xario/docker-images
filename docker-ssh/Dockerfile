FROM docker:17.03.1
RUN apk add --no-cache openssh
RUN echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
RUN echo "PermitUserEnvironment yes" >> /etc/ssh/sshd_config
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p /root/.ssh
ENV DOCKER_HOST tcp://freenas:2375
EXPOSE 22
LABEL org.freenas.interactive="false"			\
      org.freenas.version="1.0.0" 			\
      org.freenas.upgradeable="true" 			\
      org.freenas.autostart="true" 			\
      org.freenas.bridged="true" 			\
      org.freenas.port-mappings="22:22/tcp" 					\
      org.freenas.volumes="[				\
          {						\
              \"name\": \"/docker.pub\",			\
              \"descr\": \"docker public ssh key\"	\
          }				\
      ]"						\
      org.freenas.settings="[ 				\
          {						\
              \"env\": \"DOCKER_HOST\",		\
              \"descr\": \"The hostname of your freenas server (default: tcp://freenas:2375)\",	\
              \"optional\": false			\
          } 						\
      ]"
