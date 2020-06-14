const express = require('express')
const app = express();
const path = require('path')
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
const PORT = process.env.PORT || 5000

const config = {
  channelAccessToken: '3xoDGJ8KgOVxVsyS4/XJwYqXOemYOX2b3mDioaOgnMv2jc2vkZcuGBnSzrehcK+sYXWEXgwraDP4DDvm6uiez8PChvb77gEAAtndU93wGwLN+LnsqVlLnQQN8ybt6wIquvnU/xFiobFIY5IOFLjclQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '8df5f91ca99d59fdf5be9877edb547a6'
};
const client = new line.Client(config);

const API_URL = 'https://opentdb.com/api.php?amount=10&type=multiple';
const gameState = {
  quizzes:[],
  currentIndex:0,
  numberOfCorrects:0
};

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/hook',line.middleware(config),(req,res)=>{
    res.sendStatus(200);
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result)=>{
        console.log('event proceed');
      });
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

const handleEvent = (event) => {
  if(event.type !== 'message'){
    return Promise.resolve(null);
  }
  if((event.message.type !== 'text') && (event.message.type !== 'follow')){
    return Promise.resolve(null);
  }

  let message = '';
  const text = (event.message.type === 'text') ? event.message.text : '';
  const id = event.source.userId;

  if(text === 'クイズ'){
    message = 'クイズしよう';
    console.log('quizfetch @@@');
    quizFetcher(id);
  }else{
    message = text;
  }

  return client.replyMessage(event.replyToken,{
    type:'text',
    text:message
  });
}

const quizFetcher = async (id) => {
  let message = 'Now loading...';
  client.pushMessage(id,{
    type:'text',
    text:message
  });
  try{
    const response = await fetch(API_URL);
    const data = await response.json();
    gameState.quizzes = data.results;
    gameState.currentIndex = 0;
    gameState.numberOfCorrects = 0;
    console.log('quizzes:',gameState.quizzes);
    setNextQuiz(id);
  }catch(error){
    console.error(error.message);
  }
}

const setNextQuiz = (id) => {
  console.log('setNextQuiz');
  const quiz = gameState.quizzes[gameState.currentIndex];
  return client.pushMessage(id,{
    type:'text',
    text:quiz.question
  });
}

