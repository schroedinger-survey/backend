FROM dpage/pgadmin4

USER root

RUN apk --no-cache add curl

USER pgadmin

EXPOSE 443 80

ENTRYPOINT ["/entrypoint.sh"]