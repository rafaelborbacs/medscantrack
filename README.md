# medscantrack

## Prerequisites

- Docker LTS or 20.10
- docker-compose LTS or 2.15
- git

## Repository

git clone https://github.com/rafaelborbacs/medscantrack.git

## Configuration

If you wish, you can modify the setup variables in the environment file `.env`. However, you can also set them later:

aetitle=[YOUR_NETWORK_SECURITY_KEY_UP_TO_16_CHARS]
name=[NAME_OF_THIS_NODE]
httpmirror=[URL_FOR_THE_MIRROR_SERVER_IF_NEEDED_BLANK_OTHERWISE]

Additionally, you may have to change some build variables in the `docker-compose.yml` file:

- Port mapping: if you want to use ports other than 6000 for the SCP and 8080 for the API, update the port mapping section as follows:

    ports:
      - [DESIRED_API_PORT]:8080
      - [DESIRED_SCP_PORT]:6000

- Volume mapping: if you want to persist data and metadata, add a volume mapping as shown below:

    volumes:
      - [/path/to/scp/folder/on/your/host]:/scp
      - [/path/to/db/folder/on/your/host]:/db

## Build and start

cd medscantrack
docker-compose up --build

## Rest API endpoints
