FROM funkygibbon/nginx-pagespeed
LABEL org.freenas.interactive="false"                                           \
      org.freenas.version="2"                                                   \
      org.freenas.upgradeable="false"                                           \
      org.freenas.expose-ports-at-host="true"                                   \
      org.freenas.autostart="true"                                              \
      org.freenas.port-mappings="80:8080/tcp,443:8081/tcp"                      \
      org.freenas.volumes="[						                            \
          {								                                        \
              \"name\": \"/app/www\",				                            \
              \"descr\": \"html content\"		                                \
          },                                                                    \
          {								                                        \
              \"name\": \"/etc/nginx/sites-enabled/\",				            \
              \"descr\": \"nginx config\"		                                \
          }                                                                     \
      ]"                                                                        \
      org.freenas.settings="[                                                   \
          {                                                                     \
              \"env\": \"UPLOAD_MAX_SIZE\",                                     \
              \"descr\": \"Upload max size (default 30M)\",                     \
              \"optional\": true                                                \
          }                                                                     \
      ]"
