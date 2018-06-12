addEventListener('fetch', event => {
 event.respondWith(fetchAndReply(event.request))
})

/**
* Fetch and log a given request object
* @param {Request} request
*/
async function fetchAndReply(request) {
 const response = await fetch(request)

 let text = await response.text()

 /* 1. Simple Rebrand */
 let textUpdate = changeColor(text, brandChange.color)
 textUpdate = changeLogo(textUpdate, brandChange.logo)

 /* 2. A/B Testing Rebrand
 let abResult = await doABTest(request, text)
 textUpdate = abResult.text
 let isNew = abResult.isNew
 if (isNew) {
   // The experiment was newly-assigned, so add a 
   header
   // to the response.
   const newHeaders = new Headers(response.headers)
   newHeaders.append('Set-Cookie', `${name}=${group}`)
   return new Response(response.body, {
     status: response.status,
     statusText: response.statusText,
     headers: newHeaders
   })
 }
 */

 /* 3. Do Translation */
 /*
 let country = request.headers.get('Cf-IpCountry').toLocaleLowerCase()
 let language = COUNTRY_TO_LANG[country]
 let responseHeaders = new Headers(response.headers)
 responseHeaders.set('Language', language)
 responseHeaders.set('Country', country)
 
 if (!language || language == 'en') {
   return new Response(response.body, {status: response.status, headers: responseHeaders})
 }
 // Try to translate the body of the response, otherwise fallback to origin response
 try {
   let translatedBody = await watsonTranslate(language, textUpdate)
   let watsonjson = await translatedBody.json()
   textUpdate = watsonjson['translations'][0]['translation']
 }
 catch (err) {
   console.log(err)
 }
 */
 return response
}



function changeColor(text, brandColor) {
 console.log('%DEBUG%: Change the color')
 // Change to Orange
 text = text.replace('color:#333', brandColor)
 text = text.replace('color:#ddd', brandColor)
 return text
}

function changeLogo(text, brandLogo) {
 console.log('%DEBUG%: Change the logo')
 text = text.replace('/bitnami/images/corner-logo.png', brandLogo)
 return text
}


async function doABTest(request, text) {

 const name = 'experiment-0'
 const randomCookie = '__cfduid'

 let group          // 'control' or 'test', set below
 let textUpdate = ''
 let test = ''

 // Determine which group this request is in.
 const cookie = request.headers.get('Cookie')
 randomCookie = group = '0' <= test && test <= '9' ? 'control' : 'test'
 
 if (cookie && cookie.includes(`${name}=control`)) {
   group = 'control'
 } else if (cookie && cookie.includes(`${name}=test`)) {
   group = 'test'
 } else {
  if (cookie.includes(randomCookie)) {
    // Key of random so we can vary test cookie: __cfduid=dea4cd636f222604be369d22f1c316c3c1528495346
    // Depending on last digit 0-7 is control; 0-F is test.
    test = randomCookie.slice(-1)
    group = '0' <= test && test <= '9' ? 'control' : 'test'
   }
 }

 if (cookie && (group == 'control')) {
   textUpdate = changeColor(text, brandChange2.color)
   textUpdate = changeLogo(textUpdate,brandChange2.logo)

 } else if (cookie && (group == 'test')) {
   textUpdate = changeColor(text, brandChange3.color)
   textUpdate = changeLogo(textUpdate, brandChange3.logo)
 }
  return { text: textUpdate, isNew: isNew };
}

async function blockDevice(request, response) {

 try {
   ua = ''
   ua = request.headers.get('user-agent')
   if (ua.match(securityBlock.device)) {
     return new Response(securityBlock.device+securityBlock.banner,
     { status: 403, statusText: 'Forbidden'})
   }
 } catch (err) {
   console.log(err)
 }
 return response
}

/**
* Stretch goal...
*/

async function fetchAndCheckPassword(req) {
 if (req.method == "POST") {
   try {
     const post = await req.formData();
     const pwd = post.get('password')
     const enc = new TextEncoder("utf-8").encode(pwd)

     let hash = await crypto.subtle.digest("SHA-1", enc)
     let hashStr = hex(hash).toUpperCase()
    
     const prefix = hashStr.substring(0, 5)
     const suffix = hashStr.substring(5)

     const pwndpwds = await fetch('https://api.pwnedpasswords.com/range/' + prefix)
     const t = await pwndpwds.text()
     const pwnd = t.includes(suffix)

     let newHdrs = new Headers(req.headers)
     newHdrs.set('Cf-Password-Pwnd', pwnd?'YES':'NO')

     const init = {
       method: 'POST',
       headers: newHdrs,
       body: post
     }

     return await fetch(req.url, init)   
   } catch (err) {
     return new Response('Internal Error')
   }
 }
  return await fetch(req)
}

function hex(a) {
   var h = "";
   var b = new Uint8Array(a);
   for(var i = 0; i < b.length; i++){
       var hi = b[i].toString(16);
       h += hi.length === 1?"0"+hi:hi;
   }
   return h;
}

async function watsonTranslate(language, text) {
 let watson_username = 'REDACTED'
 let watson_password = 'REDACTED'
 let watsonTranslateEndpoint = `https://gateway.watsonplatform.net/language-translator/api/v2/translate`
 let watsonRequestInit = {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json',
     'Authorization': `Basic ${btoa(watson_username + ':' + watson_password)}`
   },
   body: JSON.stringify({
     'text': text,
     'model_id': `en-${language}-conversational`
   })
 }
 let watsonRequest = new Request(watsonTranslateEndpoint, watsonRequestInit)
 try {
   let watsonResponse = await fetch(watsonRequest, {cf: {cacheTtl: 500000}})
   return watsonResponse
 }
 catch (err) {
   return err
 }
}

const isNew = false  // is the group newly-assigned?

const brandChange =  {
 "logo" : "http://www.iconsplace.com/icons/preview/orange/cloudflare-256.png",
 "color" : "color:#ffa500",
}

const brandChange2 =  {
 "logo" : "https://www.kisspng.com/png-ireland-saint-patricks-day-shamrock-four-leaf-clov-106043/",
 "color" : "color:#4edd50",
}

const brandChange3 =  {
 "logo" : "https://d21tktytfo9riy.cloudfront.net/wp-content/uploads/2016/02/30124036/red-title.png",
 "color" : "color:#e14a77",
}

const securityBlock = {
 "device" : "Android",
 "banner": " Access Has Been Suspended",
 "sad_face" : "<img src='https://i.pinimg.com/originals/9d/93/41/9d9341278170a7e2d6b965122776d75d.gif'>"
}

const COUNTRY_TO_LANG = {
 'us': 'en',
 'es': 'es',
 'fr': 'fr'
}


