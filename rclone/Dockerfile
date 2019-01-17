FROM tynor88/rclone:1.40

LABEL org.freenas.interactive="false"			\
      org.freenas.version="1.0.0" 			\
      org.freenas.upgradeable="true" 			\
      org.freenas.autostart="true" 			\
      org.freenas.volumes="[				\
          {						\
              \"name\": \"/config\",			\
              \"descr\": \"config dir\"	\
          }, \
          {						\
              \"name\": \"/data\",			\
              \"descr\": \"data dir\"	\
          }				\
      ]" \
      org.freenas.settings="[ 					      \
          {							                  \
              \"env\": \"SYNC_DESTINATION\",					      \
              \"descr\": \" The destination that the data should be backed up to (must be the same name as specified in .rclone.conf)\",		      \
              \"optional\": false				            \
          },							            \
          {							                  \
              \"env\": \"SYNC_DESTINATION_SUBPATH \",			            \
              \"descr\": \"If the data should be backed up to a subpath on the destionation (will automaticly be created if it does not exist)\",	                  \
              \"optional\": true				            \
          },							            \
          {							                  \
              \"env\": \"RCLONE_CONFIG_PASS\",			      \
              \"descr\": \"If the rclone.conf is encrypted, specify the password here\",			            \
              \"optional\": true				            \
          },							            \
          {							                  \
              \"env\": \"CRON_SCHEDULE\",				\
              \"descr\": \"A custom cron schedule which will override the default value of: 0 (hourly)\",			            \
              \"optional\": true				            \
          },							            \
          {							                  \
              \"env\": \"SYNC_COMMAND\",				\
              \"descr\": \"A custom rclone command which will override the default value of: rclone sync /data $SYNC_DESTINATION:/$SYNC_DESTINATION_SUBPATH\",			            \
              \"optional\": true				            \
          } \
       ]"
          
