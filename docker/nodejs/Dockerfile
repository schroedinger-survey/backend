FROM ubuntu:20.04

RUN apt-get update && apt-get install wget build-essential gcc make -y

RUN DEBIAN_FRONTEND="noninteractive" apt-get -y install tzdata

RUN apt-get install nodejs -y