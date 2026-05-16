import fetch from 'node-fetch';

const API_KEY = 'AIzaSyAbqTkoUnpa25l7TxeGebEnQun1_vqoSuA';
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  try {
    const response = await fetch(URL);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

listModels();
