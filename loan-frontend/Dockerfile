FROM node:22.13.1-bookworm-slim AS dev

ARG UID=1000
RUN userdel node && useradd appuser --uid ${UID} -l --create-home && mkdir /loan-frontend && chown appuser /loan-frontend

WORKDIR /loan-frontend
USER appuser