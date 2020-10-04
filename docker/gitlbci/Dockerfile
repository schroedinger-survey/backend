FROM ubuntu:20.04

RUN apt-get update && apt-get install wget build-essential gcc make -y

RUN DEBIAN_FRONTEND="noninteractive" apt-get -y install tzdata

RUN apt-get install default-jdk -y

RUN apt-get install openjdk-8-jre -y

RUN apt-get update

RUN wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -

RUN apt-get install apt-transport-https -y

RUN echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-6.x.list

RUN apt-get update

RUN apt-get install elasticsearch -y

RUN apt-get install nodejs -y

RUN apt-get install npm -y

RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ focal"-pgdg main | tee /etc/apt/sources.list.d/pgdg.list

RUN apt-get update

RUN apt-get install postgresql-11 -y

USER postgres

RUN /etc/init.d/postgresql start && psql --command "ALTER USER postgres WITH PASSWORD 'postgres';" && psql --command "CREATE DATABASE schroedinger;"

USER root

RUN apt-get install -y git

RUN apt-get install -y make

RUN apt-get install -y postgresql-server-dev-11

RUN apt-get install -y gcc

RUN apt-get install -y libcurl4-gnutls-dev

RUN apt-get install -y libz-dev

WORKDIR /app

RUN git clone https://github.com/zombodb/zombodb.git --depth=1

RUN cd /app/zombodb && make install

RUN echo "zdb.default_elasticsearch_url = 'http://localhost:9200/'" | tee -a /etc/postgresql/11/main/postgresql.conf
