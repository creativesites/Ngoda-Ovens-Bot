const dialogflow = require('@google-cloud/dialogflow');
const {fileToBase64} = require('file-base64');
const imageDataURI = require('image-data-uri');
const path = require('path');


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
    await sessionClient
        .detectIntent(request)
        .then(async(res) => {
            //console.log(JSON.stringify(res))
            let res2 = JSON.parse(JSON.stringify(res));
            
            try {
              let resp = res[0].queryResult.fulfillmentMessages
              for (let index = 0; index < resp.length; index++) {
                const element = resp[index];
                if(element.image){
                  imageDataURI
                      .encodeFromURL(element.image.imageUri)
                      .then(async(resp2) => {
                          //await client.sendImage(msgNum, resp2, 'filename.jpeg', `*${element.text.text[0]}*\n`)
                          

                      })
                      .catch((err1) => {
                          console.log('failed to send img')
                      })
                  
                }else {
                  let msgs = element.text.text
                  for(const msg of msgs){
                    console.log(msg)
                    //await client.sendText(msgNum, msg)
                  }
                }
                
              }
            } catch (error) {
              console.log(error)
            }
            

        })

}
runSample('ngodaovens-ngocwh', 'hehjbdbvhbdjs', 'hi')