#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Добро пожаловать в консольную утилиту!');

rl.question('Как вас зовут? ', (name) => {
  console.log(`Привет, ${name}! Это ваша первая консольная утилита на JavaScript.`);
  rl.close();
});
