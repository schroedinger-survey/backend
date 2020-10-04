FROM postgres:11.9

RUN apt-get update

RUN apt-get install -y git

RUN apt-get install -y make

RUN apt-get install -y postgresql-server-dev-11

RUN apt-get install -y gcc

RUN apt-get install -y libcurl4-gnutls-dev

RUN apt-get install -y libz-dev

RUN git clone https://github.com/schroedinger-survey/zombodb.git --depth=1

WORKDIR zombodb

RUN make install

CMD ["postgres"]