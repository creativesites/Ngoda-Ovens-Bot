

const { create, Client, decryptMedia, ev, smartUserAgent, NotificationLanguage } = require('@open-wa/wa-automate');
const mime = require('mime-types');
const fs = require('fs');
const wa = require('@open-wa/wa-automate');
const dialogflow = require('@google-cloud/dialogflow');
const {fileToBase64} = require('file-base64');
const imageDataURI = require('image-data-uri');
const path = require('path');
const moment = require('moment');
const mongoose = require('mongoose');
const url = 'mongodb+srv://admin:higibertigibet@cluster0.abb0bhi.mongodb.net/?retryWrites=true&w=majority'
// mongo mongodb://localhost:27017/users
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected:', url)
});
const peopleSchema = new mongoose.Schema({
    _id: String,
    chatID: String,
    sessionId: String,
    name: String,
    location: String,
    updated: {
        type: Date,
        default: Date.now
    },
});
let contexts;
const People = mongoose.model('People', peopleSchema);

const saveMessageSchema = new mongoose.Schema({
    msg: String,
    from: String,
    updated: {
        type: Date,
        default: Date.now
    }
    
    
});
const SaveMessage = mongoose.model('SaveMessage', saveMessageSchema); 
 
const opts = {
    new: true,
    upsert: false
};
let latestTime = Date.now()



const ON_DEATH = fn => process.on("exit",fn) 

let globalClient
ON_DEATH(async function() {
    console.log('killing session');
    if(globalClient)await globalClient.kill();
  })
  
  /**
   * Detect the qr code
   */
  ev.on('qr.**', async (qrcode,sessionId) => {
    //base64 encoded qr code image
    const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
    fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
  });
  
  /**
   * Detect when a session has been started successfully
   */
  ev.on('STARTUP.**', async (data,sessionId) => {
    if(data==='SUCCESS') console.log(`${sessionId} started!`)
  })
  
  wa.create({
    sessionId: "Ngoda",
    useChrome: true,
    multiDevice: true, //required to enable multiDevice support
    authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: true,
    qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
  }).then(client => start(client));
  
  async function start(client) {
    async function runSample(projectId, msgNum, messageBody) {
        //const sessionClient = new dialogflow.SessionsClient();
        const sessionClient = new dialogflow.SessionsClient({ keyFilename: path.resolve(__dirname, './utils/sa.json') })
        
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, msgNum);
        // The text query request.
        
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
    
                    text: messageBody,
                    languageCode: 'en-US'
                }
            }
        };
        if (contexts && contexts.length > 0) {
            request.queryParams = {
              contexts: contexts,
            };
          }
        await sessionClient
            .detectIntent(request)
            .then(async(res) => {
                console.log(JSON.stringify(res))
                let res2 = JSON.parse(JSON.stringify(res));
                
                try {
                  let resp = res[0].queryResult.fulfillmentMessages
                  contexts = res[0].queryResult.outputContexts
                  for (let index = 0; index < resp.length; index++) {
                    const element = resp[index];
                    let platform = element.platform;
                   
                    if(platform === 'ACTIONS_ON_GOOGLE'){
                        let img = element.basicCard.image.imageUri;
                        let txt = element.basicCard.title;
                        let txt1 = element.basicCard.subtitle;
                        let txt2 = element.basicCard.formattedText;
                        imageDataURI
                          .encodeFromURL(img)
                          .then(async(resp2) => {
                              await client.sendImage(msgNum, resp2, 'filename.jpeg', `*${txt}*\n${txt1}\n\n${txt2}`)
                              //console.log(txt)
    
                          })
                          .catch(async(err1) => {
                              console.log('failed to send img')
                              await client.sendText(msgNum, `*${txt}*\n${txt1}\n\n${txt2}`)
                          })
                    }
                    if(platform === 'PLATFORM_UNSPECIFIED'){
                        let msgs = element.text.text;
                        for(const msg of msgs){
                            //console.log(msg)
                            await client.sendText(msgNum, msg)
                        }
                    }
                    
                    
                  }
                } catch (error) {
                  console.log(error)
                }
                
    
            })
    
    }
  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT" || state==="UNLAUNCHED") client.forceRefocus();

    if(state==='UNPAIRED') console.log('LOGGED OUT!!!!')
  });
    
    await client.onMessage(async (message)=>{
        console.log(message.type)
        let nnb = message.body
        let nnv = nnb.toLowerCase()
        if(nnv.includes('product')){
            let img = 'https://res.cloudinary.com/practicaldev/image/fetch/s--AInzu_FH--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/sc5u2yfjk3c842t9s8zg.png'
            imageDataURI
            .encodeFromURL(img)
            .then(async(resp2) => {
                await client.sendImageWithProduct(message.from, resp2, 'sample product', '260760411660@c.us', '1234')

            })
            .catch(async(err1) => {
                console.log('failed to send img')
                await client.sendText(message.from, `error happened`)
            })
            
        }
        if(nnv.includes('address') ){
            await client.sendLocation(message.from, '-17.832820','31.052120', `Merchant House`)
        }
        if (message.mimetype){
            console.log('multimedia msg. Doing nothing')
        }else{
            let nm 
        try {
            if(message.sender.name != null){
                nm = message.sender.name
            }else{
                if(message.sender.pushname != null){
                    nm = message.sender.pushname
                }else{
                    if(message.sender.formattedName != null){
                        nm = message.sender.formattedName
                    }else{
                        nm = message.formattedTitle
                    }
                }
            }
        } catch (error) {
            nm = message.formattedTitle
        }
        console.log(`${message.body} from ${message.from}`);
        console.log(message)
        const addNewMsg = new SaveMessage({from: message.from, msg: message.body, updated: message.timestamp});
        addNewMsg.save(function (err, doc1) {
            if (err) 
                return console.error(err);
            console.log("Document inserted succussfully!");
            console.log(doc1);
        });
        
        
        People.findById(message.from, async function (err, doc) {
            if (err) {
                console.log("Something wrong when updating data!");

            }

            console.log(doc);
            if (doc == null){
                let iid = uuid.v4()
                const addNew1 = new People({_id: message.from, chatID: message.from, sessionId: iid, name: nm});
                addNew1.save(function (err, doc1) {
                    if (err) 
                        return console.error(err);
                    console.log("Document inserted succussfully!");
                    console.log(doc1);
                });
                let pic = client.getProfilePicFromServer(message.from)
                console.log(pic)
                if(message.body.includes('address') ){
                    await client.sendLocation(message.from, '-17.832820','31.052120', `Merchant House`)
                }else{
                    let projectId
                    let msgNum = message.from
                    let messageBody = message.body
                    runSample(projectId = 'ngodaovens-ngocwh', msgNum, messageBody)
                }
            }else{
                let projectId
                let msgNum = message.from
                let messageBody = message.body
                runSample(projectId = 'ngodaovens-ngocwh', msgNum, messageBody)
            }
        })
        }
        

    });
    
    
  }
  