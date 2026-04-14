FROM node:22
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx tsc
EXPOSE 3001
CMD ["node","dist/index.js"]



