FROM mhart/alpine-node:6
WORKDIR /epub
ADD src /epub
CMD ["node", "epub.js"]
EXPOSE 80
LABEL org.freenas.interactive="false"                                         \
      org.freenas.version="2"                                                 \
      org.freenas.upgradeable="false"                                         \
      org.freenas.expose-ports-at-host="true"                                 \
      org.freenas.autostart="true"                                            \
      org.freenas.port-mappings="80:80/tcp"                                   \
      org.freenas.volumes="[						                          \
          {								                                      \
              \"name\": \"/fonts/\",                    				      \
              \"descr\": \"fonts cache\"		                              \
          }]"
