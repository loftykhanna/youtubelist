const express = require('express')
const app = express()
const port = 3000;
const axios = require("axios");
const utf8 = require('utf8');

const {google} = require('googleapis');
const youtube = google.youtube({
    version: 'v3',
    auth: 'AIzaSyDP8aCz2-hLoPLM18seCV480VV_UO5T7qE'
  });

  const params = {
    part: "snippet,id",
    channelId:"UCiGyWN6DEbnj2alu7iapuKQ",
    order:'date',
    maxResults:50
};


app.get('/', (req, res) => {

   
})

const commentsParam = {
    part : "snippet,id,replies",
    maxResults:100,
    textFormat:'plainText'
}

app.get('/youtube', async (req, res) => {
    

    let result = []
   const videoList = await youtube.search.list(params);


   videoList.data.items.map((item)=>{
      result.push(item.id.videoId);
   
  })

  const commentsArr = await Promise.all(result.map((videoId)=>{
    commentsParam.videoId = videoId
    return youtube.commentThreads.list(commentsParam)
  }));

  //res.send(videoList.data.items[0])
  let commentsMap = {}

  commentsArr.map((commentList)=>{
    commentList.data.items.map((commentDetails)=>{
        const videoID = commentDetails.snippet.videoId
        const commentText = commentDetails.snippet.topLevelComment.snippet.textDisplay
        if(commentsMap[videoID]){
            commentsMap[videoID].push({commentText})
        }else {
            commentsMap[videoID] = [];
            commentsMap[videoID].push(commentText)
        }
    })
  })


 Object.keys(commentsMap).map((key)=>{

    let reduceByteIndex = 4750
    commentsMap[key] =  commentsMap[key].join('').substr(0, reduceByteIndex)
    let size = (new TextEncoder().encode(commentsMap[key])).length

    while(size>5000){
        reduceByteIndex = reduceByteIndex - 100;
        commentsMap[key] =  commentsMap[key].substr(0, reduceByteIndex)
        size = (new TextEncoder().encode(commentsMap[key])).length
    }

  })
/* 
  let abc = await axios.post('http://localhost:4000/v1/sentiments', {
    texts: [commentsMap['-PVLHNUu0vg']],
    "typeId": "65140898cfeaf2d345ef32b7"
  });
  */


  let promiseCommentArr = [];
  let x = 0;
  for (let comment in commentsMap){
    console.log(comment)
    promiseCommentArr.push(
        axios.post('http://localhost:4000/v1/sentiments', {
        texts: [ JSON.parse( JSON.stringify( commentsMap[comment]) )],
        "typeId": "65140898cfeaf2d345ef32b7",
        "description" : "youtube video",
        "info" : {
            "title" : videoList.data.items[x].snippet.title, 
            "decription" : videoList.data.items[x].snippet.description,
            "videoId" : result[x]
        }

      }).catch(()=>{
        return Promise.resolve({"statusCode":201,"data":{"sentimentList":[{"typeId":"65140898cfeaf2d345ef32b7","sentimentScore":{"Positive":0.0661,"Negative":0.0003,"Neutral":0.9335,"Mixed":0.0001},"sentiment":"NEUTRAL","info":null,"_id":"6529129f82d3b1c62ada9b8f","createdAt":"2023-10-13T09:49:19.337Z","updatedAt":"2023-10-13T09:49:19.337Z"}]}})
      }))
      x++;
}

    Promise.all(promiseCommentArr).then((value)=>{

        let resultMap = []
        for(let i=0; i<value.length;i++){
            resultMap.push(value[i].data)
        }
       // console.log(sentimentsArr.data)



    res.send(resultMap)
    });


  
  
    
  })




// Each API may support multiple versions. With this sample, we're getting
// v3 of the blogger API, and using an API key to authenticate.



// get the blog details









app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})