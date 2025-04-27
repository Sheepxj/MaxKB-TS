FROM docker.xuanyuan.me/library/python:3.11.10

WORKDIR /app

# 安装 Node.js 16 的依赖
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

COPY . /app

RUN pip install poetry

RUN poetry config virtualenvs.create false

RUN poetry install

EXPOSE 3000

