FROM alpine

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /home

RUN apt-get update && apt-get install -y --no-install-recommends \
	sudo\
    git\
    curl\
    screen\
    wget\
    software-properties-commo\
    apt-transport-https\
    ca-certificates\
    lsb-release\
    unzip\
    default-jdk\
    dcmtk\
    && \
apt-get clean

#node + npm
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

RUN mkdir /db
RUN mkdir /scp
RUN mkdir ./medscantrack
COPY ./* ./medscantrack
WORKDIR /home/medscantrack
RUN npm install
RUN unzip ./dcm4chee.zip

#RUN chmod +x ./scdeinit.sh
#ENTRYPOINT ["./scdeinit.sh"]

EXPOSE 8080
EXPOSE 6000
