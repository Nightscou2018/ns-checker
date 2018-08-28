//load env variables
require('dotenv').load();
var   DEBUG           = new Boolean();
      DEBUG           = process.env.DEBUG=="FALSE" ? 0 : 1;
const NS_URL          = process.env.NS_URL;  
const NS_SECRET       = process.env.NS_SECRET; 
const CHECK_FREQUENCY = process.env.CHECK_FREQUENCY * 60 * 1000;
const BS_LOW          = process.env.BS_LOW;
const BS_HIGH         = process.env.BS_HIGH;
const BS_LOW_URL      = process.env.BS_LOW_URL;
const BS_HIGH_URL     = process.env.BS_HIGH_URL;
const BS_NORMAL_URL   = process.env.BS_NORMAL_URL;

//working vars
var reply             = null;
var lastReply         = null;
var request           = require('sync-request');

if(DEBUG)
{
  console.log("");
  console.log("ENVIRONMENT VARIABLES");
  console.log("  DEBUG:           " + DEBUG);
  console.log("  NS_URL:          " + NS_URL);
  console.log("  NS_SECRET:       " + NS_SECRET);
  console.log("  CHECK_FREQUENCY: " + CHECK_FREQUENCY + " ms");
  console.log("  BS_LOW:          " + BS_LOW);
  console.log("  BS_HIGH          " + BS_HIGH);
  console.log("  BS_LOW_URL       " + BS_LOW_URL);
  console.log("  BS_HIGH_URL      " + BS_HIGH_URL);
  console.log("  BS_NORMAL_URL    " + BS_NORMAL_URL);
}

(function nsCheck()
{
      try{
            //get sgv from nightscout
            var response = request('GET', NS_URL)
            if(response.statusCode == 200){
                  
                  //succes
                  reply = JSON.parse(response.body);
                  if(DEBUG){console.log("\nCurrent SGV:" + reply[0].sgv)};

                  //check timestamp, act on newer date/time
                  if(lastReply==null ? true : reply[0].date > lastReply[0].date){

                        //low sgv condition
                        if(reply[0].sgv <= BS_LOW){
                              if(DEBUG){console.log("SGV Low: " + reply[0].sgv + "<=" + BS_LOW)};

                              try{
                                    c4reply = request('GET', BS_LOW_URL);
                                    if(DEBUG){console.log("C4 Reply:" + c4reply.statusCode)};
                              } catch(e){
                                    console.log("C4 Error");
                                    console.log(c4reply);
                              }                       
                        }

                        //high condition
                        else if(reply[0].sgv >= BS_HIGH){
                              if(DEBUG){console.log("SGV High: " + reply[0].sgv + ">=" + BS_HIGH)};
                              
                              try{
                                    c4reply = request('GET', BS_HIGH_URL);
                                    if(DEBUG){console.log("C4 Reply:" + c4reply.statusCode)};
                              } catch(e){
                                    console.log("C4 Error");
                                    console.log(c4reply);
                              }    
                        }

                        //normal condition
                        else{
                              if(DEBUG){console.log("SGV Normal: " + BS_LOW + "<=" + reply[0].sgv + "<=" + BS_HIGH)};
                              try{
                                    c4reply = request('GET', BS_NORMAL_URL);
                                    if(DEBUG){console.log("C4 Reply:" + c4reply.statusCode)};
                              } catch(e){
                                    console.log("C4 Error");
                                    console.log(c4reply);
                              }
                        }
                        
                        //save last reply
                        lastReply = reply;
                  }
                  else{
                        if(DEBUG){console.log("No New Data. Date/Time: " + reply[0].date + " (" + new Date(reply[0].date) + ")");}
                  }
            }
            else{
                  console.log("ERROR:\n");
                  console.log("  Status Code:" + response.statusCode);
            }

            //sleep and repeat
            setTimeout(nsCheck, CHECK_FREQUENCY);
      }
      catch(e){
            console.log("\nERROR:\n)");
            console.log(e);
      }
}());