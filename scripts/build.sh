#!/bin/sh

yarn lint

yarn build

# yarn sass src/styles.scss dist/styles.css

cp src/style.css dist/