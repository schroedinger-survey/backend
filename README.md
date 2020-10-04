
<h1 align="center">:construction: :construction: Schroedinger Survey :construction: :construction:</h1>

<p align="center">
  <img alt="schroedinger-survey" src="./docs/logo.png" width="100" />
</p>

<p align="center">
  <img src="https://gitlab.com/Schroedinger1/backend/badges/master/pipeline.svg"/>
  <img src="https://gitlab.com/Schroedinger1/backend/badges/master/coverage.svg"/>
  <img src="https://app.codacy.com/project/badge/Grade/e495a6f3cc7a444a8b31f76489732126"/>
  <img src="https://img.shields.io/badge/Node.js-14-blue?logo=node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-11-green?logo=postgresql"/>
  <img src="https://img.shields.io/badge/Ubuntu-20.04-red?logo=ubuntu"/>
  <img src="https://img.shields.io/badge/AWS-S3-blueviolet?logo=amazon-aws"/>
  <img src="https://img.shields.io/badge/Elasticsearch-6-blue?logo=elasticsearch"/>
  <img src="https://img.shields.io/badge/RabbitMQ-3-orange?logo=rabbitmq"/>
</p>

<p align="center">
  Schroeding Survey is a web application that allows users to create flexible survey. Market research, studying investigation 
  and product pivoting easy made.
</p>

<p align="center">
  <a href="https://schroedinger-survey.de/" target="_blank">Homepage</a>
  |
  <a href="https://gitlab.com/groups/schroedinger-survey/-/milestones" target="_blank">Road Map</a>
  |
  <a href="https://schroedinger-survey.de/api/v1/">REST API documentation</a>
  |
  <a href="https://schroedinger-survey.de/api/v2/">Socket.io documentation</a>
  |
  <a href="https://gitlab.com/groups/schroedinger-survey/-/issues">Report bugs</a>
  |
  <a href="https://gitlab.com/schroedinger-survey/backend">Backend repository</a>
  |
  <a href="https://gitlab.com/schroedinger-survey/frontend">Frontend repository</a>
</p>

### Prerequisites
- Linux Ubuntu 20.04
- Postgresql 11.9
- Elasticsearch 6.8.12
- RabbitMQ 3.8.8
- [ZomboDB](https://github.com/schroedinger-survey/zombodb)
- Node.js 14

### Develop and build

Clone the repository, install the dependencies and start the hosting server with:

```
docker-compose up -d --build
```

### License

Copyright 2020 Schroedinger Survey - MIT License