FROM kylemanna/openvpn:latest
ADD init.sh /init.sh
RUN chmod a+x /init.sh
ADD adblock.sh /adblock.sh
RUN chmod a+x /adblock.sh
RUN apk --no-cache add dnsmasq
RUN apk --no-cache add curl
CMD ["/init.sh"]
LABEL org.freenas.interactive="false"			\
      org.freenas.version="1.0.0" 			\
      org.freenas.upgradeable="true" 			\
      org.freenas.expose-ports-at-host="true" 		\
      org.freenas.autostart="true" 			\
      org.freenas.bridged="true" 			\
      org.freenas.capabilities-add="[\"NET_ADMIN\"]"        \
      org.freenas.port-mappings="1194:1194/udp" 					\
      org.freenas.volumes="[				\
          {						\
              \"name\": \"/etc/openvpn\",			\
              \"descr\": \"Config storage space\"	\
          }				\
      ]"						\
      org.freenas.settings="[ 				\
          {						\
              \"env\": \"SERVER_NAME\",		\
              \"descr\": \"The domain name of the server e.g. example.com\",	\
              \"optional\": false			\
          },						\
           {						\
               \"env\": \"CLIENT_CONFIG_COUNT\",		\
               \"descr\": \"The number of client configs to generate upon initialization (default=1). They will be located in the /config/clients dir.\",	\
               \"optional\": true			\
           },						\
          {						\
              \"env\": \"BLOCK_ADS\",		\
              \"descr\": \"If true, dnsmasq will redirect known adserver DNS requests to the VPN server\",	\
              \"optional\": true			\
          } 						\
      ]"
