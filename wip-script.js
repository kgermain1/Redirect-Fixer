//301 Redirect Script
//Written by Kevin Germain for Zenith Global


//DO NOT CHANGE ANYTHING BELOW THIS LINE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function main() {
  Logger.log('Getting Keywords');
  var keywords = getKeywords();
  
  Logger.log('Fetching Status Codes');
  var statusCodes = getStatusCodes(keywords);
  
  Logger.log('Matching Keywords with Status Codes');
  var matchedKeywords = match(keywords, statusCodes);
  
  Logger.log('Updating destination URLs');
  makeOperations(matchedKeywords);
}

//RUNS 1
function getKeywords() {
  var keywords = [];
  var keywordIterator = AdsApp.keywords().get();
  if (keywordIterator.hasNext()) {
    while (keywordIterator.hasNext()) {
      var keyword = keywordIterator.next();
      var keywordObject = {keyword: keyword.getText(), URL: keyword.urls().getFinalUrl(), keywordID: keyword.getId(), adGroupID: keyword.getAdGroup().getId()};
      keywords.push(keywordObject);
    }
  }
  return keywords
}

//RUNS 2
function getStatusCodes(keywords){
  var URLs = [];
  var arrayLength = keywords.length;
  
  for (var i = 0; i < arrayLength; i++) {
    URLs.push(keywords[i].URL);
  }
  
  var uniqueURLs = uniqueArray(URLs);
  
  var statusCodes = [];
  var HTTP_OPTIONS = {muteHttpExceptions:true, 'followRedirects':false};
  var uniqueURLsLength = uniqueURLs.length;
  
  for (var i = 0; i < uniqueURLsLength; i++) {
    if (uniqueURLs[i] != null){
      var url = uniqueURLs[i];
      var response = UrlFetchApp.fetch(url, HTTP_OPTIONS)
      var statusCode = response.getResponseCode();
      if (statusCode === 301){
        var redirectedURL = response.getHeaders().Location;
        var statusCodeObject = {URL: url, statusCode: statusCode, redirectedURL: redirectedURL};
        statusCodes.push(statusCodeObject);
      }
    }
  }
  return statusCodes;
}

//RUNS IN FUNCTION 2, removes duplicates from array
function uniqueArray(arr) {
    var a = [];
    for (var i=0, l=arr.length; i<l; i++)
        if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
            a.push(arr[i]);
    return a;
}

//RUNS 3
function match(keywords, statusCodes){  
  var matchedKeywords = [];
  var keywordsLength = keywords.length;
  var statusCodesLength = statusCodes.length;
  
  for (var i = 0; i < keywordsLength; i++) {
    var keyword = keywords[i].keyword;
    var keywordID = keywords[i].keywordID;
    var adGroupID = keywords[i].adGroupID;
    
    for (var j = 0; j < statusCodesLength; j++) {
      if (keywords[i].URL === statusCodes[j].URL) {
        
        var keywordDataObject = {URL: statusCodes[j].URL, statusCode: statusCodes[j].statusCode, redirectedURL: statusCodes[j].redirectedURL, keyword: keyword, keywordID: keywordID, adGroupID: adGroupID};
        matchedKeywords.push(keywordDataObject);
      }
    }
  }
  return matchedKeywords;
}

//RUNS 4
function makeOperations(matchedKeywords){
  
  var IDs = [];
  var matchedKeywordsLength = matchedKeywords.length;
  
  for (var i = 0; i < matchedKeywordsLength; i++) {
    var IDArray = [matchedKeywords[i].adGroupID, matchedKeywords[i].keywordID];   
    var keywordIterator = AdsApp.keywords().withIds([IDArray]).get();
    
    while (keywordIterator.hasNext()) {
      var keyword = keywordIterator.next();
      var keywordURL = keyword.urls();
      var keywordName = keyword.getText();
      Logger.log(keywordName + " previous url: " + keywordURL.getFinalUrl())
      keywordURL.setFinalUrl(matchedKeywords[i].redirectedURL);
      Logger.log(keywordName + " New url: " + keywordURL.getFinalUrl())
    }
  }
}
