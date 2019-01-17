FROM tynor88/rclone:1.40
LABEL org.freenas.interactive="false" 					\
      org.freenas.version="1" 						\
      org.freenas.upgradeable="true" 					\
      org.freenas.expose-ports-at-host="false" 				\
      org.freenas.autostart="true" 					\
      org.freenas.volumes="[						\
          {							\
              \"name\": \"/config\",					\
              \"descr\": \"Config storage space\"				\
          },							\
          {							\
              \"name\": \"/data\",					\
              \"descr\": \"data\"			\
          }							\
      ]" 								\
      org.freenas.settings="[ 					\
          {							\
              \"env\": \"SYNC_DESTINATION\",					\
              \"descr\": \"SYNC_DESTINATION\",			\
              \"optional\": false					\
          },							\
          {							\
              \"env\": \"SYNC_DESTINATION_SUBPATH\",					\
              \"descr\": \"SYNC_DESTINATION_SUBPATH\",					\
              \"optional\": true					\
          },							\
          {							\
              \"env\": \"CRON_SCHEDULE\",					\
              \"descr\": \"CRON_SCHEDULE\",					\
              \"optional\": true					\
          },							\
          {							\
              \"env\": \"SYNC_COMMAND\",					\
              \"descr\": \"SYNC_COMMAND\",					\
              \"optional\": true					\
          },							\
          {							\
              \"env\": \"RCLONE_CONFIG_PASS\",					\
              \"descr\": \"RCLONE_CONFIG_PASS\",					\
              \"optional\": true					\
         }							\
      ]"
