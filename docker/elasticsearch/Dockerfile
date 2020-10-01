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