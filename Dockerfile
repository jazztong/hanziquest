# A plain Node server, not an edge bundle.
#
# The app writes to disk at runtime - the SQLite database, uploaded 课文, and
# the child's voice recordings all live under ./data - and it reads the lexicon
# from disk on boot. That rules out Workers-style hosting, which has no
# filesystem, and makes a normal container the simplest correct target.
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
# tsx and the scripts stay in the image on purpose: the container runs the
# schema setup itself on boot, so a fresh volume becomes a working database
# without anyone having to shell in.
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npm run db:setup && npx next start -p 3000 -H 0.0.0.0"]
