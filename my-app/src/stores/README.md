# Stores Directory

This directory is intended for global state management using `@nova/store` (or a similar reactive store implementation).

Currently, state is managed locally within components and services via `@nova/signals`. As the application grows, complex shared state should be migrated here.
