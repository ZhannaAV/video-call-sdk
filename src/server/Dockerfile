FROM node:18

RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  make \
  g++ \
  bash \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./

RUN npm install

COPY server.js ./

EXPOSE 3000

CMD ["npm", "start"]
