FROM node:16
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"] 
RUN npm install
COPY ["dist", "dist"]
COPY ["public", "public"]
EXPOSE 3000
CMD [ "npm", "run", "run-server" ]
# CMD ["node", "dist/app.js"]